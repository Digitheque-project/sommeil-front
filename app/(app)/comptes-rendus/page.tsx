"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
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
import { usePatient } from "@/hooks/use-patients";
import { useUploadPhoto } from "@/hooks/use-uploads";
import type { CompteRendu } from "@/lib/api/comptes-rendus";
import { useAuth } from "@/context/AuthContext";
import type { PsgExam } from "@/lib/api/psg";
import { useToast } from "@/components/ToastProvider";

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

/** Le service accueil accepte `1975`, `1975-03` ou `1975-03-12`. */
const formatAge = (dateNaissance?: string | null) => {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  if (age < 0 || age > 130) return null;
  return `${age} ans`;
};

const SEXE_LABELS: Record<string, string> = { MALE: "Homme", FEMALE: "Femme" };

const patientLabel = (exam: PsgExam) => `${exam.patientPrenom} ${exam.patientNom}`.trim() || "Patient inconnu";

const initialsOf = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

type ReportWorkStatus = "NOUVEAU" | "BROUILLON" | "VALIDE";

/**
 * Trois états lisibles d'un bout à l'autre de la page (worklist, filtres,
 * en-tête patient). Le orange reste réservé à l'urgence de l'examen, pour ne
 * pas brouiller le code couleur d'urgence utilisé dans le reste de l'app.
 */
const STATUS_META: Record<
  ReportWorkStatus,
  { label: string; icon: string; chip: string; dot: string }
> = {
  VALIDE: {
    label: "Envoyé",
    icon: "send",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  BROUILLON: {
    label: "Brouillon",
    icon: "edit_note",
    chip: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
  NOUVEAU: {
    label: "Nouveau",
    icon: "radio_button_unchecked",
    chip: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

const STATUS_FILTERS: { value: "" | ReportWorkStatus; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "NOUVEAU", label: "Nouveau" },
  { value: "BROUILLON", label: "Brouillon" },
  { value: "VALIDE", label: "Envoyé" },
];

/** Intitulé de section du formulaire : icône + libellé capitale + aide facultative. */
function FieldLabel({
  icon,
  children,
  hint,
  htmlFor,
}: Readonly<{ icon: string; children: ReactNode; hint?: ReactNode; htmlFor?: string }>) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748B]"
      >
        <span className="material-symbols-outlined text-[16px] text-[#2563EB]">{icon}</span>
        {children}
      </label>
      {hint ? <span className="text-[11px] text-[#94A3B8]">{hint}</span> : null}
    </div>
  );
}

