"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSION_CATALOG, type Permission } from "@/lib/permissions";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Permission requise pour déclencher l'action. */
  permission: Permission;
  /**
   * Masquer complètement le bouton au lieu de le désactiver.
   * À réserver aux actions destructrices ; par défaut le bouton reste visible
   * mais inactif, ce qui évite une interface qui change de forme selon le rôle.
   */
  hideWhenDenied?: boolean;
  /** Rend le bouton inactif et affiche un libellé d'attente. */
  pending?: boolean;
  pendingLabel?: ReactNode;
  children?: ReactNode;
};

export default function ActionButton({
  permission,
  hideWhenDenied = false,
  pending = false,
  pendingLabel,
  children,
  disabled,
  title,
  className,
  ...rest
}: Readonly<ActionButtonProps>) {
  const { can } = usePermissions();
  const allowed = can(permission);

  if (!allowed && hideWhenDenied) return null;

  const deniedTitle = `Action réservée : permission « ${PERMISSION_CATALOG[permission]} » (${permission}) requise.`;

  return (
    <button
      {...rest}
      type={rest.type ?? "button"}
      disabled={disabled || pending || !allowed}
      title={allowed ? title : deniedTitle}
      aria-disabled={!allowed || undefined}
      data-permission={permission}
      className={`${className ?? ""} disabled:cursor-not-allowed disabled:opacity-50`.trim()}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

/** Masque un fragment d'interface quand la permission n'est pas accordée. */
export function PermissionGate({
  permission,
  fallback = null,
  children,
}: Readonly<{ permission: Permission; fallback?: ReactNode; children: ReactNode }>) {
  const { can } = usePermissions();
  return <>{can(permission) ? children : fallback}</>;
}
