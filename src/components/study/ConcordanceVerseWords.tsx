"use client";

import { useEffect, useState } from "react";
import { useBibleDb, type VerseWord } from "@/lib/bible-db";
import { useStudy } from "./StudyContext";

function WordChip({
  word,
  active,
  onSelect,
}: {
  word: VerseWord;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-md px-1.5 py-0.5 text-left text-sm transition ${
        active
          ? "bg-sky-600 text-white shadow-sm"
          : "bg-sky-50 text-sky-900 ring-1 ring-sky-200 hover:bg-sky-100"
      }`}
      title={word.strongs}
    >
      <span>{word.englishGloss}</span>
      <span
        className={`ml-1 font-mono text-[10px] ${
          active ? "text-sky-100" : "text-sky-600/80"
        }`}
      >
        {word.strongs}
      </span>
    </button>
  );
}

export function ConcordanceVerseWords({ osisRef }: { osisRef: string }) {
  const { hoveredStrongs, setHoveredStrongs } = useStudy();
  const { ready, studyReady, studyLoading, studyProgress, getVerse, getVerseWords } =
    useBibleDb();
  const [text, setText] = useState("");
  const [verseWords, setVerseWords] = useState<VerseWord[]>([]);
  const [loadingVerse, setLoadingVerse] = useState(true);
  const [loadingWords, setLoadingWords] = useState(true);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    setLoadingVerse(true);

    async function loadVerse() {
      const verse = await getVerse(osisRef);
      if (cancelled) return;
      setText(verse?.text ?? "");
      setLoadingVerse(false);
    }

    loadVerse();
    return () => {
      cancelled = true;
    };
  }, [ready, osisRef, getVerse]);

  useEffect(() => {
    if (!ready || !studyReady) return;

    let cancelled = false;
    setLoadingWords(true);

    async function loadWords() {
      const words = await getVerseWords(osisRef);
      if (cancelled) return;
      setVerseWords(words);
      setLoadingWords(false);
    }

    loadWords();
    return () => {
      cancelled = true;
    };
  }, [ready, studyReady, osisRef, getVerseWords]);

  if (loadingVerse) {
    return <p className="text-sm text-stone-500">Loading verse…</p>;
  }

  const waitingForStudy = !studyReady || loadingWords;
  const hasWordStudy = verseWords.length > 0;

  return (
    <div className="space-y-3">
      <p className="font-serif text-sm leading-relaxed text-stone-700">{text}</p>
      {waitingForStudy ? (
        <p className="text-xs text-stone-400">
          {studyLoading || !studyReady
            ? `Loading word study data… ${studyProgress}%`
            : "Loading word tags…"}
        </p>
      ) : hasWordStudy ? (
        <div>
          <p className="mb-2 text-xs font-medium text-stone-500">
            Tap a word to study ({verseWords.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {verseWords.map((word) => (
              <WordChip
                key={`${word.strongs}-${word.wordIndex}`}
                word={word}
                active={hoveredStrongs === word.strongs}
                onSelect={() => setHoveredStrongs(word.strongs)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
