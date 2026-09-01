import { notFound } from "next/navigation";
import { bookFromSlug } from "@/lib/bible-books";
import { StudyWorkspace } from "@/components/study/StudyWorkspace";

export default async function ReadPage({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>;
}) {
  const { book: bookSlug, chapter: chapterStr } = await params;
  const book = bookFromSlug(bookSlug);
  const chapter = Number(chapterStr);

  if (!book || !Number.isFinite(chapter) || chapter < 1 || chapter > book.chapters) {
    notFound();
  }

  return (
    <StudyWorkspace
      bookId={book.id}
      bookOsis={book.osis}
      bookName={book.name}
      chapter={chapter}
      maxChapter={book.chapters}
    />
  );
}
