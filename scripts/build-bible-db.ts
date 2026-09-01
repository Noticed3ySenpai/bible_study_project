import Database from "better-sqlite3";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { join } from "path";
import { BOOK_BY_ID } from "../src/lib/bible-books";

const OUTPUT_DIR = join(process.cwd(), "public", "data");
const OUTPUT_PATH = join(OUTPUT_DIR, "bible-study.sqlite");
const TEMP_DIR = join(process.cwd(), ".cache", "bible-build");

const MIDVASH_WEB_SQLITE =
  "https://raw.githubusercontent.com/midvash/bible-data/main/versions/en/web/web.sqlite";
const GNOSIS_LITE_DB =
  "https://github.com/spearssoftware/gnosis/releases/download/v0.9.3/gnosis-lite.db";
const OPENBIBLE_CROSSREFS =
  "https://a.openbible.info/data/cross-references.zip";

async function download(url: string, dest: string) {
  console.log(`Downloading ${url}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  mkdirSync(join(dest, ".."), { recursive: true });
  await import("fs/promises").then((fs) => fs.writeFile(dest, buffer));
  console.log(`Saved ${dest} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

function createSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      osis_ref TEXT NOT NULL
    );
    CREATE UNIQUE INDEX idx_verses_unique ON verses (book_id, chapter, verse);
    CREATE INDEX idx_verses_chapter ON verses (book_id, chapter);
    CREATE INDEX idx_verses_osis ON verses (osis_ref);

    CREATE VIRTUAL TABLE verses_fts USING fts5(
      text,
      book,
      chapter UNINDEXED,
      verse UNINDEXED,
      osis_ref UNINDEXED,
      content='verses',
      content_rowid='id',
      tokenize='porter unicode61'
    );

    CREATE TABLE strongs (
      number TEXT PRIMARY KEY,
      language TEXT NOT NULL,
      lemma TEXT NOT NULL,
      transliteration TEXT,
      definition TEXT NOT NULL
    );

    CREATE TABLE word_occurrences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      strongs TEXT NOT NULL,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      word_index INTEGER NOT NULL,
      osis_ref TEXT NOT NULL
    );
    CREATE INDEX idx_word_occ_strongs ON word_occurrences (strongs);
    CREATE INDEX idx_word_occ_osis ON word_occurrences (osis_ref);

    CREATE TABLE verse_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      osis_ref TEXT NOT NULL,
      word_index INTEGER NOT NULL,
      strongs TEXT NOT NULL,
      english_gloss TEXT NOT NULL,
      lemma TEXT,
      transliteration TEXT,
      morphology TEXT
    );
    CREATE INDEX idx_verse_words_osis ON verse_words (osis_ref);

    CREATE TABLE cross_references (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_osis TEXT NOT NULL,
      to_osis TEXT NOT NULL,
      weight INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX idx_cross_from ON cross_references (from_osis);
    CREATE INDEX idx_cross_to ON cross_references (to_osis);
  `);
}

function importVerses(db: Database.Database, webDbPath: string) {
  const webDb = new Database(webDbPath, { readonly: true });
  const rows = webDb
    .prepare("SELECT book_id, chapter, number, text FROM verses ORDER BY book_id, chapter, number")
    .all() as { book_id: number; chapter: number; number: number; text: string }[];

  const insert = db.prepare(
    "INSERT INTO verses (book_id, book, chapter, verse, text, osis_ref) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const tx = db.transaction(() => {
    for (const row of rows) {
      const book = BOOK_BY_ID[row.book_id];
      if (!book) continue;
      const osisRef = `${book.osis}.${row.chapter}.${row.number}`;
      insert.run(book.id, book.osis, row.chapter, row.number, row.text, osisRef);
    }
  });
  tx();
  webDb.close();
  console.log(`Imported ${rows.length} verses from WEB translation`);
}

function buildFts(db: Database.Database) {
  db.exec(`
    INSERT INTO verses_fts(rowid, text, book, chapter, verse, osis_ref)
    SELECT id, text, book, chapter, verse, osis_ref FROM verses;

    CREATE TRIGGER verses_ai AFTER INSERT ON verses BEGIN
      INSERT INTO verses_fts(rowid, text, book, chapter, verse, osis_ref)
      VALUES (new.id, new.text, new.book, new.chapter, new.verse, new.osis_ref);
    END;
  `);
  console.log("Built FTS5 index");
}

const TAGNT_MAT_JHN =
  "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt";
const TAGNT_ACT_REV =
  "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Act-Rev%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt";

const STEP_BOOK_TO_OSIS: Record<string, string> = {
  Mat: "Matt",
  Mrk: "Mark",
  Luk: "Luke",
  Jhn: "John",
  Act: "Acts",
  Rom: "Rom",
  "1Co": "1Cor",
  "2Co": "2Cor",
  Gal: "Gal",
  Eph: "Eph",
  Php: "Phil",
  Col: "Col",
  "1Th": "1Thess",
  "2Th": "2Thess",
  "1Ti": "1Tim",
  "2Ti": "2Tim",
  Tit: "Titus",
  Phm: "Phlm",
  Heb: "Heb",
  Jas: "Jas",
  "1Pe": "1Pet",
  "2Pe": "2Pet",
  "1Jn": "1John",
  "2Jn": "2John",
  "3Jn": "3John",
  Jud: "Jude",
  Rev: "Rev",
};

function normalizeStrongsNumber(raw: string): string {
  const match = raw.match(/^([GH])(\d+)/i);
  if (!match) return raw.toUpperCase();
  return `${match[1].toUpperCase()}${Number(match[2])}`;
}

function importGnosisData(db: Database.Database, gnosisPath: string) {
  const gnosis = new Database(gnosisPath, { readonly: true });

  const strongsRows = gnosis
    .prepare(
      "SELECT number, language, lemma, transliteration, definition FROM strongs"
    )
    .all() as {
    number: string;
    language: string;
    lemma: string;
    transliteration: string | null;
    definition: string | null;
  }[];

  const insertStrongs = db.prepare(
    "INSERT OR REPLACE INTO strongs (number, language, lemma, transliteration, definition) VALUES (?, ?, ?, ?, ?)"
  );
  const strongsTx = db.transaction(() => {
    for (const row of strongsRows) {
      insertStrongs.run(
        row.number,
        row.language,
        row.lemma,
        row.transliteration ?? "",
        row.definition ?? row.lemma
      );
    }
  });
  strongsTx();
  console.log(`Imported ${strongsRows.length} Strong's entries`);

  const crossRows = gnosis
    .prepare(`
      SELECT v1.osis_ref as from_ref, v2.osis_ref as to_ref, cr.votes
      FROM cross_reference cr
      JOIN verse v1 ON v1.id = cr.from_verse_id
      JOIN verse v2 ON v2.id = cr.to_verse_start_id
    `)
    .all() as { from_ref: string; to_ref: string; votes: number }[];

  const insertCross = db.prepare(
    "INSERT INTO cross_references (from_osis, to_osis, weight) VALUES (?, ?, ?)"
  );
  const crossTx = db.transaction(() => {
    for (const row of crossRows) {
      const toRef = row.to_ref.split("-")[0];
      insertCross.run(row.from_ref, toRef, row.votes ?? 0);
    }
  });
  crossTx();
  console.log(`Imported ${crossRows.length} cross-references from gnosis`);

  gnosis.close();
}

