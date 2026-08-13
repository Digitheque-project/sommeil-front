"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { usePolysomnographies } from "@/hooks/use-prescriptions";
import type { PolysomnographieItem } from "@/lib/api/prescription";
import { cn } from "@/lib/utils";

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getInitials = (item: PolysomnographieItem) => {
  const fullName = `${item.patientPrenom} ${item.patientNom}`.trim();
  const parts = fullName.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").slice(0, 2).join("");
};

export default function PolysomnographiePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: polysomnographies = [], isLoading } = usePolysomnographies();

  // Seuls les patients ayant déjà un rendez-vous de polysomnographie planifié s'affichent ici.
  const scheduled = useMemo(() => {
    const list = polysomnographies
      .filter((item) => item.statut === "PLANIFIE" && item.rdvDate)
      .sort((a, b) => String(a.rdvDate ?? "").localeCompare(String(b.rdvDate ?? "")));

    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;
    return list.filter((item) =>
      [item.patientNom, item.patientPrenom, item.patientId, item.motif]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [polysomnographies, searchQuery]);

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = scheduled.filter((item) => item.rdvDate === today).length;
  const upcomingCount = scheduled.filter((item) => (item.rdvDate ?? "") > today).length;

  const stats = [
    { label: "RDV planifiés", value: scheduled.length, icon: "event_available", valueColor: "text-primary" },
    { label: "Aujourd'hui", value: todayCount, icon: "today", valueColor: "text-secondary" },
    { label: "À venir", value: upcomingCount, icon: "calendar_month", valueColor: "text-secondary" },
  ];

  return (
    <>
      <TopBar
        title="Polysomnographie"
        searchPlaceholder="Rechercher un patient planifié..."
        doctorName="Dr. Laurent Morel"
        doctorRole="Spécialiste Sommeil"
      />

      <div className="p-6 md:p-8 flex flex-col min-h-[calc(100vh-5rem)] max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="font-display-lg text-display-lg text-primary mb-1">
              Patients avec rendez-vous de polysomnographie
            </h2>
            <p className="text-on-surface-variant font-body-md">
              Les patients apparaissent ici dès qu&apos;une prescription de polysomnographie reçue a été
              planifiée depuis le menu Prescription.
            </p>
          </div>
          <Link
            href="/prescription"
            className="bg-secondary text-on-secondary px-4 py-2.5 rounded-lg text-label-md font-label-md flex items-center gap-2 shadow-sm hover:brightness-110 active:scale-95 transition-all self-start lg:self-auto"
          >
            <span className="material-symbols-outlined text-lg">medication</span>
            Prescriptions
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="col-span-1 bg-surface-container-lowest border border-outline-variant p-5 rounded-xl flex flex-col justify-between"
            >
              <span className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-3">
                {stat.label}
              </span>
              <div className="flex items-end justify-between">
                <span className={cn("text-display-lg font-display-lg", stat.valueColor)}>{stat.value}</span>
                <div className="p-2 bg-surface-container rounded-lg">
                  <span className={cn("material-symbols-outlined", stat.valueColor)}>{stat.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6 shadow-sm">
          <div className="p-4 border-b border-outline-variant">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rechercher par nom, ID patient ou indication..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent outline-none font-body-sm text-body-sm transition-all"
              />
            </div>
          </div>

          {/* RDV List */}
          {isLoading ? (
            <div className="px-6 py-14 text-center text-on-surface-variant">Chargement des rendez-vous...</div>
          ) : scheduled.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/60">night_shelter</span>
                </div>
                <p className="font-semibold text-on-surface">Aucun rendez-vous de polysomnographie</p>
                <p className="text-sm text-on-surface-variant max-w-sm">
                  Les patients ayant une prescription de polysomnographie planifiée s&apos;afficheront
                  automatiquement ici.
                </p>
                <Link
                  href="/prescription"
                  className="mt-2 bg-secondary text-on-secondary px-4 py-2.5 rounded-lg text-label-md font-label-md flex items-center gap-2 shadow-sm hover:brightness-110 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Planifier une prescription
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {scheduled.map((item) => (
                <li key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 hover:bg-tertiary-fixed transition-colors">
                  <div className="flex items-center gap-3 sm:w-[280px] shrink-0">
                    <div className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center font-bold shrink-0",
                      item.urgence ? "bg-error-container text-error" : "bg-secondary-fixed text-secondary"
                    )}>
                      {getInitials(item)}
                    </div>
                    <div>
                      <p className="font-semibold text-primary">{item.patientPrenom} {item.patientNom}</p>
                      <p className="text-xs font-data-mono text-on-surface-variant">{item.patientId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-on-surface whitespace-nowrap">
                      <span className="material-symbols-outlined text-[18px] text-secondary">event</span>
                      <span>{formatDate(item.rdvDate ?? "")}</span>
                      {item.rdvHeure && <span className="text-on-surface-variant">· {item.rdvHeure}</span>}
                    </div>
                    <p className="text-sm text-on-surface-variant truncate flex-1 min-w-0">{item.motif}</p>
                  </div>

                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0",
                    (item.rdvDate ?? "") === today
                      ? "bg-secondary-container text-on-secondary-container"
                      : (item.rdvDate ?? "") < today
                        ? "bg-surface-container-high text-on-surface-variant"
                        : "bg-green-100 text-green-800"
                  )}>
                    {(item.rdvDate ?? "") === today
                      ? "Aujourd'hui"
                      : (item.rdvDate ?? "") < today
                        ? "Passé"
                        : "À venir"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
