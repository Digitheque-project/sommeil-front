"use client";

import Image from "next/image";
import { useSidebar } from "@/components/AppShell";

type TopBarProps = {
  title: string;
  searchPlaceholder?: string;
  doctorName?: string;
  doctorRole?: string;
  avatarSrc?: string;
  logoSrc?: string;
  showSettings?: boolean;
};

const todayLabel = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
}).format(new Date());

export default function TopBar({
  title,
  searchPlaceholder = "Rechercher un dossier patient...",
  doctorName = "Dr. Laurent Morel",
  doctorRole = "Spécialiste Sommeil",
  avatarSrc,
  logoSrc = "/chu.png",
  showSettings = true,
}: Readonly<TopBarProps>) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="app-shell-header sticky top-0 z-30 flex h-[84px] w-full items-center justify-between border-b border-slate-200 px-4 md:px-8 print:hidden">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="p-2 -ml-1 text-on-surface cursor-pointer hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Ouvrir ou fermer le menu de navigation"
          aria-controls="sidebar"
          aria-expanded="false"
          onClick={toggleSidebar}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <img
          src={logoSrc}
          alt="Logo CHU"
          className="hidden md:block w-10 h-10 rounded-full object-cover shrink-0"
        />
        <div className="app-shell-header-title min-w-0">
          <p className="app-shell-header-eyebrow">Unité de Sommeil · {todayLabel}</p>
          <p className="app-shell-header-main-title truncate">{title}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center bg-white border border-outline-variant rounded-lg px-3 py-2 shadow-sm">
          <span className="material-symbols-outlined text-primary mr-2 text-[20px]">
            search
          </span>
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-56 p-0 outline-none placeholder:text-slate-400"
            placeholder={searchPlaceholder}
            type="text"
            aria-label={searchPlaceholder}
          />
        </div>

        <button
          className="w-10 h-10 flex items-center justify-center text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
        {showSettings && (
          <button
            className="w-10 h-10 flex items-center justify-center text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Paramètres"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        )}

        <div className="w-px h-6 bg-outline-variant hidden sm:block" />
        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 p-1 pr-3 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          {avatarSrc ? (
            <Image
              className="w-8 h-8 rounded-full object-cover"
              src={avatarSrc}
              alt={doctorName}
              width={32}
              height={32}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">
                person
              </span>
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-label-sm font-bold text-primary">{doctorName}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              {doctorRole}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
