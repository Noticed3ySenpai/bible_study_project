"use client";

import { BlockNoteSchema, defaultInlineContentSpecs } from "@blocknote/core";
import { VerseChip } from "./VerseChip";

export const studyEditorSchema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    verseChip: VerseChip,
  },
});

export type StudyEditorSchema = typeof studyEditorSchema;
