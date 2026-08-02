"use client";

import { useEffect, useState } from 'react';
import StatTile from './StatTile';

const quickActions = [
  { label: 'Planifier un examen', icon: 'event' },
  { label: 'Ajouter un patient', icon: 'person_add' },
  { label: 'Voir les dossiers', icon: 'folder' },
];

export default function DashboardShell() {
  const [data, setData] = useState<{stats:any[], activity:any[]}>({ stats: [], activity: [] });
  useEffect(() => {
    let mounted = true;
    fetch('/api/mock/summary')
      .then((r) => r.json())
      .then((json) => {
        if (mounted) setData(json);
      })
      .catch(() => {});
    return () => { mounted = false };
  }, []);

  return (
    <div className="space-y-section-gap">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {data.stats.length ? (
          data.stats.map((s) => (
            <StatTile key={s.title} title={s.title} value={s.value} />
          ))
        ) : (
          <div className="col-span-4 text-center text-on-surface-variant">Chargement...</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-[28px] overflow-hidden shadow-sm">
            <div className="p-container-padding border-b border-outline-variant flex justify-between items-center bg-surface-bright">
              <h3 className="font-headline-sm text-headline-sm text-primary">
                Activité Récente
              </h3>
              <button className="rounded-full border border-outline-variant px-4 py-2 text-label-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
                Voir tout
              </button>
            </div>
            <div className="divide-y divide-outline-variant">
              {data.activity.length ? (
                data.activity.map((it:any) => (
                  <div key={it.title} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-3xl bg-surface-container-high flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined icon-lg">
                          upload_file
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-on-surface">
                          {it.title}
                        </div>
                        <div className="text-label-sm text-on-surface-variant">
                          {it.subtitle}
                        </div>
                      </div>
                    </div>
                    <div className="text-label-sm text-on-surface-variant">
                      {it.time}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-on-surface-variant">Aucune activité</div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-[28px] p-6 shadow-sm">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-4">
              Actions Rapides
            </h3>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="w-full flex items-center justify-between gap-3 rounded-[24px] border border-outline-variant bg-white px-4 py-3 text-left font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-shadow shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary icon-lg">
                      {action.icon}
                    </span>
                    <span>{action.label}</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-dim rounded-[28px] p-6 relative overflow-hidden shadow-sm">
            <div className="relative z-10">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-3">
                État du Réseau
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-label-sm font-semibold text-green-700">
                  Système Opérationnel
                </span>
              </div>
              <p className="text-body-sm text-primary/80 leading-7">
                Connecté au serveur central de l&apos;Unité de Diagnostic.
                Synchronisation active.
              </p>
            </div>
            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-primary/10 text-[120px] select-none">
              cloud_done
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
