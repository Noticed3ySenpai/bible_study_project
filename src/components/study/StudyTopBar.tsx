"use client";

import Link from "next/link";
import { BOOK_BY_OSIS } from "@/lib/bible-books";
import { formatVerseRef } from "@/lib/verse-ref";
import { ChapterNav } from "@/components/bible/ChapterNav";

export function StudyTopBar({
  bookOsis,
  bookName,
  chapter,
  maxChapter,
  concordanceOpen,
  onToggleConcordance,
}: {
  bookOsis: string;
  bookName: string;
  chapter: number;
  maxChapter: number;
  concordanceOpen: boolean;
  onToggleConcordance: () => void;
}) {
  const slug = bookOsis.toLowerCase();

  return (
    <div className="border-b border-stone-200 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <p className="text-xs text-stone-500">
            <Link href="/" className="hover:text-stone-700">Home</Link>
            {" / "}
            <span>{bookName} {chapter}</span>
          </p>
          <h1 className="truncate text-lg font-semibold text-stone-900">
            {bookName} {chapter}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-600 sm:inline">
            WEB
          </span>
          <button
            type="button"
            onClick={onToggleConcordance}
            className={`min-h-9 rounded-lg px-3 text-sm font-medium transition ${
              concordanceOpen
                ? "bg-sky-100 text-sky-900"
                : "border border-stone-300 text-stone-700 hover:bg-stone-50"
            }`}
          >
            <span className="hidden sm:inline">Concordance</span>
            <span className="sm:hidden">Lex</span>
          </button>
        </div>
      </div>
      <ChapterNav
        bookOsis={bookOsis}
        bookName={bookName}
        chapter={chapter}
        maxChapter={maxChapter}
      />
    </div>
  );
}

export function verseLabelFromOsis(osisRef: string): string {
  const [book, chapter, verse] = osisRef.split(".");
  const bookInfo = BOOK_BY_OSIS[book];
  return formatVerseRef(
    { book, chapter: Number(chapter), verseStart: Number(verse), verseEnd: Number(verse) },
    bookInfo
  );
}
