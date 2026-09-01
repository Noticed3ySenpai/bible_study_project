"use client";

import { useCallback, useEffect, useState } from "react";
import { BOOK_BY_OSIS } from "@/lib/bible-books";
import { StudyProvider, useStudy } from "./StudyContext";
import { WorkspacePanels } from "./WorkspacePanels";
import { WorkspaceToolbar } from "./WorkspaceToolbar";

const DEFAULT_BIBLE = { bookOsis: "John", chapter: 3 };

function loadBibleLocation() {
  if (typeof window === "undefined") return DEFAULT_BIBLE;
  try {
    const saved = sessionStorage.getItem("bible-location");
    if (saved) return JSON.parse(saved) as { bookOsis: string; chapter: number };
  } catch {
    /* ignore */
  }
  return DEFAULT_BIBLE;
}

function NoteStudyLayoutInner({
  noteTitle,
  onDelete,
  deleting = false,
  children,
}: {
  noteTitle: string;
  onDelete?: () => void;
  deleting?: boolean;
  children: React.ReactNode;
}) {
  const { openBible } = useStudy();
  const [bibleLoc, setBibleLoc] = useState(loadBibleLocation);

  const book = BOOK_BY_OSIS[bibleLoc.bookOsis] ?? BOOK_BY_OSIS.John;

  useEffect(() => {
    sessionStorage.setItem("bible-location", JSON.stringify(bibleLoc));
  }, [bibleLoc]);

  const handleNavigateVerse = useCallback(
    (bookOsis: string, chapter: number) => {
      openBible();
      setBibleLoc({ bookOsis, chapter });
    },
    [openBible]
  );

  const handleChapterChange = useCallback((chapter: number, bookOsis: string) => {
    setBibleLoc({ bookOsis, chapter });
  }, []);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col md:h-dvh">
      <WorkspaceToolbar
        title={noteTitle}
        subtitle="Notes"
        bookOsis={book.osis}
        bookName={book.name}
        chapter={bibleLoc.chapter}
        maxChapter={book.chapters}
        showBibleToggle
        embeddedNav
        onChapterChange={handleChapterChange}
        onDelete={onDelete}
        deleting={deleting}
      />
      <WorkspacePanels
        bibleBookId={book.id}
        bibleChapter={bibleLoc.chapter}
        onNavigateVerse={handleNavigateVerse}
        notesPanel={<div className="flex h-full min-h-0 flex-col">{children}</div>}
      />
    </div>
  );
}

export function NoteStudyLayout({
  noteTitle,
  onDelete,
  deleting = false,
  children,
}: {
  noteTitle: string;
  onDelete?: () => void;
  deleting?: boolean;
  children: React.ReactNode;
}) {
  return (
    <StudyProvider initialBibleOpen={false}>
      <NoteStudyLayoutInner noteTitle={noteTitle} onDelete={onDelete} deleting={deleting}>
        {children}
      </NoteStudyLayoutInner>
    </StudyProvider>
  );
}
