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

export default function InterpretationPsgPage() {
  const { user } = useAuth();
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

  const selectExam = (exam: PsgExam) => {
    setSelectedExamId(exam.id);
  };

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

      <main className="w-full mx-auto px-container-padding py-section-gap animate-fade-in">
        <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 mb-6 shadow-sm">
          {selectedExam ? (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-[0.18em] mb-2">
                  Patient
                </p>
                <h1 className="font-headline-sm text-headline-sm text-primary">
                  {selectedExam.patientPrenom} {selectedExam.patientNom}
                </h1>
                <p className="text-body-sm text-on-surface-variant mt-2">
                  Examen du {formatDate(selectedExam.rdvDate)} · {selectedExam.motif}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-surface-container p-4 text-center">
                  <p className="text-label-sm text-on-surface-variant uppercase">Terminé le</p>
                  <p className="font-label-md text-primary mt-2">{formatDateTime(selectedExam.termineLe)}</p>
                </div>
                <div className="rounded-3xl bg-surface-container p-4 text-center">
                  <p className="text-label-sm text-on-surface-variant uppercase">Statut</p>
                  <p className="font-label-md text-primary mt-2">
                    {selectedInterpretation ? (isLocked ? "Validée" : "Brouillon") : "Nouvelle"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="font-headline-sm text-headline-sm text-primary mb-2">
                Sélectionnez un examen terminé pour commencer
              </p>
              <p className="text-body-sm text-on-surface-variant">
                Seuls les examens de polysomnographie au statut « Terminé » peuvent être interprétés.
              </p>
            </div>
          )}
        </section>

        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-4">
            <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-5 shadow-sm">
              <h2 className="font-label-md text-label-md text-on-surface-variant uppercase mb-5">
                Examens terminés
              </h2>
              {areExamsLoading || areInterpretationsLoading ? (
                <p className="text-body-sm text-on-surface-variant">Chargement…</p>
              ) : sortedExams.length === 0 ? (
                <div className="text-center py-6">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/60">
                    night_shelter
                  </span>
                  <p className="mt-2 text-body-sm text-on-surface-variant">
                    Aucun examen terminé pour le moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedExams.map((exam) => {
                    const interpretation = interpretations.find((item) => item.psgId === exam.id);
                    const badge = interpretation
                      ? interpretation.statut === "VALIDE"
                        ? { label: "Validée", className: "bg-green-100 text-green-800" }
                        : { label: "Brouillon", className: "bg-amber-100 text-amber-800" }
                      : { label: "À interpréter", className: "bg-surface-container-high text-on-surface-variant" };

                    return (
                      <button
                        key={exam.id}
                        type="button"
                        onClick={() => selectExam(exam)}
                        className={cn(
                          "w-full text-left rounded-3xl border px-4 py-4 transition-colors",
                          selectedExamId === exam.id
                            ? "border-primary bg-primary/10"
                            : "border-outline-variant bg-surface-container"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-on-surface">
                              {exam.patientPrenom} {exam.patientNom}
                            </p>
                            <p className="text-body-sm text-on-surface-variant mt-1">
                              Terminé le {formatDateTime(exam.termineLe)}
                            </p>
                            <p className="text-body-sm text-on-surface-variant mt-1 line-clamp-1">
                              {exam.motif}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                              badge.className
                            )}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>

          <section className="col-span-12 lg:col-span-8">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-sm flex flex-col h-full">
              <div className="px-6 py-5 border-b border-outline-variant flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-[0.18em]">
                    Titre de l&apos;interprétation
                  </p>
                  <input
                    type="text"
                    value={titre}
                    onChange={(event) => setTitre(event.target.value)}
                    disabled={!selectedExam || isLocked}
                    placeholder="Interprétation de polysomnographie"
                    className="mt-2 w-full rounded-2xl border border-outline-variant bg-surface-container px-3 py-2 font-headline-sm text-headline-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                  />
                </div>
                <div className="rounded-3xl bg-surface-container p-3 text-sm text-on-surface-variant shrink-0">
                  Dernière modification : {formatDateTime(selectedInterpretation?.updatedAt)}
                </div>
              </div>

              <div className="p-6">
                {isLocked && (
                  <p className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                    Cette interprétation a été validée le {formatDateTime(selectedInterpretation?.valideLe)}
                    {selectedInterpretation?.validePar ? ` par ${selectedInterpretation.validePar}` : ""} : elle
                    est verrouillée et ne peut plus être modifiée.
                  </p>
                )}
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={
                    selectedExam
                      ? "Rédigez ici votre interprétation de l'examen sélectionné..."
                      : "Sélectionnez un examen terminé pour commencer"
                  }
                  disabled={!selectedExam || isLocked || areInterpretationsLoading}
                  className="w-full min-h-[480px] resize-none rounded-3xl border border-outline-variant bg-background p-5 text-body-lg text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="px-6 py-5 border-t border-outline-variant bg-surface-bright rounded-b-3xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-body-sm text-on-surface-variant hidden md:block">
                  Enregistrez le brouillon autant de fois que nécessaire, puis validez pour signer
                  définitivement l&apos;interprétation.
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
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
                    disabled={!selectedExam || !draft.trim() || isLocked}
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
          </section>
        </div>
      </main>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}
