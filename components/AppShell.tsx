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
import MobileNav from "@/components/MobileNav";

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
      <div className="min-h-screen">
        <Sidebar />
        <main
          className={`min-h-screen pb-16 transition-[margin] duration-200 ease-in-out md:pb-0 ${
            desktopOpen ? "md:ml-64" : "md:ml-0"
          }`}
        >
          {children}
        </main>
        <MobileNav />
      </div>
    </SidebarContext.Provider>
  );
}
