"use client";

import { PastilleAutresServices } from "@/components/ActionsCompte";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSidebar } from "@/components/AppShell";
import { useBackendStatus } from "@/hooks/use-backend-status";
import { useMarkNotificationsRead, useNotifications } from "@/hooks/use-notifications";
import { usePermissions } from "@/hooks/use-permissions";
import type { NotificationItem } from "@/lib/api/notifications";
import { useAuth } from "@/context/AuthContext";
import { roleLabel } from "@/lib/auth";
import { resolveNotificationTarget } from "@/lib/notification-routing";
import { playNotificationSound } from "@/lib/sound";
import { Bell, Menu } from "lucide-react";
import { getChuLogoUrl } from "@/lib/config";

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

// Code couleur d'urgence de l'hôpital : bleue = normale, orange = urgente,
// rouge = très urgente -- à respecter partout où une priorité est affichée
// (cf. le même code déjà utilisé pour les rendez-vous du planning).
const PRIORITY_STYLES: Record<NotificationItem["priority"], { dot: string; label: string }> = {
  critical: { dot: "bg-red-500", label: "Très urgente" },
  urgent: { dot: "bg-orange-500", label: "Urgente" },
  normal: { dot: "bg-blue-500", label: "Normale" },
};

/** Nom du service affiché dans l'en-tête (identique sur toutes les pages). */
const SERVICE_NAME = "Centre de Sommeil";

