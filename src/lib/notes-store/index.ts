import { isSupabaseBackend } from "@/lib/config";
import type { NoteVerseRef, StudyNote } from "@/lib/notes";
import {
  createLocalNote,
  deleteLocalNote,
  getLocalNote,
  listLocalNotes,
  updateLocalNote,
} from "./local";
import {
  createSupabaseNote,
  deleteSupabaseNote,
  getSupabaseNote,
  listSupabaseNotes,
  updateSupabaseNote,
} from "./supabase";

export async function listNotes(userId: string, limit?: number): Promise<StudyNote[]> {
  const notes = isSupabaseBackend()
    ? await listSupabaseNotes(userId)
    : await listLocalNotes(userId);
  return limit ? notes.slice(0, limit) : notes;
}

export async function getNote(id: string, userId: string): Promise<StudyNote | null> {
  if (isSupabaseBackend()) {
    return getSupabaseNote(id);
  }
  return getLocalNote(id, userId);
}

export async function createNote(userId: string): Promise<StudyNote | null> {
  if (isSupabaseBackend()) {
    return createSupabaseNote(userId);
  }
  return createLocalNote(userId);
}

export async function saveNote(
  id: string,
  userId: string,
  data: {
    title: string;
    content: unknown;
    verseRefs: Omit<NoteVerseRef, "id" | "note_id" | "user_id">[];
  }
): Promise<StudyNote | null> {
  if (isSupabaseBackend()) {
    return updateSupabaseNote(id, userId, data);
  }
  return updateLocalNote(id, userId, data);
}

export async function deleteNote(id: string, userId: string): Promise<boolean> {
  if (isSupabaseBackend()) {
    return deleteSupabaseNote(id, userId);
  }
  return deleteLocalNote(id, userId);
}
