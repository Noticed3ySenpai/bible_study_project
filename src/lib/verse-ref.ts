import { BOOK_BY_OSIS, type BibleBook } from "./bible-books";

export type VerseRef = {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
};

export function toOsisRef(ref: VerseRef): string {
  const end =
    ref.verseEnd !== ref.verseStart
      ? `-${ref.verseEnd}`
      : "";
  return `${ref.book}.${ref.chapter}.${ref.verseStart}${end}`;
}

export function formatVerseRef(ref: VerseRef, book?: BibleBook): string {
  const name = book?.name ?? BOOK_BY_OSIS[ref.book]?.name ?? ref.book;
  const verses =
    ref.verseEnd !== ref.verseStart
      ? `${ref.verseStart}-${ref.verseEnd}`
      : `${ref.verseStart}`;
  return `${name} ${ref.chapter}:${verses}`;
}

export function parseVerseRef(input: string): VerseRef | null {
  const trimmed = input.trim();
  const match = trimmed.match(
    /^([1-3]?\s?[A-Za-z]+)\s*(\d+)[.:](\d+)(?:\s*-\s*(\d+))?$/i
  );
  if (!match) return null;

  const bookQuery = match[1].replace(/\s+/g, "").toLowerCase();
  const book = Object.values(BOOK_BY_OSIS).find((b) => {
    const osis = b.osis.toLowerCase();
    const name = b.name.toLowerCase().replace(/\s+/g, "");
    return (
      osis === bookQuery ||
      name === bookQuery ||
      name.startsWith(bookQuery)
    );
  });
  if (!book) return null;

  const chapter = Number(match[2]);
  const verseStart = Number(match[3]);
  const verseEnd = match[4] ? Number(match[4]) : verseStart;

  return { book: book.osis, chapter, verseStart, verseEnd };
}

export function verseOfTheDaySeed(date = new Date()): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
}
