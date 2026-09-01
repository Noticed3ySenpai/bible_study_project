"use client";

import { createReactInlineContentSpec } from "@blocknote/react";
import { VerseChipView } from "./VerseChipView";

export const VerseChip = createReactInlineContentSpec(
  {
    type: "verseChip",
    propSchema: {
      osisRef: { default: "" },
      book: { default: "" },
      chapter: { default: 0 },
      verseStart: { default: 0 },
      verseEnd: { default: 0 },
      label: { default: "" },
      preview: { default: "" },
    },
    content: "none",
  } as const,
  {
    render: (props) => {
      const { osisRef, book, chapter, label, preview } = props.inlineContent.props;
      return (
        <VerseChipView
          osisRef={osisRef}
          book={book}
          chapter={chapter}
          label={label}
          preview={preview}
          editor={props.editor}
          getPos={props.getPos}
        />
      );
    },
  }
);
