export type StudyNote = {
  id: string;
  user_id: string;
  title: string;
  content: unknown;
  updated_at: string;
  created_at: string;
};

export type NoteVerseRef = {
  id: string;
  note_id: string;
  user_id: string;
  osis_ref: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
};

export function extractVerseRefsFromContent(content: unknown): Omit<NoteVerseRef, "id" | "note_id" | "user_id">[] {
  const refs: Omit<NoteVerseRef, "id" | "note_id" | "user_id">[] = [];
  const seen = new Set<string>();

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;

    if (obj.type === "verseChip" && obj.props) {
      const props = obj.props as Record<string, unknown>;
      const osisRef = String(props.osisRef ?? "");
      const book = String(props.book ?? "");
      const chapter = Number(props.chapter ?? 0);
      const verseStart = Number(props.verseStart ?? 0);
      const verseEnd = Number(props.verseEnd ?? verseStart);
      if (osisRef && !seen.has(osisRef)) {
        seen.add(osisRef);
        refs.push({ osis_ref: osisRef, book, chapter, verse_start: verseStart, verse_end: verseEnd });
      }
    }

    if (Array.isArray(obj.content)) {
      for (const child of obj.content) walk(child);
    }
    if (Array.isArray(obj)) {
      for (const child of obj) walk(child);
    }
  }

  if (Array.isArray(content)) {
    for (const block of content) walk(block);
  }
  return refs;
}

export function extractTitleFromContent(content: unknown): string {
  if (!Array.isArray(content) || content.length === 0) return "Untitled";
  const first = content[0] as Record<string, unknown>;
  if (!first?.content || !Array.isArray(first.content)) return "Untitled";
  const text = first.content
    .map((c: Record<string, unknown>) => (typeof c.text === "string" ? c.text : ""))
    .join("")
    .trim();
  return text.slice(0, 80) || "Untitled";
}
