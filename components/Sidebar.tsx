"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isPathActive } from "@/lib/nav";
import { useSidebar } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/use-permissions";
import { roleLabel } from "@/lib/auth";

export default function Sidebar() {
  const pathname = usePathname();
  const { desktopOpen, mobileOpen, closeMobile } = useSidebar();
  const { user } = useAuth();
  const { can } = usePermissions();

  const linkClass = (active: boolean, extra = "") =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 border-l-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
      active
        ? "border-white/50 bg-white/25 text-white"
        : "border-transparent text-white hover:bg-white/20 hover:shadow-lg"
    } ${extra}`;

  const navContent = (
    <>
      <div className="px-6 py-6 mb-5">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-sm mb-4 overflow-hidden border border-white/60">
          <img src="/chu.png" alt="Logo CHU" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-headline-sm text-headline-sm font-semibold text-white leading-tight">
            Sommeil Clinic
          </h1>
          <p className="text-white/75 font-label-sm text-label-sm">
            Unité de Diagnostic
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-2 pb-4" aria-label="Navigation principale">
        {NAV_ITEMS.filter((item) => !user || can(item.permission)).map((item) => {
          const active = isPathActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              aria-current={active ? "page" : undefined}
              className={linkClass(active)}
            >
              <span
                className={`material-symbols-outlined text-xl ${active ? "filled" : ""}`}
              >
                {item.icon}
              </span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/15 px-2 pt-4 pb-4">
        {user && (
          <div className="mb-3 rounded-xl bg-white/10 px-4 py-3 text-white">
            <p className="truncate text-sm font-semibold">{user.firstName} {user.lastName}</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-white/70">{roleLabel(user.role)}</p>
          </div>
        )}
        <Link
          href="/deconnexion"
          onClick={closeMobile}
          aria-current={isPathActive(pathname, "/deconnexion") ? "page" : undefined}
          className={`${linkClass(isPathActive(pathname, "/deconnexion"), "text-red-300")} ${
            isPathActive(pathname, "/deconnexion")
              ? ""
              : "hover:bg-red-500/10 text-white"
          }`}
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="font-label-md text-label-md">Déconnexion</span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        id="sidebar"
        className={`hidden md:flex ${desktopOpen ? "md:translate-x-0" : "md:-translate-x-64"} transform transition-transform duration-200 flex-col h-screen fixed left-0 top-0 w-64 py-unit z-40 bg-sidebar-gradient border-r border-white/10 shadow-[4px_0_40px_rgba(15,23,42,0.08)]`}
        aria-label="Navigation principale"
      >
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation principale"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-full h-full bg-sidebar-gradient border-r border-white/10 p-4 overflow-auto shadow-2xl">
            <div className="flex justify-end mb-4">
              <button
                type="button"
                className="text-white p-2 rounded-full hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                onClick={closeMobile}
                aria-label="Fermer la navigation"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
