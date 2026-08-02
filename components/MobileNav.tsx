"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant h-16 flex items-center justify-around px-2 z-50">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 ${
              active ? "text-secondary" : "text-on-surface-variant"
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
          >
            <span
              className={`material-symbols-outlined text-2xl ${active ? "filled" : ""}`}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-bold">
              {item.shortLabel ?? item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
