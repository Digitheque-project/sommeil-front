"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import ActionButton from "@/components/ActionButton";
import { usePsgExams } from "@/hooks/use-psg";
import {
  useCreatePsgInterpretation,
  useDeletePsgInterpretation,
  usePsgInterpretations,
  useUpdatePsgInterpretation,
  useValidatePsgInterpretation,
} from "@/hooks/use-psg-interpretations";
import { psgInterpretationApi } from "@/lib/api/psg-interpretations";
import type { PsgExam } from "@/lib/api/psg";
import { useAuth } from "@/context/AuthContext";
import { printDocument } from "@/lib/download";
import { cn } from "@/lib/utils";

const formatDateTime = (value?: string | null) => {
  if (!value) return "Jamais";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Jamais";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getInitials = (item: PsgExam) => {
  const parts = `${item.patientPrenom} ${item.patientNom}`.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").slice(0, 2).join("");
};

export default function InterpretationPsgPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [titre, setTitre] = useState("");
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const { data: exams = [], isLoading: areExamsLoading } = usePsgExams("TERMINE");
  const { data: interpretations = [], isLoading: areInterpretationsLoading } = usePsgInterpretations();

  const createMutation = useCreatePsgInterpretation();
  const updateMutation = useUpdatePsgInterpretation();
  const validateMutation = useValidatePsgInterpretation();
  const deleteMutation = useDeletePsgInterpretation();

  const sortedExams = useMemo(
    () => [...exams].sort((a, b) => (b.termineLe ?? "").localeCompare(a.termineLe ?? "")),
    [exams]
  );

  const filteredExams = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedExams;
    return sortedExams.filter((item) =>
      [item.patientNom, item.patientPrenom, item.patientId, item.motif]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [sortedExams, searchQuery]);

  const selectedExam = useMemo(
    () => sortedExams.find((exam) => exam.id === selectedExamId) ?? null,
    [sortedExams, selectedExamId]
  );

  const selectedInterpretation = useMemo(
    () => interpretations.find((item) => item.psgId === selectedExamId) ?? null,
    [interpretations, selectedExamId]
  );

  const isLocked = selectedInterpretation?.statut === "VALIDE";
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Le brouillon suit l'interprétation existante de l'examen sélectionné.
  useEffect(() => {
    setDraft(selectedInterpretation?.contenu ?? "");
    setTitre(selectedInterpretation?.titre ?? "");
  }, [selectedInterpretation]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const closePanel = () => setSelectedExamId(null);

  /** `psg:interpret_create` / `psg:interpret_update` selon qu'un brouillon existe déjà. */
  const saveInterpretation = async () => {
    if (!selectedExam || !draft.trim()) return;
    try {
      if (selectedInterpretation) {
        await updateMutation.mutateAsync({
          id: selectedInterpretation.id,
          titre: titre.trim() || "Interprétation PSG",
          contenu: draft,
        });
        setToast("Interprétation enregistrée.");
        return;
      }

      await createMutation.mutateAsync({
        psgId: selectedExam.id,
        titre: titre.trim() || `Interprétation PSG — ${selectedExam.patientPrenom} ${selectedExam.patientNom}`,
        contenu: draft,
      });
      setToast("Interprétation créée.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "L'enregistrement a échoué.");
    }
  };

  /** `psg:interpret_validate` — verrouille définitivement l'interprétation. */
  const validateInterpretation = async () => {
    if (!selectedInterpretation) return;
    try {
      await validateMutation.mutateAsync({
        id: selectedInterpretation.id,
        validePar: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
      });
      setToast("Interprétation validée et signée.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "La validation a échoué.");
    }
  };

  /** `psg:interpret_delete` — seulement tant que l'interprétation est un brouillon. */
  const deleteInterpretation = async () => {
    if (!selectedInterpretation) return;
    if (!window.confirm("Supprimer définitivement cette interprétation ?")) return;
    try {
      await deleteMutation.mutateAsync(selectedInterpretation.id);
      setToast("Interprétation supprimée.");
      closePanel();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "La suppression a échoué.");
    }
  };

  /** `psg:interpret_export` — génère le PDF via l'impression du navigateur. */
  const exportInterpretation = async () => {
    if (!selectedInterpretation) return;
    try {
      const data = await psgInterpretationApi.export(selectedInterpretation.id);
      printDocument(
        data.titre,
        `<h1>${data.titre}</h1>
         <p class="meta">
           Patient : ${data.patient.nom}<br />
           Examen du ${data.examen ? formatDate(data.examen.rdvDate) : "—"}<br />
           Statut : ${data.statut === "VALIDE" ? `Validée le ${formatDateTime(data.valideLe)}${data.validePar ? ` par ${data.validePar}` : ""}` : "Brouillon"}<br />
           Édité le ${formatDateTime(data.genereLe)}
         </p>
         <div class="content">${data.contenu.replaceAll("<", "&lt;")}</div>`
      );
    } catch (error) {
      setToast(error instanceof Error ? error.message : "L'export a échoué.");
    }
  };

  return (
    <>
      <TopBar
        title="Interprétation PSG"
        searchPlaceholder="Rechercher un examen terminé..."
        doctorName="Dr. Laurent Morel"
        doctorRole="Spécialiste Sommeil"
      />

      <main className="w-full mx-auto px-container-padding py-section-gap animate-fade-in max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-headline-sm text-headline-sm text-primary">Examens à interpréter</h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Cliquez sur un patient pour rédiger ou consulter son interprétation.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher par nom ou ID patient..."
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 pl-10 pr-4 text-body-sm font-body-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          {areExamsLoading || areInterpretationsLoading ? (
            <div className="px-6 py-14 text-center text-on-surface-variant">Chargement des examens...</div>
          ) : filteredExams.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/60">
                    night_shelter
                  </span>
                </div>
                <p className="font-semibold text-on-surface">Aucun examen à interpréter</p>
                <p className="max-w-sm text-sm text-on-surface-variant">
                  Les examens de polysomnographie terminés s&apos;afficheront automatiquement ici.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {filteredExams.map((exam) => {
                const interpretation = interpretations.find((item) => item.psgId === exam.id);
                const badge = interpretation
                  ? interpretation.statut === "VALIDE"
                    ? { label: "Validée", className: "bg-green-100 text-green-800" }
                    : { label: "Brouillon", className: "bg-amber-100 text-amber-800" }
                  : { label: "À interpréter", className: "bg-surface-container-high text-on-surface-variant" };

                return (
                  <li key={exam.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedExamId(exam.id)}
                      className={cn(
                        "flex w-full flex-col gap-3 px-6 py-5 text-left transition-colors hover:bg-tertiary-fixed sm:flex-row sm:items-center",
                        selectedExamId === exam.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex shrink-0 items-center gap-3 sm:w-[240px]">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary-fixed font-bold text-secondary">
                          {getInitials(exam)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-primary">
                            {exam.patientPrenom} {exam.patientNom}
                          </p>
                          <p className="truncate font-data-mono text-xs text-on-surface-variant">{exam.patientId}</p>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-sm font-semibold text-on-surface">
                          Terminé le {formatDateTime(exam.termineLe)}
                        </span>
                        <p className="truncate text-sm text-on-surface-variant">{exam.motif}</p>
                      </div>

                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                          badge.className
                        )}
                      >
                        {badge.label}
                      </span>

                      <span className="material-symbols-outlined shrink-0 text-on-surface-variant">
                        chevron_right
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      {selectedExam && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closePanel}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Interprétation — ${selectedExam.patientPrenom} ${selectedExam.patientNom}`}
            className="animate-slideInRight relative flex h-full w-full max-w-xl flex-col bg-surface-container-lowest shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-outline-variant px-6 py-5">
              <div className="min-w-0">
                <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">
                  Interprétation
                </p>
                <h2 className="mt-1 truncate font-headline-sm text-headline-sm text-primary">
                  {selectedExam.patientPrenom} {selectedExam.patientNom}
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Examen du {formatDate(selectedExam.rdvDate)} · Terminé le {formatDateTime(selectedExam.termineLe)}
                </p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                aria-label="Fermer"
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {isLocked && (
                <p className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                  Cette interprétation a été validée le {formatDateTime(selectedInterpretation?.valideLe)}
                  {selectedInterpretation?.validePar ? ` par ${selectedInterpretation.validePar}` : ""} : elle
                  est verrouillée et ne peut plus être modifiée.
                </p>
              )}

              <label
                htmlFor="psgi-titre"
                className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant"
              >
                Titre
              </label>
              <input
                id="psgi-titre"
                type="text"
                value={titre}
                onChange={(event) => setTitre(event.target.value)}
                disabled={isLocked}
                placeholder="Interprétation de polysomnographie"
                className="mb-5 w-full rounded-2xl border border-outline-variant bg-surface-container px-3 py-2.5 text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
              />

              <label
                htmlFor="psgi-contenu"
                className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant"
              >
                Interprétation
              </label>
              <textarea
                id="psgi-contenu"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Rédigez ici votre interprétation de l'examen sélectionné..."
                disabled={isLocked}
                className="w-full min-h-[360px] resize-none rounded-3xl border border-outline-variant bg-background p-5 text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant bg-surface-bright px-6 py-5">
              <ActionButton
                permission="psg:interpret_delete"
                onClick={deleteInterpretation}
                disabled={!selectedInterpretation || isLocked}
                pending={deleteMutation.isPending}
                pendingLabel="Suppression…"
                className="action-danger inline-flex items-center gap-2 rounded-3xl px-4 py-3 text-body-md font-semibold"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
                Supprimer
              </ActionButton>
              <ActionButton
                permission="psg:interpret_export"
                onClick={exportInterpretation}
                disabled={!selectedInterpretation}
                className="action-secondary inline-flex items-center gap-2 rounded-3xl px-4 py-3 text-body-md font-semibold"
              >
                <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                Exporter
              </ActionButton>
              <ActionButton
                permission="psg:interpret_validate"
                onClick={validateInterpretation}
                disabled={!selectedInterpretation || isLocked}
                pending={validateMutation.isPending}
                pendingLabel="Validation…"
                className="action-warning inline-flex items-center gap-2 rounded-3xl px-4 py-3 text-body-md font-semibold"
              >
                <span className="material-symbols-outlined text-[20px]">verified</span>
                {isLocked ? "Validée" : "Valider et signer"}
              </ActionButton>
              <ActionButton
                permission={selectedInterpretation ? "psg:interpret_update" : "psg:interpret_create"}
                onClick={saveInterpretation}
                disabled={!draft.trim() || isLocked}
                pending={isSaving}
                pendingLabel={
                  <>
                    <span className="material-symbols-outlined">sync</span>
                    Enregistrement…
                  </>
                }
                className="action-success inline-flex items-center gap-2 rounded-3xl px-6 py-3 text-body-md font-semibold"
              >
                <span className="material-symbols-outlined">save</span>
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
