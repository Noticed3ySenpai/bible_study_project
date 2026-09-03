"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudyEditor } from "@/components/editor/DynamicStudyEditor";
import { NoteStudyLayout } from "@/components/study/NoteStudyLayout";
import { getUser } from "@/lib/auth";
import { createNote, deleteNote, getNote, saveNote } from "@/lib/notes-store";
import {
  extractTitleFromContent,
  extractVerseRefsFromContent,
  type StudyNote,
} from "@/lib/notes";

export default function NoteEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [note, setNote] = useState<StudyNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const user = await getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      if (id === "new") {
        const created = await createNote(user.id);
        if (created) router.replace(`/notes/${created.id}`);
        return;
      }

      const data = await getNote(id, user.id);
      if (!data) {
        router.push("/notes");
        return;
      }
      setNote(data);
      setLoading(false);
    }

    load();
  }, [id, router]);

  const handleSave = useCallback(
    async (content: unknown) => {
      if (!note) return;
      const user = await getUser();
      if (!user) return;

      // Keep a manually set title; only derive from content while still Untitled.
      const title =
        note.title.trim() && note.title !== "Untitled"
          ? note.title
          : extractTitleFromContent(content);
      const verseRefs = extractVerseRefsFromContent(content);
      const updated = await saveNote(note.id, user.id, {
        title,
        content,
        verseRefs,
      });

      if (updated) {
        setNote(updated);
      }
    },
    [note]
  );

  const handleTitleChange = useCallback(
    async (title: string) => {
      if (!note) return;
      const nextTitle = title.trim() || "Untitled";
      setNote((current) => (current ? { ...current, title: nextTitle } : current));

      const user = await getUser();
      if (!user) return;

      const verseRefs = extractVerseRefsFromContent(note.content);
      const updated = await saveNote(note.id, user.id, {
        title: nextTitle,
        content: note.content,
        verseRefs,
      });

      if (updated) {
        setNote(updated);
      }
    },
    [note]
  );

  const handleDelete = useCallback(async () => {
    if (!note || deleting) return;
    if (!window.confirm(`Delete "${note.title}"? This cannot be undone.`)) return;

    const user = await getUser();
    if (!user) return;

    setDeleting(true);
    const deleted = await deleteNote(note.id, user.id);
    if (deleted) {
      router.push("/notes");
      return;
    }
    setDeleting(false);
  }, [note, deleting, router]);

  if (loading || !note) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-stone-500">Loading note…</p>
      </div>
    );
  }

  return (
    <NoteStudyLayout
      noteTitle={note.title}
      onTitleChange={handleTitleChange}
      onDelete={handleDelete}
      deleting={deleting}
    >
      <StudyEditor initialContent={note.content} onSaveContent={handleSave} />
    </NoteStudyLayout>
  );
}
