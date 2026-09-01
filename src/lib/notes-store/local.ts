import type { NoteVerseRef, StudyNote } from "@/lib/notes";

const NOTES_KEY = "bible-study-local-notes";
const REFS_KEY = "bible-study-local-verse-refs";

type LocalStore = {
  notes: StudyNote[];
  verseRefs: NoteVerseRef[];
};

function loadStore(): LocalStore {
  if (typeof window === "undefined") {
    return { notes: [], verseRefs: [] };
  }
  try {
    const notes = JSON.parse(localStorage.getItem(NOTES_KEY) ?? "[]") as StudyNote[];
    const verseRefs = JSON.parse(localStorage.getItem(REFS_KEY) ?? "[]") as NoteVerseRef[];
    return { notes, verseRefs };
  } catch {
    return { notes: [], verseRefs: [] };
  }
}

function saveStore(store: LocalStore): void {
  localStorage.setItem(NOTES_KEY, JSON.stringify(store.notes));
  localStorage.setItem(REFS_KEY, JSON.stringify(store.verseRefs));
}

function now(): string {
  return new Date().toISOString();
}

export async function listLocalNotes(userId: string): Promise<StudyNote[]> {
  const store = loadStore();
  return store.notes
    .filter((n) => n.user_id === userId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getLocalNote(id: string, userId: string): Promise<StudyNote | null> {
  const store = loadStore();
  const note = store.notes.find((n) => n.id === id && n.user_id === userId);
  return note ?? null;
}

export async function createLocalNote(userId: string): Promise<StudyNote> {
  const store = loadStore();
  const timestamp = now();
  const note: StudyNote = {
    id: crypto.randomUUID(),
    user_id: userId,
    title: "Untitled",
    content: [],
    created_at: timestamp,
    updated_at: timestamp,
  };
  store.notes.push(note);
  saveStore(store);
  return note;
}

export async function updateLocalNote(
  id: string,
  userId: string,
  data: {
    title: string;
    content: unknown;
    verseRefs: Omit<NoteVerseRef, "id" | "note_id" | "user_id">[];
  }
): Promise<StudyNote | null> {
  const store = loadStore();
  const index = store.notes.findIndex((n) => n.id === id && n.user_id === userId);
  if (index < 0) return null;

  const updated: StudyNote = {
    ...store.notes[index],
    title: data.title,
    content: data.content,
    updated_at: now(),
  };
  store.notes[index] = updated;

  store.verseRefs = store.verseRefs.filter((r) => r.note_id !== id);
  for (const ref of data.verseRefs) {
    store.verseRefs.push({
      id: crypto.randomUUID(),
      note_id: id,
      user_id: userId,
      ...ref,
    });
  }

  saveStore(store);
  return updated;
}

export async function deleteLocalNote(id: string, userId: string): Promise<boolean> {
  const store = loadStore();
  const index = store.notes.findIndex((n) => n.id === id && n.user_id === userId);
  if (index < 0) return false;

  store.notes.splice(index, 1);
  store.verseRefs = store.verseRefs.filter((r) => r.note_id !== id);
  saveStore(store);
  return true;
}
