import type { SleepRole } from "@/lib/auth";

/**
 * Catalogue des permissions du Centre de Sommeil.
 *
 * Convention `module:action`, alignée sur Sommeil_Clinic_Matrice_Permissions.md.
 * Ces clés sont celles attendues par le service d'authentification CHU
 * (`GET /permissions`, `GET /roles`) ; `normalizePermission` accepte aussi la
 * forme SCREAMING_SNAKE (`PRESCRIPTION_CREATE`) utilisée par ce service.
 */
export const PERMISSION_CATALOG = {
  // 1. Tableau de bord
  "dashboard:view": "Consulter le tableau de bord",

  // 2. Consultation
  "consultation:list": "Lister les consultations",
  "consultation:read": "Consulter une consultation",
  "consultation:treat": "Consulter et traiter un patient",

  // 3. Prescription
  "prescription:create": "Créer une prescription",
  "prescription:read": "Consulter une prescription",
  "prescription:list": "Lister les prescriptions",
  "prescription:update": "Modifier une prescription",
  "prescription:delete": "Supprimer une prescription",
  "prescription:sign": "Signer une prescription",
  "prescription:print": "Imprimer une prescription",

  // 3bis. Planning
  "planning:list": "Lister les rendez-vous du planning",
  "planning:read": "Consulter un rendez-vous du planning",
  "planning:create": "Créer un rendez-vous du planning",
  "planning:update": "Modifier un rendez-vous du planning",
  "planning:delete": "Supprimer un rendez-vous du planning",

  // 4. Polysomnographie
  "psg:create": "Programmer un examen PSG",
  "psg:read": "Consulter un examen PSG",
  "psg:list": "Lister les examens PSG",
  "psg:update": "Modifier un examen PSG",
  "psg:delete": "Supprimer un examen PSG",
  "psg:start": "Démarrer l'enregistrement",
  "psg:stop": "Arrêter l'enregistrement",
  "psg:view_waveform": "Visualiser les tracés",
  "psg:export_data": "Exporter les données brutes",

  // 4bis. Interprétation PSG
  "psg:interpret_create": "Créer une interprétation PSG",
  "psg:interpret_read": "Consulter une interprétation PSG",
  "psg:interpret_list": "Lister les interprétations PSG",
  "psg:interpret_update": "Modifier une interprétation PSG",
  "psg:interpret_validate": "Valider/signer une interprétation PSG",
  "psg:interpret_delete": "Supprimer une interprétation PSG",
  "psg:interpret_export": "Exporter une interprétation PSG",

  // 5. Compte rendu
  "report:create": "Créer un compte rendu",
  "report:read": "Consulter un compte rendu",
  "report:list": "Lister les comptes rendus",
  "report:update": "Modifier un compte rendu",
  "report:delete": "Supprimer un compte rendu",
  "report:validate": "Valider/signer un compte rendu",
  "report:export": "Exporter un compte rendu",

  // 6. Rapports & Statistiques
  "stats:view": "Consulter les statistiques",
  "stats:generate": "Générer un rapport",
  "stats:export": "Exporter les statistiques",

  // 7. Archives
  "archive:read": "Consulter une archive",
  "archive:list": "Lister les archives",
  "archive:restore": "Restaurer une archive",
  "archive:delete": "Supprimer une archive",
  "archive:export": "Exporter une archive",

  // 8. Administration
  "user:create": "Créer un utilisateur",
  "user:read": "Consulter un utilisateur",
  "user:list": "Lister les utilisateurs",
  "user:update": "Modifier un utilisateur",
  "user:delete": "Supprimer un utilisateur",
  "role:assign": "Attribuer un rôle",
  "permission:manage": "Gérer les permissions",
  "audit:view": "Consulter le journal d'audit",
} as const;

export type Permission = keyof typeof PERMISSION_CATALOG;

export const ALL_PERMISSIONS = Object.keys(PERMISSION_CATALOG) as Permission[];

/* ─────────────────────────────────────────────────────────────────────────
 * OUVERTURE TEMPORAIRE DES ACCÈS
 *
 * Tant que ce drapeau vaut `true`, tout compte authentifié dispose de la
 * totalité des permissions : toutes les rubriques et tous les boutons sont
 * accessibles, quel que soit le rôle.
 *
 * La matrice par rôle ci-dessous reste en place et n'est pas modifiée : il
 * suffit de repasser ce drapeau à `false` pour que la répartition fine
 * reprenne effet, sans autre changement de code.
 * ───────────────────────────────────────────────────────────────────────── */
export const GRANT_ALL_PERMISSIONS = false;

/** Rôle appliqué quand le jeton CHU n'en porte aucun de reconnaissable. */
export const DEFAULT_ROLE: SleepRole = "MEDECIN";

const permissionSet = new Set<string>(ALL_PERMISSIONS);

