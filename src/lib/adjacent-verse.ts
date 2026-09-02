import { BIBLE_BOOKS, BOOK_BY_OSIS } from "./bible-books";
import { parseOsisVerse } from "./verse-ref";

type ChapterVerse = { verse: number; osisRef: string };

type GetChapterVerses = (bookId: number, chapter: number) => Promise<ChapterVerse[]>;

export async function getAdjacentVerseOsis(
  osisRef: string,
  direction: "prev" | "next",
  getChapter: GetChapterVerses
): Promise<string | null> {
  const parsed = parseOsisVerse(osisRef);
  if (!parsed) return null;

  const book = BOOK_BY_OSIS[parsed.book];
  if (!book) return null;

  const chapterVerses = await getChapter(book.id, parsed.chapter);
  if (chapterVerses.length === 0) return null;

  const idx = chapterVerses.findIndex((v) => v.verse === parsed.verse);

  if (direction === "next") {
    if (idx >= 0 && idx < chapterVerses.length - 1) {
      return chapterVerses[idx + 1].osisRef;
    }
    if (parsed.chapter < book.chapters) {
      const nextVerses = await getChapter(book.id, parsed.chapter + 1);
      return nextVerses[0]?.osisRef ?? null;
    }
    const bookIdx = BIBLE_BOOKS.findIndex((b) => b.osis === parsed.book);
    if (bookIdx >= 0 && bookIdx < BIBLE_BOOKS.length - 1) {
      const nextBook = BIBLE_BOOKS[bookIdx + 1];
      const nextVerses = await getChapter(nextBook.id, 1);
      return nextVerses[0]?.osisRef ?? null;
    }
    return null;
  }

  if (idx > 0) {
    return chapterVerses[idx - 1].osisRef;
  }
  if (parsed.chapter > 1) {
    const prevVerses = await getChapter(book.id, parsed.chapter - 1);
    return prevVerses[prevVerses.length - 1]?.osisRef ?? null;
  }
  const bookIdx = BIBLE_BOOKS.findIndex((b) => b.osis === parsed.book);
  if (bookIdx > 0) {
    const prevBook = BIBLE_BOOKS[bookIdx - 1];
    const prevVerses = await getChapter(prevBook.id, prevBook.chapters);
    return prevVerses[prevVerses.length - 1]?.osisRef ?? null;
  }
  return null;
}
