import type { SleepRole } from "@/lib/auth";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  shortLabel?: string;
  roles: SleepRole[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/", icon: "dashboard", shortLabel: "Accueil", roles: ["PARAMED", "MAJOR", "MEDECIN"] },
  {
    label: "Consultation",
    href: "/consultation",
    icon: "medical_services",
    shortLabel: "Consults",
    roles: ["PARAMED", "MAJOR", "MEDECIN"],
  },
  {
    label: "Prescription",
    href: "/prescription",
    icon: "medication",
    shortLabel: "Rx",
    roles: ["PARAMED", "MAJOR", "MEDECIN"],
  },
  {
    label: "Polysomnographie",
    href: "/polysomnographie",
    icon: "sleep",
    shortLabel: "PSG",
    roles: ["PARAMED", "MAJOR", "MEDECIN"],
  },
  {
    label: "Compte rendu",
    href: "/comptes-rendus",
    icon: "description",
    shortLabel: "Bilan",
    roles: ["MAJOR", "MEDECIN"],
  },
  {
    label: "Rapports & Statistiques",
    href: "/rapports",
    icon: "bar_chart",
    shortLabel: "Stats",
    roles: ["MAJOR", "MEDECIN"],
  },
  {
    label: "Archives",
    href: "/archives",
    icon: "archive",
    shortLabel: "Archives",
    roles: ["MAJOR", "MEDECIN"],
  },
];

export function isPathActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
