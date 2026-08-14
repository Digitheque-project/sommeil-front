"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import ActionButton from "@/components/ActionButton";
import BarChart from "@/components/charts/BarChart";
import DonutChart from "@/components/charts/DonutChart";
import { useStats } from "@/hooks/use-stats";
import { statsApi, type StatsPeriod } from "@/lib/api/stats";
import { downloadCsv, printDocument } from "@/lib/download";

const PERIODS: Array<{ key: StatsPeriod; label: string }> = [
  { key: "7j", label: "7 jours" },
  { key: "30j", label: "30 jours" },
  { key: "annee", label: "Année" },
];

// Palette réutilisée pour les secteurs, quel que soit le nombre de séries.
const SLICE_COLORS = ["#1e3a8a", "#2563eb", "#7fa6ff", "#bfdbfe", "#93c5fd", "#dbeafe"];
const SEVERITY_COLORS = ["#22c55e", "#eab308", "#f97316", "#ef5350"];

const examVolumeSeries = [
  { key: "precedent", label: "Période précédente", color: "#cbd5e1" },
  { key: "courant", label: "Période actuelle", color: "#2563eb" },
];

const withColors = (
  data: Array<{ label: string; value: number }>,
  palette: string[]
) => data.map((item, index) => ({ ...item, color: palette[index % palette.length] }));

