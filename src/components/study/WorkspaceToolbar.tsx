"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import { ChapterNav } from "@/components/bible/ChapterNav";
import { useStudy } from "./StudyContext";

export function WorkspaceToolbar({
  title,
  subtitle,
  bookOsis,
  bookName,
  chapter,
  maxChapter,
  showBibleToggle = false,
  embeddedNav = false,
  onChapterChange,
  onTitleChange,
  onDelete,
  deleting = false,
}: {
  title: string;
  subtitle?: string;
  bookOsis?: string;
  bookName?: string;
  chapter?: number;
  maxChapter?: number;
  showBibleToggle?: boolean;
  embeddedNav?: boolean;
  onChapterChange?: (chapter: number, bookOsis: string) => void;
  onTitleChange?: (title: string) => void;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const {
    bibleOpen,
    concordanceOpen,
    toggleBible,
    closeConcordance,
    selectedVerse,
    openConcordance,
  } = useStudy();
  const [draftTitle, setDraftTitle] = useState(title);

  useEffect(() => {
    setDraftTitle(title);
  }, [title]);

  const handleToggleConcordance = () => {
    if (concordanceOpen) {
      closeConcordance();
    } else if (selectedVerse) {
      openConcordance(selectedVerse);
    }
  };

  const commitTitle = () => {
    if (!onTitleChange) return;
    const next = draftTitle.trim() || "Untitled";
    setDraftTitle(next);
    if (next !== title) {
      onTitleChange(next);
    }
  };

  const showChapterNav =
    bookOsis &&
    bookName &&
    chapter &&
    maxChapter &&
    (showBibleToggle ? bibleOpen : true);

  return (
    <div className="border-b border-stone-200 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="min-w-0 flex-1">
          {subtitle && (
            <p className="text-xs text-stone-500">
              <Link href="/" className="hover:text-stone-700">
                Home
              </Link>
              {" / "}
              <span>{subtitle}</span>
            </p>
          )}
          {onTitleChange ? (
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              placeholder="Untitled"
              aria-label="Note title"
              className="mt-0.5 w-full min-w-0 truncate rounded-md border border-transparent bg-transparent px-1 py-0.5 text-lg font-semibold text-stone-900 outline-none placeholder:text-stone-400 hover:border-stone-200 focus:border-amber-400 focus:bg-white focus:ring-1 focus:ring-amber-400"
            />
          ) : (
            <h1 className="truncate text-lg font-semibold text-stone-900">{title}</h1>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="min-h-9 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
          {showBibleToggle && (
            <button
              type="button"
              onClick={toggleBible}
              className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
                bibleOpen
                  ? "bg-amber-100 text-amber-900"
                  : "border border-stone-300 text-stone-700 hover:bg-stone-50"
              }`}
              aria-label="Toggle Bible panel"
            >
              <BookOpenIcon className="h-5 w-5" aria-hidden />
              <span className="hidden sm:inline">Bible</span>
            </button>
          )}
          {!showBibleToggle && (
            <span className="hidden rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-600 sm:inline">
              WEB
            </span>
          )}
          <button
            type="button"
            onClick={handleToggleConcordance}
            disabled={!concordanceOpen && !selectedVerse}
            className={`min-h-9 rounded-lg px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              concordanceOpen
                ? "bg-sky-100 text-sky-900"
                : "border border-stone-300 text-stone-700 hover:bg-stone-50"
            }`}
          >
            <span className="hidden sm:inline">Study</span>
            <span className="sm:hidden">Lex</span>
          </button>
        </div>
      </div>
      {showChapterNav && (
        <ChapterNav
          bookOsis={bookOsis}
          bookName={bookName}
          chapter={chapter}
          maxChapter={maxChapter}
          embedded={embeddedNav}
          onChapterChange={onChapterChange}
        />
      )}
    </div>
  );
}
