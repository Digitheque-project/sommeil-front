import {
  ALLOW_UNKNOWN_ACCOUNTS,
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

type SleepUserProfile = Pick<SleepUser, "firstName" | "lastName" | "role">;

const USERS: Record<string, SleepUserProfile> = {
  "para@gmail.com": {
    firstName: "Paramed",
    lastName: "Sommeil",
    role: "PARAMED",
  },
  "maj@gmail.com": {
    firstName: "major",
    lastName: "sommeil",
    role: "MAJOR",
  },
  "med@gmail.com": {
    firstName: "medecin",
    lastName: "sommeil",
    role: "MEDECIN",
  },
};

type JwtPayload = {
  sub?: string;
  id?: string;
  email?: string;
  name?: string;
  firstname?: string;
  // Le service d'authentification CHU expose des rôles porteurs de permissions
  // (`POST /roles` : `permissionIds`). Selon la configuration, le jeton peut
  // transporter les permissions à plat ou imbriquées dans les rôles.
  permissions?: Array<string | { name?: string }>;
  roles?: Array<string | { name?: string; permissions?: Array<string | { name?: string }> }>;
};

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

    // Seuls trois comptes de démonstration sont listés nominativement. Tant que
    // l'ouverture temporaire est active, tout autre compte authentifié est
    // accepté avec le rôle par défaut au lieu d'être refusé à l'entrée.
    if (!USERS[email] && !ALLOW_UNKNOWN_ACCOUNTS) return null;

    const user = USERS[email] ?? {
      firstName: payload.firstname?.trim() || payload.name?.trim() || email,
      lastName: "",
      role: DEFAULT_ROLE,
    };
    // Le SSO peut renvoyer soit `firstname` + `name`, soit uniquement le
    // nom complet dans `name`. Dans ce second cas, ne dupliquons pas le nom.
    const firstName = payload.firstname?.trim() || (payload.name?.trim() ? payload.name.trim() : user.firstName);
    const lastName = payload.firstname?.trim() ? payload.name?.trim() || user.lastName : "";

    return {
      email,
      role: user.role,
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
