"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<boolean>(true);

  useEffect(() => {
    function onToggle() {
      setOpen((v) => !v);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("toggle-sidebar", onToggle as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("toggle-sidebar", onToggle as EventListener);
      }
    };
  }, []);

  const transformClass = open ? "md:translate-x-0" : "md:-translate-x-64";
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => {
      mq.removeEventListener("change", handler);
    };
  }, []);

  const navContent = (
    <>
      <div className="px-6 py-5 mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-sm mb-4">
          <span className="font-bold text-lg tracking-tight text-primary">CHU</span>
        </div>
        <div>
          <h1 className="font-headline-sm text-headline-sm font-semibold text-white leading-tight">
            Sommeil Clinic
          </h1>
          <p className="text-sidebar-muted font-label-sm text-label-sm">
            Unité de Diagnostic
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto px-2" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-3xl transition-all duration-150 border-l-4 ${
                active
                  ? "border-white/50 bg-white/10 text-white"
                  : "border-transparent text-sidebar-muted hover:bg-white/10"
              } focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70`}
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

      <div className="px-4 py-4 mb-2">
        <button className="w-full bg-white text-primary font-label-md text-label-md py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-95 transition-all">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="font-label-md text-label-md">Nouvel Examen</span>
        </button>
      </div>

      <div className="border-t border-white/15 pt-4 space-y-1 px-2">
        <Link
          href="/aide"
          aria-current={pathname === '/aide' ? 'page' : undefined}
          className={`flex items-center gap-3 px-4 py-3 rounded-3xl transition-all border-l-4 ${
            pathname === '/aide' ? 'border-white/50 bg-white/10 text-white' : 'border-transparent text-sidebar-muted hover:bg-white/10'
          } focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70`}
        >
          <span className="material-symbols-outlined text-xl">help</span>
          <span className="font-label-md text-label-md">Aide</span>
        </Link>
        <Link
          href="/deconnexion"
          aria-current={pathname === '/deconnexion' ? 'page' : undefined}
          className={`flex items-center gap-3 px-4 py-3 rounded-3xl transition-all border-l-4 ${
            pathname === '/deconnexion' ? 'border-white/50 bg-white/10 text-white' : 'border-transparent text-sidebar-muted hover:bg-red-500/10 text-white'
          } focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70`}
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="font-label-md text-label-md text-white">
            Déconnexion
          </span>
        </Link>
      </div>

      <div className="mt-6 mx-4 rounded-[28px] border border-white/15 bg-white/8 p-4 backdrop-blur-sm text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-white font-semibold">
            CP
          </div>
          <div>
            <p className="font-semibold">Chef Pharmacien</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-sidebar-muted">
              PHARMACIEN CHEF
            </p>
          </div>
        </div>
        <p className="text-[12px] text-sidebar-muted leading-5">
          Accès rapide à l&apos;ensemble des rapports et du planning quotidien.
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex ${transformClass} transform transition-transform duration-200 flex-col h-screen fixed left-0 top-0 w-64 py-unit z-40 bg-sidebar-gradient border-r border-white/10 shadow-[4px_0_40px_rgba(15,23,42,0.08)]`}>
        {navContent}
      </aside>

      {/* Mobile drawer overlay shown when open */}
      {isMobile && open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="relative w-72 max-w-full h-full bg-sidebar-gradient border-r border-white/10 p-4 overflow-auto">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
