"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import ActionButton from "@/components/ActionButton";
import { usePolysomnographies, useSchedulePolysomnographie } from "@/hooks/use-prescriptions";
import type { PolysomnographieItem } from "@/lib/api/prescription";
import { cn } from "@/lib/utils";

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(date);
};

const formatReceivedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(date);
};

const getInitials = (item: PolysomnographieItem) => {
  const fullName = `${item.patientPrenom} ${item.patientNom}`.trim();
  const parts = fullName.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").slice(0, 2).join("");
};

export default function PrescriptionPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TOUS" | "EN_ATTENTE" | "PLANIFIE">("TOUS");
  const [scheduleTarget, setScheduleTarget] = useState<PolysomnographieItem | null>(null);
  const [rdvDate, setRdvDate] = useState("");
  const [rdvHeure, setRdvHeure] = useState("");
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const { data: polysomnographies = [], isLoading } = usePolysomnographies();
  const scheduleMutation = useSchedulePolysomnographie();

  const stats = useMemo(() => {
    const total = polysomnographies.length;
    const planned = polysomnographies.filter((p) => p.statut === "PLANIFIE").length;
    const waiting = total - planned;
    const urgent = polysomnographies.filter((p) => p.urgence).length;
    return { total, planned, waiting, urgent };
  }, [polysomnographies]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return polysomnographies.filter((item) => {
      const searchableText = [item.patientNom, item.patientPrenom, item.patientId, item.motif].join(" ").toLowerCase();
      if (query && !searchableText.includes(query)) return false;
      if (statusFilter !== "TOUS" && item.statut !== statusFilter) return false;
      return true;
    });
  }, [polysomnographies, searchQuery, statusFilter]);

  const openSchedule = (item: PolysomnographieItem) => {
    setScheduleError(null);
    setScheduleTarget(item);
    setRdvDate(item.rdvDate ?? "");
    setRdvHeure(item.rdvHeure ?? "20:00");
  };

  const submitSchedule = async () => {
    if (!scheduleTarget || !rdvDate) return;
    try {
      await scheduleMutation.mutateAsync({ id: scheduleTarget.id, rdvDate, rdvHeure: rdvHeure || undefined });
      setScheduleTarget(null);
      setRdvDate("");
      setRdvHeure("");
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : "La planification a échoué. Veuillez réessayer.");
    }
  };

  const statCards = [
    { label: "Total", value: stats.total, icon: "inventory_2", valueColor: "text-primary" },
    { label: "Planifiées", value: stats.planned, icon: "event_available", valueColor: "text-secondary" },
    { label: "En attente", value: stats.waiting, icon: "schedule", valueColor: "text-amber-600" },
    { label: "Urgentes", value: stats.urgent, icon: "priority_high", valueColor: "text-error" },
  ];

  return (
    <>
      <TopBar
        title="Prescriptions"
        searchPlaceholder="Rechercher une prescription..."
        doctorName="Dr. Laurent Morel"
        doctorRole="Spécialiste Sommeil"
      />

      <div className="p-6 md:p-8 flex flex-col min-h-[calc(100vh-5rem)] max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="font-display-lg text-display-lg text-primary mb-1">
              Prescriptions de polysomnographie
            </h2>
            <p className="text-on-surface-variant font-body-md">
              Prescriptions de polysomnographie reçues des services externes — planifiez le
              rendez-vous du patient, il apparaîtra automatiquement dans la page Polysomnographie.
            </p>
          </div>
          <Link
            href="/polysomnographie"
            className="bg-secondary text-on-secondary px-4 py-2.5 rounded-lg text-label-md font-label-md flex items-center gap-2 shadow-sm hover:brightness-110 active:scale-95 transition-all self-start lg:self-auto"
          >
            <span className="material-symbols-outlined text-lg">night_shelter</span>
            Voir les RDV planifiés
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-8">
          {statCards.map((stat) => (
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

        {/* Filters */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6 shadow-sm">
          <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">filter_list</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className="px-3 py-2.5 bg-surface-container border border-outline-variant rounded-lg text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                <option value="TOUS">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="PLANIFIE">Planifiées</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-tertiary-fixed border-b border-outline-variant">
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface uppercase tracking-wider">Indication</th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface uppercase tracking-wider">Reçue le</th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center text-on-surface-variant">
                      Chargement des prescriptions...
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">inventory_2</span>
                        <p className="font-semibold text-on-surface">Aucune prescription trouvée</p>
                        <p className="text-sm text-on-surface-variant">Aucune prescription de polysomnographie reçue pour le moment.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered.map((item) => {
                  const isPlanned = item.statut === "PLANIFIE";
                  return (
                    <tr key={item.id} className="hover:bg-tertiary-fixed transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0",
                            item.urgence ? "bg-error-container text-error" : "bg-secondary-fixed text-secondary"
                          )}>
                            {getInitials(item)}
                          </div>
                          <div>
                            <div className="font-semibold text-primary">
                              {item.patientPrenom} {item.patientNom}
                            </div>
                            <div className="text-xs font-data-mono text-on-surface-variant">{item.patientId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[320px]">
                        <p className="text-on-surface line-clamp-2">{item.motif}</p>
                        {item.urgence && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-error">
                            <span className="material-symbols-outlined text-[14px]">priority_high</span>
                            Urgent
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isPlanned ? (
                          <span className="px-2.5 py-1 bg-green-100 text-green-800 text-[11px] font-bold rounded-full uppercase">
                            RDV planifié
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full uppercase">
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-data-mono text-on-surface-variant text-sm">
                        {formatReceivedAt(item.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isPlanned ? (
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-sm text-on-surface-variant">
                              {formatDate(item.rdvDate ?? "")}
                              {item.rdvHeure ? ` · ${item.rdvHeure}` : ""}
                            </span>
                            <ActionButton
                              permission="psg:update"
                              onClick={() => openSchedule(item)}
                              className="action-warning px-3 py-2 rounded-lg text-label-md font-label-md flex items-center gap-1.5"
                              title="Modifier le rendez-vous"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                              Modifier
                            </ActionButton>
                          </div>
                        ) : (
                          <ActionButton
                            permission="psg:create"
                            onClick={() => openSchedule(item)}
                            className="action-primary px-4 py-2.5 rounded-lg text-label-md font-label-md flex items-center gap-1.5 shadow-sm ml-auto"
                          >
                            <span className="material-symbols-outlined text-[18px]">event</span>
                            Planifier
                          </ActionButton>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {scheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest border border-outline-variant p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  Planifier un rendez-vous
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-primary">
                  {scheduleTarget.patientPrenom} {scheduleTarget.patientNom}
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">{scheduleTarget.motif}</p>
              </div>
              <button
                type="button"
                onClick={() => setScheduleTarget(null)}
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
                aria-label="Fermer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {scheduleError && (
                <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {scheduleError}
                </p>
              )}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                  Date du rendez-vous
                </label>
                <input
                  type="date"
                  value={rdvDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => setRdvDate(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-outline-variant bg-surface-container px-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
                  Heure du rendez-vous
                </label>
                <input
                  type="time"
                  value={rdvHeure}
                  onChange={(event) => setRdvHeure(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-outline-variant bg-surface-container px-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setScheduleTarget(null)}
                className="action-secondary rounded-2xl px-4 py-2 text-sm font-bold"
              >
                Annuler
              </button>
              <ActionButton
                permission={scheduleTarget.statut === "PLANIFIE" ? "psg:update" : "psg:create"}
                disabled={!rdvDate}
                pending={scheduleMutation.isPending}
                pendingLabel="Planification..."
                onClick={submitSchedule}
                className="action-primary rounded-2xl px-4 py-2 text-sm font-bold"
              >
                Confirmer le rendez-vous
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
