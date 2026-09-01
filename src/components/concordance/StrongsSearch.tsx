"use client";

import Link from "next/link";
import { useState } from "react";
import { useBibleDb } from "@/lib/bible-db";
import { BOOK_BY_OSIS } from "@/lib/bible-books";
import { formatVerseRef } from "@/lib/verse-ref";

export function StrongsSearch() {
  const { searchStrongs, getStrongsOccurrences } = useBibleDb();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [entries, setEntries] = useState<
    Awaited<ReturnType<typeof searchStrongs>>
  >([]);
  const [occurrences, setOccurrences] = useState<
    Awaited<ReturnType<typeof getStrongsOccurrences>>
  >([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSelected(null);
    setOccurrences([]);
    try {
      const hits = await searchStrongs(query);
      setEntries(hits);
      if (hits.length === 1) {
        await selectEntry(hits[0].number);
      }
    } finally {
      setSearching(false);
    }
  }

  async function selectEntry(number: string) {
    setSelected(number);
    const occs = await getStrongsOccurrences(number);
    setOccurrences(occs);
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Strong&apos;s number (G26) or lemma (agape)'
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

      {entries.length > 1 && (
        <ul className="mb-4 space-y-1">
          {entries.map((entry) => (
            <li key={entry.number}>
              <button
                type="button"
                onClick={() => selectEntry(entry.number)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-100 ${
                  selected === entry.number ? "bg-amber-50 font-medium" : ""
                }`}
              >
                <span className="font-mono text-amber-800">{entry.number}</span>{" "}
                {entry.lemma}
                {entry.transliteration && (
                  <span className="text-stone-500"> ({entry.transliteration})</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && entries.find((e) => e.number === selected) && (
        <div className="mb-4 rounded-lg border border-stone-200 bg-white p-4">
          {(() => {
            const entry = entries.find((e) => e.number === selected)!;
            return (
              <>
                <h3 className="font-mono text-lg font-semibold text-amber-900">
                  {entry.number}
                </h3>
                <p className="text-sm text-stone-600">
                  {entry.lemma}
                  {entry.transliteration && ` · ${entry.transliteration}`}
                  {" · "}
                  {entry.language === "hebrew" ? "Hebrew" : "Greek"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-700">
                  {entry.definition}
                </p>
              </>
            );
          })()}
        </div>
      )}

      {occurrences.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-stone-700">
            {occurrences.length} occurrence{occurrences.length !== 1 ? "s" : ""}
          </h4>
          <ul className="max-h-96 space-y-2 overflow-y-auto">
            {occurrences.map((r, index) => {
              const book = BOOK_BY_OSIS[r.book];
              const label = formatVerseRef(
                { book: r.book, chapter: r.chapter, verseStart: r.verse, verseEnd: r.verse },
                book
              );
              return (
                <li key={`${r.osisRef}-${index}`}>
                  <Link
                    href={`/read/${r.book.toLowerCase()}/${r.chapter}`}
                    className="block rounded-lg border border-stone-200 bg-white p-3 hover:border-amber-300"
                  >
                    <span className="text-sm font-semibold text-amber-900">{label}</span>
                    <p className="mt-1 line-clamp-2 text-sm text-stone-600">{r.text}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
