export type NavItem = {
  label: string;
  href: string;
  icon: string;
  shortLabel?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/", icon: "dashboard", shortLabel: "Accueil" },
  {
    label: "Consultation",
    href: "/consultation",
    icon: "medical_services",
    shortLabel: "Consults",
  },
  {
    label: "Prescription",
    href: "/prescription",
    icon: "medication",
    shortLabel: "Rx",
  },
  {
    label: "Polysomnographie",
    href: "/polysomnographie",
    icon: "sleep",
    shortLabel: "PSG",
  },
  {
    label: "Compte rendu",
    href: "/comptes-rendus",
    icon: "description",
    shortLabel: "Bilan",
  },
  {
    label: "Rapports & Statistiques",
    href: "/rapports",
    icon: "bar_chart",
    shortLabel: "Stats",
  },
  {
    label: "Archives",
    href: "/archives",
    icon: "archive",
    shortLabel: "Archives",
  },
];

export function isPathActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
