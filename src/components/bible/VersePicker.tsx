"use client";

import { useState } from "react";
import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BIBLE_BOOKS } from "@/lib/bible-books";

export function VersePicker({
  onSelect,
  className = "",
}: {
  onSelect?: (ref: { book: string; chapter: number; verse: number; label: string; osisRef: string }) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState(BIBLE_BOOKS[0]);
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState(1);

  const filteredBooks = BIBLE_BOOKS.filter(
    (b) =>
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      b.osis.toLowerCase().includes(query.toLowerCase())
  );

  function handleSelect() {
    const label = `${selectedBook.name} ${chapter}:${verse}`;
    const osisRef = `${selectedBook.osis}.${chapter}.${verse}`;
    onSelect?.({
      book: selectedBook.osis,
      chapter,
      verse,
      label,
      osisRef,
    });
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`min-h-11 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 ${className}`}
      >
        Insert Verse
      </button>
    );
  }

  return (
    <div className={`rounded-xl border border-stone-200 bg-white p-4 shadow-lg ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Pick a Verse</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      <input
        type="search"
        placeholder="Search books…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-3 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
      />
      <div className="mb-3 max-h-32 overflow-y-auto rounded-lg border border-stone-200">
        {filteredBooks.map((book) => (
          <button
            key={book.osis}
            type="button"
            onClick={() => {
              setSelectedBook(book);
              setChapter(1);
              setVerse(1);
            }}
            className={`block w-full px-3 py-2 text-left text-sm hover:bg-stone-50 ${
              selectedBook.osis === book.osis ? "bg-amber-50 font-medium text-amber-900" : ""
            }`}
          >
            {book.name}
          </button>
        ))}
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <label className="text-xs text-stone-500">
          Chapter
          <input
            type="number"
            min={1}
            max={selectedBook.chapters}
            value={chapter}
            onChange={(e) => setChapter(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs text-stone-500">
          Verse
          <input
            type="number"
            min={1}
            value={verse}
            onChange={(e) => setVerse(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSelect}
          className="min-h-11 flex-1 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
        >
          Insert {selectedBook.name} {chapter}:{verse}
        </button>
        <Link
          href={`/read/${selectedBook.osis.toLowerCase()}/${chapter}`}
          className="flex min-h-11 items-center rounded-lg border border-stone-300 px-3 text-sm text-stone-600 hover:bg-stone-50"
        >
          Read
        </Link>
      </div>
    </div>
  );
}
