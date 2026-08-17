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

  // 9. Paramètres système
  "settings:view": "Consulter les paramètres",
  "settings:update": "Modifier les paramètres",
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
 *
 * `ALLOW_UNKNOWN_ACCOUNTS` lève le second verrou : les comptes absents de la
 * liste nominative de lib/auth.ts sont acceptés au lieu d'être refusés.
 * ───────────────────────────────────────────────────────────────────────── */
export const GRANT_ALL_PERMISSIONS = true;
export const ALLOW_UNKNOWN_ACCOUNTS = true;

/** Rôle attribué par défaut à un compte non listé nominativement. */
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

const MEDECIN_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "consultation:list",
  "consultation:read",
  "consultation:treat",
  "prescription:create",
  "prescription:read",
  "prescription:list",
  "prescription:update",
  "prescription:delete",
  "prescription:sign",
  "prescription:print",
  "psg:read",
  "psg:list",
  "psg:view_waveform",
  "psg:interpret_create",
  "psg:interpret_read",
  "psg:interpret_list",
  "psg:interpret_update",
  "psg:interpret_validate",
  "psg:interpret_delete",
  "psg:interpret_export",
  "report:create",
  "report:read",
  "report:list",
  "report:update",
  "report:delete",
  "report:validate",
  "report:export",
  "stats:view",
  "stats:generate",
  "archive:read",
  "archive:list",
  "archive:export",
  "settings:view",
];

const PARAMED_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "consultation:list",
  "consultation:read",
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
  "report:create",
  "report:read",
  "report:list",
];

/**
 * Répartition par rôle applicative, dérivée de la matrice Rôles × Modules.
 *
 * Correspondance avec les rôles du document :
 *   MEDECIN -> Médecin Spécialiste
 *   PARAMED -> Technicien PSG
 *   MAJOR   -> Administrateur (encadrement de l'unité)
 *
 * Ce tableau n'est qu'un repli : dès que le service d'authentification CHU
 * fournit les permissions du compte (claim JWT ou `GET /roles`), ce sont
 * elles qui font foi — voir `resolvePermissions`.
 */
export const ROLE_PERMISSIONS: Record<SleepRole, Permission[]> = {
  MEDECIN: MEDECIN_PERMISSIONS,
  PARAMED: PARAMED_PERMISSIONS,
  MAJOR: ALL_PERMISSIONS,
};

/**
 * Permissions effectives d'un compte.
 * `grantedByAuthService` provient du jeton ou de l'API d'authentification ;
 * si rien n'est fourni, on retombe sur la matrice du rôle.
 */
export function resolvePermissions(
  role: SleepRole | null | undefined,
  grantedByAuthService?: readonly string[] | null
): Permission[] {
  // Ouverture temporaire : prime sur le jeton comme sur la matrice.
  if (GRANT_ALL_PERMISSIONS) return ALL_PERMISSIONS;

  if (grantedByAuthService && grantedByAuthService.length > 0) {
    const resolved = grantedByAuthService
      .map(normalizePermission)
      .filter((permission): permission is Permission => permission !== null);
    if (resolved.length > 0) return [...new Set(resolved)];
  }

  return role ? ROLE_PERMISSIONS[role] : [];
}

/** Permissions requises pour ouvrir chaque rubrique de navigation. */
export const ROUTE_PERMISSIONS: Array<{ path: string; permission: Permission }> = [
  { path: "/", permission: "dashboard:view" },
  { path: "/consultation", permission: "consultation:list" },
  { path: "/prescription", permission: "prescription:list" },
  { path: "/polysomnographie", permission: "psg:list" },
  { path: "/interpretation-psg", permission: "psg:interpret_list" },
  { path: "/comptes-rendus", permission: "report:list" },
  { path: "/rapports", permission: "stats:view" },
  { path: "/archives", permission: "archive:list" },
  { path: "/parametres", permission: "settings:view" },
];
