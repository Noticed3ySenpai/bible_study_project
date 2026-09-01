"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useBibleDb, type CrossRef, type LexiconEntry, type Verse } from "@/lib/bible-db";
import { BOOK_BY_OSIS } from "@/lib/bible-books";
import { morphologyLabel, parseRootStrongs } from "@/lib/verse-alignment";
import { formatVerseRef } from "@/lib/verse-ref";
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
        <span
          className={`text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open && <div className="border-t border-stone-200 px-3 pb-3 pt-2">{children}</div>}
    </section>
  );
}

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
    <div className="flex h-full flex-col bg-stone-100/80">
      <div className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Study
          </h2>
          <p className="text-sm font-medium text-stone-800">
            {verseLabelFromOsis(selectedVerse)}
          </p>
        </div>
        <button
          type="button"
          onClick={closeConcordance}
          className="flex min-h-9 min-w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200/60 hover:text-stone-700"
          aria-label="Close concordance"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-4">
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
                    ? lexicon
                      ? null
                      : "Tap a highlighted word below to see its Strong's entry."
                    : "Word-level study is available in the New Testament."}
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
                            onClick={() => onNavigateVerse(occ.book, occ.chapter)}
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
