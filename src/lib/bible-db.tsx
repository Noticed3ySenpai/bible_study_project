"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Database, SqlJsStatic, SqlValue } from "sql.js";

export type Verse = {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  osisRef: string;
};

export type StrongsEntry = {
  number: string;
  language: string;
  lemma: string;
  transliteration: string | null;
  definition: string;
};

export type VerseWord = {
  wordIndex: number;
  strongs: string;
  englishGloss: string;
  lemma: string | null;
  transliteration: string | null;
  morphology: string | null;
};

export type LexiconEntry = StrongsEntry & {
  morphology: string | null;
};

export type SearchResult = Verse & { snippet?: string };
export type CrossRef = { toOsis: string; weight: number; text?: string };

type BibleDbContextValue = {
  ready: boolean;
  loading: boolean;
  progress: number;
  error: string | null;
  studyReady: boolean;
  studyLoading: boolean;
  studyProgress: number;
  getChapter: (bookId: number, chapter: number) => Promise<Verse[]>;
  getVerse: (osisRef: string) => Promise<Verse | null>;
  searchEnglish: (query: string, limit?: number) => Promise<SearchResult[]>;
  searchStrongs: (query: string) => Promise<StrongsEntry[]>;
  getStrongsOccurrences: (number: string) => Promise<Verse[]>;
  getStrongsEntry: (number: string) => Promise<StrongsEntry | null>;
  getVerseWords: (osisRef: string) => Promise<VerseWord[]>;
  getLexiconEntry: (strongs: string, osisRef?: string) => Promise<LexiconEntry | null>;
  getCrossReferences: (osisRef: string) => Promise<CrossRef[]>;
  getVerseOfDay: () => Promise<Verse | null>;
};

type DbVersionManifest = {
  builtAt: string;
  files: Record<string, { hash: string; bytes: number; url: string }>;
};

const BibleDbContext = createContext<BibleDbContextValue | null>(null);

const IDB_NAME = "bible-db-cache";
const IDB_STORE = "files";
const CORE_FILE = "bible-core.sqlite";
const STUDY_FILE = "bible-study.sqlite";

let sqlPromise: Promise<SqlJsStatic> | null = null;
let coreDb: Database | null = null;
let studyDb: Database | null = null;
let coreInitPromise: Promise<Database> | null = null;
let studyInitPromise: Promise<Database> | null = null;
let versionManifest: DbVersionManifest | null = null;
let versionPromise: Promise<DbVersionManifest> | null = null;

function openCacheDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

async function idbGet(key: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openCacheDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve((req.result as ArrayBuffer | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error("IndexedDB get failed"));
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: ArrayBuffer): Promise<void> {
  try {
    const db = await openCacheDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB put failed"));
    });
  } catch {
    // Cache is best-effort.
  }
}

async function loadSqlJs(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      const initSqlJs = (await import("sql.js")).default;
      return initSqlJs({
        locateFile: (file) => `/sql-wasm/${file}`,
      });
    })();
  }
  return sqlPromise;
}

async function getVersionManifest(): Promise<DbVersionManifest> {
  if (versionManifest) return versionManifest;
  if (!versionPromise) {
    versionPromise = (async () => {
      const response = await fetch("/data/bible-db-version.json", { cache: "no-cache" });
      if (!response.ok) {
        throw new Error("Bible database version manifest missing. Run npm run build:bible-db.");
      }
      const manifest = (await response.json()) as DbVersionManifest;
      versionManifest = manifest;
      return manifest;
    })();
  }
  return versionPromise;
}

