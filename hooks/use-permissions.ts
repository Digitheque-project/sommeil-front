"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { authServiceApi, permissionNamesForRoles } from "@/lib/api/auth-service";
import {
  GRANT_ALL_PERMISSIONS,
  resolvePermissions,
  type Permission,
} from "@/lib/permissions";

/**
 * Permissions effectives du compte connecté, par ordre de priorité :
 *   1. permissions portées par le jeton JWT ;
 *   2. permissions du rôle homonyme dans le service d'authentification CHU ;
 *   3. matrice de repli `ROLE_PERMISSIONS`.
 *
 * L'étape 2 échoue silencieusement quand le service est injoignable ou que le
 * jeton ne donne pas accès à `/roles` : l'interface reste utilisable.
 */
export function usePermissions() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const hasTokenPermissions = (user?.grantedPermissions?.length ?? 0) > 0;

  const { data: roles = [], isLoading: isRolesLoading } = useQuery({
    queryKey: ["auth-roles"],
    queryFn: () => authServiceApi.getRoles(),
    // Inutile d'interroger le service quand le jeton porte déjà les permissions,
    // ou pendant l'ouverture temporaire des accès.
    enabled: Boolean(user) && !hasTokenPermissions && !GRANT_ALL_PERMISSIONS,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const permissions = useMemo<Permission[]>(() => {
    if (!user) return [];
    if (GRANT_ALL_PERMISSIONS) return resolvePermissions(user.role);
    if (hasTokenPermissions) {
      return resolvePermissions(user.role, user.grantedPermissions);
    }

    const fromService = permissionNamesForRoles(roles, [user.role]);
    return resolvePermissions(user.role, fromService);
  }, [user, hasTokenPermissions, roles]);

  return useMemo(() => {
    const granted = new Set(permissions);

    return {
      permissions,
      role: user?.role ?? null,
      isLoading: isAuthLoading || isRolesLoading,
      can: (permission: Permission) => granted.has(permission),
      canAny: (...list: Permission[]) => list.some((item) => granted.has(item)),
      canAll: (...list: Permission[]) => list.every((item) => granted.has(item)),
    };
  }, [permissions, user, isAuthLoading, isRolesLoading]);
}