/** Puce d'information sous le nom du patient. */
function MetaChip({
  icon,
  children,
  tone = "neutral",
  title,
}: Readonly<{ icon: string; children: ReactNode; tone?: "neutral" | "urgent"; title?: string }>) {
  const tones = {
    neutral: "border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]",
    urgent: "border-orange-200 bg-orange-50 text-orange-700",
  };
  return (
    <span
      title={title}
      className={`inline-flex min-w-0 max-w-[260px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      <span className="material-symbols-outlined shrink-0 text-[15px]">{icon}</span>
      <span className="truncate">{children}</span>
    </span>
  );
}

export default function CompteRenduPage() {
  const { user } = useAuth();
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
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

  // Informations d'identité : le service accueil fait foi, l'examen ne sert
  // que de repli quand le patient n'y est pas (encore) enregistré.
  const { data: patient, isLoading: isPatientLoading } = usePatient(selectedExam?.patientId);

  const displayName = useMemo(() => {
    if (!selectedExam) return "";
    const fromAccueil = [patient?.prenom, patient?.nom].filter(Boolean).join(" ").trim();
    return fromAccueil || patientLabel(selectedExam);
  }, [patient, selectedExam]);

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
  const currentStatus: ReportWorkStatus = selectedReport
    ? isLocked
      ? "VALIDE"
      : "BROUILLON"
    : "NOUVEAU";

  // Le brouillon suit le compte rendu sélectionné.
  useEffect(() => {
    setDraft(selectedReport?.contenu ?? "");
    setTitle(selectedReport?.titre ?? "");
    setConclusion(selectedReport?.conclusion ?? "");
    setPhotoUrl(selectedReport?.photoUrl ?? null);
  }, [selectedReport]);

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
      showError("Le fichier doit être une image.");
      return;
    }
    try {
      const { url } = await uploadPhotoMutation.mutateAsync(file);
      setPhotoUrl(url);
    } catch (error) {
      showError(error instanceof Error ? error.message : "L'import de la photo a échoué.");
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
          titre: title.trim() || `Compte rendu — ${displayName}`,
          contenu: draft,
          conclusion: conclusion.trim() || undefined,
          photoUrl: photoUrl ?? undefined,
          type: "MEDICAL",
          patientId: selectedExam.patientId,
          patientNom: displayName,
        });
        reportId = (created as CompteRendu).id;
        setSelectedReportId(reportId);
      }

      const validated = await validateMutation.mutateAsync({
        id: reportId,
        validePar: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
      });
      // La signature est acquise même si la transmission échoue : le message
      // doit dire lequel des deux a réellement eu lieu, sans quoi le praticien
      // croirait le prescripteur informé alors qu'il ne l'est pas.
      if (validated.prescripteurNotifie) {
        showSuccess("Compte rendu validé et envoyé au prescripteur.");
      } else {
        showError("Compte rendu validé, mais l'envoi au prescripteur a échoué : il sera à relancer.");
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "La validation a échoué.");
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
        showError(error instanceof Error ? error.message : "La suppression du brouillon a échoué.");
        return;
      }
    }

    setSelectedExamId(null);
    setSelectedReportId(null);
    resetForm();
    showSuccess(draftToDelete ? "Saisie annulée, brouillon supprimé." : "Saisie annulée.");
  };

  const statusMeta = STATUS_META[currentStatus];
  const age = formatAge(patient?.dateNaissance);
  const sexe = patient?.sexe ? (SEXE_LABELS[patient.sexe] ?? patient.sexe) : null;
  const identite = [sexe, age].filter(Boolean).join(" · ");

  return (
    <>
      <TopBar title="Rédaction du compte rendu" searchPlaceholder="Rechercher un dossier..." />

      <div className="min-h-[calc(100vh-5rem)] bg-[#F8FAFC]">
        {/* Pas de largeur maximale : l'écran de rédaction occupe toute la
            surface disponible, la colonne de gauche gardant une largeur fixe. */}
        <main className="w-full animate-fade-in px-4 py-5 md:px-6 md:py-6">
          {/* ---------- Bandeau patient ---------- */}
          <section className="mb-6 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
            {selectedExam ? (
              <>
                <div className="flex flex-col gap-5 p-5 md:p-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] font-headline text-lg font-extrabold text-[#1E3A8A]">
                      {initialsOf(displayName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">
                        Patient
                      </p>
                      <h1 className="truncate font-headline text-2xl font-extrabold leading-tight text-[#0F172A]">
                        {displayName}
                      </h1>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <MetaChip icon="badge">Dossier {selectedExam.patientId}</MetaChip>
                        {identite && <MetaChip icon="person">{identite}</MetaChip>}
                        {patient?.telephone && (
                          <MetaChip icon="call">{patient.telephone}</MetaChip>
                        )}
                        <MetaChip icon="bedtime">
                          PSG terminée le {formatDateTime(selectedExam.termineLe)}
                        </MetaChip>
                        <MetaChip icon="stethoscope" title={selectedExam.motif}>
                          {selectedExam.motif || "Sans motif"}
                        </MetaChip>
                        {selectedExam.urgence && (
                          <MetaChip icon="priority_high" tone="urgent">
                            Urgent
                          </MetaChip>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 lg:justify-end">
                    <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-center">
                      <p className="font-headline text-2xl font-extrabold leading-none text-[#0F172A]">
                        {examReports.length}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        Compte{examReports.length > 1 ? "s" : ""} rendu
                        {examReports.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 ${statusMeta.chip}`}>
                      <span className="material-symbols-outlined text-[22px]">{statusMeta.icon}</span>
                      <div className="text-left">
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                          Statut
                        </p>
                        <p className="font-headline text-base font-extrabold leading-tight">
                          {statusMeta.label}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Allergie : information clinique à ne pas manquer. */}
                {patient?.allergie && (
                  <div className="flex items-center gap-2 border-t border-red-100 bg-red-50 px-5 py-2.5 md:px-6">
                    <span className="material-symbols-outlined text-[18px] text-red-600">warning</span>
                    <p className="text-sm text-red-800">
                      <span className="font-bold">Allergie :</span> {patient.allergie}
                    </p>
                  </div>
                )}

                {!isPatientLoading && !patient && (
                  <div className="flex items-center gap-2 border-t border-[#E2E8F0] bg-[#F8FAFC] px-5 py-2 md:px-6">
                    <span className="material-symbols-outlined text-[16px] text-[#94A3B8]">info</span>
                    <p className="text-xs text-[#64748B]">
                      Fiche introuvable au service accueil : identité reprise de l&apos;examen.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="material-symbols-outlined text-[36px] text-[#2563EB]">
                  contact_page
                </span>
                <h1 className="font-headline text-xl font-extrabold text-[#0F172A]">
                  Sélectionnez un patient pour commencer
                </h1>
                <p className="max-w-md text-sm text-[#64748B]">
                  Le compte rendu est rattaché à l&apos;examen de polysomnographie terminé.
                </p>
              </div>
            )}
          </section>

          {/* La worklist garde une largeur constante ; tout l'espace restant va
              à l'éditeur, quelle que soit la largeur de l'écran. */}
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            {/* ---------- Worklist ---------- */}
            <aside className="space-y-4 xl:sticky xl:top-6">
              <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                <div className="border-b border-[#E2E8F0] p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748B]">
                      Patients ayant réalisé une PSG
                    </h2>
                    <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-bold text-[#475569]">
                      {filteredExams.length}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#94A3B8]">
                      search
                    </span>
                    <input
                      type="text"
                      value={filters.nom}
                      onChange={(event) => setFilters((f) => ({ ...f, nom: event.target.value }))}
                      placeholder="Rechercher un patient..."
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 pl-10 pr-3 text-sm text-[#0F172A] transition placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
                    />
                  </div>

                  <select
                    value={filters.motif}
                    onChange={(event) => setFilters((f) => ({ ...f, motif: event.target.value }))}
                    className="mt-2 w-full truncate rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#0F172A] transition focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
                  >
                    <option value="">Tous les motifs</option>
                    {motifOptions.map((motif) => (
                      <option key={motif} value={motif}>
                        {motif}
                      </option>
                    ))}
                  </select>

                  {/* Filtre de statut en segments : plus lisible que la liste
                      déroulante, qui se retrouvait écrasée à côté du motif. */}
                  <div className="mt-2 flex gap-1 rounded-xl bg-[#F1F5F9] p-1">
                    {STATUS_FILTERS.map((option) => {
                      const active = filters.statut === option.value;
                      return (
                        <button
                          key={option.value || "all"}
                          type="button"
                          onClick={() => setFilters((f) => ({ ...f, statut: option.value }))}
                          aria-pressed={active}
                          className={`flex-1 rounded-lg px-1.5 py-1.5 text-[11px] font-bold transition ${
                            active
                              ? "bg-white text-[#1E3A8A] shadow-sm"
                              : "text-[#64748B] hover:text-[#0F172A]"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {areExamsLoading ? (
                  <div className="space-y-3 p-4">
                    {[0, 1, 2].map((row) => (
                      <div key={row} className="flex animate-pulse items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-[#F1F5F9]" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-2/3 rounded bg-[#F1F5F9]" />
                          <div className="h-3 w-1/2 rounded bg-[#F1F5F9]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredExams.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F5F9]">
                      <span className="material-symbols-outlined text-[24px] text-[#94A3B8]">
                        {exams.length === 0 ? "night_shelter" : "filter_alt_off"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {exams.length === 0 ? "Aucun examen PSG terminé" : "Aucun résultat"}
                    </p>
                    <p className="max-w-[220px] text-xs text-[#64748B]">
                      {exams.length === 0
                        ? "Les examens terminés apparaîtront ici automatiquement."
                        : "Aucun patient ne correspond aux filtres sélectionnés."}
                    </p>
                  </div>
                ) : (
                  <div className="custom-scrollbar max-h-[560px] divide-y divide-[#F1F5F9] overflow-y-auto">
                    {filteredExams.map((exam) => {
                      const status = getExamStatus(exam.id);
                      const meta = STATUS_META[status];
                      const active = selectedExamId === exam.id;

                      return (
                        <button
                          key={exam.id}
                          type="button"
                          onClick={() => selectExam(exam)}
                          aria-current={active || undefined}
                          className={`flex w-full items-start gap-3 border-l-[3px] px-4 py-3.5 text-left transition-colors ${
                            active
                              ? "border-l-[#2563EB] bg-[#EFF6FF]"
                              : "border-l-transparent hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${
                              exam.urgence
                                ? "bg-orange-50 text-orange-700"
                                : "bg-[#F1F5F9] text-[#475569]"
                            }`}
                          >
                            {initialsOf(patientLabel(exam))}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 truncate text-sm font-bold text-[#0F172A]">
                              {patientLabel(exam)}
                              {exam.urgence && (
                                <span
                                  className="material-symbols-outlined text-[15px] text-orange-500"
                                  title="Examen urgent"
                                >
                                  priority_high
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-[#64748B]">
                              Terminé le {formatDateTime(exam.termineLe)}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-[#94A3B8]">
                              {exam.motif || "Sans motif"}
                            </p>
                          </div>

                          <span
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.chip}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {examReports.length > 1 && (
                <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                  <h2 className="border-b border-[#E2E8F0] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748B]">
                    Comptes rendus du dossier
                  </h2>
                  <div className="divide-y divide-[#F1F5F9]">
                    {examReports.map((report) => {
                      const meta = STATUS_META[report.statut === "VALIDE" ? "VALIDE" : "BROUILLON"];
                      const active = selectedReportId === report.id;
                      return (
                        <button
                          key={report.id}
                          type="button"
                          onClick={() => setSelectedReportId(report.id)}
                          className={`flex w-full items-center gap-2 border-l-[3px] px-4 py-3 text-left transition-colors ${
                            active
                              ? "border-l-[#2563EB] bg-[#EFF6FF]"
                              : "border-l-transparent hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#0F172A]">
                            {report.titre}
                          </span>
                          <span
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.chip}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </aside>

            {/* ---------- Éditeur ---------- */}
            <section className="min-w-0">
              {!selectedExam ? (
                <div className="flex h-full min-h-[calc(100vh-14rem)] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF]">
                    <span className="material-symbols-outlined text-[32px] text-[#2563EB]">
                      touch_app
                    </span>
                  </div>
                  <h2 className="font-headline text-xl font-extrabold text-[#0F172A]">
                    Cliquez sur un patient pour rédiger son compte rendu
                  </h2>
                  <p className="max-w-sm text-sm text-[#64748B]">
                    Le formulaire s&apos;affiche une fois un dossier sélectionné dans la liste de
                    gauche.
                  </p>
                </div>
              ) : (
                <div className="flex h-full min-h-[calc(100vh-14rem)] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                  <div className="border-b border-[#E2E8F0] bg-gradient-to-r from-white to-[#F8FAFC] px-5 py-4 md:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor="cr-titre"
                          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748B]"
                        >
                          <span className="material-symbols-outlined text-[16px] text-[#2563EB]">
                            title
                          </span>
                          Titre du compte rendu
                        </label>
                        <input
                          id="cr-titre"
                          type="text"
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          disabled={isLocked}
                          placeholder="Compte rendu de polysomnographie"
                          className="mt-1 w-full border-0 border-b-2 border-transparent bg-transparent px-0 py-1 font-headline text-xl font-extrabold text-[#0F172A] transition placeholder:font-semibold placeholder:text-[#CBD5E1] focus:border-[#2563EB] focus:outline-none disabled:text-[#64748B]"
                        />
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 text-xs text-[#64748B]">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        Modifié : {formatDateTime(selectedReport?.updatedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col gap-6 p-5 md:p-6">
                    {isLocked && (
                      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <span className="material-symbols-outlined text-[20px] text-emerald-600">
                          verified
                        </span>
                        <p className="text-sm text-emerald-800">
                          <span className="font-bold">Envoyé au prescripteur.</span> Validé le{" "}
                          {formatDateTime(selectedReport?.valideLe)}
                          {selectedReport?.validePar ? ` par ${selectedReport.validePar}` : ""} — le
                          document est verrouillé et ne peut plus être modifié.
                        </p>
                      </div>
                    )}

                    {/* La zone de saisie absorbe la hauteur restante de la carte. */}
                    <div className="flex min-h-0 flex-1 flex-col">
                      <FieldLabel
                        icon="description"
                        htmlFor="cr-contenu"
                        hint={draft.trim() ? `${draft.trim().length} caractères` : "Obligatoire"}
                      >
                        Observations
                      </FieldLabel>
                      <textarea
                        id="cr-contenu"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder="Rédigez ici votre compte rendu pour le patient sélectionné..."
                        disabled={isLocked || areReportsLoading}
                        className="min-h-[280px] w-full flex-1 resize-y rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-[15px] leading-relaxed text-[#0F172A] transition placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </div>

                    <div>
                      <FieldLabel icon="image" hint="Facultatif">
                        Photo jointe
                      </FieldLabel>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={importPhoto}
                      />
                      {photoUrl ? (
                        <div className="relative inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element -- URL externe (service-upload), non gérable par next/image */}
                          <img
                            src={photoUrl}
                            alt="Photo jointe au compte rendu"
                            className="max-h-44 rounded-xl border border-[#E2E8F0] object-cover"
                          />
                          {!isLocked && (
                            <button
                              type="button"
                              onClick={() => setPhotoUrl(null)}
                              aria-label="Retirer la photo"
                              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0F172A] text-white shadow-lg transition hover:bg-[#DC2626]"
                            >
                              <span className="material-symbols-outlined text-[15px]">close</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <ActionButton
                          permission={selectedReport ? "report:update" : "report:create"}
                          onClick={() => photoInputRef.current?.click()}
                          disabled={isLocked}
                          pending={uploadPhotoMutation.isPending}
                          pendingLabel={
                            <>
                              <span className="material-symbols-outlined animate-spin text-[18px]">
                                progress_activity
                              </span>
                              Import en cours…
                            </>
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-5 text-sm font-semibold text-[#475569] transition hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1E3A8A]"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            add_photo_alternate
                          </span>
                          Importer une photo
                        </ActionButton>
                      )}
                    </div>

                    <div>
                      <FieldLabel icon="fact_check" htmlFor="cr-conclusion" hint="Facultatif">
                        Conclusion
                      </FieldLabel>
                      <textarea
                        id="cr-conclusion"
                        value={conclusion}
                        onChange={(event) => setConclusion(event.target.value)}
                        placeholder="Rédigez ici la conclusion du compte rendu..."
                        disabled={isLocked || areReportsLoading}
                        className="min-h-[130px] w-full resize-y rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm leading-relaxed text-[#0F172A] transition placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </div>
                  </div>

                  <div className="sticky bottom-0 flex flex-col gap-3 border-t border-[#E2E8F0] bg-white/95 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-6">
                    <p className="flex items-start gap-2 text-xs text-[#64748B]">
                      <span className="material-symbols-outlined text-[16px] text-[#94A3B8]">
                        info
                      </span>
                      La validation signe le compte rendu et l&apos;envoie au prescripteur : il ne
                      sera plus modifiable.
                    </p>
                    <div className="flex shrink-0 items-center justify-end gap-2">
                      <ActionButton
                        permission={selectedReport && !isLocked ? "report:delete" : "report:create"}
                        onClick={cancelReport}
                        pending={deleteMutation.isPending}
                        pendingLabel="Annulation…"
                        className="action-secondary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                        Annuler
                      </ActionButton>
                      <ActionButton
                        permission="report:validate"
                        onClick={validateAndSend}
                        disabled={!draft.trim() || isLocked}
                        pending={isSending}
                        pendingLabel={
                          <>
                            <span className="material-symbols-outlined animate-spin text-[18px]">
                              progress_activity
                            </span>
                            Envoi…
                          </>
                        }
                        className="action-success inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isLocked ? "verified" : "send"}
                        </span>
                        {isLocked ? "Envoyé au prescripteur" : "Valider et envoyer"}
                      </ActionButton>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
