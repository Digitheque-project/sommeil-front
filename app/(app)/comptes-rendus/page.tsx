"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import TopBar from "@/components/TopBar";
import ActionButton from "@/components/ActionButton";
import { usePsgExams } from "@/hooks/use-psg";
import {
  useComptesRendus,
  useCreateCompteRendu,
  useDeleteCompteRendu,
  useUpdateCompteRendu,
  useValidateCompteRendu,
} from "@/hooks/use-comptes-rendus";
import { useUploadPhoto } from "@/hooks/use-uploads";
import type { CompteRendu } from "@/lib/api/comptes-rendus";
import { useAuth } from "@/context/AuthContext";
import type { PsgExam } from "@/lib/api/psg";

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

const patientLabel = (exam: PsgExam) => `${exam.patientPrenom} ${exam.patientNom}`.trim() || "Patient inconnu";

type ReportWorkStatus = "NOUVEAU" | "BROUILLON" | "VALIDE";

const STATUS_META: Record<ReportWorkStatus, { label: string; icon: string; className: string }> = {
  VALIDE: { label: "Envoyé", icon: "send", className: "bg-green-100 text-green-800" },
  BROUILLON: { label: "Brouillon", icon: "edit_note", className: "bg-sky-100 text-sky-800" },
  NOUVEAU: { label: "Nouveau", icon: "radio_button_unchecked", className: "bg-surface-container-high text-on-surface-variant" },
};

