"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useBibleDb } from "@/lib/bible-db";
import { BOOK_BY_OSIS } from "@/lib/bible-books";
import { formatVerseRef } from "@/lib/verse-ref";
import { getUser } from "@/lib/auth";
import { listNotes } from "@/lib/notes-store";
import type { StudyNote } from "@/lib/notes";

export default function HomePage() {
  const { ready, getVerseOfDay } = useBibleDb();
  const [verseOfDay, setVerseOfDay] = useState<Awaited<ReturnType<typeof getVerseOfDay>>>(null);
  const [recentNotes, setRecentNotes] = useState<StudyNote[]>([]);

  useEffect(() => {
    if (!ready) return;
    getVerseOfDay().then(setVerseOfDay);
  }, [ready, getVerseOfDay]);

  useEffect(() => {
    getUser().then(async (user) => {
      if (!user) return;
      const data = await listNotes(user.id, 5);
      setRecentNotes(data);
    });
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">Bible Study</h1>
      <p className="mt-2 text-stone-600">
        Read the World English Bible, search the concordance, and write study notes.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/read/john/3"
          className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow"
        >
          <span className="text-2xl">📖</span>
          <h2 className="mt-2 font-semibold">Read Bible</h2>
          <p className="mt-1 text-sm text-stone-500">Browse all 66 books</p>
        </Link>
        <Link
          href="/search"
          className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow"
        >
          <span className="text-2xl">🔍</span>
          <h2 className="mt-2 font-semibold">Concordance</h2>
          <p className="mt-1 text-sm text-stone-500">English & Strong&apos;s search</p>
        </Link>
        <Link
          href="/notes"
          className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow"
        >
          <span className="text-2xl">📝</span>
          <h2 className="mt-2 font-semibold">Study Notes</h2>
          <p className="mt-1 text-sm text-stone-500">BlockNote editor with verse chips</p>
        </Link>
        <Link
          href="/notes/new"
          className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm transition hover:border-amber-300 hover:shadow"
        >
          <span className="text-2xl">✏️</span>
          <h2 className="mt-2 font-semibold text-amber-900">New Note</h2>
          <p className="mt-1 text-sm text-amber-700">Start a fresh study session</p>
        </Link>
      </div>

      {verseOfDay && (
        <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Verse of the Day
          </h2>
          <blockquote className="mt-3 text-lg leading-relaxed text-stone-800">
            {verseOfDay.text}
          </blockquote>
          <Link
            href={`/read/${verseOfDay.book.toLowerCase()}/${verseOfDay.chapter}`}
            className="mt-3 inline-block text-sm font-medium text-amber-800 hover:underline"
          >
            {formatVerseRef(
              {
                book: verseOfDay.book,
                chapter: verseOfDay.chapter,
                verseStart: verseOfDay.verse,
                verseEnd: verseOfDay.verse,
              },
              BOOK_BY_OSIS[verseOfDay.book]
            )}
          </Link>
        </section>
      )}

      {recentNotes.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Recent Notes
          </h2>
          <ul className="mt-3 space-y-2">
            {recentNotes.map((note) => (
              <li key={note.id}>
                <Link
                  href={`/notes/${note.id}`}
                  className="block rounded-lg border border-stone-200 bg-white px-4 py-3 hover:border-amber-300"
                >
                  <span className="font-medium">{note.title}</span>
                  <span className="mt-1 block text-xs text-stone-400">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
