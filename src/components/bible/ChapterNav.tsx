"use client";

import Link from "next/link";
import { useId } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { BIBLE_BOOKS, BOOK_BY_OSIS } from "@/lib/bible-books";

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
  const router = useRouter();
  const bookSelectId = useId();
  const chapterSelectId = useId();
  const slug = bookOsis.toLowerCase();
  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < maxChapter ? chapter + 1 : null;

  const currentIndex = BIBLE_BOOKS.findIndex((b) => b.osis === bookOsis);
  const prevBook = currentIndex > 0 ? BIBLE_BOOKS[currentIndex - 1] : null;
  const nextBook =
    currentIndex < BIBLE_BOOKS.length - 1 ? BIBLE_BOOKS[currentIndex + 1] : null;

  const navButtonClass =
    "flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100";
  const selectClass =
    "min-h-9 max-w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500";

  function goToChapter(targetChapter: number, targetBookOsis = bookOsis) {
    if (embedded && onChapterChange) {
      onChapterChange(targetChapter, targetBookOsis);
      return;
    }
    router.push(`/read/${targetBookOsis.toLowerCase()}/${targetChapter}`);
  }

  function handleBookChange(nextOsis: string) {
    const book = BOOK_BY_OSIS[nextOsis];
    if (!book) return;
    goToChapter(1, book.osis);
  }

  function handleChapterSelect(nextChapter: number) {
    const clamped = Math.min(Math.max(1, nextChapter), maxChapter);
    goToChapter(clamped);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-white px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {prevChapter ? (
          embedded ? (
            <button
              type="button"
              onClick={() => goToChapter(prevChapter)}
              className={navButtonClass}
              aria-label="Previous chapter"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          ) : (
            <Link
              href={`/read/${slug}/${prevChapter}`}
              className={navButtonClass}
              aria-label="Previous chapter"
            >
              <ChevronLeftIcon className="h-5 w-5" />
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
              <ChevronDoubleLeftIcon className="h-5 w-5" />
            </button>
          ) : (
            <Link
              href={`/read/${prevBook.osis.toLowerCase()}/${prevBook.chapters}`}
              className={navButtonClass}
              aria-label={`Previous book: ${prevBook.name}`}
            >
              <ChevronDoubleLeftIcon className="h-5 w-5" />
            </Link>
          )
        ) : (
          <span className="min-w-11" />
        )}

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2">
          <label className="sr-only" htmlFor={bookSelectId}>
            Book
          </label>
          <select
            id={bookSelectId}
            value={bookOsis}
            onChange={(e) => handleBookChange(e.target.value)}
            className={`${selectClass} min-w-0 flex-1 basis-36`}
            aria-label="Select book"
          >
            <optgroup label="Old Testament">
              {BIBLE_BOOKS.filter((b) => b.testament === "OT").map((book) => (
                <option key={book.osis} value={book.osis}>
                  {book.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="New Testament">
              {BIBLE_BOOKS.filter((b) => b.testament === "NT").map((book) => (
                <option key={book.osis} value={book.osis}>
                  {book.name}
                </option>
              ))}
            </optgroup>
          </select>

          <label className="sr-only" htmlFor={chapterSelectId}>
            Chapter
          </label>
          <select
            id={chapterSelectId}
            value={chapter}
            onChange={(e) => handleChapterSelect(Number(e.target.value))}
            className={`${selectClass} w-20 shrink-0`}
            aria-label="Select chapter"
          >
            {Array.from({ length: maxChapter }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="sr-only">
            {bookName} chapter {chapter}
          </span>
        </div>

        {nextChapter ? (
          embedded ? (
            <button
              type="button"
              onClick={() => goToChapter(nextChapter)}
              className={navButtonClass}
              aria-label="Next chapter"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          ) : (
            <Link
              href={`/read/${slug}/${nextChapter}`}
              className={navButtonClass}
              aria-label="Next chapter"
            >
              <ChevronRightIcon className="h-5 w-5" />
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
              <ChevronDoubleRightIcon className="h-5 w-5" />
            </button>
          ) : (
            <Link
              href={`/read/${nextBook.osis.toLowerCase()}/1`}
              className={navButtonClass}
              aria-label={`Next book: ${nextBook.name}`}
            >
              <ChevronDoubleRightIcon className="h-5 w-5" />
            </Link>
          )
        ) : (
          <span className="min-w-11" />
        )}
      </div>
    </div>
  );
}