async function importTagntData(db: Database.Database, url: string, label: string) {
  const dest = join(TEMP_DIR, label.replace(/\W+/g, "_") + ".txt");
  if (!existsSync(dest)) await download(url, dest);

  const { readFileSync } = await import("fs");
  const lines = readFileSync(dest, "utf-8").split("\n");

  const insertOcc = db.prepare(
    "INSERT INTO word_occurrences (strongs, book, chapter, verse, word_index, osis_ref) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insertWord = db.prepare(
    `INSERT INTO verse_words (osis_ref, word_index, strongs, english_gloss, lemma, transliteration, morphology)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  let occCount = 0;
  let wordCount = 0;
  const tx = db.transaction(() => {
    for (const line of lines) {
      const match = line.match(/^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)#(\d+)/);
      if (!match) continue;

      const stepBook = match[1];
      const osisBook = STEP_BOOK_TO_OSIS[stepBook];
      if (!osisBook) continue;

      const chapter = Number(match[2]);
      const verse = Number(match[3]);
      const wordIndex = Number(match[4]);
      const osisRef = `${osisBook}.${chapter}.${verse}`;

      const cols = line.split("\t");
      const gloss = cols[2]?.trim() ?? "";
      const strongsMorph = cols[3]?.trim() ?? "";
      const strongsMorphMatch = strongsMorph.match(/^([GH]\d{1,5})=(.+)$/);
      if (!strongsMorphMatch) continue;

      const strongs = normalizeStrongsNumber(strongsMorphMatch[1]);
      const morphology = strongsMorphMatch[2];

      const greekField = cols[1]?.trim() ?? "";
      const lemmaMatch = greekField.match(/^(.+?)\s*\(([^)]+)\)/);
      const lemma = lemmaMatch ? lemmaMatch[1].trim() : greekField;
      const transliteration = lemmaMatch ? lemmaMatch[2].trim() : "";

      insertOcc.run(strongs, osisBook, chapter, verse, wordIndex, osisRef);
      occCount++;

      if (gloss) {
        insertWord.run(osisRef, wordIndex, strongs, gloss, lemma, transliteration, morphology);
        wordCount++;
      }
    }
  });
  tx();
  console.log(`Imported ${occCount} word occurrences and ${wordCount} verse words from ${label}`);
}

async function importOpenBibleCrossRefs(db: Database.Database, zipPath: string) {
  const { execSync } = await import("child_process");
  const extractDir = join(TEMP_DIR, "crossrefs");
  mkdirSync(extractDir, { recursive: true });
  execSync(`unzip -o "${zipPath}" -d "${extractDir}"`, { stdio: "inherit" });

  const csvPath = join(extractDir, "cross_references.txt");
  if (!existsSync(csvPath)) {
    console.warn("OpenBible cross-references file not found");
    return;
  }

  const existing = db.prepare("SELECT COUNT(*) as c FROM cross_references").get() as {
    c: number;
  };
  if (existing.c > 10000) {
    console.log("Cross-references already imported, skipping OpenBible");
    return;
  }

  const { readFileSync } = await import("fs");
  const lines = readFileSync(csvPath, "utf-8").split("\n");
  const insert = db.prepare(
    "INSERT INTO cross_references (from_osis, to_osis, weight) VALUES (?, ?, ?)"
  );

  let count = 0;
  const tx = db.transaction(() => {
    for (const line of lines) {
      if (!line || line.startsWith("#") || line.startsWith("From Verse")) continue;
      const [from, to, votes] = line.split("\t");
      if (!from || !to || !from.includes(".")) continue;
      insert.run(from.trim(), to.trim(), Number(votes) || 0);
      count++;
    }
  });
  tx();
  console.log(`Imported ${count} OpenBible cross-references`);
}

async function main() {
  mkdirSync(TEMP_DIR, { recursive: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const webDbPath = join(TEMP_DIR, "web.sqlite");
  const gnosisPath = join(TEMP_DIR, "gnosis-lite.db");
  const crossZipPath = join(TEMP_DIR, "cross-references.zip");

  if (!existsSync(webDbPath)) await download(MIDVASH_WEB_SQLITE, webDbPath);
  if (!existsSync(gnosisPath)) await download(GNOSIS_LITE_DB, gnosisPath);
  if (!existsSync(crossZipPath)) await download(OPENBIBLE_CROSSREFS, crossZipPath);

  if (existsSync(OUTPUT_PATH)) unlinkSync(OUTPUT_PATH);

  const db = new Database(OUTPUT_PATH);
  createSchema(db);
  importVerses(db, webDbPath);
  buildFts(db);
  importGnosisData(db, gnosisPath);
  await importTagntData(db, TAGNT_MAT_JHN, "TAGNT Mat-Jhn");
  await importTagntData(db, TAGNT_ACT_REV, "TAGNT Act-Rev");
  await importOpenBibleCrossRefs(db, crossZipPath);
  db.close();

  const { statSync } = await import("fs");
  const size = statSync(OUTPUT_PATH).size;
  console.log(`\nDone! Created ${OUTPUT_PATH} (${(size / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
