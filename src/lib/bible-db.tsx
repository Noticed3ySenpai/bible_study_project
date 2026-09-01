"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Database, SqlValue } from "sql.js";

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

const BibleDbContext = createContext<BibleDbContextValue | null>(null);

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

async function initDb(onProgress?: (p: number) => void): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    onProgress?.(5);

    const initSqlJs = (await import("sql.js")).default;
    const SQL = await initSqlJs({
      locateFile: (file) => `/sql-wasm/${file}`,
    });

    onProgress?.(10);

    const response = await fetch("/data/bible-study.sqlite");
    if (!response.ok) {
      throw new Error(
        "Bible database not found. Run `npm run build:bible-db` first."
      );
    }

    const total = Number(response.headers.get("content-length") ?? 0);
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        if (total > 0) onProgress?.(10 + Math.round((loaded / total) * 80));
      }
    }

    onProgress?.(95);
    const buffer = new Uint8Array(
      chunks.reduce((acc, c) => acc + c.length, 0)
    );
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    dbInstance = new SQL.Database(buffer);
    onProgress?.(100);
    return dbInstance;
  })();

  return initPromise;
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

  useEffect(() => {
    initDb(setProgress)
      .then(() => {
        setReady(true);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getChapter = useCallback(async (bookId: number, chapter: number) => {
    const db = await initDb();
    return queryAll<Verse>(
      db,
      `SELECT id, book, chapter, verse, text, osis_ref as osisRef
       FROM verses WHERE book_id = ? AND chapter = ? ORDER BY verse`,
      [bookId, chapter]
    );
  }, []);

  const getVerse = useCallback(async (osisRef: string) => {
    const db = await initDb();
    return queryOne<Verse>(
      db,
      `SELECT id, book, chapter, verse, text, osis_ref as osisRef FROM verses WHERE osis_ref = ?`,
      [osisRef]
    );
  }, []);

  const searchEnglish = useCallback(async (query: string, limit = 50) => {
    const db = await initDb();
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
    const db = await initDb();
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
    const db = await initDb();
    return queryAll<Verse>(
      db,
      `SELECT DISTINCT v.id, v.book, v.chapter, v.verse, v.text, v.osis_ref as osisRef
       FROM word_occurrences w
       JOIN verses v ON v.osis_ref = w.osis_ref
       WHERE w.strongs = ?
       ORDER BY v.book_id, v.chapter, v.verse`,
      [number.toUpperCase()]
    );
  }, []);

  const getStrongsEntry = useCallback(async (number: string) => {
    const db = await initDb();
    return queryOne<StrongsEntry>(
      db,
      `SELECT number, language, lemma, transliteration, definition FROM strongs WHERE number = ?`,
      [number.toUpperCase()]
    );
  }, []);

  const getVerseWords = useCallback(async (osisRef: string) => {
    const db = await initDb();
    return queryAll<VerseWord>(
      db,
      `SELECT word_index as wordIndex, strongs, english_gloss as englishGloss,
              lemma, transliteration, morphology
       FROM verse_words WHERE osis_ref = ? ORDER BY word_index`,
      [osisRef]
    );
  }, []);

  const getLexiconEntry = useCallback(
    async (strongs: string, osisRef?: string) => {
      const db = await initDb();
      const entry = queryOne<StrongsEntry>(
        db,
        `SELECT number, language, lemma, transliteration, definition FROM strongs WHERE number = ?`,
        [strongs.toUpperCase()]
      );
      if (!entry) return null;

      let morphology: string | null = null;
      if (osisRef) {
        const word = queryOne<{ morphology: string | null }>(
          db,
          `SELECT morphology FROM verse_words WHERE osis_ref = ? AND strongs = ? LIMIT 1`,
          [osisRef, strongs.toUpperCase()]
        );
        morphology = word?.morphology ?? null;
      }

      return { ...entry, morphology };
    },
    []
  );

  const getCrossReferences = useCallback(async (osisRef: string) => {
    const db = await initDb();
    const refs = queryAll<{ to_osis: string; weight: number }>(
      db,
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
  }, [getVerse]);

  const getVerseOfDay = useCallback(async () => {
    const db = await initDb();
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
