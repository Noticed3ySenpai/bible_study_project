"use client";

import Link from "next/link";
import { BIBLE_BOOKS } from "@/lib/bible-books";

export function ChapterNav({
  bookOsis,
  bookName,
  chapter,
  maxChapter,
  embedded = false,
  onChapterChange,
}: {
  bookOsis: string;
  bookName: string;
  chapter: number;
  maxChapter: number;
  embedded?: boolean;
  onChapterChange?: (chapter: number, bookOsis: string) => void;
}) {
  const slug = bookOsis.toLowerCase();
  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < maxChapter ? chapter + 1 : null;

  const currentIndex = BIBLE_BOOKS.findIndex((b) => b.osis === bookOsis);
  const prevBook = currentIndex > 0 ? BIBLE_BOOKS[currentIndex - 1] : null;
  const nextBook =
    currentIndex < BIBLE_BOOKS.length - 1 ? BIBLE_BOOKS[currentIndex + 1] : null;

  const navButtonClass =
    "flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100";

  function goToChapter(targetChapter: number, targetBookOsis = bookOsis) {
    if (embedded && onChapterChange) {
      onChapterChange(targetChapter, targetBookOsis);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 border-b border-stone-200 bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        {prevChapter ? (
          embedded ? (
            <button
              type="button"
              onClick={() => goToChapter(prevChapter)}
              className={navButtonClass}
              aria-label="Previous chapter"
            >
              ‹
            </button>
          ) : (
            <Link href={`/read/${slug}/${prevChapter}`} className={navButtonClass} aria-label="Previous chapter">
              ‹
            </Link>
          )
        ) : prevBook ? (
          embedded ? (
            <button
              type="button"
              onClick={() => goToChapter(prevBook.chapters, prevBook.osis)}
              className={navButtonClass}
              aria-label={`Previous book: ${prevBook.name}`}
            >
              ‹‹
            </button>
          ) : (
            <Link
              href={`/read/${prevBook.osis.toLowerCase()}/${prevBook.chapters}`}
              className={navButtonClass}
              aria-label={`Previous book: ${prevBook.name}`}
            >
              ‹‹
            </Link>
          )
        ) : (
          <span className="min-w-11" />
        )}
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold">{bookName}</p>
          <p className="text-xs text-stone-500">Chapter {chapter}</p>
        </div>
        {nextChapter ? (
          embedded ? (
            <button
              type="button"
              onClick={() => goToChapter(nextChapter)}
              className={navButtonClass}
              aria-label="Next chapter"
            >
              ›
            </button>
          ) : (
            <Link href={`/read/${slug}/${nextChapter}`} className={navButtonClass} aria-label="Next chapter">
              ›
            </Link>
          )
        ) : nextBook ? (
          embedded ? (
            <button
              type="button"
              onClick={() => goToChapter(1, nextBook.osis)}
              className={navButtonClass}
              aria-label={`Next book: ${nextBook.name}`}
            >
              ››
            </button>
          ) : (
            <Link
              href={`/read/${nextBook.osis.toLowerCase()}/1`}
              className={navButtonClass}
              aria-label={`Next book: ${nextBook.name}`}
            >
              ››
            </Link>
          )
        ) : (
          <span className="min-w-11" />
        )}
      </div>
    </div>
  );
}
