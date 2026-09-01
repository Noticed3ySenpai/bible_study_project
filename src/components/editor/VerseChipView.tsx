"use client";

import type { BlockNoteEditor } from "@blocknote/core";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getBlockIdAtPos } from "@/components/editor/editor-utils";
import { useStudyOptional } from "@/components/study/StudyContext";
import { useBibleDb } from "@/lib/bible-db";

type VerseChipViewProps = {
  osisRef: string;
  book: string;
  chapter: number;
  label: string;
  preview: string;
  editor: BlockNoteEditor<any, any, any>;
  getPos: () => number | undefined;
};

export function VerseChipView({
  osisRef,
  book,
  chapter,
  label,
  preview,
  editor,
  getPos,
}: VerseChipViewProps) {
  const study = useStudyOptional();
  const { ready, getVerse } = useBibleDb();
  const [open, setOpen] = useState(false);
  const [verseText, setVerseText] = useState(preview);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  const href = book ? `/read/${String(book).toLowerCase()}/${chapter}` : "#";
  const canAddToNote = study?.canInsertVerse ?? false;

  useEffect(() => {
    if (!open || verseText || !ready) return;

    let cancelled = false;
    setLoading(true);
    getVerse(osisRef).then((verse) => {
      if (cancelled) return;
      setVerseText(verse?.text ?? "");
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, verseText, ready, getVerse, osisRef]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  function handleAddBlock(blockType: "quote" | "paragraph") {
    if (!verseText || !study) return;

    study.insertVerseBlock({
      text: verseText,
      label,
      blockType,
      getReferenceBlockId: () => getBlockIdAtPos(editor, getPos),
    });
    setOpen(false);
  }

  return (
    <span ref={rootRef} className="verse-chip-wrap relative inline">
      <button
        type="button"
        className="verse-chip"
        contentEditable={false}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((current) => !current);
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {label || osisRef}
      </button>

      {open && (
        <span
          role="dialog"
          className="verse-chip-popover"
          contentEditable={false}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="verse-chip-popover-label">{label || osisRef}</span>
          {loading ? (
            <span className="verse-chip-popover-text text-stone-400">Loading verse…</span>
          ) : verseText ? (
            <span className="verse-chip-popover-text">{verseText}</span>
          ) : (
            <span className="verse-chip-popover-text text-stone-400">Verse text unavailable.</span>
          )}

          {canAddToNote && verseText && (
            <span className="verse-chip-popover-actions">
              <button
                type="button"
                className="verse-chip-popover-action"
                onClick={() => handleAddBlock("quote")}
              >
                Add as quote
              </button>
              <button
                type="button"
                className="verse-chip-popover-action"
                onClick={() => handleAddBlock("paragraph")}
              >
                Add as text
              </button>
            </span>
          )}

          <Link href={href} className="verse-chip-popover-link" onClick={() => setOpen(false)}>
            Open in Bible
          </Link>
        </span>
      )}
    </span>
  );
}
