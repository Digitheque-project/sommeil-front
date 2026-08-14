"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import ActionButton from "@/components/ActionButton";
import { useAllConsultations } from "@/hooks/use-consultations";
import {
  useComptesRendus,
  useCreateCompteRendu,
  useDeleteCompteRendu,
  useUpdateCompteRendu,
  useValidateCompteRendu,
} from "@/hooks/use-comptes-rendus";
import { compteRenduApi, type CompteRendu } from "@/lib/api/comptes-rendus";
import { useAuth } from "@/context/AuthContext";
import { printDocument } from "@/lib/download";
import type { ConsultationApi } from "@/lib/api/consultation";

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

const patientLabel = (consultation: ConsultationApi) =>
  consultation.patient?.displayName ??
  [consultation.patient?.prenom, consultation.patient?.nom].filter(Boolean).join(" ") ??
  "Patient inconnu";

export default function CompteRenduPage() {
  const { user } = useAuth();
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const { data: consultations = [], isLoading: areConsultationsLoading } = useAllConsultations();
  const { data: reports = [], isLoading: areReportsLoading } = useComptesRendus();

  const createMutation = useCreateCompteRendu();
  const updateMutation = useUpdateCompteRendu();
  const validateMutation = useValidateCompteRendu();
  const deleteMutation = useDeleteCompteRendu();

  const selectedConsultation = useMemo(
    () =>
      (consultations as ConsultationApi[]).find(
        (consultation) => String(consultation.id) === selectedConsultationId
      ) ?? null,
    [consultations, selectedConsultationId]
  );

  const consultationReports = useMemo(
    () =>
      (reports as CompteRendu[]).filter(
        (report) => report.consultationId === selectedConsultationId
      ),
    [reports, selectedConsultationId]
  );

  const selectedReport = useMemo(
    () => consultationReports.find((report) => report.id === selectedReportId) ?? null,
    [consultationReports, selectedReportId]
  );

  const isLocked = selectedReport?.statut === "VALIDE";
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Le brouillon suit le compte rendu sélectionné.
  useEffect(() => {
    setDraft(selectedReport?.contenu ?? "");
    setTitle(selectedReport?.titre ?? "");
  }, [selectedReport]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const selectConsultation = (consultation: ConsultationApi) => {
    const id = String(consultation.id);
    setSelectedConsultationId(id);
    const existing = (reports as CompteRendu[]).find((report) => report.consultationId === id);
    setSelectedReportId(existing?.id ?? null);
    if (!existing) {
      setDraft("");
      setTitle("");
    }
  };

  /** `report:create` / `report:update` selon qu'un brouillon existe déjà. */
  const saveReport = async () => {
    if (!selectedConsultation || !draft.trim()) return;
    try {
      if (selectedReport) {
        await updateMutation.mutateAsync({
          id: selectedReport.id,
          titre: title.trim() || "Compte rendu",
          contenu: draft,
        });
        setToast("Compte rendu enregistré.");
        return;
      }

      const created = await createMutation.mutateAsync({
        consultationId: String(selectedConsultation.id),
        titre: title.trim() || `Compte rendu — ${patientLabel(selectedConsultation)}`,
        contenu: draft,
        type: "MEDICAL",
        patientId: selectedConsultation.patientId,
        patientNom: patientLabel(selectedConsultation),
      });
      setSelectedReportId((created as CompteRendu).id);
      setToast("Compte rendu créé.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "L'enregistrement a échoué.");
    }
  };

  /** `report:validate` — verrouille définitivement le document. */
  const validateReport = async () => {
    if (!selectedReport) return;
    try {
      await validateMutation.mutateAsync({
        id: selectedReport.id,
        validePar: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
      });
      setToast("Compte rendu validé et signé.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "La validation a échoué.");
    }
  };

  /** `report:delete` — seulement tant que le compte rendu est un brouillon. */
  const deleteReport = async () => {
    if (!selectedReport) return;
    if (!window.confirm("Supprimer définitivement ce compte rendu ?")) return;
    try {
      await deleteMutation.mutateAsync(selectedReport.id);
      setSelectedReportId(null);
      setDraft("");
      setTitle("");
      setToast("Compte rendu supprimé.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "La suppression a échoué.");
    }
  };

  /** `report:export` — génère le PDF via l'impression du navigateur. */
  const exportReport = async () => {
    if (!selectedReport) return;
    try {
      const data = await compteRenduApi.export(selectedReport.id);
      printDocument(
        data.titre,
        `<h1>${data.titre}</h1>
         <p class="meta">
           Patient : ${data.patient.nom ?? "non renseigné"}${data.patient.dossier ? ` · Dossier ${data.patient.dossier}` : ""}<br />
           Statut : ${data.statut === "VALIDE" ? `Validé le ${formatDateTime(data.valideLe)}${data.validePar ? ` par ${data.validePar}` : ""}` : "Brouillon"}<br />
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
        title="Rédaction du compte rendu"
        searchPlaceholder="Rechercher un dossier..."
        doctorName="Dr. Morel"
        doctorRole="Somnologue"
        showSettings={false}
      />

      <main className="w-full mx-auto px-container-padding py-section-gap animate-fade-in">
        <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 mb-6 shadow-sm">
          {selectedConsultation ? (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-[0.18em] mb-2">
                  Patient
                </p>
                <h1 className="font-headline-sm text-headline-sm text-primary">
                  {patientLabel(selectedConsultation)}
                </h1>
                <p className="text-body-sm text-on-surface-variant mt-2">
                  Dossier {selectedConsultation.patient?.dossier ?? selectedConsultation.patientId} ·
                  Consultation du {new Date(selectedConsultation.date).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-surface-container p-4 text-center">
                  <p className="text-label-sm text-on-surface-variant uppercase">Motif</p>
                  <p className="font-label-md text-primary mt-2">{selectedConsultation.motif || "—"}</p>
                </div>
                <div className="rounded-3xl bg-surface-container p-4 text-center">
                  <p className="text-label-sm text-on-surface-variant uppercase">Comptes rendus</p>
                  <p className="font-label-md text-primary mt-2">{consultationReports.length}</p>
                </div>
                <div className="rounded-3xl bg-surface-container p-4 text-center">
                  <p className="text-label-sm text-on-surface-variant uppercase">Statut</p>
                  <p className="font-label-md text-primary mt-2">
                    {selectedReport ? (isLocked ? "Validé" : "Brouillon") : "Nouveau"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="font-headline-sm text-headline-sm text-primary mb-2">
                Sélectionnez une consultation pour commencer
              </p>
              <p className="text-body-sm text-on-surface-variant">
                Le compte rendu est rattaché à la consultation choisie.
              </p>
            </div>
          )}
        </section>

        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-4 space-y-4">
            <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-5 shadow-sm">
              <h2 className="font-label-md text-label-md text-on-surface-variant uppercase mb-5">
                Consultations
              </h2>
              {areConsultationsLoading ? (
                <p className="text-body-sm text-on-surface-variant">Chargement…</p>
              ) : consultations.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">Aucune consultation enregistrée.</p>
              ) : (
                <div className="space-y-3">
                  {(consultations as ConsultationApi[]).map((consultation) => {
                    const id = String(consultation.id);
                    const count = (reports as CompteRendu[]).filter(
                      (report) => report.consultationId === id
                    ).length;

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => selectConsultation(consultation)}
                        className={`w-full text-left rounded-3xl border px-4 py-4 transition-colors ${
                          selectedConsultationId === id
                            ? "border-primary bg-primary/10"
                            : "border-outline-variant bg-surface-container"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-on-surface">{patientLabel(consultation)}</p>
                            <p className="text-body-sm text-on-surface-variant mt-1">
                              {new Date(consultation.date).toLocaleDateString("fr-FR")} · {consultation.heure}
                            </p>
                            <p className="text-body-sm text-on-surface-variant mt-1 line-clamp-1">
                              {consultation.motif || "Sans motif"}
                            </p>
                          </div>
                          <span
                            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              count > 0
                                ? "bg-primary text-on-primary"
                                : "bg-surface-container-high text-on-surface-variant"
                            }`}
                          >
                            {count} CR
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {consultationReports.length > 1 && (
              <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-5 shadow-sm">
                <h2 className="font-label-md text-label-md text-on-surface-variant uppercase mb-4">
                  Comptes rendus du dossier
                </h2>
                <div className="space-y-2">
                  {consultationReports.map((report) => (
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
                        {report.statut === "VALIDE" ? "Validé" : "Brouillon"}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </aside>

          <section className="col-span-12 lg:col-span-8">
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
                    disabled={!selectedConsultation || isLocked}
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
                    {selectedReport?.validePar ? ` par ${selectedReport.validePar}` : ""} : il est
                    verrouillé et ne peut plus être modifié.
                  </p>
                )}
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={
                    selectedConsultation
                      ? "Rédigez ici votre compte rendu pour la consultation sélectionnée..."
                      : "Sélectionnez une consultation pour commencer"
                  }
                  disabled={!selectedConsultation || isLocked || areReportsLoading}
                  className="w-full min-h-[480px] resize-none rounded-3xl border border-outline-variant bg-background p-5 text-body-lg text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="px-6 py-5 border-t border-outline-variant bg-surface-bright rounded-b-3xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-body-sm text-on-surface-variant hidden md:block">
                  Enregistrez le brouillon autant de fois que nécessaire, puis validez pour signer
                  définitivement le compte rendu.
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <ActionButton
                    permission="report:delete"
                    onClick={deleteReport}
                    disabled={!selectedReport || isLocked}
                    pending={deleteMutation.isPending}
                    pendingLabel="Suppression…"
                    className="action-danger inline-flex items-center gap-2 rounded-3xl px-4 py-3 text-body-md font-semibold"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                    Supprimer
                  </ActionButton>
                  <ActionButton
                    permission="report:export"
                    onClick={exportReport}
                    disabled={!selectedReport}
                    className="action-secondary inline-flex items-center gap-2 rounded-3xl px-4 py-3 text-body-md font-semibold"
                  >
                    <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                    Exporter
                  </ActionButton>
                  <ActionButton
                    permission="report:validate"
                    onClick={validateReport}
                    disabled={!selectedReport || isLocked}
                    pending={validateMutation.isPending}
                    pendingLabel="Validation…"
                    className="action-warning inline-flex items-center gap-2 rounded-3xl px-4 py-3 text-body-md font-semibold"
                  >
                    <span className="material-symbols-outlined text-[20px]">verified</span>
                    {isLocked ? "Validé" : "Valider et signer"}
                  </ActionButton>
                  <ActionButton
                    permission={selectedReport ? "report:update" : "report:create"}
                    onClick={saveReport}
                    disabled={!selectedConsultation || !draft.trim() || isLocked}
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
