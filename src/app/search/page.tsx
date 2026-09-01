"use client";

import { useState } from "react";
import { EnglishSearch } from "@/components/concordance/EnglishSearch";
import { StrongsSearch } from "@/components/concordance/StrongsSearch";

type Tab = "english" | "strongs";

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>("english");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold text-stone-900">Concordance</h1>
      <p className="mt-2 text-stone-600">
        Search every verse or explore original-language word study.
      </p>

      <div className="mt-6 flex rounded-lg border border-stone-200 bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => setTab("english")}
          className={`min-h-11 flex-1 rounded-md text-sm font-medium transition ${
            tab === "english"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          English Search
        </button>
        <button
          type="button"
          onClick={() => setTab("strongs")}
          className={`min-h-11 flex-1 rounded-md text-sm font-medium transition ${
            tab === "strongs"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Strong&apos;s
        </button>
      </div>

      <div className="mt-6">
        {tab === "english" ? <EnglishSearch /> : <StrongsSearch />}
      </div>
    </div>
  );
}
