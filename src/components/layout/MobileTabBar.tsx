"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/read/gen/1", label: "Read", icon: "📖" },
  { href: "/search", label: "Search", icon: "🔍" },
  { href: "/notes", label: "Notes", icon: "📝" },
  { href: "/login", label: "Account", icon: "👤" },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href.split("/").slice(0, 2).join("/") || item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors ${
                active ? "text-amber-800" : "text-stone-500"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
