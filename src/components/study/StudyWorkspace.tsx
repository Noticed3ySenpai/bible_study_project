"use client";

import { useRouter } from "next/navigation";
import { StudyProvider } from "./StudyContext";
import { WorkspacePanels } from "./WorkspacePanels";
import { WorkspaceToolbar } from "./WorkspaceToolbar";

function StudyWorkspaceInner({
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
  const router = useRouter();

  const handleNavigateVerse = (book: string, targetChapter: number) => {
    router.push(`/read/${book.toLowerCase()}/${targetChapter}`);
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col md:h-dvh">
      <WorkspaceToolbar
        title={`${bookName} ${chapter}`}
        subtitle={`${bookName} ${chapter}`}
        bookOsis={bookOsis}
        bookName={bookName}
        chapter={chapter}
        maxChapter={maxChapter}
      />
      <WorkspacePanels
        bibleBookId={bookId}
        bibleChapter={chapter}
        onNavigateVerse={handleNavigateVerse}
      />
    </div>
  );
}

export function StudyWorkspace(props: {
  bookId: number;
  bookOsis: string;
  bookName: string;
  chapter: number;
  maxChapter: number;
}) {
  return (
    <StudyProvider initialBibleOpen>
      <StudyWorkspaceInner {...props} />
    </StudyProvider>
  );
}
