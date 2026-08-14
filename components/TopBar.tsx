"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSidebar } from "@/components/AppShell";
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
  showSettings?: boolean;
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
  const { user } = useAuth();
  const { can, permissions } = usePermissions();
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
        {showSettings && can("settings:view") && (
          <Link
            href="/parametres"
            className="w-10 h-10 flex items-center justify-center text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Paramètres"
          >
            <span className="material-symbols-outlined">settings</span>
          </Link>
        )}

        <div className="w-px h-6 bg-outline-variant hidden sm:block" />
        <div className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((open) => !open)}
            aria-expanded={accountOpen}
            aria-label="Menu du compte"
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 p-1 pr-3 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
          {avatarSrc ? (
            <Image
              className="w-8 h-8 rounded-full object-cover"
              src={avatarSrc}
              alt={displayName}
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
            <div className="hidden sm:block text-left">
              <p className="text-label-sm font-bold text-primary">{displayName}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                {displayRole}
              </p>
            </div>
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
                {can("settings:view") && (
                  <Link
                    href="/parametres"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                    Paramètres
                  </Link>
                )}
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
