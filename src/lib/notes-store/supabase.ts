import { createClient } from "@/lib/supabase/client";
import type { NoteVerseRef, StudyNote } from "@/lib/notes";

export async function listSupabaseNotes(userId: string): Promise<StudyNote[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("study_notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return (data as StudyNote[]) ?? [];
}

export async function getSupabaseNote(id: string): Promise<StudyNote | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("study_notes")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as StudyNote;
}

export async function createSupabaseNote(userId: string): Promise<StudyNote | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("study_notes")
    .insert({ user_id: userId, title: "Untitled", content: [] })
    .select()
    .single();
  if (error || !data) return null;
  return data as StudyNote;
}

export async function updateSupabaseNote(
  id: string,
  userId: string,
  data: {
    title: string;
    content: unknown;
    verseRefs: Omit<NoteVerseRef, "id" | "note_id" | "user_id">[];
  }
): Promise<StudyNote | null> {
  const supabase = createClient();
  const { error } = await supabase
    .from("study_notes")
    .update({ content: data.content, title: data.title, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return null;

  await supabase.from("note_verse_refs").delete().eq("note_id", id);
  if (data.verseRefs.length > 0) {
    await supabase.from("note_verse_refs").insert(
      data.verseRefs.map((r) => ({
        ...r,
        note_id: id,
        user_id: userId,
      }))
    );
  }

  return getSupabaseNote(id);
}

export async function deleteSupabaseNote(id: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("study_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}
