"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import ActionButton from "@/components/ActionButton";
import { useDeletePsg, usePsgExams, useStartPsg, useStopPsg, useUpdatePsg } from "@/hooks/use-psg";
import { psgApi, type PsgExam } from "@/lib/api/psg";
import { downloadJson } from "@/lib/download";
import { cn } from "@/lib/utils";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const dateKey = (value: string) => new Date(value).toISOString().slice(0, 10);

const getInitials = (item: PsgExam) => {
  const parts = `${item.patientPrenom} ${item.patientNom}`.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").slice(0, 2).join("");
};

const STATUS_STYLES: Record<PsgExam["statut"], { label: string; className: string }> = {
  PLANIFIE: { label: "Planifié", className: "bg-secondary-container text-on-secondary-container" },
  EN_COURS: { label: "Enregistrement en cours", className: "bg-amber-100 text-amber-800" },
  TERMINE: { label: "Terminé", className: "bg-green-100 text-green-800" },
};

export default function PolysomnographiePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [startTarget, setStartTarget] = useState<PsgExam | null>(null);
  const [room, setRoom] = useState("");
  const [editTarget, setEditTarget] = useState<PsgExam | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editRoom, setEditRoom] = useState("");

  const { data: exams = [], isLoading } = usePsgExams();
  const startMutation = useStartPsg();
  const stopMutation = useStopPsg();
  const updateMutation = useUpdatePsg();
  const deleteMutation = useDeletePsg();

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filtered = useMemo(() => {
    const list = [...exams].sort((a, b) => a.rdvDate.localeCompare(b.rdvDate));
    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;
    return list.filter((item) =>
      [item.patientNom, item.patientPrenom, item.patientId, item.motif, item.salle ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [exams, searchQuery]);

  const today = new Date().toISOString().slice(0, 10);
  const stats = [
    { label: "RDV planifiés", value: exams.length, icon: "event_available", valueColor: "text-primary" },
    {
      label: "Aujourd'hui",
      value: exams.filter((item) => dateKey(item.rdvDate) === today).length,
      icon: "today",
      valueColor: "text-secondary",
    },
    {
      label: "En cours",
      value: exams.filter((item) => item.statut === "EN_COURS").length,
      icon: "sensors",
      valueColor: "text-amber-600",
    },
    {
      label: "Terminés",
      value: exams.filter((item) => item.statut === "TERMINE").length,
      icon: "task_alt",
      valueColor: "text-green-700",
    },
  ];

  /** `psg:start` — lance l'acquisition, salle facultative. */
  const confirmStart = async () => {
    if (!startTarget) return;
    try {
      await startMutation.mutateAsync({ id: startTarget.id, salle: room.trim() || undefined });
      setToast(`Enregistrement démarré pour ${startTarget.patientPrenom} ${startTarget.patientNom}.`);
      setStartTarget(null);
      setRoom("");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Le démarrage a échoué.");
    }
  };

  /** `psg:stop` — clôt l'acquisition. */
  const stop = async (exam: PsgExam) => {
    try {
      await stopMutation.mutateAsync(exam.id);
      setToast("Enregistrement terminé.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "L'arrêt a échoué.");
    }
  };

  /** `psg:export_data` — extraction des données de la séance. */
  const exportData = async (exam: PsgExam) => {
    try {
      const data = await psgApi.exportData(exam.id);
      downloadJson(data, `psg-${exam.patientNom || exam.patientId}-${dateKey(exam.rdvDate)}.json`);
      setToast("Données de l'examen exportées.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "L'export a échoué.");
    }
  };

  const openEdit = (exam: PsgExam) => {
    setEditTarget(exam);
    setEditDate(dateKey(exam.rdvDate));
    setEditTime(exam.rdvHeure ?? "");
    setEditRoom(exam.salle ?? "");
  };

  /** `psg:update` — replanifie le rendez-vous et réassigne la salle. */
  const submitEdit = async () => {
    if (!editTarget || !editDate) return;
    try {
      await updateMutation.mutateAsync({
        id: editTarget.id,
        rdvDate: editDate,
        rdvHeure: editTime || undefined,
        salle: editRoom.trim(),
      });
      setToast("Rendez-vous mis à jour.");
      setEditTarget(null);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "La mise à jour a échoué.");
    }
  };

  /** `psg:delete` — retire l'examen du planning. */
  const remove = async (exam: PsgExam) => {
    if (!window.confirm(`Supprimer l'examen de ${exam.patientPrenom} ${exam.patientNom} ?`)) return;
    try {
      await deleteMutation.mutateAsync(exam.id);
      setToast("Examen supprimé.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "La suppression a échoué.");
    }
  };

  return (
    <>
      <TopBar
        title="Polysomnographie"
        searchPlaceholder="Rechercher un patient planifié..."
        doctorName="Dr. Laurent Morel"
        doctorRole="Spécialiste Sommeil"
      />

      <div className="p-6 md:p-8 flex flex-col min-h-[calc(100vh-5rem)] max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="font-display-lg text-display-lg text-primary mb-1">
              Examens de polysomnographie
            </h2>
            <p className="text-on-surface-variant font-body-md">
              Les patients apparaissent ici dès qu&apos;une prescription de polysomnographie reçue a
              été planifiée depuis le menu Prescription.
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-8">
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
                placeholder="Rechercher par nom, ID patient, salle ou indication..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent outline-none font-body-sm text-body-sm transition-all"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="px-6 py-14 text-center text-on-surface-variant">Chargement des examens...</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/60">night_shelter</span>
                </div>
                <p className="font-semibold text-on-surface">Aucun examen de polysomnographie</p>
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
              {filtered.map((item) => {
                const status = STATUS_STYLES[item.statut] ?? STATUS_STYLES.PLANIFIE;
                return (
                  <li key={item.id} className="flex flex-col gap-4 px-6 py-5 hover:bg-tertiary-fixed transition-colors xl:flex-row xl:items-center">
                    <div className="flex items-center gap-3 xl:w-[260px] shrink-0">
                      <div className={cn(
                        "w-11 h-11 rounded-full flex items-center justify-center font-bold shrink-0",
                        item.urgence ? "bg-error-container text-error" : "bg-secondary-fixed text-secondary"
                      )}>
                        {getInitials(item)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-primary truncate">{item.patientPrenom} {item.patientNom}</p>
                        <p className="text-xs font-data-mono text-on-surface-variant truncate">{item.patientId}</p>
                      </div>
                    </div>

                    <div className="flex flex-1 min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-on-surface">
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <span className="material-symbols-outlined text-[18px] text-secondary">event</span>
                          {formatDate(item.rdvDate)}
                          {item.rdvHeure && <span className="text-on-surface-variant">· {item.rdvHeure}</span>}
                        </span>
                        {item.salle && (
                          <span className="flex items-center gap-1 text-xs text-on-surface-variant whitespace-nowrap">
                            <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                            {item.salle}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-on-surface-variant truncate">{item.motif}</p>
                    </div>

                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0",
                      status.className
                    )}>
                      {status.label}
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {item.statut === "EN_COURS" ? (
                        <ActionButton
                          permission="psg:stop"
                          onClick={() => stop(item)}
                          pending={stopMutation.isPending}
                          className="action-danger flex items-center gap-1.5 rounded-lg px-3 py-2 text-label-md font-label-md"
                        >
                          <span className="material-symbols-outlined text-[18px]">stop_circle</span>
                          Arrêter
                        </ActionButton>
                      ) : (
                        <ActionButton
                          permission="psg:start"
                          onClick={() => { setStartTarget(item); setRoom(item.salle ?? ""); }}
                          disabled={item.statut === "TERMINE"}
                          className="action-success flex items-center gap-1.5 rounded-lg px-3 py-2 text-label-md font-label-md"
                        >
                          <span className="material-symbols-outlined text-[18px]">play_circle</span>
                          Démarrer
                        </ActionButton>
                      )}
                      <ActionButton
                        permission="psg:update"
                        onClick={() => openEdit(item)}
                        disabled={item.statut === "TERMINE"}
                        pending={updateMutation.isPending}
                        title="Replanifier le rendez-vous ou changer de salle"
                        className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                      </ActionButton>
                      <ActionButton
                        permission="psg:export_data"
                        onClick={() => exportData(item)}
                        title="Exporter les données de l'examen"
                        className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container"
                      >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                      </ActionButton>
                      <ActionButton
                        permission="psg:delete"
                        hideWhenDenied
                        onClick={() => remove(item)}
                        pending={deleteMutation.isPending}
                        title="Supprimer l'examen"
                        className="p-2 rounded-lg text-on-surface-variant hover:bg-red-50 hover:text-red-600"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </ActionButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {startTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest border border-outline-variant p-6 shadow-2xl">
            <div className="mb-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Démarrer l&apos;enregistrement
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-primary">
                {startTarget.patientPrenom} {startTarget.patientNom}
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">{startTarget.motif}</p>
            </div>

            <label htmlFor="psg-room" className="block text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
              Salle d&apos;acquisition (facultatif)
            </label>
            <input
              id="psg-room"
              type="text"
              value={room}
              onChange={(event) => setRoom(event.target.value)}
              placeholder="Ex. Salle B-04"
              className="h-11 w-full rounded-2xl border border-outline-variant bg-surface-container px-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStartTarget(null)}
                className="action-secondary rounded-2xl px-4 py-2 text-sm font-bold"
              >
                Annuler
              </button>
              <ActionButton
                permission="psg:start"
                onClick={confirmStart}
                pending={startMutation.isPending}
                pendingLabel="Démarrage…"
                className="action-success rounded-2xl px-4 py-2 text-sm font-bold"
              >
                Démarrer l&apos;acquisition
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest border border-outline-variant p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  Replanifier l&apos;examen
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-primary">
                  {editTarget.patientPrenom} {editTarget.patientNom}
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">{editTarget.motif}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                aria-label="Fermer"
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="psg-edit-date" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  Date du rendez-vous
                </label>
                <input
                  id="psg-edit-date"
                  type="date"
                  value={editDate}
                  onChange={(event) => setEditDate(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-outline-variant bg-surface-container px-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div>
                <label htmlFor="psg-edit-time" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  Heure du rendez-vous
                </label>
                <input
                  id="psg-edit-time"
                  type="time"
                  value={editTime}
                  onChange={(event) => setEditTime(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-outline-variant bg-surface-container px-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div>
                <label htmlFor="psg-edit-room" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  Salle d&apos;examen
                </label>
                <input
                  id="psg-edit-room"
                  type="text"
                  value={editRoom}
                  onChange={(event) => setEditRoom(event.target.value)}
                  placeholder="Ex. Salle B-04"
                  className="h-11 w-full rounded-2xl border border-outline-variant bg-surface-container px-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="action-secondary rounded-2xl px-4 py-2 text-sm font-bold"
              >
                Annuler
              </button>
              <ActionButton
                permission="psg:update"
                onClick={submitEdit}
                disabled={!editDate}
                pending={updateMutation.isPending}
                pendingLabel="Enregistrement…"
                className="action-primary rounded-2xl px-4 py-2 text-sm font-bold"
              >
                Enregistrer
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}
