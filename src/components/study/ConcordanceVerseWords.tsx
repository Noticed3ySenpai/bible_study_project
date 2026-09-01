"use client";

import { useEffect, useState } from "react";
import { useBibleDb, type VerseWord } from "@/lib/bible-db";
import { alignVerseWords, type AlignedToken } from "@/lib/verse-alignment";
import { useStudy } from "./StudyContext";

function WordChip({
  token,
  active,
  onSelect,
}: {
  token: AlignedToken;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-md px-1.5 py-0.5 text-sm transition ${
        active
          ? "bg-sky-600 text-white shadow-sm"
          : "bg-sky-50 text-sky-900 ring-1 ring-sky-200 hover:bg-sky-100"
      }`}
    >
      {token.text}
    </button>
  );
}

export function ConcordanceVerseWords({ osisRef }: { osisRef: string }) {
  const { hoveredStrongs, setHoveredStrongs } = useStudy();
  const { ready, getVerse, getVerseWords } = useBibleDb();
  const [text, setText] = useState("");
  const [verseWords, setVerseWords] = useState<VerseWord[]>([]);
  const [aligned, setAligned] = useState<AlignedToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    setLoading(true);

    async function load() {
      const [verse, words] = await Promise.all([getVerse(osisRef), getVerseWords(osisRef)]);
      if (cancelled) return;

      const verseText = verse?.text ?? "";
      setText(verseText);
      setVerseWords(words);
      setAligned(alignVerseWords(verseText, words));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ready, osisRef, getVerse, getVerseWords]);

  if (loading) {
    return <p className="text-sm text-stone-500">Loading verse…</p>;
  }

  const hasWordStudy = verseWords.length > 0;
  const hoverableTokens = aligned.filter((t) => t.isHoverable && t.strongs);

  if (!hasWordStudy) {
    return <p className="font-serif text-sm leading-relaxed text-stone-700">{text}</p>;
  }

  return (
    <div className="space-y-3">
      <p className="font-serif text-sm leading-relaxed text-stone-700">{text}</p>
      <div>
        <p className="mb-2 text-xs font-medium text-stone-500">Tap a word to study</p>
        <div className="flex flex-wrap gap-1.5">
          {hoverableTokens.map((token, i) => (
            <WordChip
              key={`${token.strongs}-${i}`}
              token={token}
              active={hoveredStrongs === token.strongs}
              onSelect={() => setHoveredStrongs(token.strongs!)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
