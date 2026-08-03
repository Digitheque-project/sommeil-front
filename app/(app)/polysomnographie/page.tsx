"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";

const statusStyles = {
  planned: "bg-surface-container text-on-surface-variant",
  started: "bg-primary/10 text-primary",
  stopped: "bg-green-100 text-green-700",
};

const statusLabels = {
  planned: "À planifier",
  started: "En cours",
  stopped: "Arrêté",
};

type PrescriptionItem = {
  id: number;
  label: string;
  detail: string;
  status: "planned" | "started" | "stopped";
  scheduledAt?: string;
  scheduledDraft?: string;
  isScheduling?: boolean;
  interpretation?: string;
  interpretationDraft?: string;
};

const initialPrescriptions: PrescriptionItem[] = [
  { id: 1, label: "Prescription CPAP", detail: "Pression 8 cmH2O", status: "planned" },
  { id: 2, label: "Prescription O2", detail: "1 L/min", status: "planned" },
  { id: 3, label: "Prescription EEG", detail: "Suivi nocturne", status: "planned" },
];

export default function PolysomnographiePage() {
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);

  const updatePrescription = (id: number, nextStatus: PrescriptionItem["status"]) => {
    setPrescriptions((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return { ...item, status: nextStatus };
      })
    );
  };

  const updatePrescriptionDraft = (id: number, scheduledDraft: string) => {
    setPrescriptions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, scheduledDraft } : item))
    );
  };

  const toggleScheduling = (id: number) => {
    setPrescriptions((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, isScheduling: !item.isScheduling }
          : item
      )
    );
  };

  const confirmPrescriptionSchedule = (id: number) => {
    setPrescriptions((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              scheduledAt: item.scheduledDraft ?? item.scheduledAt,
              isScheduling: false,
            }
          : item
      )
    );
  };

  const handleStartStop = (item: PrescriptionItem) => {
    if (item.status === "planned") {
      updatePrescription(item.id, "started");
      return;
    }

    if (item.status === "started") {
      updatePrescription(item.id, "stopped");
      return;
    }
  };

  const getStartButtonLabel = (status: PrescriptionItem["status"]) =>
    status === "started" ? "Stopper" : "Démarrer";

  const updateInterpretationDraft = (id: number, interpretationDraft: string) => {
    setPrescriptions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, interpretationDraft } : item
      )
    );
  };

  const confirmInterpretation = (id: number) => {
    setPrescriptions((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              interpretation: item.interpretationDraft ?? item.interpretation,
            }
          : item
      )
    );
  };

  return (
    <>
      <TopBar
        title="Polysomnographie"
        searchPlaceholder="Rechercher un dossier..."
        doctorName="Dr. Morel"
        doctorRole="Technicien du sommeil"
      />

      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Main Workspace */}
        <div className="flex-1 overflow-auto p-gutter bg-background grid grid-cols-12 gap-gutter">
          {/* Left Panel: prescriptions */}
          <div className="col-span-12 lg:col-span-12 xl:col-span-12 space-y-6 w-full max-w-full">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 shadow-sm w-full max-w-full">
              <div className="mb-6">
                <p className="text-[22px] font-semibold text-primary">
                  Prescriptions externes
                </p>
                <p className="text-body-sm text-on-surface-variant mt-2 max-w-2xl">
                  Utilisez les actions pour planifier une date, démarrer l&apos;examen et arrêter quand nécessaire.
                </p>
              </div>
              <div className="space-y-6">
                {prescriptions.map((item) => {
                  const statusLabel = statusLabels[item.status];
                  const statusClass = statusStyles[item.status];
                  const isStopped = item.status === "stopped";

                  return (
                    <div
                      key={item.id}
                      className="rounded-3xl border border-outline-variant bg-surface-container-high p-6 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-on-surface">
                            {item.label}
                          </p>
                          <p className="text-body-sm text-on-surface-variant mt-1">
                            {item.detail}
                          </p>
                          {item.scheduledAt && (
                            <p className="mt-3 text-sm text-on-surface-variant">
                              Planifié le {new Date(item.scheduledAt).toLocaleString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                        <span
                          className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-3">
                          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                            Date et heure
                          </label>
                          {item.isScheduling ? (
                            <input
                              type="datetime-local"
                              value={item.scheduledDraft ?? item.scheduledAt ?? ""}
                              onChange={(event) =>
                                updatePrescriptionDraft(item.id, event.target.value)
                              }
                              className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          ) : (
                            <button
                              onClick={() => toggleScheduling(item.id)}
                              className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-on-secondary"
                            >
                              Planifier
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                            Examen
                          </label>
                          <button
                            onClick={() => handleStartStop(item)}
                            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                              item.status === "started"
                                ? "bg-error text-on-error"
                                : "bg-primary text-on-primary"
                            }`}
                          >
                            {getStartButtonLabel(item.status)}
                          </button>
                        </div>
                      </div>
                      {item.isScheduling && (
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <button
                            onClick={() => confirmPrescriptionSchedule(item.id)}
                            disabled={!item.scheduledDraft}
                            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Enregistrer
                          </button>
                          <button
                            onClick={() => toggleScheduling(item.id)}
                            className="w-full rounded-2xl border border-outline-variant bg-surface-container px-4 py-3 text-sm font-semibold text-on-surface-variant"
                          >
                            Annuler
                          </button>
                        </div>
                      )}
                      {isStopped && (
                        <div className="mt-6 space-y-4">
                          <label className="text-sm font-medium text-on-surface-variant">
                            Interprétation
                          </label>
                          <textarea
                            value={item.interpretationDraft ?? item.interpretation ?? ""}
                            onChange={(event) =>
                              updateInterpretationDraft(item.id, event.target.value)
                            }
                            rows={5}
                            className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Rédiger une interprétation..."
                          />
                          <button
                            onClick={() => confirmInterpretation(item.id)}
                            disabled={!item.interpretationDraft || item.interpretationDraft === item.interpretation}
                            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Enregistrer
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
