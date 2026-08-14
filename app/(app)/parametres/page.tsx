"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import ActionButton from "@/components/ActionButton";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/use-permissions";
import { roleLabel } from "@/lib/auth";
import { PERMISSION_CATALOG, type Permission } from "@/lib/permissions";

const STORAGE_KEY = "sommeil_settings";

type Settings = {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  urgentOnly: boolean;
  refreshInterval: number;
};

const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: true,
  soundEnabled: false,
  urgentOnly: false,
  refreshInterval: 30,
};

/**
 * Préférences d'affichage du poste de travail. Elles sont propres au
 * navigateur : le service sommeil-back n'expose pas encore de stockage de
 * configuration par utilisateur.
 */
function readSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  consultation: "Consultation",
  prescription: "Prescription",
  psg: "Polysomnographie",
  report: "Compte rendu",
  stats: "Rapports & Statistiques",
  archive: "Archives",
  user: "Administration",
  role: "Administration",
  permission: "Administration",
  audit: "Administration",
  settings: "Paramètres système",
};

export default function ParametresPage() {
  const { user } = useAuth();
  const { permissions, can } = usePermissions();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => setSettings(readSettings()), []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Permission[]>();
    for (const permission of permissions) {
      const module = MODULE_LABELS[permission.split(":")[0]] ?? "Autres";
      groups.set(module, [...(groups.get(module) ?? []), permission]);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions]);

  const canEdit = can("settings:update");

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  /** `settings:update` — persiste les préférences du poste. */
  const save = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setToast("Paramètres enregistrés.");
  };

  const reset = () => {
    setSettings(DEFAULT_SETTINGS);
    window.localStorage.removeItem(STORAGE_KEY);
    setToast("Paramètres réinitialisés.");
  };

  return (
    <>
      <TopBar title="Paramètres" doctorRole="Configuration" showSettings={false} />

      <div className="mx-auto w-full max-w-5xl space-y-6 p-6 md:p-8">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A]">
            Paramètres système
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Préférences d&apos;affichage de ce poste et récapitulatif de vos autorisations.
          </p>
        </div>

        <section className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-primary">Notifications</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Ces réglages sont enregistrés dans ce navigateur.
          </p>

          <div className="mt-5 space-y-4">
            {[
              { key: "notificationsEnabled" as const, label: "Afficher les notifications", hint: "Cloche de la barre supérieure" },
              { key: "soundEnabled" as const, label: "Signal sonore", hint: "Émettre un son à l'arrivée d'une notification urgente" },
              { key: "urgentOnly" as const, label: "Urgences uniquement", hint: "Masquer les notifications de priorité normale" },
            ].map((option) => (
              <label
                key={option.key}
                className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container px-4 py-3"
              >
                <span>
                  <span className="block text-sm font-semibold text-on-surface">{option.label}</span>
                  <span className="block text-xs text-on-surface-variant">{option.hint}</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings[option.key]}
                  disabled={!canEdit}
                  onChange={(event) => update(option.key, event.target.checked)}
                  className="h-5 w-5 accent-[#2563EB] disabled:opacity-40"
                />
              </label>
            ))}

            <label className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-on-surface">
                  Intervalle d&apos;actualisation
                </span>
                <span className="block text-xs text-on-surface-variant">
                  Fréquence de rafraîchissement des listes, en secondes
                </span>
              </span>
              <input
                type="number"
                min={10}
                max={300}
                step={10}
                value={settings.refreshInterval}
                disabled={!canEdit}
                onChange={(event) => update("refreshInterval", Number(event.target.value) || 30)}
                className="h-10 w-24 rounded-xl border border-outline-variant bg-white px-3 text-sm font-semibold text-on-surface disabled:opacity-40"
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <ActionButton
              permission="settings:update"
              onClick={reset}
              className="action-secondary rounded-2xl px-4 py-2.5 text-sm font-bold"
            >
              Réinitialiser
            </ActionButton>
            <ActionButton
              permission="settings:update"
              onClick={save}
              className="action-primary rounded-2xl px-5 py-2.5 text-sm font-bold"
            >
              Enregistrer
            </ActionButton>
          </div>
        </section>

        <section className="rounded-3xl border border-outline-variant bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-primary">Mes autorisations</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Compte {user?.email} · profil {user ? roleLabel(user.role) : "inconnu"} ·{" "}
            {permissions.length} permission(s) accordée(s).
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {grouped.map(([module, modulePermissions]) => (
              <div key={module} className="rounded-2xl border border-outline-variant bg-surface-container p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {module}
                </p>
                <ul className="mt-2 space-y-1">
                  {modulePermissions.map((permission) => (
                    <li key={permission} className="flex items-start gap-2 text-sm text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-green-600">check</span>
                      <span>
                        {PERMISSION_CATALOG[permission]}
                        <span className="ml-1 font-data-mono text-[11px] text-on-surface-variant">
                          ({permission})
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {permissions.length === 0 && (
            <p className="mt-4 text-sm text-on-surface-variant">
              Aucune permission n&apos;est associée à ce compte.
            </p>
          )}
        </section>
      </div>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}
