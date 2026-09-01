"use client";

import { useEffect, useState } from "react";
import { useBibleDb, type Verse } from "@/lib/bible-db";
import { ChapterNav } from "./ChapterNav";
import { CrossRefPanel } from "./CrossRefPanel";

export function BibleReader({
  bookId,
  bookOsis,
  bookName,
  chapter,
  maxChapter,
}: {
  bookId: number;
  bookOsis: string;
  bookName: string;
  chapter: number;
  maxChapter: number;
}) {
  const { ready, getChapter } = useBibleDb();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState("");

  const chapterKey = `${bookId}-${chapter}`;
  const loading = ready && loadedKey !== chapterKey;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getChapter(bookId, chapter).then((data) => {
      if (!cancelled) {
        setVerses(data);
        setLoadedKey(chapterKey);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready, bookId, chapter, chapterKey, getChapter]);

  return (
    <div className="flex h-full flex-col">
      <ChapterNav
        bookOsis={bookOsis}
        bookName={bookName}
        chapter={chapter}
        maxChapter={maxChapter}
      />
      <div className="flex flex-1 flex-col md:flex-row">
        <article className="flex-1 px-4 py-6 md:max-w-3xl md:px-8">
          {loading ? (
            <p className="text-stone-500">Loading chapter…</p>
          ) : (
            <div className="space-y-3 leading-relaxed">
              {verses.map((v) => (
                <p
                  key={v.osisRef}
                  className={`cursor-pointer rounded-lg px-2 py-1 text-base transition-colors ${
                    selectedVerse === v.osisRef
                      ? "bg-amber-100"
                      : "hover:bg-stone-100"
                  }`}
                  onClick={() =>
                    setSelectedVerse(selectedVerse === v.osisRef ? null : v.osisRef)
                  }
                >
                  <sup className="mr-1 text-xs font-semibold text-amber-800">
                    {v.verse}
                  </sup>
                  {v.text}
                </p>
              ))}
            </div>
          )}
        </article>
        {selectedVerse && (
          <aside className="md:w-80 md:border-l md:border-stone-200 md:bg-white">
            <CrossRefPanel
              osisRef={selectedVerse}
              onClose={() => setSelectedVerse(null)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
