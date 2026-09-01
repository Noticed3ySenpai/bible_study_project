"use client";

import { BibleDbProvider } from "@/lib/bible-db";
import { MobileTabBar } from "./MobileTabBar";
import { Sidebar } from "./Sidebar";
import { DbLoadingOverlay } from "./DbLoadingOverlay";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <BibleDbProvider>
      <div className="flex min-h-dvh bg-stone-50 text-stone-900">
        <Sidebar />
        <div className="flex min-h-dvh flex-1 flex-col">
          <header className="flex items-center border-b border-stone-200 bg-white px-4 py-3 md:hidden">
            <h1 className="text-base font-semibold">Bible Study</h1>
          </header>
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
          <MobileTabBar />
        </div>
      </div>
      <DbLoadingOverlay />
    </BibleDbProvider>
  );
}
