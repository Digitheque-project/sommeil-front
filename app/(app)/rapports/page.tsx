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
      borderColor: "border-[#2563EB]",
    },
    {
      label: "Comptes-rendus validés",
      value: stats ? String(stats.indicateurs.tauxValidation) : "—",
      suffix: "%",
      borderColor: "border-[#15803D]",
      note: stats ? `${stats.indicateurs.comptesRendusValides} compte(s) rendu(s) signé(s)` : undefined,
    },
    {
      label: "Consultations",
      value: stats ? String(stats.indicateurs.consultations) : "—",
      borderColor: "border-[#2563EB]",
      note: stats ? { count: stats.indicateurs.urgences, suffix: "urgente(s)" } : undefined,
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

      <div className="page-content p-8 bg-[#F7FBFD] min-h-[calc(100vh-84px)]">
        <div className="max-w-[1500px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h2 className="text-[42px] font-extrabold text-[#0B1F33] leading-none">
                Rapports &amp; Statistiques
              </h2>
              <p className="text-[#64748B] font-semibold mt-2">
                Analyse de l&apos;activité clinique et des indicateurs de diagnostic du sommeil.
              </p>
            </div>
            <div className="flex gap-3">
              <ActionButton
                permission="stats:export"
                onClick={exportCsv}
                disabled={!stats}
                pending={isExporting}
                pendingLabel="Export en cours…"
                className="flex items-center gap-2 rounded-xl bg-[#EEF3F7] px-5 py-2.5 text-sm font-bold text-[#1E293B] hover:bg-[#E2E8F0] transition"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
                Exporter
              </ActionButton>
              <ActionButton
                permission="stats:generate"
                onClick={generateReport}
                disabled={!stats}
                className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1E3A8A] transition"
              >
                <span className="material-symbols-outlined text-[20px]">summarize</span>
                Générer un rapport
              </ActionButton>
            </div>
          </div>

          {/* Period filter bar */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm flex flex-wrap items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Période</span>
            <div className="inline-flex bg-[#F1F5F9] rounded-xl p-1">
              {PERIODS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPeriod(item.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                    period === item.key
                      ? "bg-[#2563EB] text-white shadow-sm"
                      : "text-[#475569] hover:bg-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {isFetching && (
              <span className="text-xs font-semibold text-[#64748B]">Actualisation…</span>
            )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className={`bg-white rounded-2xl p-6 border-l-4 shadow-sm ${kpi.borderColor}`}
              >
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#64748B]">
                  {kpi.label}
                </p>
                <h4 className="text-5xl font-black text-[#0F172A] mt-3">
                  {isLoading ? "…" : kpi.value}
                  {kpi.suffix && !isLoading && (
                    <span className="text-2xl font-bold text-[#64748B] ml-1">{kpi.suffix}</span>
                  )}
                </h4>
                {kpi.note && typeof kpi.note === "string" && (
                  <p className="text-xs text-[#64748B] mt-2">{kpi.note}</p>
                )}
                {kpi.note && typeof kpi.note === "object" && (
                  <p className="text-xs text-[#64748B] mt-2">
                    dont <span className="font-bold text-[#DC2626]">{kpi.note.count}</span>{" "}
                    {kpi.note.suffix}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div>
                  <h3 className="text-[22px] font-extrabold text-[#0F172A]">Volume d&apos;activité</h3>
                  <p className="text-sm text-[#64748B] font-semibold">
                    Répartition sur la période · {periodLabel}
                  </p>
                </div>
              </div>
              <BarChart
                data={(stats?.volumeExamens ?? []).map((item) => ({
                  label: item.label,
                  values: { precedent: item.precedent, courant: item.courant },
                }))}
                series={examVolumeSeries}
                height={220}
              />
            </div>

            <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-[#0F172A] mb-1">
                Répartition par type de visite
              </h3>
              <p className="text-sm text-[#64748B] font-semibold mb-6">
                Sur {stats?.indicateurs.consultations ?? 0} consultations · {periodLabel}
              </p>
              {stats && stats.typesExamens.length > 0 ? (
                <DonutChart
                  data={withColors(stats.typesExamens, SLICE_COLORS)}
                  centerValue={String(stats.indicateurs.consultations)}
                  centerLabel="consultations"
                />
              ) : (
                <p className="py-10 text-center text-sm text-[#64748B]">
                  Aucune donnée sur cette période.
                </p>
              )}
            </div>

            <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-[#0F172A] mb-1">Niveau de priorité</h3>
              <p className="text-sm text-[#64748B] font-semibold mb-6">
                Urgences et consultations programmées · {periodLabel}
              </p>
              {stats && stats.severite.length > 0 ? (
                <DonutChart
                  data={withColors(stats.severite, SEVERITY_COLORS)}
                  centerValue={String(stats.indicateurs.urgences)}
                  centerLabel="urgences"
                />
              ) : (
                <p className="py-10 text-center text-sm text-[#64748B]">
                  Aucune donnée sur cette période.
                </p>
              )}
            </div>

            <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-[#0F172A] mb-1">
                Taux d&apos;occupation par salle
              </h3>
              <p className="text-sm text-[#64748B] font-semibold mb-6">
                Examens de polysomnographie · {periodLabel}
              </p>
              {stats && stats.occupationSalles.length > 0 ? (
                <div className="space-y-5">
                  {stats.occupationSalles.map((room) => (
                    <div key={room.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-[#0F172A]">{room.label}</span>
                        <span className="text-sm font-bold text-[#0F172A]">{room.percent}%</span>
                      </div>
                      <div className="h-2.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2563EB] rounded-full"
                          style={{ width: `${room.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-[#64748B]">
                  Aucune salle renseignée sur les examens de la période.
                </p>
              )}
            </div>
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
