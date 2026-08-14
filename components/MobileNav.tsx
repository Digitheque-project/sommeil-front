"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isPathActive } from "@/lib/nav";
import { usePermissions } from "@/hooks/use-permissions";

export default function MobileNav() {
  const pathname = usePathname();
  const { can } = usePermissions();

  return (
    <nav
      aria-label="Navigation mobile principale"
      className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant h-16 flex items-center justify-around px-2 z-50"
    >
      {NAV_ITEMS.filter((item) => can(item.permission)).map((item) => {
        const active = isPathActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-colors ${
              active
                ? "text-secondary"
                : "text-on-surface-variant hover:text-secondary"
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
