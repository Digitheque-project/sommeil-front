"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

/** Nom affichable du patient. L'identifiant ne sert que de repli quand le
 * service accueil n'a pas pu fournir l'identité : un UUID n'apprend rien au
 * praticien, il ne doit jamais s'afficher à la place d'un nom disponible. */
const patientLabel = (item: PolysomnographieItem) =>
  `${item.patientPrenom} ${item.patientNom}`.trim() || item.patientId;

const getInitials = (item: PolysomnographieItem) => {
  const fullName = `${item.patientPrenom} ${item.patientNom}`.trim();
  const parts = fullName.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").slice(0, 2).join("");
};

/**
 * `useSearchParams` bascule l'arbre client jusqu'à la frontière `Suspense` la
 * plus proche : sans cette limite, le prérendu de la route échoue.
 */
export default function PrescriptionPage() {
  return (
    <Suspense fallback={<TopBar title="Prescriptions" />}>
      <PrescriptionPageContent />
    </Suspense>
  );
}

function PrescriptionPageContent() {
  const searchParams = useSearchParams();
  // Identifiant de prescription transmis par une notification (cf.
  // lib/notification-routing.ts) : la ligne correspondante est mise en avant
  // et sa planification ouverte directement.
  const focusId = searchParams.get("focus");

  const [searchQuery, setSearchQuery] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<PolysomnographieItem | null>(null);
  const [rdvDate, setRdvDate] = useState("");
  const [rdvHeure, setRdvHeure] = useState("");
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const { data: polysomnographies = [], isLoading } = usePolysomnographies();
  const scheduleMutation = useSchedulePolysomnographie();

  const focusedItem = useMemo(
    () => (focusId ? polysomnographies.find((item) => item.id === focusId) ?? null : null),
    [focusId, polysomnographies]
  );

  const stats = useMemo(() => {
    const total = polysomnographies.length;
    const planned = polysomnographies.filter((p) => p.statut === "PLANIFIE").length;
    const waiting = total - planned;
    const urgent = polysomnographies.filter((p) => p.urgence).length;
    return { total, planned, waiting, urgent };
  }, [polysomnographies]);

  // Une prescription planifiée quitte cette page : elle devient un examen et
  // se gère depuis la page Polysomnographie. Ne restent ici que les
  // prescriptions reçues qui attendent encore un rendez-vous.
  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return polysomnographies.filter((item) => {
      if (item.statut === "PLANIFIE") return false;
      const searchableText = [item.patientNom, item.patientPrenom, item.patientId, item.motif].join(" ").toLowerCase();
      if (query && !searchableText.includes(query)) return false;
      if (urgentOnly && !item.urgence) return false;
      return true;
    });
  }, [polysomnographies, searchQuery, urgentOnly]);

  const openSchedule = (item: PolysomnographieItem) => {
    setScheduleError(null);
    setScheduleTarget(item);
    setRdvDate(item.rdvDate ?? "");
    setRdvHeure(item.rdvHeure ?? "20:00");
  };

  // Ouverture automatique une seule fois : rouvrir la fenêtre après une
  // annulation de l'utilisateur serait un piège.
  const autoOpenedFocusRef = useRef<string | null>(null);
  useEffect(() => {
    if (!focusedItem || focusedItem.statut === "PLANIFIE") return;
    if (autoOpenedFocusRef.current === focusedItem.id) return;
    autoOpenedFocusRef.current = focusedItem.id;
    openSchedule(focusedItem);
  }, [focusedItem]);

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
      <TopBar title="Prescriptions" searchPlaceholder="Rechercher une prescription..." />

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

        {/* Notification ouverte sur une prescription : dire où elle en est.
            Sans ce repère, un clic sur une notification déjà traitée
            aboutissait à une liste où la ligne attendue avait disparu. */}
        {focusId && !isLoading && !focusedItem && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <span className="material-symbols-outlined text-amber-700">info</span>
            <p className="flex-1 text-sm font-semibold text-amber-900">
              La prescription signalée par la notification n&apos;est plus dans la liste du service
              (traitée, annulée ou adressée à un autre service).
            </p>
          </div>
        )}
        {focusedItem?.statut === "PLANIFIE" && (
          <Link
            href={`/polysomnographie?focus=${encodeURIComponent(focusedItem.id)}`}
            className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4 transition-colors hover:bg-green-100"
          >
            <span className="material-symbols-outlined text-green-700">event_available</span>
            <p className="flex-1 text-sm font-semibold text-green-900">
              La prescription de {focusedItem.patientPrenom} {focusedItem.patientNom} est déjà
              planifiée — ouvrir l&apos;examen dans la page Polysomnographie.
            </p>
            <span className="material-symbols-outlined text-green-700">arrow_forward</span>
          </Link>
        )}

        {stats.planned > 0 && (
          <Link
            href="/polysomnographie"
            className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4 transition-colors hover:bg-green-100"
          >
            <span className="material-symbols-outlined text-green-700">event_available</span>
            <p className="flex-1 text-sm font-semibold text-green-900">
              {stats.planned} examen{stats.planned > 1 ? "s" : ""} déjà planifié
              {stats.planned > 1 ? "s" : ""} — {stats.planned > 1 ? "ils ont quitté" : "il a quitté"} cette
              liste et se {stats.planned > 1 ? "gèrent" : "gère"} désormais depuis la page Polysomnographie.
            </p>
            <span className="material-symbols-outlined text-green-700">arrow_forward</span>
          </Link>
        )}

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
            <label className="flex items-center gap-2 text-sm font-semibold text-on-surface whitespace-nowrap">
              <input
                type="checkbox"
                checked={urgentOnly}
                onChange={(event) => setUrgentOnly(event.target.checked)}
                className="h-4 w-4 accent-[#2563EB]"
              />
              Urgentes uniquement
            </label>
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
                        <p className="font-semibold text-on-surface">Aucune prescription à planifier</p>
                        <p className="text-sm text-on-surface-variant">
                          {stats.planned > 0
                            ? "Toutes les prescriptions reçues ont été planifiées : retrouvez-les dans la page Polysomnographie."
                            : "Aucune prescription de polysomnographie reçue pour le moment."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered.map((item) => {
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "hover:bg-tertiary-fixed transition-colors group",
                        item.id === focusId && "bg-secondary-fixed/40 ring-2 ring-inset ring-secondary"
                      )}
                    >
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
                              {patientLabel(item)}
                            </div>
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
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full uppercase">
                          À planifier
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-data-mono text-on-surface-variant text-sm">
                        {formatReceivedAt(item.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <ActionButton
                          permission="psg:create"
                          onClick={() => openSchedule(item)}
                          className="action-primary px-4 py-2.5 rounded-lg text-label-md font-label-md flex items-center gap-1.5 shadow-sm ml-auto"
                        >
                          <span className="material-symbols-outlined text-[18px]">event</span>
                          Planifier
                        </ActionButton>
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
