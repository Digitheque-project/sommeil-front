"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type SidebarContextValue = {
  desktopOpen: boolean;
  mobileOpen: boolean;
  toggleSidebar: () => void;
  closeMobile: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within <AppShell>");
  }
  return ctx;
}

const MOBILE_QUERY = "(max-width: 767px)";

export default function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches) {
      setMobileOpen((value) => !value);
    } else {
      setDesktopOpen((value) => !value);
    }
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMobile();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, closeMobile]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <SidebarContext.Provider
      value={{ desktopOpen, mobileOpen, toggleSidebar, closeMobile }}
    >
      {/* Mise en page commune de la plateforme : en-tête sur toute la largeur,
          puis barre latérale + contenu (modèle Consultation externe). */}
      <div className="flex h-screen flex-col overflow-hidden bg-[#F8F9FB] print:block print:h-auto print:overflow-visible">
        <Header />
        <div className="flex min-w-0 flex-1 overflow-hidden print:block print:overflow-visible">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-auto overflow-x-hidden bg-[#F8F9FB] print:overflow-visible">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
