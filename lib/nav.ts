import type { SleepRole } from "@/lib/auth";
import { ROLE_PERMISSIONS, type Permission } from "@/lib/permissions";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  shortLabel?: string;
  /** Permission requise pour voir la rubrique dans la navigation. */
  permission: Permission;
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/",
    icon: "dashboard",
    shortLabel: "Accueil",
    permission: "dashboard:view",
  },
  {
    label: "Consultation",
    href: "/consultation",
    icon: "medical_services",
    shortLabel: "Consults",
    permission: "consultation:list",
  },
  {
    label: "Prescription",
    href: "/prescription",
    icon: "medication",
    shortLabel: "Rx",
    permission: "prescription:list",
  },
  {
    label: "Planning",
    href: "/planning",
    icon: "calendar_month",
    shortLabel: "Planning",
    permission: "planning:list",
  },
  {
    label: "Polysomnographie",
    href: "/polysomnographie",
    icon: "sleep",
    shortLabel: "PSG",
    permission: "psg:list",
  },
  {
    label: "Compte rendu",
    href: "/comptes-rendus",
    icon: "description",
    shortLabel: "Bilan",
    permission: "report:list",
  },
  {
    label: "Rapports & Statistiques",
    href: "/rapports",
    icon: "bar_chart",
    shortLabel: "Stats",
    permission: "stats:view",
  },
  {
    label: "Archives",
    href: "/archives",
    icon: "archive",
    shortLabel: "Archives",
    permission: "archive:list",
  },
];

export function isPathActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Repli utilisé avant que les permissions du compte ne soient résolues. */
export function navItemsForRole(role: SleepRole | null | undefined): NavItem[] {
  if (!role) return NAV_ITEMS;
  const granted = new Set<Permission>(ROLE_PERMISSIONS[role]);
  return NAV_ITEMS.filter((item) => granted.has(item.permission));
}
