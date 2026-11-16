"use client";

import { ActionsCompte } from "@/components/ActionsCompte";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, LogOut, X } from "lucide-react";
import { NAV_ITEMS, isPathActive } from "@/lib/nav";
import { useSidebar } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/use-permissions";

/**
 * Barre latérale commune de la plateforme (modèle Consultation externe) :
 * barre blanche, coin haut-droit arrondi, rubriques filtrées par permission,
 * puis en bas Aide, actions du compte et Déconnexion. Sur mobile, tiroir
 * ouvert par le bouton menu de l'en-tête.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const { mobileOpen, closeMobile } = useSidebar();
  const { user } = useAuth();
  const { can } = usePermissions();

  const items = NAV_ITEMS.filter((item) => !user || can(item.permission));
  const bottomLinkClass =
    "flex w-full items-center gap-3 px-4 text-[#64748B] transition-colors hover:text-[#0F172A]";

  return (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      ) : null}
      <aside
        id="sidebar"
        aria-label="Navigation principale"
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[82vw] max-w-[280px] shrink-0 flex-col overflow-y-auto border-r border-[#F1F5F9] bg-white shadow-[1px_0px_5px_rgba(0,0,0,0.01)] transition-transform duration-200 md:static md:mt-2 md:h-auto md:w-[220px] md:translate-x-0 md:rounded-tr-[24px] lg:w-[260px] print:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-4 md:hidden">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400">
            Navigation
          </span>
          <button
            type="button"
            onClick={closeMobile}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900"
            aria-label="Fermer la navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-4 sm:py-5" aria-label="Rubriques">
          {items.map((item) => {
            const active = isPathActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-[12px] px-4 py-3 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006A8C]/20 sm:gap-4 sm:py-3.5 ${
                  active
                    ? "bg-[#F0F7FF] font-bold text-[#006A8C]"
                    : "font-medium text-[#475569] hover:bg-gray-50"
                }`}
              >
                <span
                  className={`material-symbols-outlined shrink-0 text-[20px] ${
                    active ? "filled text-[#006A8C]" : "text-[#64748B]"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-[13px] sm:text-[14px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-5 px-4 py-5 sm:px-5 sm:py-6">
          <Link href="/aide" onClick={closeMobile} className={bottomLinkClass}>
            <span className="flex h-5 w-5 items-center justify-center">
              <HelpCircle className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </span>
            <span className="text-[12px] font-bold sm:text-[13px]">Aide</span>
          </Link>
          <ActionsCompte className={bottomLinkClass} classeLibelle="text-[12px] sm:text-[13px] font-bold" />
          <Link
            href="/deconnexion"
            onClick={closeMobile}
            aria-current={isPathActive(pathname, "/deconnexion") ? "page" : undefined}
            className="flex w-full items-center gap-3 px-4 text-[#E11D48] transition-colors hover:text-red-700"
          >
            <span className="flex h-5 w-5 items-center justify-center">
              <LogOut className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </span>
            <span className="text-[12px] font-bold sm:text-[13px]">Déconnexion</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
