"use client";

import { BiblePanel } from "./BiblePanel";
import { ConcordancePanel } from "./ConcordancePanel";
import { useStudy } from "./StudyContext";

function MobilePanelSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close panel"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-stone-100 shadow-2xl">
        <div className="flex justify-center py-2">
          <div className="h-1 w-10 rounded-full bg-stone-300" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

export function WorkspacePanels({
  bibleBookId,
  bibleChapter,
  showBible = true,
  onNavigateVerse,
  notesPanel,
}: {
  bibleBookId: number;
  bibleChapter: number;
  showBible?: boolean;
  onNavigateVerse: (book: string, chapter: number) => void;
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

  return (
    <>
      <div className="relative flex min-h-0 flex-1">
        {notesPanel && (
          <section
            className={`${panelWidth} flex min-h-0 flex-col border-stone-200 bg-white ${
              bibleVisible || concordanceOpen ? "md:border-r" : ""
            }`}
          >
            {notesPanel}
          </section>
        )}

        {bibleVisible && (
          <section
            className={`${panelWidth} min-h-0 overflow-hidden ${
              notesPanel ? "hidden md:block" : ""
            } ${concordanceOpen ? "border-r border-stone-200" : ""}`}
          >
            <BiblePanel bookId={bibleBookId} chapter={bibleChapter} />
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
          <BiblePanel bookId={bibleBookId} chapter={bibleChapter} />
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
