"use client";

import { useEffect, useState } from "react";
import { ArrowLeftIcon, CheckIcon } from "@heroicons/react/24/outline";
import type { VerseWord } from "@/lib/bible-db";
import { BOOK_BY_OSIS } from "@/lib/bible-books";
import { alignVerseWords, type AlignedToken } from "@/lib/verse-alignment";
import { formatVerseRef } from "@/lib/verse-ref";
import { useStudy } from "./StudyContext";

function WordToken({
  token,
  active,
  onActivate,
}: {
  token: AlignedToken;
  active: boolean;
  onActivate: () => void;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      className={`cursor-pointer rounded px-0.5 transition-colors ${
        active
          ? "bg-sky-200 text-sky-950 underline decoration-sky-500"
          : "hover:bg-sky-100 hover:underline hover:decoration-sky-400"
      }`}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onActivate();
        }
      }}
    >
      {token.text}
    </span>
  );
}

export function VerseText({
  verseNumber,
  text,
  osisRef,
  verseWords,
  isSelected,
  onSelectVerse,
}: {
  verseNumber: number;
  text: string;
  osisRef: string;
  verseWords: VerseWord[];
  isSelected: boolean;
  onSelectVerse: (osisRef: string) => void;
}) {
  const { hoveredStrongs, setHoveredStrongs, selectedVerse, canInsertVerse, insertVerse } =
    useStudy();
  const [aligned, setAligned] = useState<AlignedToken[]>([]);
  const [inserted, setInserted] = useState(false);

  useEffect(() => {
    setAligned(alignVerseWords(text, verseWords));
  }, [text, verseWords]);

  const hasWordStudy = verseWords.length > 0;
  const isActiveVerse = selectedVerse === osisRef;
  const [book, chapter] = osisRef.split(".");

  function handleInsertVerse(e: React.MouseEvent) {
    e.stopPropagation();
    const bookInfo = BOOK_BY_OSIS[book];
    const label = formatVerseRef(
      {
        book,
        chapter: Number(chapter),
        verseStart: verseNumber,
        verseEnd: verseNumber,
      },
      bookInfo
    );
    insertVerse({
      book,
      chapter: Number(chapter),
      verse: verseNumber,
      label,
      osisRef,
      preview: text,
    });
    setInserted(true);
    window.setTimeout(() => setInserted(false), 1200);
  }

  return (
    <div
      className={`group flex items-start gap-1.5 rounded-lg px-2 py-1.5 transition-colors ${
        isSelected || isActiveVerse ? "bg-sky-50 ring-1 ring-sky-200" : "hover:bg-stone-50"
      }`}
    >
      {canInsertVerse && (
        <button
          type="button"
          onClick={handleInsertVerse}
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-sm font-semibold transition ${
            inserted
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-amber-200 bg-white text-amber-800 hover:bg-amber-50 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
          }`}
          aria-label={`Insert ${osisRef} into note`}
        >
          {inserted ? (
            <CheckIcon className="h-4 w-4" aria-hidden />
          ) : (
            <ArrowLeftIcon className="h-4 w-4" aria-hidden />
          )}
        </button>
      )}
      <p
        className="min-w-0 flex-1 cursor-pointer text-base leading-relaxed"
        onClick={() => onSelectVerse(osisRef)}
      >
        <sup className="mr-1 select-none text-xs font-semibold text-amber-800">{verseNumber}</sup>
        {aligned.map((token, i) => (
          <span key={`${osisRef}-${i}`}>
            {token.leadingSpace ? " " : ""}
            {token.isHoverable && token.strongs && isActiveVerse ? (
              <WordToken
                token={token}
                active={hoveredStrongs === token.strongs}
                onActivate={() => setHoveredStrongs(token.strongs!)}
              />
            ) : (
              token.text
            )}
          </span>
        ))}
        {isActiveVerse && !hasWordStudy && (
          <span className="ml-2 text-xs text-stone-400">(no word study)</span>
        )}
      </p>
    </div>
  );
}
