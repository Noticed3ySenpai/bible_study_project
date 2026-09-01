"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useBibleDb, type CrossRef, type LexiconEntry, type Verse } from "@/lib/bible-db";
import { BOOK_BY_OSIS } from "@/lib/bible-books";
import { morphologyLabel, parseRootStrongs } from "@/lib/verse-alignment";
import { formatVerseRef } from "@/lib/verse-ref";
import { useStudy } from "./StudyContext";
import { verseLabelFromOsis } from "./StudyTopBar";

export function ConcordancePanel({
  onNavigateVerse,
}: {
  onNavigateVerse: (book: string, chapter: number) => void;
}) {
  const { selectedVerse, hoveredStrongs, closeConcordance, setHoveredStrongs } = useStudy();
  const { getLexiconEntry, getStrongsOccurrences, getCrossReferences, getVerseWords } =
    useBibleDb();

  const [lexicon, setLexicon] = useState<LexiconEntry | null>(null);
  const [occurrences, setOccurrences] = useState<Verse[]>([]);
  const [crossRefs, setCrossRefs] = useState<CrossRef[]>([]);
  const [hasWordStudy, setHasWordStudy] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedVerse) return;

    let cancelled = false;
    setLoading(true);

    async function load() {
      const words = await getVerseWords(selectedVerse!);
      const refs = await getCrossReferences(selectedVerse!);
      if (cancelled) return;

      setHasWordStudy(words.length > 0);
      setCrossRefs(refs);

      if (hoveredStrongs) {
        const entry = await getLexiconEntry(hoveredStrongs, selectedVerse!);
        const occs = await getStrongsOccurrences(hoveredStrongs);
        if (!cancelled) {
          setLexicon(entry);
          setOccurrences(occs);
        }
      } else {
        setLexicon(null);
        setOccurrences([]);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [
    selectedVerse,
    hoveredStrongs,
    getLexiconEntry,
    getStrongsOccurrences,
    getCrossReferences,
    getVerseWords,
  ]);

  if (!selectedVerse) return null;

  const rootStrongs = lexicon ? parseRootStrongs(lexicon.definition) : null;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Lexicon
          </h2>
          <p className="text-sm font-medium text-stone-800">
            {verseLabelFromOsis(selectedVerse)}
          </p>
        </div>
        <button
          type="button"
          onClick={closeConcordance}
          className="flex min-h-9 min-w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          aria-label="Close concordance"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="text-sm text-stone-500">Loading…</p>
        ) : lexicon ? (
          <div className="space-y-5">
            <div>
              <p className="font-serif text-2xl text-stone-900">{lexicon.lemma}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                {lexicon.transliteration && (
                  <span className="text-stone-600">{lexicon.transliteration}</span>
                )}
                <span className="rounded bg-sky-100 px-2 py-0.5 font-mono text-sky-800">
                  {lexicon.number}
                </span>
              </div>
              {lexicon.morphology && (
                <p className="mt-2 text-xs uppercase tracking-wide text-stone-500">
                  {morphologyLabel(lexicon.morphology)}
                </p>
              )}
            </div>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Definition
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-700">
                {lexicon.definition.trim()}
              </p>
              {rootStrongs && (
                <p className="mt-2 text-sm text-stone-600">
                  Root:{" "}
                  <button
                    type="button"
                    className="font-mono text-sky-700 hover:underline"
                    onClick={() => setHoveredStrongs(rootStrongs)}
                  >
                    {rootStrongs}
                  </button>
                </p>
              )}
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Occurrences
              </h3>
              <ul className="mt-2 space-y-2">
                {occurrences.slice(0, 30).map((occ, index) => {
                  const label = formatVerseRef(
                    {
                      book: occ.book,
                      chapter: occ.chapter,
                      verseStart: occ.verse,
                      verseEnd: occ.verse,
                    },
                    BOOK_BY_OSIS[occ.book]
                  );
                  const isCurrent = occ.osisRef === selectedVerse;
                  return (
                    <li key={`${occ.osisRef}-${index}`}>
                      <button
                        type="button"
                        onClick={() => onNavigateVerse(occ.book, occ.chapter)}
                        className="w-full rounded-lg border border-stone-200 p-3 text-left hover:border-sky-300 hover:bg-sky-50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-sky-900">{label}</span>
                          {isCurrent && (
                            <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-stone-600">{occ.text}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-stone-600">
              {hasWordStudy
                ? "Hover a highlighted word in the verse to see its Strong's entry."
                : "Word-level study is available in the New Testament. Cross-references for this verse are shown below."}
            </p>

            {crossRefs.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Cross References
                </h3>
                <ul className="mt-2 space-y-2">
                  {crossRefs.map((ref, index) => {
                    const [book, chapter, verse] = ref.toOsis.split(".");
                    const label = formatVerseRef(
                      {
                        book,
                        chapter: Number(chapter),
                        verseStart: Number(verse),
                        verseEnd: Number(verse),
                      },
                      BOOK_BY_OSIS[book]
                    );
                    return (
                      <li key={`${ref.toOsis}-${index}`}>
                        <Link
                          href={`/read/${book.toLowerCase()}/${chapter}`}
                          className="block rounded-lg border border-stone-200 p-3 hover:border-sky-300 hover:bg-sky-50"
                        >
                          <span className="text-sm font-semibold text-sky-900">{label}</span>
                          {ref.text && (
                            <p className="mt-1 line-clamp-2 text-sm text-stone-600">{ref.text}</p>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
