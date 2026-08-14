/**
 * Client du service d'authentification CHU (rôles & permissions).
 * Swagger : https://auth-service-4q6g.onrender.com/auth/api/docs
 *
 * Attention : la documentation est exposée sous /auth/api/docs, mais les
 * routes `/roles` et `/permissions` sont servies à la racine du service et
 * exigent un jeton porteur.
 */
const DEFAULT_AUTH_SERVICE_URL = "https://auth-service-4q6g.onrender.com";

export type AuthPermission = {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
};

export type AuthRole = {
  id: string;
  name: string;
  description?: string;
  serviceId?: string;
  isActive?: boolean;
  permissions?: AuthPermission[];
  permissionIds?: string[];
};

const getAuthServiceUrl = () =>
  (process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || DEFAULT_AUTH_SERVICE_URL).replace(/\/+$/, "");

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token")
  );
}

async function authServiceFetch<T>(path: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${getAuthServiceUrl()}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Service d'authentification : HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const authServiceApi = {
  /** Catalogue des permissions déclarées dans la plateforme CHU. */
  getPermissions: () => authServiceFetch<AuthPermission[]>("/permissions"),

  /** Rôles et leurs permissions. */
  getRoles: () => authServiceFetch<AuthRole[]>("/roles"),
};

/** Noms de permissions portés par les rôles dont l'utilisateur fait partie. */
export function permissionNamesForRoles(
  roles: AuthRole[],
  roleNames: readonly string[]
): string[] {
  const wanted = new Set(roleNames.map((name) => name.trim().toUpperCase()));

  return roles
    .filter((role) => wanted.has(role.name?.trim().toUpperCase()))
    .flatMap((role) => role.permissions ?? [])
    .map((permission) => permission.name)
    .filter(Boolean);
}
