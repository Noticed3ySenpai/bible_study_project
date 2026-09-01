"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type VerseInsertRef = {
  book: string;
  chapter: number;
  verse: number;
  label: string;
  osisRef: string;
  preview?: string;
};

type InsertVerseHandler = (ref: VerseInsertRef) => void;

export type VerseBlockInsertRef = {
  text: string;
  label: string;
  blockType: "quote" | "paragraph";
  getReferenceBlockId: () => string | undefined;
};

type InsertVerseBlockHandler = (ref: VerseBlockInsertRef) => void;

type StudyContextValue = {
  bibleOpen: boolean;
  concordanceOpen: boolean;
  selectedVerse: string | null;
  hoveredStrongs: string | null;
  canInsertVerse: boolean;
  openBible: () => void;
  closeBible: () => void;
  toggleBible: () => void;
  openConcordance: (osisRef: string) => void;
  closeConcordance: () => void;
  selectVerse: (osisRef: string | null) => void;
  setHoveredStrongs: (strongs: string | null) => void;
  insertVerse: (ref: VerseInsertRef) => void;
  registerInsertVerse: (handler: InsertVerseHandler | null) => void;
  insertVerseBlock: (ref: VerseBlockInsertRef) => void;
  registerInsertVerseBlock: (handler: InsertVerseBlockHandler | null) => void;
};

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({
  children,
  initialBibleOpen = false,
}: {
  children: React.ReactNode;
  initialBibleOpen?: boolean;
}) {
  const [bibleOpen, setBibleOpen] = useState(initialBibleOpen);
  const [concordanceOpen, setConcordanceOpen] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [hoveredStrongs, setHoveredStrongs] = useState<string | null>(null);
  const [insertVerseHandler, setInsertVerseHandler] = useState<InsertVerseHandler | null>(null);
  const [insertVerseBlockHandler, setInsertVerseBlockHandler] =
    useState<InsertVerseBlockHandler | null>(null);

  const registerInsertVerse = useCallback((handler: InsertVerseHandler | null) => {
    setInsertVerseHandler(() => handler);
  }, []);

  const registerInsertVerseBlock = useCallback((handler: InsertVerseBlockHandler | null) => {
    setInsertVerseBlockHandler(() => handler);
  }, []);

  const insertVerse = useCallback(
    (ref: VerseInsertRef) => {
      insertVerseHandler?.(ref);
    },
    [insertVerseHandler]
  );

  const insertVerseBlock = useCallback(
    (ref: VerseBlockInsertRef) => {
      insertVerseBlockHandler?.(ref);
    },
    [insertVerseBlockHandler]
  );

  const openBible = useCallback(() => setBibleOpen(true), []);
  const closeBible = useCallback(() => setBibleOpen(false), []);
  const toggleBible = useCallback(() => setBibleOpen((open) => !open), []);

  const openConcordance = useCallback((osisRef: string) => {
    setSelectedVerse(osisRef);
    setConcordanceOpen(true);
    setHoveredStrongs(null);
  }, []);

  const closeConcordance = useCallback(() => {
    setConcordanceOpen(false);
    setSelectedVerse(null);
    setHoveredStrongs(null);
  }, []);

  const selectVerse = useCallback(
    (osisRef: string | null) => {
      if (osisRef) {
        setSelectedVerse(osisRef);
        setConcordanceOpen(true);
        setHoveredStrongs(null);
        if (
          typeof window !== "undefined" &&
          window.matchMedia("(max-width: 767px)").matches
        ) {
          setBibleOpen(false);
        }
      } else {
        closeConcordance();
      }
    },
    [closeConcordance]
  );

  const value = useMemo(
    () => ({
      bibleOpen,
      concordanceOpen,
      selectedVerse,
      hoveredStrongs,
      canInsertVerse: insertVerseHandler !== null,
      openBible,
      closeBible,
      toggleBible,
      openConcordance,
      closeConcordance,
      selectVerse,
      setHoveredStrongs,
      insertVerse,
      registerInsertVerse,
      insertVerseBlock,
      registerInsertVerseBlock,
    }),
    [
      bibleOpen,
      concordanceOpen,
      selectedVerse,
      hoveredStrongs,
      insertVerseHandler,
      insertVerseBlockHandler,
      openBible,
      closeBible,
      toggleBible,
      openConcordance,
      closeConcordance,
      selectVerse,
      insertVerse,
      registerInsertVerse,
      insertVerseBlock,
      registerInsertVerseBlock,
    ]
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudyOptional() {
  return useContext(StudyContext);
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used within StudyProvider");
  return ctx;
}