export default function RapportsPage() {
  const [period, setPeriod] = useState<StatsPeriod>("30j");
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { data: stats, isLoading, isError, error, refetch, isFetching } = useStats(period);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const periodLabel = PERIODS.find((item) => item.key === period)?.label ?? "";

  /** `stats:export` — registre chiffré au format CSV. */
  const exportCsv = async () => {
    setIsExporting(true);
    try {
      const data = await statsApi.export(period);
      downloadCsv(
        [
          { indicateur: "Consultations", valeur: data.indicateurs.consultations },
          { indicateur: "Examens réalisés", valeur: data.indicateurs.examensRealises },
          { indicateur: "Comptes rendus validés", valeur: data.indicateurs.comptesRendusValides },
          { indicateur: "Taux de validation (%)", valeur: data.indicateurs.tauxValidation },
          { indicateur: "Consultations urgentes", valeur: data.indicateurs.urgences },
          ...data.typesExamens.map((item) => ({ indicateur: `Type · ${item.label}`, valeur: item.value })),
          ...data.occupationSalles.map((item) => ({ indicateur: `Salle · ${item.label}`, valeur: `${item.percent}%` })),
        ],
        [
          { key: "indicateur", label: "Indicateur" },
          { key: "valeur", label: "Valeur" },
        ],
        `statistiques-sommeil-${period}.csv`
      );
      setToast("Statistiques exportées.");
    } catch (exportError) {
      setToast(exportError instanceof Error ? exportError.message : "L'export a échoué.");
    } finally {
      setIsExporting(false);
    }
  };

  /** `stats:generate` — rapport imprimable sur la période sélectionnée. */
  const generateReport = async () => {
    try {
      const data = await statsApi.export(period);
      printDocument(
        `Rapport d'activité — ${periodLabel}`,
        `<h1>Rapport d'activité du Centre de Sommeil</h1>
         <p class="meta">
           Période : ${periodLabel} (du ${new Date(data.debut).toLocaleDateString("fr-FR")} au ${new Date(data.fin).toLocaleDateString("fr-FR")})<br />
           Édité le ${new Date(data.genereLe).toLocaleString("fr-FR")}
         </p>
         <table>
           <thead><tr><th>Indicateur</th><th>Valeur</th></tr></thead>
           <tbody>
             <tr><td>Consultations</td><td>${data.indicateurs.consultations}</td></tr>
             <tr><td>Examens réalisés</td><td>${data.indicateurs.examensRealises}</td></tr>
             <tr><td>Comptes rendus validés</td><td>${data.indicateurs.comptesRendusValides}</td></tr>
             <tr><td>Taux de validation</td><td>${data.indicateurs.tauxValidation} %</td></tr>
             <tr><td>Consultations urgentes</td><td>${data.indicateurs.urgences}</td></tr>
           </tbody>
         </table>`
      );
    } catch (generateError) {
      setToast(generateError instanceof Error ? generateError.message : "La génération a échoué.");
    }
  };

  const kpis = [
    {
      label: "Examens réalisés",
      value: stats ? String(stats.indicateurs.examensRealises) : "—",
      icon: "clinical_notes",
      iconBg: "bg-secondary-container/15",
      iconColor: "text-secondary",
    },
    {
      label: "Comptes-rendus validés",
      value: stats ? String(stats.indicateurs.tauxValidation) : "—",
      suffix: "%",
      icon: "fact_check",
      iconBg: "bg-green-100",
      iconColor: "text-green-700",
      note: stats ? `${stats.indicateurs.comptesRendusValides} compte(s) rendu(s) signé(s)` : undefined,
    },
    {
      label: "Consultations",
      value: stats ? String(stats.indicateurs.consultations) : "—",
      note: stats ? `dont ${stats.indicateurs.urgences} urgente(s)` : undefined,
      icon: "bedtime",
      iconBg: "bg-secondary-fixed",
      iconColor: "text-secondary",
    },
  ];

  return (
    <>
      <TopBar
        title="Rapports & Statistiques"
        searchPlaceholder="Rechercher un rapport..."
        doctorName="Dr. Morel"
        doctorRole="Spécialiste Sommeil"
      />

      <div className="p-container-padding space-y-section-gap">
        {/* Header & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary mb-1">
              Rapports &amp; Statistiques
            </h2>
            <p className="text-on-surface-variant font-body-md">
              Analyse de l&apos;activité clinique et des indicateurs de diagnostic du sommeil.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-surface-container-lowest border border-outline-variant p-1 rounded-lg flex items-center">
              {PERIODS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPeriod(item.key)}
                  className={`px-4 py-1.5 rounded-md font-label-md text-label-md transition-colors ${
                    period === item.key
                      ? "text-secondary font-semibold bg-secondary-container"
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <ActionButton
              permission="stats:generate"
              onClick={generateReport}
              disabled={!stats}
              className="action-primary px-4 py-2 rounded-lg text-label-md font-label-md flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">summarize</span>
              Générer un rapport
            </ActionButton>
            <ActionButton
              permission="stats:export"
              onClick={exportCsv}
              disabled={!stats}
              pending={isExporting}
              pendingLabel="Export en cours…"
              className="action-secondary px-4 py-2 rounded-lg text-label-md font-label-md flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Exporter
            </ActionButton>
          </div>
        </div>

        {isError && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-800">
              Les statistiques n&apos;ont pas pu être chargées :{" "}
              {error instanceof Error ? error.message : "erreur inconnue"}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white border border-outline-variant p-6 rounded-[28px] shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${kpi.iconBg} ${kpi.iconColor} inline-flex`}>
                  <span className="material-symbols-outlined icon-xl">{kpi.icon}</span>
                </div>
              </div>
              <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-[0.16em] mb-3">
                {kpi.label}
              </p>
              <h4 className="font-display-lg text-display-lg text-primary">
                {isLoading ? "…" : kpi.value}
                {kpi.suffix && !isLoading && (
                  <span className="text-headline-sm font-headline-sm text-on-surface-variant"> {kpi.suffix}</span>
                )}
              </h4>
              {kpi.note && <p className="mt-3 text-label-sm text-on-surface-variant">{kpi.note}</p>}
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-12 lg:col-span-7 bg-white border border-outline-variant rounded-[32px] p-6 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-2">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary">Volume d&apos;activité</h3>
                <p className="text-label-sm text-on-surface-variant">
                  Répartition sur la période · {periodLabel}
                  {isFetching && " · actualisation…"}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <BarChart
                data={(stats?.volumeExamens ?? []).map((item) => ({
                  label: item.label,
                  values: { precedent: item.precedent, courant: item.courant },
                }))}
                series={examVolumeSeries}
                height={220}
              />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 bg-white border border-outline-variant rounded-[32px] p-6 shadow-sm">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-1">
              Répartition par type de visite
            </h3>
            <p className="text-label-sm text-on-surface-variant mb-6">
              Sur {stats?.indicateurs.consultations ?? 0} consultations · {periodLabel}
            </p>
            {stats && stats.typesExamens.length > 0 ? (
              <DonutChart
                data={withColors(stats.typesExamens, SLICE_COLORS)}
                centerValue={String(stats.indicateurs.consultations)}
                centerLabel="consultations"
              />
            ) : (
              <p className="py-10 text-center text-sm text-on-surface-variant">
                Aucune donnée sur cette période.
              </p>
            )}
          </div>

          <div className="col-span-12 lg:col-span-5 bg-white border border-outline-variant rounded-[32px] p-6 shadow-sm">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-1">Niveau de priorité</h3>
            <p className="text-label-sm text-on-surface-variant mb-6">
              Urgences et consultations programmées · {periodLabel}
            </p>
            {stats && stats.severite.length > 0 ? (
              <DonutChart
                data={withColors(stats.severite, SEVERITY_COLORS)}
                centerValue={String(stats.indicateurs.urgences)}
                centerLabel="urgences"
              />
            ) : (
              <p className="py-10 text-center text-sm text-on-surface-variant">
                Aucune donnée sur cette période.
              </p>
            )}
          </div>

          <div className="col-span-12 lg:col-span-7 bg-white border border-outline-variant rounded-[32px] p-6 shadow-sm">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-1">
              Taux d&apos;occupation par salle
            </h3>
            <p className="text-label-sm text-on-surface-variant mb-6">
              Examens de polysomnographie · {periodLabel}
            </p>
            {stats && stats.occupationSalles.length > 0 ? (
              <div className="space-y-5">
                {stats.occupationSalles.map((room) => (
                  <div key={room.label}>
                    <div className="flex items-center justify-between mb-2 text-body-sm">
                      <span className="text-on-surface font-medium">{room.label}</span>
                      <span className="font-data-mono text-on-surface-variant">{room.percent}%</span>
                    </div>
                    <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full" style={{ width: `${room.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-on-surface-variant">
                Aucune salle renseignée sur les examens de la période.
              </p>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}
