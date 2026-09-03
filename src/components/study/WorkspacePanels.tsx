"use client";

import { useEffect } from "react";
import { ChapterNav } from "@/components/bible/ChapterNav";
import { BiblePanel } from "./BiblePanel";
import { ConcordancePanel } from "./ConcordancePanel";
import { useStudy } from "./StudyContext";

function useMobilePanelScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.body.dataset.mobilePanelOpen = "true";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      delete document.body.dataset.mobilePanelOpen;
    };
  }, [open]);
}

function MobilePanelSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useMobilePanelScrollLock(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close panel"
        onClick={onClose}
      />
      <div
        className="absolute inset-x-0 bottom-0 flex h-[85vh] max-h-[85vh] flex-col rounded-t-2xl bg-stone-100 shadow-2xl"
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center py-2">
          <div className="h-1 w-10 rounded-full bg-stone-300" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain touch-pan-y">
          {children}
        </div>
      </div>
    </div>
  );
}

export function WorkspacePanels({
  bibleBookId,
  bibleChapter,
  bibleBookOsis,
  bibleBookName,
  bibleMaxChapter,
  showBible = true,
  onNavigateVerse,
  onChapterChange,
  notesPanel,
}: {
  bibleBookId: number;
  bibleChapter: number;
  bibleBookOsis?: string;
  bibleBookName?: string;
  bibleMaxChapter?: number;
  showBible?: boolean;
  onNavigateVerse: (book: string, chapter: number, osisRef?: string) => void;
  onChapterChange?: (chapter: number, bookOsis: string) => void;
  notesPanel?: React.ReactNode;
}) {
  const { bibleOpen, concordanceOpen, closeBible, closeConcordance } = useStudy();

  const bibleVisible = showBible && (notesPanel ? bibleOpen : true);
  const openPanelCount =
    (notesPanel ? 1 : 0) + (bibleVisible ? 1 : 0) + (concordanceOpen ? 1 : 0);

  const panelWidth =
    openPanelCount <= 1
      ? "flex-1"
      : openPanelCount === 2
        ? "min-w-0 flex-1"
        : "min-w-0 flex-1 md:max-w-[40%]";

  const showInlineBibleNav = Boolean(
    notesPanel && onChapterChange && bibleBookOsis && bibleBookName && bibleMaxChapter
  );

  function renderBibleNav() {
    if (!showInlineBibleNav) return null;
    return (
      <ChapterNav
        bookOsis={bibleBookOsis!}
        bookName={bibleBookName!}
        chapter={bibleChapter}
        maxChapter={bibleMaxChapter!}
        embedded
        onChapterChange={onChapterChange}
      />
    );
  }

  return (
    <>
      <div className="relative flex min-h-0 flex-1">
        {notesPanel && (
          <section
            className={`${panelWidth} flex min-h-0 flex-col border-stone-200 bg-white ${
              bibleVisible || concordanceOpen ? "md:border-r" : ""
            } ${bibleOpen || concordanceOpen ? "max-md:overflow-hidden max-md:touch-none" : ""}`}
          >
            {notesPanel}
          </section>
        )}

        {bibleVisible && (
          <section
            className={`${panelWidth} flex min-h-0 flex-col overflow-hidden ${
              notesPanel ? "hidden md:flex" : ""
            } ${concordanceOpen ? "border-r border-stone-200" : ""}`}
          >
            {renderBibleNav()}
            <div className="min-h-0 flex-1 overflow-hidden">
              <BiblePanel bookId={bibleBookId} chapter={bibleChapter} />
            </div>
          </section>
        )}

        {concordanceOpen && (
          <aside className={`${panelWidth} hidden min-h-0 bg-stone-100/50 md:block`}>
            <ConcordancePanel onNavigateVerse={onNavigateVerse} />
          </aside>
        )}
      </div>

      {notesPanel && (
        <MobilePanelSheet open={bibleOpen} onClose={closeBible}>
          {renderBibleNav()}
          <div className="min-h-0 flex-1 overflow-hidden">
            <BiblePanel bookId={bibleBookId} chapter={bibleChapter} />
          </div>
        </MobilePanelSheet>
      )}

      <div className="md:hidden">
        <MobilePanelSheet open={concordanceOpen} onClose={closeConcordance}>
          <ConcordancePanel onNavigateVerse={onNavigateVerse} />
        </MobilePanelSheet>
      </div>
    </>
  );
}