async function fetchSqliteBuffer(
  url: string,
  onProgress?: (ratio: number) => void
): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}. Run npm run build:bible-db first.`);
  }

  const total = Number(response.headers.get("content-length") ?? 0);
  const reader = response.body?.getReader();
  if (!reader) {
    const buffer = await response.arrayBuffer();
    onProgress?.(1);
    return buffer;
  }

  const chunks: Uint8Array[] = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    if (total > 0) onProgress?.(loaded / total);
  }

  const merged = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  onProgress?.(1);
  return merged.buffer;
}

async function loadDbFile(
  fileName: string,
  onProgress?: (p: number) => void
): Promise<Database> {
  const SQL = await loadSqlJs();
  onProgress?.(8);

  const manifest = await getVersionManifest();
  const meta = manifest.files[fileName];
  if (!meta) {
    throw new Error(`Missing ${fileName} in bible-db-version.json`);
  }

  const cacheKey = `${fileName}:${meta.hash}`;
  onProgress?.(12);

  let buffer = await idbGet(cacheKey);
  if (buffer) {
    onProgress?.(90);
  } else {
    buffer = await fetchSqliteBuffer(meta.url, (ratio) => {
      onProgress?.(12 + Math.round(ratio * 75));
    });
    await idbSet(cacheKey, buffer);
  }

  onProgress?.(95);
  const db = new SQL.Database(new Uint8Array(buffer));
  onProgress?.(100);
  return db;
}

async function initCoreDb(onProgress?: (p: number) => void): Promise<Database> {
  if (coreDb) return coreDb;
  if (!coreInitPromise) {
    coreInitPromise = loadDbFile(CORE_FILE, onProgress)
      .then((db) => {
        coreDb = db;
        return db;
      })
      .catch((err) => {
        coreInitPromise = null;
        throw err;
      });
  }
  return coreInitPromise;
}

async function initStudyDb(onProgress?: (p: number) => void): Promise<Database> {
  if (studyDb) return studyDb;
  if (!studyInitPromise) {
    studyInitPromise = loadDbFile(STUDY_FILE, onProgress)
      .then((db) => {
        studyDb = db;
        return db;
      })
      .catch((err) => {
        studyInitPromise = null;
        throw err;
      });
  }
  return studyInitPromise;
}

function queryAll<T>(db: Database, sql: string, params: SqlValue[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

function queryOne<T>(db: Database, sql: string, params: SqlValue[] = []): T | null {
  const results = queryAll<T>(db, sql, params);
  return results[0] ?? null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSearchSnippet(text: string, terms: string[], context = 40): string {
  const lower = text.toLowerCase();
  let matchIndex = -1;

  for (const term of terms) {
    const idx = lower.indexOf(term.toLowerCase());
    if (idx >= 0 && (matchIndex < 0 || idx < matchIndex)) {
      matchIndex = idx;
    }
  }

  if (matchIndex < 0) {
    return text.length > context * 2 ? `${text.slice(0, context * 2)}…` : text;
  }

  const start = Math.max(0, matchIndex - context);
  const end = Math.min(text.length, matchIndex + context);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = `…${snippet}`;
  if (end < text.length) snippet = `${snippet}…`;

  for (const term of terms) {
    snippet = snippet.replace(
      new RegExp(`(${escapeRegExp(term)})`, "gi"),
      "<mark>$1</mark>"
    );
  }

  return snippet;
}

export function BibleDbProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [studyReady, setStudyReady] = useState(false);
  const [studyLoading, setStudyLoading] = useState(false);
  const [studyProgress, setStudyProgress] = useState(0);

  const ensureStudyDb = useCallback(async () => {
    if (studyDb) {
      setStudyReady(true);
      return studyDb;
    }
    setStudyLoading(true);
    try {
      const db = await initStudyDb((p) => setStudyProgress(p));
      setStudyReady(true);
      return db;
    } finally {
      setStudyLoading(false);
    }
  }, []);

  useEffect(() => {
    initCoreDb(setProgress)
      .then(() => {
        setReady(true);
        setLoading(false);
        const prefetch = () => {
          void ensureStudyDb().catch(() => {
            /* prefetch is best-effort */
          });
        };
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          window.requestIdleCallback(() => prefetch(), { timeout: 4000 });
        } else {
          setTimeout(prefetch, 1500);
        }
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [ensureStudyDb]);

  const getChapter = useCallback(async (bookId: number, chapter: number) => {
    const db = await initCoreDb();
    return queryAll<Verse>(
      db,
      `SELECT id, book, chapter, verse, text, osis_ref as osisRef
       FROM verses WHERE book_id = ? AND chapter = ? ORDER BY verse`,
      [bookId, chapter]
    );
  }, []);

  const getVerse = useCallback(async (osisRef: string) => {
    const db = await initCoreDb();
    return queryOne<Verse>(
      db,
      `SELECT id, book, chapter, verse, text, osis_ref as osisRef FROM verses WHERE osis_ref = ?`,
      [osisRef]
    );
  }, []);

  const searchEnglish = useCallback(async (query: string, limit = 50) => {
    const db = await initCoreDb();
    const terms = query
      .trim()
      .replace(/['"]/g, "")
      .split(/\s+/)
      .filter(Boolean);
    if (terms.length === 0) return [];

    const conditions = terms.map(() => "text LIKE ?").join(" AND ");
    const params: SqlValue[] = [...terms.map((term) => `%${term}%`), limit];

    const results = queryAll<Verse>(
      db,
      `SELECT id, book, chapter, verse, text, osis_ref as osisRef
       FROM verses
       WHERE ${conditions}
       ORDER BY book_id, chapter, verse
       LIMIT ?`,
      params
    );

    return results.map((verse) => ({
      ...verse,
      snippet: buildSearchSnippet(verse.text, terms),
    }));
  }, []);

  const searchStrongs = useCallback(async (query: string) => {
    const db = await initCoreDb();
    const q = query.trim().toUpperCase();
    if (!q) return [];
    if (/^[GH]\d+$/.test(q)) {
      const entry = queryOne<StrongsEntry>(
        db,
        `SELECT number, language, lemma, transliteration, definition FROM strongs WHERE number = ?`,
        [q]
      );
      return entry ? [entry] : [];
    }
    return queryAll<StrongsEntry>(
      db,
      `SELECT number, language, lemma, transliteration, definition FROM strongs
       WHERE lemma LIKE ? OR transliteration LIKE ? OR definition LIKE ?
       LIMIT 30`,
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );
  }, []);

  const getStrongsOccurrences = useCallback(async (number: string) => {
    const study = await ensureStudyDb();
    const core = await initCoreDb();
    const refs = queryAll<{ osis_ref: string }>(
      study,
      `SELECT DISTINCT osis_ref FROM word_occurrences WHERE strongs = ? ORDER BY book, chapter, verse`,
      [number.toUpperCase()]
    );

    const results: Verse[] = [];
    for (const ref of refs) {
      const verse = queryOne<Verse>(
        core,
        `SELECT id, book, chapter, verse, text, osis_ref as osisRef FROM verses WHERE osis_ref = ?`,
        [ref.osis_ref]
      );
      if (verse) results.push(verse);
    }
    return results;
  }, [ensureStudyDb]);

  const getStrongsEntry = useCallback(async (number: string) => {
    const db = await initCoreDb();
    return queryOne<StrongsEntry>(
      db,
      `SELECT number, language, lemma, transliteration, definition FROM strongs WHERE number = ?`,
      [number.toUpperCase()]
    );
  }, []);

  const getVerseWords = useCallback(async (osisRef: string) => {
    const db = await ensureStudyDb();
    return queryAll<VerseWord>(
      db,
      `SELECT word_index as wordIndex, strongs, english_gloss as englishGloss,
              lemma, transliteration, morphology
       FROM verse_words WHERE osis_ref = ? ORDER BY word_index`,
      [osisRef]
    );
  }, [ensureStudyDb]);

  const getLexiconEntry = useCallback(
    async (strongs: string, osisRef?: string) => {
      const core = await initCoreDb();
      const entry = queryOne<StrongsEntry>(
        core,
        `SELECT number, language, lemma, transliteration, definition FROM strongs WHERE number = ?`,
        [strongs.toUpperCase()]
      );
      if (!entry) return null;

      let morphology: string | null = null;
      if (osisRef) {
        const study = await ensureStudyDb();
        const word = queryOne<{ morphology: string | null }>(
          study,
          `SELECT morphology FROM verse_words WHERE osis_ref = ? AND strongs = ? LIMIT 1`,
          [osisRef, strongs.toUpperCase()]
        );
        morphology = word?.morphology ?? null;
      }

      return { ...entry, morphology };
    },
    [ensureStudyDb]
  );

  const getCrossReferences = useCallback(async (osisRef: string) => {
    const study = await ensureStudyDb();
    const refs = queryAll<{ to_osis: string; weight: number }>(
      study,
      `SELECT to_osis, weight FROM cross_references WHERE from_osis = ? ORDER BY weight DESC LIMIT 20`,
      [osisRef]
    );
    const results: CrossRef[] = [];
    for (const ref of refs) {
      const verse = await getVerse(ref.to_osis);
      results.push({
        toOsis: ref.to_osis,
        weight: ref.weight,
        text: verse?.text,
      });
    }
    return results;
  }, [ensureStudyDb, getVerse]);

  const getVerseOfDay = useCallback(async () => {
    const db = await initCoreDb();
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const count = queryOne<{ c: number }>(db, `SELECT COUNT(*) as c FROM verses`);
    if (!count) return null;
    const offset = seed % count.c;
    return queryOne<Verse>(
      db,
      `SELECT id, book, chapter, verse, text, osis_ref as osisRef FROM verses LIMIT 1 OFFSET ?`,
      [offset]
    );
  }, []);

  return (
    <BibleDbContext.Provider
      value={{
        ready,
        loading,
        progress,
        error,
        studyReady,
        studyLoading,
        studyProgress,
        getChapter,
        getVerse,
        searchEnglish,
        searchStrongs,
        getStrongsOccurrences,
        getStrongsEntry,
        getVerseWords,
        getLexiconEntry,
        getCrossReferences,
        getVerseOfDay,
      }}
    >
      {children}
    </BibleDbContext.Provider>
  );
}

export function useBibleDb() {
  const ctx = useContext(BibleDbContext);
  if (!ctx) throw new Error("useBibleDb must be used within BibleDbProvider");
  return ctx;
}