export default function Header() {
  const { toggleSidebar } = useSidebar();
  const router = useRouter();
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const backendReady = useBackendStatus();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { data: notifications = [], isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationsRead();

  // Même son que côté pharmacie (cf. lib/sound.ts), joué uniquement pour les
  // notifications réellement nouvelles -- le tout premier chargement peut
  // rattraper des dizaines de notifications déjà existantes côté serveur, ce
  // n'est pas une "nouvelle" notification à signaler par un son, seuls les
  // arrivages découverts APRÈS ce premier chargement (via le polling de
  // useNotifications) le sont.
  const knownIdsRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    const currentIds = new Set(notifications.map((n) => n.id));
    const known = knownIdsRef.current;
    // known === null uniquement au tout premier passage : on mémorise l'état
    // de départ sans jouer de son (sinon un rechargement de page rejouerait
    // le son pour des notifications déjà anciennes).
    if (known !== null) {
      const hasNewUnread = notifications.some((n) => !n.read && !known.has(n.id));
      if (hasNewUnread) playNotificationSound();
    }
    knownIdsRef.current = currentIds;
  }, [notifications]);

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

  /**
   * Une notification est un point d'entrée vers un dossier, pas un simple
   * accusé de lecture : le clic marque comme lue PUIS ouvre l'écran concerné
   * (cf. lib/notification-routing.ts). Les notifications purement
   * informatives, sans dossier rattaché, restent cliquables mais ne
   * naviguent nulle part.
   */
  const openNotification = (item: NotificationItem) => {
    markOneRead(item);
    const target = resolveNotificationTarget(item);
    if (!target) return;
    setNotificationsOpen(false);
    router.push(target);
  };

  // Identité du compte connecté uniquement : tant que le jeton n'est pas lu,
  // on n'affiche pas de nom de substitution.
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "—";
  const displayRole = user ? roleLabel(user.role) : "Compte non identifié";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((value) => value[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Logo du CHU lu dans le jeton après le montage (jamais figé dans le code).
  const [chuLogoUrl, setChuLogoUrl] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChuLogoUrl(getChuLogoUrl());
  }, [user]);

  return (
    <header className="app-shell-header z-30 flex shrink-0 items-center justify-between border-b border-[#F1F5F9] bg-white px-4 py-2.5 shadow-[0px_4px_10px_rgba(0,0,0,0.015)] sm:px-6 sm:py-3 lg:px-7 print:hidden">
      {/* Gauche : bouton menu (mobile), logo du CHU, nom du service */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 md:hidden"
          aria-label="Ouvrir la navigation"
          aria-controls="sidebar"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </button>
        {chuLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo servi par service-upload, adresse lue dans le jeton
          <img
            src={chuLogoUrl}
            alt="Logo CHU"
            className="h-8 w-8 shrink-0 rounded-full border border-[#CFE9EF] object-cover sm:h-9 sm:w-9"
          />
        ) : null}
        <div className="truncate text-[16px] font-black tracking-tight text-[#004A66] sm:text-[18px] lg:text-[20px]">
          {SERVICE_NAME}
        </div>
      </div>

      {/* Centre : salutation */}
      <div className="hidden truncate text-[13px] font-semibold text-gray-500 md:block">
        Bonjour{user?.firstName ? ` ${user.firstName}` : ""}
      </div>

      {/* Droite : autres services, notifications, compte */}
      <div className="flex items-center gap-4 pr-0 sm:gap-5 sm:pr-2 lg:gap-8">
        <PastilleAutresServices />
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative block cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006A8C]/30"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ""}`}
            aria-expanded={notificationsOpen}
          >
            <Bell className="h-5 w-5 stroke-[2] text-gray-700 sm:h-6 sm:w-6" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-[#E11D48] px-0.5 text-[9px] font-bold text-white sm:h-[18px] sm:min-w-[18px] sm:text-[10px]">
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
              <div className="absolute right-0 top-10 z-50 w-[380px] max-w-[92vw] overflow-hidden rounded-2xl border border-[#F1F5F9] bg-white shadow-[0px_12px_40px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between border-b border-[#F1F5F9] px-4 py-3">
                  <p className="text-sm font-black text-[#0F172A]">Notifications</p>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      disabled={markReadMutation.isPending}
                      className="rounded text-[11px] font-bold text-[#006A8C] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006A8C]/30 disabled:opacity-50"
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>

                <div className="custom-scrollbar max-h-[360px] overflow-y-auto">
                  {isLoading && notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-[#64748B]">
                      Chargement des notifications...
                    </p>
                  ) : visibleNotifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-[#64748B]">
                      Aucune notification pour le moment.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#F1F5F9]">
                      {visibleNotifications.map((item) => {
                        const priority = PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.normal;
                        const hasTarget = resolveNotificationTarget(item) !== null;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => openNotification(item)}
                              title={hasTarget ? "Ouvrir le dossier concerné" : undefined}
                              className={`w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-[#F8F9FB] focus:outline-none focus-visible:bg-[#F0F7FF] ${
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
                                    <p className="truncate text-[13px] font-bold text-[#0F172A]">
                                      {item.title}
                                    </p>
                                    <span className="shrink-0 text-[10px] text-[#64748B]">
                                      {timeFormatter.format(new Date(item.createdAt))}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 line-clamp-2 text-xs text-[#475569]">
                                    {item.message}
                                  </p>
                                  <div className="mt-1 flex items-center justify-between gap-2">
                                    {item.source ? (
                                      <p className="truncate text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                                        {item.source}
                                      </p>
                                    ) : (
                                      <span />
                                    )}
                                    {hasTarget && (
                                      <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-[#006A8C]">
                                        Ouvrir
                                        <span className="material-symbols-outlined text-[14px]">
                                          arrow_forward
                                        </span>
                                      </span>
                                    )}
                                  </div>
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

        <div className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((open) => !open)}
            aria-expanded={accountOpen}
            aria-label="Menu du compte"
            className="flex min-w-0 cursor-pointer items-center gap-2 rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006A8C]/30 sm:gap-3"
          >
            <span className="flex min-w-0 flex-col text-right">
              <span className="max-w-[140px] truncate text-[12px] font-extrabold leading-tight text-gray-900 sm:max-w-[180px] sm:text-[12.5px] lg:max-w-none lg:text-[13px]">
                {displayName}
              </span>
              <span className="mt-0.5 hidden truncate text-[10px] font-bold uppercase leading-tight tracking-widest text-gray-400 sm:block">
                {displayRole}
              </span>
            </span>
            <span className="relative h-8 w-8 shrink-0 sm:h-10 sm:w-10">
              <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-[#CFE9EF] bg-[#F0F7FF] text-xs font-black text-[#006A8C] sm:text-sm">
                {initials}
              </span>
              <span
                title={backendReady ? "Serveur prêt" : "Connexion au serveur en cours..."}
                className={`pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white sm:h-3 sm:w-3 ${
                  backendReady ? "bg-emerald-500" : "bg-orange-400"
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
              <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-[#F1F5F9] bg-white shadow-[0px_12px_40px_rgba(15,23,42,0.12)]">
                <div className="border-b border-[#F1F5F9] px-4 py-3">
                  <p className="text-sm font-black text-[#0F172A]">{displayName}</p>
                  <p className="text-xs text-[#64748B]">{user?.email ?? displayRole}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#006A8C]">
                    {displayRole} · {permissions.length} permission(s)
                  </p>
                </div>
                <Link
                  href="/aide"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#475569] hover:bg-gray-50"
                >
                  <span className="material-symbols-outlined text-[20px]">help</span>
                  Aide
                </Link>
                <Link
                  href="/deconnexion"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-2 border-t border-[#F1F5F9] px-4 py-3 text-sm font-bold text-[#E11D48] hover:bg-red-50"
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

