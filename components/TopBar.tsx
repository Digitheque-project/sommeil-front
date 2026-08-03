"use client";

import Image from "next/image";

type TopBarProps = {
  title: string;
  searchPlaceholder?: string;
  doctorName?: string;
  doctorRole?: string;
  avatarSrc?: string;
  logoSrc?: string;
  showSettings?: boolean;
};

export default function TopBar({
  title,
  searchPlaceholder = "Rechercher un dossier patient...",
  doctorName = "Dr. Laurent Morel",
  doctorRole = "Spécialiste Sommeil",
  avatarSrc,
  logoSrc = "/chu.png",
  showSettings = true,
}: Readonly<TopBarProps>) {
  return (
    <header className="flex justify-between items-center w-full px-container-padding h-16 z-30 bg-surface-bright border-b border-outline-variant sticky top-0 shadow-md">
      <div className="flex items-center gap-4">
        <button
          className="p-2 text-on-surface cursor-pointer"
          aria-label="Menu"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("toggle-sidebar"));
            }
          }}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="hidden md:flex items-center gap-4">
          <img src={logoSrc} alt="Logo CHU" className="w-10 h-10 rounded-full object-cover" />
          <h2 className="font-headline-md text-headline-md font-bold text-primary">
            {title}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center bg-white px-4 py-2 rounded-full border border-outline-variant">
          <span className="material-symbols-outlined text-primary mr-2 text-[20px]">
            search
          </span>
          <input
            className="bg-transparent border-none focus:ring-0 text-body-sm w-64 p-0 outline-none placeholder:text-on-surface-variant"
            placeholder={searchPlaceholder}
            type="text"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            className="w-10 h-10 flex items-center justify-center text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          {showSettings && (
            <button
              className="w-10 h-10 flex items-center justify-center text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer"
              aria-label="Paramètres"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          )}
          <div className="w-px h-6 bg-outline-variant mx-2" />
          <div className="flex items-center gap-3 cursor-pointer hover:bg-surface-container-high p-1 pr-3 rounded-full transition-all">
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
              <p className="text-label-sm font-bold text-primary">
                {doctorName}
              </p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                {doctorRole}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