export default function CompteRenduPage() {
  const { user } = useAuth();
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filters, setFilters] = useState({ nom: "", motif: "", statut: "" as "" | ReportWorkStatus });
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Un compte rendu se rédige pour un examen PSG terminé : c'est la même liste
  // que l'ancienne page "Interprétation PSG", désormais fusionnée ici.
  const { data: exams = [], isLoading: areExamsLoading } = usePsgExams("TERMINE");
  const { data: reports = [], isLoading: areReportsLoading } = useComptesRendus();

  // Regroupe les comptes rendus par examen pour dériver un statut par dossier
  // (Nouveau / Brouillon / Envoyé), à la manière de la worklist "Comptes rendus" du
  // service endoscopie.
  const reportsByExam = useMemo(() => {
    const map = new Map<string, CompteRendu[]>();
    for (const report of reports as CompteRendu[]) {
      if (!report.psgId) continue;
      const list = map.get(report.psgId) ?? [];
      list.push(report);
      map.set(report.psgId, list);
    }
    return map;
  }, [reports]);

  const getExamStatus = (examId: string): ReportWorkStatus => {
    const examReportsFor = reportsByExam.get(examId) ?? [];
    if (examReportsFor.some((report) => report.statut === "VALIDE")) return "VALIDE";
    if (examReportsFor.length > 0) return "BROUILLON";
    return "NOUVEAU";
  };

  const motifOptions = useMemo(() => {
    const motifs = new Set<string>();
    for (const exam of exams as PsgExam[]) {
      if (exam.motif) motifs.add(exam.motif);
    }
    return Array.from(motifs).sort((a, b) => a.localeCompare(b));
  }, [exams]);

  const sortedExams = useMemo(
    () => [...(exams as PsgExam[])].sort((a, b) => (b.termineLe ?? "").localeCompare(a.termineLe ?? "")),
    [exams]
  );

  const filteredExams = useMemo(() => {
    const nom = filters.nom.trim().toLowerCase();
    return sortedExams.filter((exam) => {
      const matchesNom = !nom || patientLabel(exam).toLowerCase().includes(nom);
      const matchesMotif = !filters.motif || exam.motif === filters.motif;
      const matchesStatut = !filters.statut || getExamStatus(exam.id) === filters.statut;
      return matchesNom && matchesMotif && matchesStatut;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedExams, filters, reportsByExam]);

  const createMutation = useCreateCompteRendu();
  const updateMutation = useUpdateCompteRendu();
  const validateMutation = useValidateCompteRendu();
  const deleteMutation = useDeleteCompteRendu();
  const uploadPhotoMutation = useUploadPhoto();

  const selectedExam = useMemo(
    () => sortedExams.find((exam) => exam.id === selectedExamId) ?? null,
    [sortedExams, selectedExamId]
  );

  const examReports = useMemo(
    () => (reports as CompteRendu[]).filter((report) => report.psgId === selectedExamId),
    [reports, selectedExamId]
  );

  const selectedReport = useMemo(
    () => examReports.find((report) => report.id === selectedReportId) ?? null,
    [examReports, selectedReportId]
  );

  const isLocked = selectedReport?.statut === "VALIDE";
  const isSending =
    createMutation.isPending || updateMutation.isPending || validateMutation.isPending;

  // Le brouillon suit le compte rendu sélectionné.
  useEffect(() => {
    setDraft(selectedReport?.contenu ?? "");
    setTitle(selectedReport?.titre ?? "");
    setConclusion(selectedReport?.conclusion ?? "");
    setPhotoUrl(selectedReport?.photoUrl ?? null);
  }, [selectedReport]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const resetForm = () => {
    setDraft("");
    setTitle("");
    setConclusion("");
    setPhotoUrl(null);
  };

  const selectExam = (exam: PsgExam) => {
    setSelectedExamId(exam.id);
    const existing = (reports as CompteRendu[]).find((report) => report.psgId === exam.id);
    setSelectedReportId(existing?.id ?? null);
    if (!existing) resetForm();
  };

  /** `report:create`/`report:update` implicite via ActionButton : importe la photo
   * dès la sélection du fichier, puis la conserve en brouillon local jusqu'à
   * l'enregistrement du compte rendu. */
  const importPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast("Le fichier doit être une image.");
      return;
    }
    try {
      const { url } = await uploadPhotoMutation.mutateAsync(file);
      setPhotoUrl(url);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "L'import de la photo a échoué.");
    }
  };

  /**
   * Le module n'expose que deux actions : « Valider » et « Annuler ».
   * Valider enchaîne `report:create`/`report:update` puis `report:validate` :
   * la saisie est enregistrée, signée, puis envoyée au prescripteur.
   */
  const validateAndSend = async () => {
    if (!selectedExam || !draft.trim()) return;
    try {
      let reportId = selectedReport?.id ?? null;

      if (reportId) {
        await updateMutation.mutateAsync({
          id: reportId,
          titre: title.trim() || "Compte rendu",
          contenu: draft,
          conclusion,
          photoUrl,
        });
      } else {
        const created = await createMutation.mutateAsync({
          psgId: selectedExam.id,
          titre: title.trim() || `Compte rendu — ${patientLabel(selectedExam)}`,
          contenu: draft,
          conclusion: conclusion.trim() || undefined,
          photoUrl: photoUrl ?? undefined,
          type: "MEDICAL",
          patientId: selectedExam.patientId,
          patientNom: patientLabel(selectedExam),
        });
        reportId = (created as CompteRendu).id;
        setSelectedReportId(reportId);
      }

      await validateMutation.mutateAsync({
        id: reportId,
        validePar: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
      });
      // TODO(prescripteur) : brancher l'appel au service prescriptions pour
      // transmettre le document. Tant qu'il n'existe pas, un compte rendu
      // validé vaut « envoyé au prescripteur ».
      setToast("Compte rendu validé et envoyé au prescripteur.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "La validation a échoué.");
    }
  };

  /**
   * `report:delete` — Annuler abandonne la saisie en cours et supprime le
   * brouillon déjà enregistré. Un compte rendu validé étant verrouillé, on se
   * contente alors de refermer le dossier.
   */
  const cancelReport = async () => {
    const draftToDelete = selectedReport && !isLocked ? selectedReport : null;
    const hasPendingInput = Boolean(draft.trim() || conclusion.trim() || title.trim() || photoUrl);

    if (draftToDelete || hasPendingInput) {
      const message = draftToDelete
        ? "Abandonner la saisie et supprimer le brouillon enregistré ?"
        : "Abandonner la saisie en cours ?";
      if (!window.confirm(message)) return;
    }

    if (draftToDelete) {
      try {
        await deleteMutation.mutateAsync(draftToDelete.id);
      } catch (error) {
        setToast(error instanceof Error ? error.message : "La suppression du brouillon a échoué.");
        return;
      }
    }

    setSelectedExamId(null);
    setSelectedReportId(null);
    resetForm();
    setToast(draftToDelete ? "Saisie annulée, brouillon supprimé." : "Saisie annulée.");
  };

  return (
    <>
      <TopBar
        title="Rédaction du compte rendu"
        searchPlaceholder="Rechercher un dossier..."
        doctorName="Dr. Morel"
        doctorRole="Somnologue"
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
                  {patientLabel(selectedExam)}
                </h1>
                <p className="text-body-sm text-on-surface-variant mt-2">
                  Dossier {selectedExam.patientId} · Examen PSG terminé le{" "}
                  {formatDateTime(selectedExam.termineLe)}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-surface-container p-4 text-center">
                  <p className="text-label-sm text-on-surface-variant uppercase">Motif</p>
                  <p className="font-label-md text-primary mt-2">{selectedExam.motif || "—"}</p>
                </div>
                <div className="rounded-3xl bg-surface-container p-4 text-center">
                  <p className="text-label-sm text-on-surface-variant uppercase">Comptes rendus</p>
                  <p className="font-label-md text-primary mt-2">{examReports.length}</p>
                </div>
                <div className="rounded-3xl bg-surface-container p-4 text-center">
                  <p className="text-label-sm text-on-surface-variant uppercase">Statut</p>
                  <p className="font-label-md text-primary mt-2">
                    {selectedReport ? (isLocked ? "Envoyé" : "Brouillon") : "Nouveau"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="font-headline-sm text-headline-sm text-primary mb-2">
                Sélectionnez un patient pour commencer
              </p>
              <p className="text-body-sm text-on-surface-variant">
                Le compte rendu est rattaché à l&apos;examen de polysomnographie terminé.
              </p>
            </div>
          )}
        </section>

        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-4 space-y-4">
            <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-5 shadow-sm">
              <h2 className="font-label-md text-label-md text-on-surface-variant uppercase mb-4">
                Patients ayant réalisé une PSG
              </h2>

              <div className="flex flex-col gap-2 mb-5">
                <input
                  type="text"
                  value={filters.nom}
                  onChange={(event) => setFilters((f) => ({ ...f, nom: event.target.value }))}
                  placeholder="Rechercher un patient..."
                  className="w-full rounded-xl border border-outline-variant bg-surface-container px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex gap-2">
                  <select
                    value={filters.motif}
                    onChange={(event) => setFilters((f) => ({ ...f, motif: event.target.value }))}
                    className="flex-1 rounded-xl border border-outline-variant bg-surface-container px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Tous les motifs</option>
                    {motifOptions.map((motif) => (
                      <option key={motif} value={motif}>
                        {motif}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filters.statut}
                    onChange={(event) =>
                      setFilters((f) => ({ ...f, statut: event.target.value as "" | ReportWorkStatus }))
                    }
                    className="flex-1 rounded-xl border border-outline-variant bg-surface-container px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="NOUVEAU">Nouveau</option>
                    <option value="BROUILLON">Brouillon</option>
                    <option value="VALIDE">Envoyé</option>
                  </select>
                </div>
              </div>

              {areExamsLoading ? (
                <p className="text-body-sm text-on-surface-variant">Chargement…</p>
              ) : filteredExams.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">
                  {exams.length === 0
                    ? "Aucun examen PSG terminé."
                    : "Aucun patient ne correspond aux filtres."}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredExams.map((exam) => {
                    const status = getExamStatus(exam.id);
                    const meta = STATUS_META[status];

                    return (
                      <button
                        key={exam.id}
                        type="button"
                        onClick={() => selectExam(exam)}
                        className={`w-full text-left rounded-3xl border px-4 py-4 transition-colors ${
                          selectedExamId === exam.id
                            ? "border-primary bg-primary/10"
                            : "border-outline-variant bg-surface-container"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-on-surface">{patientLabel(exam)}</p>
                            <p className="text-body-sm text-on-surface-variant mt-1">
                              Terminé le {formatDateTime(exam.termineLe)}
                            </p>
                            <p className="text-body-sm text-on-surface-variant mt-1 line-clamp-1">
                              {exam.motif || "Sans motif"}
                            </p>
                          </div>
                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.className}`}
                          >
                            <span className="material-symbols-outlined text-[13px]">{meta.icon}</span>
                            {meta.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {examReports.length > 1 && (
              <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-5 shadow-sm">
                <h2 className="font-label-md text-label-md text-on-surface-variant uppercase mb-4">
                  Comptes rendus du dossier
                </h2>
                <div className="space-y-2">
                  {examReports.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => setSelectedReportId(report.id)}
                      className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition-colors ${
                        selectedReportId === report.id
                          ? "border-primary bg-primary/10"
                          : "border-outline-variant bg-surface-container"
                      }`}
                    >
                      <span className="font-semibold text-on-surface">{report.titre}</span>
                      <span className="ml-2 text-[10px] font-bold uppercase text-on-surface-variant">
                        {report.statut === "VALIDE" ? "Envoyé" : "Brouillon"}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </aside>

          <section className="col-span-12 lg:col-span-8">
            {!selectedExam ? (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-sm flex h-full min-h-[420px] flex-col items-center justify-center gap-2 p-6 text-center">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant">
                  touch_app
                </span>
                <p className="font-headline-sm text-headline-sm text-primary">
                  Cliquez sur un patient pour rédiger son compte rendu
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  Le formulaire s&apos;affiche une fois un dossier sélectionné dans la liste.
                </p>
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-sm flex flex-col h-full">
                <div className="px-6 py-5 border-b border-outline-variant flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-label-sm text-on-surface-variant uppercase tracking-[0.18em]">
                      Titre du compte rendu
                    </p>
                    <input
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      disabled={isLocked}
                      placeholder="Compte rendu de polysomnographie"
                      className="mt-2 w-full rounded-2xl border border-outline-variant bg-surface-container px-3 py-2 font-headline-sm text-headline-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                    />
                  </div>
                  <div className="rounded-3xl bg-surface-container p-3 text-sm text-on-surface-variant shrink-0">
                    Dernière modification : {formatDateTime(selectedReport?.updatedAt)}
                  </div>
                </div>

                <div className="p-6">
                  {isLocked && (
                    <p className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                      Ce compte rendu a été validé le {formatDateTime(selectedReport?.valideLe)}
                      {selectedReport?.validePar ? ` par ${selectedReport.validePar}` : ""} et envoyé
                      au prescripteur : il est verrouillé et ne peut plus être modifié.
                    </p>
                  )}
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Rédigez ici votre compte rendu pour le patient sélectionné..."
                    disabled={isLocked || areReportsLoading}
                    className="w-full min-h-[480px] resize-none rounded-3xl border border-outline-variant bg-background p-5 text-body-lg text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <div className="mt-4">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={importPhoto}
                    />
                    <ActionButton
                      permission={selectedReport ? "report:update" : "report:create"}
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isLocked}
                      pending={uploadPhotoMutation.isPending}
                      pendingLabel={
                        <>
                          <span className="material-symbols-outlined text-[18px]">sync</span>
                          Import…
                        </>
                      }
                      className="action-secondary inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-body-sm font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                      Importer une photo
                    </ActionButton>

                    {photoUrl && (
                      <div className="relative mt-3 inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element -- URL externe (service-upload), non gérable par next/image */}
                        <img
                          src={photoUrl}
                          alt="Photo jointe au compte rendu"
                          className="max-h-40 rounded-2xl border border-outline-variant object-cover"
                        />
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => setPhotoUrl(null)}
                            aria-label="Retirer la photo"
                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white shadow"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <label
                      htmlFor="cr-conclusion"
                      className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant"
                    >
                      Conclusion
                    </label>
                    <textarea
                      id="cr-conclusion"
                      value={conclusion}
                      onChange={(event) => setConclusion(event.target.value)}
                      placeholder="Rédigez ici la conclusion du compte rendu..."
                      disabled={isLocked || areReportsLoading}
                      className="w-full min-h-[140px] resize-none rounded-3xl border border-outline-variant bg-background p-4 text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="px-6 py-5 border-t border-outline-variant bg-surface-bright rounded-b-3xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-body-sm text-on-surface-variant hidden md:block">
                    La validation signe le compte rendu et l&apos;envoie au prescripteur : il ne
                    sera plus modifiable.
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <ActionButton
                      permission={selectedReport && !isLocked ? "report:delete" : "report:create"}
                      onClick={cancelReport}
                      pending={deleteMutation.isPending}
                      pendingLabel="Annulation…"
                      className="action-secondary inline-flex items-center gap-2 rounded-3xl px-6 py-3 text-body-md font-semibold"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                      Annuler
                    </ActionButton>
                    <ActionButton
                      permission="report:validate"
                      onClick={validateAndSend}
                      disabled={!draft.trim() || isLocked}
                      pending={isSending}
                      pendingLabel={
                        <>
                          <span className="material-symbols-outlined">sync</span>
                          Envoi au prescripteur…
                        </>
                      }
                      className="action-success inline-flex items-center gap-2 rounded-3xl px-6 py-3 text-body-md font-semibold"
                    >
                      <span className="material-symbols-outlined text-[20px]">send</span>
                      {isLocked ? "Envoyé au prescripteur" : "Valider et envoyer"}
                    </ActionButton>
                  </div>
                </div>
              </div>
            )}
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
