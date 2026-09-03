"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BasicTextStyleButton,
  BlockTypeSelect,
  FormattingToolbar,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/ariakit";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/ariakit/style.css";
import "./study-editor.css";
import { studyEditorSchema } from "./verse-chip-schema";
import { useStudyOptional } from "@/components/study/StudyContext";
import type { VerseBlockInsertRef } from "@/components/study/StudyContext";
import { BIBLE_BOOKS } from "@/lib/bible-books";

type StudyEditorProps = {
  initialContent: unknown;
  editable?: boolean;
  onSaveContent: (content: unknown) => Promise<void>;
};

export default function StudyEditor({
  initialContent,
  editable = true,
  onSaveContent,
}: StudyEditorProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const study = useStudyOptional();

  const initialBlocks = useMemo(() => {
    if (!Array.isArray(initialContent) || initialContent.length === 0) return undefined;
    return initialContent;
  }, [initialContent]);

  const editor = useCreateBlockNote({
    schema: studyEditorSchema,
    initialContent: initialBlocks,
  });

  const scheduleSave = useCallback(
    (document: unknown) => {
      if (!editable) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState("saving");
      saveTimer.current = setTimeout(async () => {
        try {
          await onSaveContent(document);
          setSaveState("saved");
        } catch {
          setSaveState("error");
        }
      }, 800);
    },
    [editable, onSaveContent]
  );

  const insertVerse = useCallback(
    (ref: { book: string; chapter: number; verse: number; label: string; osisRef: string; preview?: string }) => {
      editor.insertInlineContent([
        {
          type: "verseChip",
          props: {
            osisRef: ref.osisRef,
            book: ref.book,
            chapter: ref.chapter,
            verseStart: ref.verse,
            verseEnd: ref.verse,
            label: ref.label,
            preview: ref.preview ?? "",
          },
        },
        " ",
      ]);
    },
    [editor]
  );

  const insertVerseBlock = useCallback(
    (ref: VerseBlockInsertRef) => {
      const referenceBlockId = ref.getReferenceBlockId();
      const referenceBlock =
        (referenceBlockId ? editor.getBlock(referenceBlockId) : undefined) ??
        editor.getTextCursorPosition().block;

      editor.insertBlocks(
        [
          {
            type: ref.blockType,
            content: ref.text,
          },
        ],
        referenceBlock,
        "after"
      );
      scheduleSave(editor.document);
    },
    [editor, scheduleSave]
  );

  useEffect(() => {
    if (!study) return;
    study.registerInsertVerse(insertVerse);
    study.registerInsertVerseBlock(insertVerseBlock);
    return () => {
      study.registerInsertVerse(null);
      study.registerInsertVerseBlock(null);
    };
  }, [study, insertVerse, insertVerseBlock]);

  // Notion-style mobile: show + / drag handles for the focused block.
  // BlockNote's default SideMenu is hover-only and hides on keydown, which
  // doesn't work well on touch devices.
  useEffect(() => {
    if (!editable || typeof window === "undefined") return;

    const isTouchUi =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(max-width: 767px)").matches;
    if (!isTouchUi) return;

    const showSideMenuForCursorBlock = () => {
      if (!editor.isFocused()) return;

      try {
        const { block } = editor.getTextCursorPosition();
        const blockEl = editor.domElement?.querySelector(
          `[data-id="${CSS.escape(block.id)}"]`
        ) as HTMLElement | null;
        if (!blockEl) return;

        const rect = blockEl.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        blockEl.dispatchEvent(
          new MouseEvent("mousemove", {
            clientX: rect.left + 12,
            clientY: rect.top + Math.min(20, Math.max(8, rect.height / 2)),
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
      } catch {
        // Cursor can briefly be in an invalid position during edits.
      }
    };

    const scheduleShow = () => {
      requestAnimationFrame(showSideMenuForCursorBlock);
    };

    const unsubscribe = editor.onSelectionChange(scheduleShow);
    editor.domElement?.addEventListener("focusin", scheduleShow);

    return () => {
      unsubscribe();
      editor.domElement?.removeEventListener("focusin", scheduleShow);
    };
  }, [editor, editable]);

  const getVerseSuggestions = useCallback(
  async (query: string) => {
    const q = query.toLowerCase();
    return BIBLE_BOOKS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.osis.toLowerCase().includes(q)
    )
      .slice(0, 8)
      .map((book) => ({
        title: book.name,
        onItemClick: () => {
          insertVerse({
            book: book.osis,
            chapter: 1,
            verse: 1,
            label: `${book.name} 1:1`,
            osisRef: `${book.osis}.1.1`,
          });
        },
      }));
  },
  [insertVerse]
);

  return (
    <div className="study-editor relative flex h-full min-h-0 flex-col">
      {saveState !== "idle" && (
        <span className="pointer-events-none absolute right-3 top-3 z-10 text-xs text-stone-400">
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && "Saved"}
          {saveState === "error" && "Save failed"}
        </span>
      )}
      <div className="min-h-0 flex-1">
        <BlockNoteView
          editor={editor}
          editable={editable}
          theme="light"
          formattingToolbar={false}
          onChange={() => scheduleSave(editor.document)}
        >
        <FormattingToolbar>
          <BlockTypeSelect key="blockTypeSelect" />
          <BasicTextStyleButton basicTextStyle="bold" key="bold" />
          <BasicTextStyleButton basicTextStyle="italic" key="italic" />
          <BasicTextStyleButton basicTextStyle="underline" key="underline" />
        </FormattingToolbar>
        <SuggestionMenuController
          triggerCharacter="@"
          getItems={async (query) =>
            filterSuggestionItems(await getVerseSuggestions(query), query)
          }
        />
      </BlockNoteView>
      </div>
    </div>
  );
}
