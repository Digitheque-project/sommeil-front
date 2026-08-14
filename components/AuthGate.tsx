"use client";

import { AUTH_LOGIN_URL } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { canAccessPath, permissionForPath, roleLabel } from "@/lib/auth";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSION_CATALOG } from "@/lib/permissions";
import { usePathname } from "next/navigation";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, token, user } = useAuth();
  const { permissions, isLoading: arePermissionsLoading } = usePermissions();
  const pathname = usePathname();

  if (isLoading) {
    return <main className="grid min-h-screen place-items-center text-sm text-slate-500">Vérification de votre session…</main>;
  }

  if (!token) {
    window.location.replace(AUTH_LOGIN_URL);
    return null;
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
        <section className="max-w-md rounded-2xl bg-white p-7 text-center shadow-lg">
          <span className="material-symbols-outlined text-4xl text-red-600">lock</span>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Accès non autorisé</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ce compte n’est pas rattaché au Centre de Sommeil. Utilisez un compte PARAMED, MAJOR ou MEDECIN autorisé.
          </p>
          <a href={AUTH_LOGIN_URL} className="mt-5 inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            Changer de compte
          </a>
        </section>
      </main>
    );
  }

  // Tant que les permissions ne sont pas résolues, on n'affiche pas de refus :
  // la matrice du rôle sert de repli immédiat, l'appel réseau ne fait que
  // l'affiner.
  if (arePermissionsLoading) {
    return <main className="grid min-h-screen place-items-center text-sm text-slate-500">Chargement de vos autorisations…</main>;
  }

  if (!canAccessPath(permissions, pathname)) {
    const required = permissionForPath(pathname);
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
        <section className="max-w-md rounded-2xl bg-white p-7 text-center shadow-lg">
          <span className="material-symbols-outlined text-4xl text-amber-600">gpp_maybe</span>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Accès réservé</h1>
          <p className="mt-2 text-sm text-slate-600">
            Votre profil {roleLabel(user.role)} ne permet pas d’ouvrir cette rubrique.
            {required && ` Permission requise : « ${PERMISSION_CATALOG[required]} » (${required}).`}
          </p>
          <a href="/" className="mt-5 inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            Retour au tableau de bord
          </a>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