/**
 * Ramène une permission à sa forme canonique `module:action`.
 * Accepte `PRESCRIPTION_CREATE`, `prescription.create`, `Prescription:Create`.
 * Renvoie `null` si la clé ne fait pas partie du catalogue.
 */
export function normalizePermission(raw: unknown): Permission | null {
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim().toLowerCase();
  if (permissionSet.has(trimmed)) return trimmed as Permission;

  // PRESCRIPTION_CREATE / prescription.create -> prescription:create
  // `psg:view_waveform` et `psg:export_data` gardent leur underscore final :
  // on ne remplace donc que le premier séparateur rencontré.
  const converted = trimmed.replace(/[._]/, ":");
  return permissionSet.has(converted) ? (converted as Permission) : null;
}

/*
 * Répartition des accès par rôle (demande du 28/11/2026) :
 *   MAJOR   : tableau de bord, prescription (c'est le major qui planifie les
 *             examens prescrits), planning, polysomnographie, rapports, archives.
 *   PARAMED : tableau de bord, planning (consultation), polysomnographie, archives.
 *   MEDECIN : tout, sauf générer un rapport.
 */

/** Toutes les permissions sauf la génération de rapport. */
const MEDECIN_PERMISSIONS: Permission[] = ALL_PERMISSIONS.filter(
  (permission) => permission !== "stats:generate"
);

const MAJOR_PERMISSIONS: Permission[] = [
  "dashboard:view",
  // Prescription : consulter les demandes reçues et les planifier (psg:create / psg:update).
  "prescription:read",
  "prescription:list",
  "prescription:print",
  "planning:list",
  "planning:read",
  "planning:create",
  "planning:update",
  "planning:delete",
  "psg:create",
  "psg:read",
  "psg:list",
  "psg:update",
  "psg:delete",
  "psg:start",
  "psg:stop",
  "psg:view_waveform",
  "psg:export_data",
  "psg:interpret_read",
  "psg:interpret_list",
  "stats:view",
  "stats:generate",
  "stats:export",
  "archive:read",
  "archive:list",
  "archive:restore",
  "archive:delete",
  "archive:export",
];

const PARAMED_PERMISSIONS: Permission[] = [
  "dashboard:view",
  // Planning en lecture : c'est le major qui planifie.
  "planning:list",
  "planning:read",
  "psg:read",
  "psg:list",
  "psg:update",
  "psg:start",
  "psg:stop",
  "psg:view_waveform",
  "psg:export_data",
  "psg:interpret_read",
  "psg:interpret_list",
  "archive:read",
  "archive:list",
];

/**
 * Répartition par rôle applicative.
 *
 * Correspondance avec les rôles du document :
 *   MEDECIN -> Médecin Spécialiste
 *   PARAMED -> Paramédical / Technicien PSG
 *   MAJOR   -> Major (encadrement de l'unité)
 *
 * Cette matrice fait foi : les permissions du jeton ne s'y ajoutent plus
 * (voir `resolvePermissions`).
 */
export const ROLE_PERMISSIONS: Record<SleepRole, Permission[]> = {
  MEDECIN: MEDECIN_PERMISSIONS,
  PARAMED: PARAMED_PERMISSIONS,
  MAJOR: MAJOR_PERMISSIONS,
};

/**
 * Permissions effectives d'un compte.
 * La matrice du rôle fait foi ; `grantedByAuthService` (jeton ou API
 * d'authentification) ne sert que lorsqu'aucun rôle n'est connu.
 */
export function resolvePermissions(
  role: SleepRole | null | undefined,
  grantedByAuthService?: readonly string[] | null
): Permission[] {
  // Ouverture temporaire : prime sur le jeton comme sur la matrice.
  if (GRANT_ALL_PERMISSIONS) return ALL_PERMISSIONS;

  // Le rôle décide de ce que le compte voit : les permissions du jeton s'y
  // ajoutaient, ce qui pouvait rouvrir une rubrique fermée à ce rôle.
  if (role) return ROLE_PERMISSIONS[role];

  return (grantedByAuthService ?? [])
    .map(normalizePermission)
    .filter((permission): permission is Permission => permission !== null);
}

/** Permissions requises pour ouvrir chaque rubrique de navigation. */
export const ROUTE_PERMISSIONS: Array<{ path: string; permission: Permission }> = [
  { path: "/", permission: "dashboard:view" },
  { path: "/consultation", permission: "consultation:list" },
  { path: "/prescription", permission: "prescription:list" },
  { path: "/planning", permission: "planning:list" },
  { path: "/polysomnographie", permission: "psg:list" },
  { path: "/comptes-rendus", permission: "report:list" },
  { path: "/rapports", permission: "stats:view" },
  { path: "/archives", permission: "archive:list" },
];
