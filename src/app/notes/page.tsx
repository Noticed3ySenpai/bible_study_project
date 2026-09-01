"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, type AppUser } from "@/lib/auth";
import { createNote, deleteNote, listNotes } from "@/lib/notes-store";
import type { StudyNote } from "@/lib/notes";

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    getUser().then(async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }
      const data = await listNotes(currentUser.id);
      setNotes(data);
      setLoading(false);
    });
  }, []);

  async function handleCreateNote() {
    const currentUser = user ?? (await getUser());
    if (!currentUser) {
      router.push("/login");
      return;
    }
    const note = await createNote(currentUser.id);
    if (note) {
      router.push(`/notes/${note.id}`);
    }
  }

  async function handleDeleteNote(note: StudyNote) {
    if (!user || deletingId) return;
    if (!window.confirm(`Delete "${note.title}"? This cannot be undone.`)) return;

    setDeletingId(note.id);
    const deleted = await deleteNote(note.id, user.id);
    if (deleted) {
      setNotes((current) => current.filter((n) => n.id !== note.id));
    }
    setDeletingId(null);
  }

  if (!user && !loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Study Notes</h1>
        <p className="mt-3 text-stone-600">Sign in to create and sync your study notes.</p>
        <Link
          href="/login"
          className="mt-6 inline-block min-h-11 rounded-lg bg-amber-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-800"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Study Notes</h1>
        <button
          type="button"
          onClick={handleCreateNote}
          className="min-h-11 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
        >
          New Note
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-stone-500">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="mt-8 text-stone-500">No notes yet. Create your first study note.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="flex items-stretch gap-2">
              <Link
                href={`/notes/${note.id}`}
                className="block flex-1 rounded-lg border border-stone-200 bg-white px-4 py-4 hover:border-amber-300"
              >
                <span className="font-medium">{note.title}</span>
                <span className="mt-1 block text-xs text-stone-400">
                  Updated {new Date(note.updated_at).toLocaleString()}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => handleDeleteNote(note)}
                disabled={deletingId === note.id}
                className="shrink-0 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Delete ${note.title}`}
              >
                {deletingId === note.id ? "…" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
