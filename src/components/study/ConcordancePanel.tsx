"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { getAdjacentVerseOsis } from "@/lib/adjacent-verse";
import { useBibleDb, type CrossRef, type LexiconEntry, type Verse } from "@/lib/bible-db";
import { BOOK_BY_OSIS } from "@/lib/bible-books";
import { morphologyLabel, parseRootStrongs } from "@/lib/verse-alignment";
import { formatVerseRef, parseOsisVerse } from "@/lib/verse-ref";
import { useStudy } from "./StudyContext";
import { ConcordanceVerseWords } from "./ConcordanceVerseWords";
import { verseLabelFromOsis } from "./StudyTopBar";

function StudyCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-stone-200 bg-stone-50/80 p-3 ${className}`}
    >
      {title && (
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

function CollapsibleStudyCard({
  title,
  count,
  defaultOpen = false,
  resetKey,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  resetKey?: string | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [resetKey, defaultOpen]);

  return (
    <section className="rounded-lg border border-stone-200 bg-stone-50/80">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          {title}
          {count !== undefined && (
            <span className="ml-1.5 font-normal normal-case text-stone-400">({count})</span>
          )}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && <div className="border-t border-stone-200 px-3 pb-3 pt-2">{children}</div>}
    </section>
  );
}

export function ConcordancePanel({
  onNavigateVerse,
}: {
  onNavigateVerse: (book: string, chapter: number, osisRef?: string) => void;
}) {
  const { selectedVerse, hoveredStrongs, closeConcordance, setHoveredStrongs, selectVerse } =
    useStudy();
  const { getLexiconEntry, getStrongsOccurrences, getCrossReferences, getVerseWords, getChapter } =
    useBibleDb();

  const [lexicon, setLexicon] = useState<LexiconEntry | null>(null);
  const [occurrences, setOccurrences] = useState<Verse[]>([]);
  const [crossRefs, setCrossRefs] = useState<CrossRef[]>([]);
  const [hasWordStudy, setHasWordStudy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [navigatingVerse, setNavigatingVerse] = useState(false);

  const navigateAdjacentVerse = useCallback(
    async (direction: "prev" | "next") => {
      if (!selectedVerse || navigatingVerse) return;
      setNavigatingVerse(true);
      try {
        const nextOsis = await getAdjacentVerseOsis(selectedVerse, direction, getChapter);
        if (!nextOsis) return;
        const parsed = parseOsisVerse(nextOsis);
        if (!parsed) return;
        onNavigateVerse(parsed.book, parsed.chapter, nextOsis);
        selectVerse(nextOsis);
      } finally {
        setNavigatingVerse(false);
      }
    },
    [selectedVerse, navigatingVerse, getChapter, onNavigateVerse, selectVerse]
  );

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
    <div className="flex h-full min-h-0 flex-col bg-stone-100/80">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-stone-200 bg-stone-50 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Study
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateAdjacentVerse("prev")}
              disabled={navigatingVerse}
              className="flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-50 md:hidden"
              aria-label="Previous verse"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <p className="min-w-0 truncate text-sm font-medium text-stone-800">
              {verseLabelFromOsis(selectedVerse)}
            </p>
            <button
              type="button"
              onClick={() => navigateAdjacentVerse("next")}
              disabled={navigatingVerse}
              className="flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-50 md:hidden"
              aria-label="Next verse"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={closeConcordance}
          className="flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200/60 hover:text-stone-700"
          aria-label="Close concordance"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y p-3 md:p-4">
        <article className="overflow-hidden rounded-xl border border-sky-200/80 bg-white shadow-md ring-1 ring-sky-100">
          <header className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Concordance
            </p>
            {lexicon ? (
              <div className="mt-2">
                <p className="font-serif text-2xl text-stone-900">{lexicon.lemma}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  {lexicon.transliteration && (
                    <span className="text-stone-600">{lexicon.transliteration}</span>
                  )}
                  <span className="rounded-md bg-sky-100 px-2 py-0.5 font-mono text-sm font-medium text-sky-900">
                    {lexicon.number}
                  </span>
                  <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-stone-600">
                    {lexicon.language === "hebrew" || lexicon.number.startsWith("H")
                      ? "Hebrew"
                      : "Greek"}
                  </span>
                </div>
                {lexicon.morphology && (
                  <p className="mt-1.5 text-xs uppercase tracking-wide text-stone-500">
                    {morphologyLabel(lexicon.morphology)}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm text-stone-600">
                {loading
                  ? "Loading…"
                  : hasWordStudy
                    ? "Tap a word below to see its Strong's entry."
                    : "No word-level Strong's tags for this verse."}
              </p>
            )}
          </header>

          <div className="space-y-3 p-4">
            <StudyCard title="Verse">
              <ConcordanceVerseWords osisRef={selectedVerse} />
            </StudyCard>

            {loading ? (
              <p className="text-sm text-stone-500">Loading…</p>
            ) : lexicon ? (
              <>
                <StudyCard title="Definition">
                  <p className="text-sm leading-relaxed text-stone-700">
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
                </StudyCard>

                <CollapsibleStudyCard
                  title="Occurrences"
                  count={occurrences.length}
                  defaultOpen={false}
                  resetKey={hoveredStrongs}
                >
                  <ul className="space-y-2">
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
                            onClick={() => {
                              onNavigateVerse(occ.book, occ.chapter, occ.osisRef);
                              selectVerse(occ.osisRef);
                            }}
                            className="w-full rounded-lg border border-stone-200 bg-white p-3 text-left transition hover:border-sky-300 hover:bg-sky-50"
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
                </CollapsibleStudyCard>
              </>
            ) : (
              crossRefs.length > 0 && (
                <StudyCard title="Cross References">
                  <ul className="space-y-2">
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
                            className="block rounded-lg border border-stone-200 bg-white p-3 transition hover:border-sky-300 hover:bg-sky-50"
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
                </StudyCard>
              )
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
