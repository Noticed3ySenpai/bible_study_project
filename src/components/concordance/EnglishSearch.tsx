"use client";

import Link from "next/link";
import { useState } from "react";
import { useBibleDb } from "@/lib/bible-db";
import { BOOK_BY_OSIS } from "@/lib/bible-books";
import { formatVerseRef } from "@/lib/verse-ref";

export function EnglishSearch() {
  const { searchEnglish } = useBibleDb();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Awaited<ReturnType<typeof searchEnglish>>
  >([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const hits = await searchEnglish(query);
      setResults(hits);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search verses (e.g. "faith hope")'
            className="min-h-11 flex-1 rounded-lg border border-stone-300 px-4 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={searching}
            className="min-h-11 rounded-lg bg-amber-700 px-5 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {searching ? "…" : "Search"}
          </button>
        </div>
      </form>
      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((r) => {
            const book = BOOK_BY_OSIS[r.book];
            const label = formatVerseRef(
              { book: r.book, chapter: r.chapter, verseStart: r.verse, verseEnd: r.verse },
              book
            );
            return (
              <li key={r.osisRef}>
                <Link
                  href={`/read/${r.book.toLowerCase()}/${r.chapter}`}
                  className="block rounded-lg border border-stone-200 bg-white p-4 hover:border-amber-300 hover:bg-amber-50"
                >
                  <span className="text-sm font-semibold text-amber-900">{label}</span>
                  <p
                    className="mt-1 text-sm text-stone-700 [&_mark]:bg-amber-200 [&_mark]:font-medium"
                    dangerouslySetInnerHTML={{
                      __html: r.snippet ?? r.text,
                    }}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
