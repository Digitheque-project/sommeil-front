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
};

const USERS: Record<string, Omit<SleepUser, "email">> = {
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
  email?: string;
  name?: string;
  firstname?: string;
};

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
    if (!email || !USERS[email]) return null;

    const user = USERS[email];
    // Le SSO peut renvoyer soit `firstname` + `name`, soit uniquement le
    // nom complet dans `name`. Dans ce second cas, ne dupliquons pas le nom.
    const firstName = payload.firstname?.trim() || (payload.name?.trim() ? payload.name.trim() : user.firstName);
    const lastName = payload.firstname?.trim() ? payload.name?.trim() || user.lastName : "";

    return {
      email,
      role: user.role,
      firstName,
      lastName,
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

const PARAMED_PATHS = ["/", "/consultation", "/prescription", "/polysomnographie"];
const MAJOR_PATHS = [...PARAMED_PATHS, "/comptes-rendus", "/rapports", "/archives"];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((path) => path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`));
}

/** Autorisations de navigation du Centre de Sommeil. */
export function canAccessPath(role: SleepRole, pathname: string) {
  if (role === "MEDECIN") return true;
  return matchesPath(pathname, role === "MAJOR" ? MAJOR_PATHS : PARAMED_PATHS);
}
