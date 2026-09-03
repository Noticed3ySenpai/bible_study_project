"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useBibleDb, type CrossRef } from "@/lib/bible-db";
import { BOOK_BY_OSIS } from "@/lib/bible-books";
import { formatVerseRef } from "@/lib/verse-ref";

export function CrossRefPanel({
  osisRef,
  onClose,
}: {
  osisRef: string;
  onClose: () => void;
}) {
  const { getCrossReferences } = useBibleDb();
  const [refs, setRefs] = useState<CrossRef[]>([]);
  const [loadedRef, setLoadedRef] = useState("");
  const loading = loadedRef !== osisRef;

  useEffect(() => {
    let cancelled = false;
    getCrossReferences(osisRef).then((data) => {
      if (!cancelled) {
        setRefs(data);
        setLoadedRef(osisRef);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [osisRef, getCrossReferences]);

  return (
    <div className="border-t border-stone-200 bg-stone-50 p-4 md:rounded-xl md:border md:shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Cross References</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 md:hidden"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : refs.length === 0 ? (
        <p className="text-sm text-stone-500">No cross-references found.</p>
      ) : (
        <ul className="space-y-2">
          {refs.map((ref) => {
            const [book, chapter, verse] = ref.toOsis.split(".");
            const bookInfo = BOOK_BY_OSIS[book];
            const label = formatVerseRef(
              { book, chapter: Number(chapter), verseStart: Number(verse), verseEnd: Number(verse) },
              bookInfo
            );
            return (
              <li key={ref.toOsis}>
                <Link
                  href={`/read/${book.toLowerCase()}/${chapter}`}
                  className="block rounded-lg bg-white p-3 text-sm hover:bg-amber-50"
                >
                  <span className="font-medium text-amber-900">{label}</span>
                  {ref.text && (
                    <p className="mt-1 line-clamp-2 text-stone-600">{ref.text}</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
