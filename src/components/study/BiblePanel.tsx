"use client";

import { useEffect, useState } from "react";
import { useBibleDb, type Verse, type VerseWord } from "@/lib/bible-db";
import { useStudy } from "./StudyContext";
import { VerseText } from "./VerseText";

export function BiblePanel({
  bookId,
  chapter,
}: {
  bookId: number;
  chapter: number;
}) {
  const { ready, getChapter, getVerseWords } = useBibleDb();
  const { selectVerse, selectedVerse } = useStudy();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [wordsByVerse, setWordsByVerse] = useState<Record<string, VerseWord[]>>({});
  const [loadedKey, setLoadedKey] = useState("");

  const chapterKey = `${bookId}-${chapter}`;
  const loading = ready && loadedKey !== chapterKey;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function load() {
      const data = await getChapter(bookId, chapter);
      if (cancelled) return;

      setVerses(data);
      setLoadedKey(chapterKey);

      const wordsMap: Record<string, VerseWord[]> = {};
      await Promise.all(
        data.map(async (v) => {
          wordsMap[v.osisRef] = await getVerseWords(v.osisRef);
        })
      );
      if (!cancelled) setWordsByVerse(wordsMap);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ready, bookId, chapter, chapterKey, getChapter, getVerseWords]);

  return (
    <article className="h-full min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-4 py-4 md:px-6">
      {loading ? (
        <p className="text-stone-500">Loading chapter…</p>
      ) : (
        <div className="mx-auto max-w-3xl space-y-2 font-serif">
          {verses.map((v) => (
            <VerseText
              key={v.osisRef}
              verseNumber={v.verse}
              text={v.text}
              osisRef={v.osisRef}
              verseWords={wordsByVerse[v.osisRef] ?? []}
              isSelected={selectedVerse === v.osisRef}
              onSelectVerse={selectVerse}
            />
          ))}
        </div>
      )}
    </article>
  );
}
