"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import BarChart from "@/components/charts/BarChart";
import DonutChart from "@/components/charts/DonutChart";

const periods = ["7 jours", "30 jours", "Année"] as const;
type Period = (typeof periods)[number];

const kpis = [
  {
    label: "Examens réalisés",
    value: "214",
    delta: "+9%",
    icon: "clinical_notes",
    iconBg: "bg-secondary-container/15",
    iconColor: "text-secondary",
  },
  {
    label: "IAH moyen",
    value: "24.6",
    suffix: "/h",
    note: "Sévérité modérée",
    icon: "monitor_heart",
    iconBg: "bg-tertiary-fixed",
    iconColor: "text-primary",
  },
  {
    label: "Comptes-rendus validés",
    value: "96",
    suffix: "%",
    delta: "+3%",
    icon: "fact_check",
    iconBg: "bg-green-100",
    iconColor: "text-green-700",
  },
  {
    label: "Sommeil analysé (moy.)",
    value: "6h 42m",
    note: "par patient",
    icon: "bedtime",
    iconBg: "bg-secondary-fixed",
    iconColor: "text-secondary",
  },
];

const examVolume = [
  { label: "S1", values: { precedent: 32, courant: 38 } },
  { label: "S2", values: { precedent: 28, courant: 41 } },
  { label: "S3", values: { precedent: 35, courant: 29 } },
  { label: "S4", values: { precedent: 30, courant: 44 } },
  { label: "S5", values: { precedent: 33, courant: 52 } },
];

const examVolumeSeries = [
  { key: "precedent", label: "Période précédente", color: "#cbd5e1" },
  { key: "courant", label: "Période actuelle", color: "#2563eb" },
];

const examTypes = [
  { label: "Polysomnographie complète", value: 48, color: "#1e3a8a" },
  { label: "Polygraphie ventilatoire", value: 27, color: "#2563eb" },
  { label: "Actimétrie", value: 16, color: "#7fa6ff" },
  { label: "Test de Latence (TILE)", value: 9, color: "#bfdbfe" },
];

const severity = [
  { label: "Normal (IAH < 5)", value: 22, color: "#22c55e" },
  { label: "Léger (5-15)", value: 34, color: "#eab308" },
  { label: "Modéré (15-30)", value: 28, color: "#f97316" },
  { label: "Sévère (> 30)", value: 16, color: "#ef5350" },
];

const roomOccupancy = [
  { label: "Salle A-01", percent: 92 },
  { label: "Salle B-04", percent: 78 },
  { label: "Salle C-02", percent: 65 },
  { label: "Salle D-03 (Vidéo-EEG)", percent: 40 },
];

export default function RapportsPage() {
  const [period, setPeriod] = useState<Period>("30 jours");

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
              Analyse de l&apos;activité clinique et des indicateurs de
              diagnostic du sommeil.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-surface-container-lowest border border-outline-variant p-1 rounded-lg flex items-center">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-md font-label-md text-label-md transition-colors ${
                    period === p
                      ? "text-secondary font-semibold bg-secondary-container"
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button className="bg-secondary text-on-secondary px-4 py-2 rounded-lg text-label-md font-label-md flex items-center gap-2 shadow-sm hover:brightness-110 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[20px]">
                download
              </span>
              Exporter
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white border border-outline-variant p-6 rounded-[28px] shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-2xl ${kpi.iconBg} ${kpi.iconColor} inline-flex`}
                >
                  <span className="material-symbols-outlined icon-xl">
                    {kpi.icon}
                  </span>
                </div>
                {kpi.delta && (
                  <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {kpi.delta}
                  </span>
                )}
              </div>
              <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-[0.16em] mb-3">
                {kpi.label}
              </p>
              <h4 className="font-display-lg text-display-lg text-primary">
                {kpi.value}
                {kpi.suffix && (
                  <span className="text-headline-sm font-headline-sm text-on-surface-variant">
                    {" "}
                    {kpi.suffix}
                  </span>
                )}
              </h4>
              {kpi.note && (
                <p className="mt-3 text-label-sm text-on-surface-variant">
                  {kpi.note}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-12 gap-gutter">
          {/* Bar Chart: Exam Volume */}
          <div className="col-span-12 lg:col-span-7 bg-white border border-outline-variant rounded-[32px] p-6 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-2">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary">
                  Volume d&apos;Examens
                </h3>
                <p className="text-label-sm text-on-surface-variant">
                  Répartition hebdomadaire · {period}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <BarChart data={examVolume} series={examVolumeSeries} height={220} />
            </div>
          </div>

          {/* Donut: Exam Types */}
          <div className="col-span-12 lg:col-span-5 bg-white border border-outline-variant rounded-[32px] p-6 shadow-sm">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-1">
              Répartition par Type d&apos;Examen
            </h3>
            <p className="text-label-sm text-on-surface-variant mb-6">
              Sur {kpis[0].value} examens · {period}
            </p>
            <DonutChart
              data={examTypes}
              centerValue={kpis[0].value}
              centerLabel="examens"
            />
          </div>

          {/* Donut: Severity */}
          <div className="col-span-12 lg:col-span-5 bg-white border border-outline-variant rounded-[32px] p-6 shadow-sm">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-1">
              Sévérité des Diagnostics
            </h3>
            <p className="text-label-sm text-on-surface-variant mb-6">
              Indice d&apos;Apnées-Hypopnées (IAH) · {period}
            </p>
            <DonutChart data={severity} centerValue="24.6/h" centerLabel="IAH moyen" />
          </div>

          {/* Room Occupancy */}
          <div className="col-span-12 lg:col-span-7 bg-white border border-outline-variant rounded-[32px] p-6 shadow-sm">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-1">
              Taux d&apos;Occupation par Salle
            </h3>
            <p className="text-label-sm text-on-surface-variant mb-6">
              Moyenne sur la période sélectionnée · {period}
            </p>
            <div className="space-y-5">
              {roomOccupancy.map((room) => (
                <div key={room.label}>
                  <div className="flex items-center justify-between mb-2 text-body-sm">
                    <span className="text-on-surface font-medium">
                      {room.label}
                    </span>
                    <span className="font-data-mono text-on-surface-variant">
                      {room.percent}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full"
                      style={{ width: `${room.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
