"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/read/gen/1", label: "Read" },
  { href: "/search", label: "Concordance" },
  { href: "/notes", label: "Notes" },
  { href: "/about/data", label: "Data Sources" },
  { href: "/login", label: "Account" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-stone-200 bg-stone-50 md:flex md:flex-col">
      <div className="border-b border-stone-200 px-5 py-6">
        <Link href="/" className="text-lg font-semibold text-stone-900">
          Bible Study
        </Link>
        <p className="mt-1 text-xs text-stone-500">World English Bible</p>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href.startsWith("/read")
                ? pathname.startsWith("/read")
                : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-amber-100 text-amber-900"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
