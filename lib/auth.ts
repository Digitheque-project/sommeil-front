import {
  DEFAULT_ROLE,
  ROUTE_PERMISSIONS,
  type Permission,
} from "@/lib/permissions";

export const AUTH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "sommeil_auth_token";

export const AUTH_LOGIN_URL =
  process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ||
  "https://authentification-front.vercel.app/login";

export type SleepRole = "PARAMED" | "MAJOR" | "MEDECIN";

export type SleepUser = {
  email: string;
  firstName: string;
  lastName: string;
  role: SleepRole;
  /** Identifiant du compte côté service d'authentification CHU, s'il est présent. */
  userId?: string;
  /**
   * Permissions portées par le jeton (service d'authentification CHU).
   * Vide quand le jeton n'en transporte pas : la matrice du rôle prend alors
   * le relais — voir `resolvePermissions` dans lib/permissions.ts.
   */
  grantedPermissions: string[];
};

type JwtPayload = {
  sub?: string;
  id?: string;
  email?: string;
  name?: string;
  firstname?: string;
  /** Timestamp Unix (secondes) d'expiration du jeton. */
  exp?: number;
  role?: string | { name?: string };
  // Le service d'authentification CHU expose des rôles porteurs de permissions
  // (`POST /roles` : `permissionIds`). Selon la configuration, le jeton peut
  // transporter les permissions à plat ou imbriquées dans les rôles.
  permissions?: Array<string | { name?: string }>;
  roles?: Array<string | { name?: string; permissions?: Array<string | { name?: string }> }>;
};

/**
 * Rôle applicatif porté par le jeton. Les noms de rôles du service
 * d'authentification CHU sont variés (`MEDECIN`, `Médecin Spécialiste`,
 * `TECHNICIEN_PSG`...) : on les rattache aux trois rôles du Centre de Sommeil.
 * `DEFAULT_ROLE` s'applique quand le jeton n'en porte aucun de reconnaissable.
 */
function readRole(payload: JwtPayload): SleepRole {
  const names: string[] = [];

  const push = (entry: string | { name?: string } | undefined) => {
    if (typeof entry === "string") names.push(entry);
    else if (entry?.name) names.push(entry.name);
  };

  push(payload.role);
  payload.roles?.forEach((role) =>
    push(typeof role === "object" ? { name: role.name } : role)
  );

  for (const name of names) {
    const normalized = name.trim().toUpperCase();
    if (normalized.includes("MAJOR") || normalized.includes("ADMIN")) return "MAJOR";
    if (
      normalized.includes("PARAMED") ||
      normalized.includes("TECHNICIEN") ||
      normalized.includes("INFIRM")
    ) {
      return "PARAMED";
    }
    if (normalized.includes("MEDECIN") || normalized.includes("MÉDECIN")) return "MEDECIN";
  }

  return DEFAULT_ROLE;
}

/** Aplatit les permissions du jeton, quelle que soit leur forme. */
function readGrantedPermissions(payload: JwtPayload): string[] {
  const collected: string[] = [];

  const push = (entry: string | { name?: string } | undefined) => {
    if (typeof entry === "string") collected.push(entry);
    else if (entry?.name) collected.push(entry.name);
  };

  payload.permissions?.forEach(push);
  payload.roles?.forEach((role) => {
    if (typeof role === "object" && role?.permissions) role.permissions.forEach(push);
  });

  return [...new Set(collected)];
}

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return decodeURIComponent(
      Array.from(atob(padded))
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
  } catch {
    return null;
  }
}

/**
 * Un jeton présent mais expiré doit être traité comme absent : sans ce
 * contrôle, `AuthGate` le laisse passer (il ne vérifie que la présence) et
 * l'utilisateur ne découvre le problème qu'au premier appel API en échec
 * (401 « Session expirée »), en pleine saisie.
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;

  const payloadPart = token.split(".")[1];
  if (!payloadPart) return true;

  try {
    const decoded = decodeBase64Url(payloadPart);
    if (!decoded) return true;
    const payload = JSON.parse(decoded) as JwtPayload;
    // Pas de claim `exp` : on ne peut pas juger, on laisse passer plutôt que
    // de bloquer un jeton potentiellement valide.
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

/** Efface la session locale : storage et cookies posés par AuthContext. */
export function clearAuthSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("auth_token");
  localStorage.removeItem("token");
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax";
  document.cookie = "access_token=; Path=/; Max-Age=0; SameSite=Lax";
}

/**
 * Jeton expiré ou refusé (401) par un backend : on nettoie la session locale
 * et on renvoie vers le SSO plutôt que de laisser l'utilisateur sur un écran
 * qui échouera à chaque appel.
 */
export function redirectToLogin() {
  clearAuthSession();
  window.location.replace(AUTH_LOGIN_URL);
}

/** Lit uniquement les informations d'affichage d'un JWT déjà délivré par le SSO. */
export function getSleepUserFromToken(token: string | null | undefined): SleepUser | null {
  if (!token) return null;

  const payloadPart = token.split(".")[1];
  if (!payloadPart) return null;

  try {
    const decoded = decodeBase64Url(payloadPart);
    if (!decoded) return null;
    const payload = JSON.parse(decoded) as JwtPayload;
    const email = payload.email?.trim().toLowerCase();
    if (!email) return null;

    // Le SSO peut renvoyer soit `firstname` + `name`, soit uniquement le
    // nom complet dans `name`. Dans ce second cas, ne dupliquons pas le nom.
    // Dernier recours : l'adresse e-mail, seule identité toujours présente.
    const firstName = payload.firstname?.trim() || payload.name?.trim() || email;
    const lastName = payload.firstname?.trim() ? payload.name?.trim() || "" : "";

    return {
      email,
      role: readRole(payload),
      firstName,
      lastName,
      userId: payload.sub ?? payload.id,
      grantedPermissions: readGrantedPermissions(payload),
    };
  } catch {
    return null;
  }
}

export const roleLabel = (role: SleepRole) => {
  switch (role) {
    case "PARAMED":
      return "Paramédical";
    case "MAJOR":
      return "Major";
    case "MEDECIN":
      return "Médecin";
  }
};

function matchesPath(pathname: string, path: string) {
  return path === "/"
    ? pathname === "/"
    : pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * Permission requise pour ouvrir un chemin, ou `null` si le chemin est libre
 * (déconnexion, aide...). Les chemins les plus spécifiques l'emportent.
 */
export function permissionForPath(pathname: string): Permission | null {
  const match = [...ROUTE_PERMISSIONS]
    .sort((a, b) => b.path.length - a.path.length)
    .find((route) => matchesPath(pathname, route.path));

  return match?.permission ?? null;
}

/**
 * Autorisations de navigation du Centre de Sommeil, évaluées sur les
 * permissions effectives du compte (jeton CHU ou matrice du rôle).
 */
export function canAccessPath(
  permissions: readonly Permission[],
  pathname: string
) {
  const required = permissionForPath(pathname);
  return required === null || permissions.includes(required);
}
