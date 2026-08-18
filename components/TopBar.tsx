"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSidebar } from "@/components/AppShell";
import { useBackendStatus } from "@/hooks/use-backend-status";
import { useMarkNotificationsRead, useNotifications } from "@/hooks/use-notifications";
import { usePermissions } from "@/hooks/use-permissions";
import type { NotificationItem } from "@/lib/api/notifications";
import { useAuth } from "@/context/AuthContext";
import { roleLabel } from "@/lib/auth";

type TopBarProps = {
  title: string;
  searchPlaceholder?: string;
  doctorName?: string;
  doctorRole?: string;
  avatarSrc?: string;
  logoSrc?: string;
};

const todayLabel = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
}).format(new Date());

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const PRIORITY_STYLES: Record<NotificationItem["priority"], { dot: string; label: string }> = {
  critical: { dot: "bg-red-500", label: "Critique" },
  urgent: { dot: "bg-amber-500", label: "Urgent" },
  normal: { dot: "bg-emerald-500", label: "Normal" },
};

// Composant séparé : le tick chaque seconde ne doit re-render que l'horloge,
// pas tout TopBar (notifications + menu compte inclus).
function HeaderClock() {
  // Démarre à null et se peuple seulement après le montage (useEffect,
  // jamais exécuté côté serveur) -- sinon l'heure figée dans le HTML rendu
  // côté serveur ne correspond jamais à l'heure du navigateur au moment de
  // l'hydratation, ce que React signale comme une erreur d'hydratation.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Tick initial volontairement synchrone (voir le commentaire au-dessus
    // sur la désynchronisation serveur/client) -- pas une valeur dérivable
    // du rendu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const time = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const date = now
    .toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();

  return (
    <div className="hidden text-right leading-tight md:block">
      <p className="text-sm font-extrabold tabular-nums text-slate-800">{time}</p>
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{date}</p>
    </div>
  );
}

export default function TopBar({
  title,
  searchPlaceholder = "Rechercher un dossier patient...",
  doctorName = "Dr. Laurent Morel",
  doctorRole = "Spécialiste Sommeil",
  avatarSrc,
  logoSrc = "/chu.png",
}: Readonly<TopBarProps>) {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const backendReady = useBackendStatus();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { data: notifications = [], isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visibleNotifications = [...notifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 15);

  const markAllRead = () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (ids.length > 0) markReadMutation.mutate(ids);
  };

  const markOneRead = (item: NotificationItem) => {
    if (!item.read) markReadMutation.mutate([item.id]);
  };

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : doctorName;
  const displayRole = user ? roleLabel(user.role) : doctorRole;

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

        <HeaderClock />
        <div className="hidden h-8 w-px bg-outline-variant md:block" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative w-10 h-10 flex items-center justify-center text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ""}`}
            aria-expanded={notificationsOpen}
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotificationsOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-12 z-50 w-[380px] max-w-[92vw] rounded-2xl border border-outline-variant bg-white shadow-[0px_12px_40px_rgba(15,23,42,0.15)] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
                  <p className="text-sm font-black text-on-surface">Notifications</p>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      disabled={markReadMutation.isPending}
                      className="text-[11px] font-bold text-secondary hover:underline disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  {isLoading && notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-on-surface-variant">
                      Chargement des notifications...
                    </p>
                  ) : visibleNotifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-on-surface-variant">
                      Aucune notification pour le moment.
                    </p>
                  ) : (
                    <ul className="divide-y divide-outline-variant/60">
                      {visibleNotifications.map((item) => {
                        const priority = PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.normal;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => markOneRead(item)}
                              className={`w-full text-left px-4 py-3 hover:bg-surface-container transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                item.read ? "opacity-60" : ""
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span
                                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priority.dot}`}
                                  title={`Priorité ${priority.label}`}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-baseline justify-between gap-2">
                                    <p className="text-[13px] font-bold text-on-surface truncate">
                                      {item.title}
                                    </p>
                                    <span className="shrink-0 text-[10px] text-on-surface-variant">
                                      {timeFormatter.format(new Date(item.createdAt))}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-xs text-on-surface-variant line-clamp-2">
                                    {item.message}
                                  </p>
                                  {item.source && (
                                    <p className="mt-1 text-[10px] uppercase tracking-wider text-secondary">
                                      {item.source}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="w-px h-6 bg-outline-variant hidden sm:block" />
        <div className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((open) => !open)}
            aria-expanded={accountOpen}
            aria-label="Menu du compte"
            className="flex items-center gap-3 cursor-pointer rounded-full py-1 pl-3 pr-1 transition-all hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-sm font-bold text-slate-700">{displayName}</span>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {displayRole}
              </span>
            </span>
            <span className="relative flex h-11 w-11 shrink-0 md:h-12 md:w-12">
              <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#e0f2fe] to-[#d7deea] text-sm font-bold text-primary shadow-md ring-2 ring-white">
                {avatarSrc ? (
                  <Image
                    className="h-full w-full object-cover"
                    src={avatarSrc}
                    alt={displayName}
                    width={48}
                    height={48}
                  />
                ) : (
                  displayName
                    .split(" ")
                    .filter(Boolean)
                    .map((value) => value[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                )}
              </span>
              {/* Point de statut : vert si le backend répond, gris sinon */}
              <span
                title={backendReady ? "Backend connecté" : "Backend indisponible"}
                className={`pointer-events-none absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${
                  backendReady ? "bg-[#4CAF50]" : "bg-slate-300"
                }`}
              />
            </span>
          </button>

          {accountOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setAccountOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[0px_12px_40px_rgba(15,23,42,0.15)]">
                <div className="border-b border-outline-variant px-4 py-3">
                  <p className="text-sm font-black text-on-surface">{displayName}</p>
                  <p className="text-xs text-on-surface-variant">{user?.email ?? displayRole}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
                    {displayRole} · {permissions.length} permission(s)
                  </p>
                </div>
                <Link
                  href="/aide"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[20px]">help</span>
                  Aide
                </Link>
                <Link
                  href="/deconnexion"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-2 border-t border-outline-variant px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  Déconnexion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
