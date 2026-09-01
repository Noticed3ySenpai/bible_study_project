"use client";

import { useBibleDb } from "@/lib/bible-db";

export function DbLoadingOverlay() {
  const { loading, progress, error } = useBibleDb();

  if (!loading && !error) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {error ? (
          <>
            <h2 className="text-lg font-semibold text-red-700">Database Error</h2>
            <p className="mt-2 text-sm text-stone-600">{error}</p>
            <p className="mt-3 text-xs text-stone-500">
              Run <code className="rounded bg-stone-100 px-1">npm run build:bible-db</code> to
              generate the Bible database.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold">Loading Bible Database</h2>
            <p className="mt-1 text-sm text-stone-500">
              Downloading Scripture and concordance data…
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-amber-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-right text-xs text-stone-400">{progress}%</p>
          </>
        )}
      </div>
    </div>
  );
}
