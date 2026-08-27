"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, CalendarClock, Search, Filter, X, Plus, ChevronRight, Archive as ArchiveIcon, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import TopBar from "@/components/TopBar";
import ActionButton from "@/components/ActionButton";
import { useAuth } from "@/context/AuthContext";
import {
  useAllConsultations,
  useArchiveConsultation,
  useConsultationEventsSubscription,
  useMarkArrival,
  usePatientConsultationHistory,
  useSaveObservation,
  useTraiterConsultation,
} from "@/hooks/use-consultations";
import { consultationApi, getVisiteLabel, type ConsultationApi, type ConsultationHistoryEntry } from "@/lib/api/consultation";
import { useToast } from "@/components/ToastProvider";

type PatientStatus = "TOUS" | "EN ATTENTE" | "EN COURS" | "EFFECTUÉ";
type VisitType = "TOUS" | "INITIALE" | "CONTROLE";

type Appointment = {
  id: string;
  time: string;
  name: string;
  date: string;
  dateKey: string;
  status: Exclude<PatientStatus, "TOUS">;
  nature: "Consultation initiale" | "Contrôle" | "Suivi CPAP" | "Résultats Poly" | "Consultation";
  visitType: Exclude<VisitType, "TOUS">;
  isUrgent: boolean;
  isControl: boolean;
  patientId: string;
  motif: string;
  priseEnCharge?: { companyName: string; isActive: boolean } | null;
  isArrived: boolean;
  isReport: boolean;
  dossier: string;
  searchText: string;
  medecinId: string;
  /** Identifiant de la consultation dans le service qui l'a créée. */
  reference: string;
  allergies?: string;
  timeline?: Array<{
    title: string;
    date: string;
    body: string;
  }>;
};

const formatDateKey = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDateKey = () => formatDateKey(new Date());

const formatAppointmentDate = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

type ClinicalParameterRow = { id: number; nom: string; valeur: string; unite: string };

const DEFAULT_PARAMETERS: ClinicalParameterRow[] = [
  { id: 1, nom: "Tension", valeur: "", unite: "mmHg" },
  { id: 2, nom: "Température", valeur: "", unite: "°C" },
  { id: 3, nom: "Poids", valeur: "", unite: "kg" },
  { id: 4, nom: "Fréquence cardiaque", valeur: "", unite: "bpm" },
  { id: 5, nom: "Saturation O₂", valeur: "", unite: "%" },
];

/**
 * Les paramètres cliniques n'ont pas de table dédiée côté sommeil-back : ils
 * sont consignés dans les notes de l'observation, en tête du texte libre.
 */
const buildObservationNotes = (parameters: ClinicalParameterRow[], notes: string) => {
  const measured = parameters
    .filter((parameter) => parameter.nom.trim() && parameter.valeur.trim())
    .map((parameter) => `${parameter.nom.trim()} : ${parameter.valeur.trim()} ${parameter.unite}`.trim());

  return [
    measured.length ? `Paramètres cliniques — ${measured.join(" · ")}` : "",
    notes.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");
};

/**
 * `useSearchParams` bascule l'arbre client jusqu'à la frontière `Suspense` la
 * plus proche : sans cette limite, le prérendu de la route échoue.
 */
export default function ConsultationPage() {
  return (
    <Suspense fallback={<TopBar title="Consultation" />}>
      <ConsultationPageContent />
    </Suspense>
  );
}

function ConsultationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Dossier désigné par une notification (cf. lib/notification-routing.ts).
  const focusConsultationId = searchParams.get("consultationId");
  const focusPatientId = searchParams.get("patientId");
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<"today" | "all">("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientStatus>("TOUS");
  const [visitTypeFilter, setVisitTypeFilter] = useState<VisitType>("TOUS");
  const { showSuccess, showError } = useToast();
  const [reportTarget, setReportTarget] = useState<Appointment | null>(null);
  const [reportDate, setReportDate] = useState("");
  const [reportTime, setReportTime] = useState("");

  // Fiche patient : saisie locale enregistrée via l'endpoint « observations ».
  const [clinicalParameters, setClinicalParameters] = useState<ClinicalParameterRow[]>(DEFAULT_PARAMETERS);
  const [observationNotes, setObservationNotes] = useState("");
  const [diagnosticSuspicion, setDiagnosticSuspicion] = useState("");
  const [diagnosticRetenu, setDiagnosticRetenu] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useConsultationEventsSubscription();
  const traiterMutation = useTraiterConsultation();
  const saveObservationMutation = useSaveObservation();
  const markArrivalMutation = useMarkArrival();
  const archiveMutation = useArchiveConsultation();

  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== 'TOUS' || visitTypeFilter !== 'TOUS' || viewMode !== 'today';

  const { data: consultations = [], isLoading, error } = useAllConsultations();
  const { data: todayConsultationsRaw = [] } = useAllConsultations();
  const { data: patientHistory = [], isLoading: isHistoryLoading } = usePatientConsultationHistory(
    showHistory ? selectedPatient?.patientId ?? null : null
  );

  const handleSetViewMode = (mode: "today" | "all") => {
    setViewMode(mode);
  };

  const handleResetFilters = () => {
    setViewMode("today");
    setSearchQuery("");
    setStatusFilter("TOUS");
    setVisitTypeFilter("TOUS");
  };

  const handleStart = async (appt: Appointment) => {
    try {
      await consultationApi.traiterConsultation(appt.id, 'ouvrir');
    } catch (error) {
      console.error('Impossible de marquer la consultation comme en cours:', error);
    }
    router.push(`/consultation/traitement?id=${appt.id}`);
  };

  const handleOpenPatientInfo = (appt: Appointment) => {
    setSelectedPatient(appt);
    setClinicalParameters(DEFAULT_PARAMETERS);
    setObservationNotes("");
    setDiagnosticSuspicion("");
    setDiagnosticRetenu(appt.motif === "" ? "" : "");
    setShowHistory(false);
  };

  const handleClosePatientInfo = () => {
    setSelectedPatient(null);
  };

  const openReport = (appt: Appointment) => {
    setReportTarget(appt);
    setReportDate("");
    setReportTime(appt.time ?? "");
  };

  /** `consultation:treat` — replace la consultation à une nouvelle date. */
  const submitReport = async () => {
    if (!reportTarget || !reportDate) return;
    try {
      await traiterMutation.mutateAsync({
        id: reportTarget.id,
        action: "reporter",
        extra: { nouvelleDate: reportDate, nouvelleHeure: reportTime || undefined },
      });
      showSuccess(`Consultation reportée au ${new Date(`${reportDate}T00:00:00`).toLocaleDateString("fr-FR")}.`);
      setReportTarget(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Le report n'a pas pu être enregistré.");
    }
  };

  /** `consultation:treat` — confirme l'arrivée du patient à l'accueil. */
  const toggleArrival = async (appt: Appointment) => {
    try {
      await markArrivalMutation.mutateAsync({ id: appt.id, arrived: !appt.isArrived });
      showSuccess(appt.isArrived ? "Arrivée annulée." : "Patient marqué comme arrivé.");
    } catch (error) {
      showError(error instanceof Error ? error.message : "L'arrivée n'a pas pu être enregistrée.");
    }
  };

  /** `archive:list` alimenté par l'archivage d'une consultation terminée. */
  const archiveConsultation = async (appt: Appointment) => {
    try {
      await archiveMutation.mutateAsync(appt.id);
      showSuccess("Consultation archivée.");
    } catch (error) {
      showError(error instanceof Error ? error.message : "L'archivage a échoué.");
    }
  };

  /** `consultation:treat` — enregistre observation et diagnostic. */
  const saveConsultation = async () => {
    if (!selectedPatient) return;
    try {
      await saveObservationMutation.mutateAsync({
        id: selectedPatient.id,
        diagnostic: diagnosticRetenu || diagnosticSuspicion,
        notes: buildObservationNotes(clinicalParameters, observationNotes),
      });
      showSuccess("Consultation enregistrée.");
    } catch (error) {
      showError(error instanceof Error ? error.message : "L'enregistrement a échoué.");
    }
  };

  const updateParameter = (id: number, field: "nom" | "valeur" | "unite", value: string) =>
    setClinicalParameters((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));

  // Praticien connecté : aucune valeur de substitution, le sous-titre
  // disparaît tant que l'identité n'est pas connue.
  const doctorName = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  // Quota d'aujourd'hui
  const todayOnlyConsultations = todayConsultationsRaw.filter(
    (c: ConsultationApi) => formatDateKey(c.date) === getTodayDateKey()
  );
  const todayTotal = todayOnlyConsultations.length;
  const todayCompleted = todayOnlyConsultations.filter(
    (c: ConsultationApi) => c.termine || c.statut?.toUpperCase() === 'TERMINE' || c.statut?.toUpperCase() === 'TERMINÉ'
  ).length;
  const quotaMax = 18;

  const progressPercent = quotaMax > 0 ? Math.min((todayTotal / quotaMax) * 100, 100) : 0;

  const patients: Appointment[] = useMemo(() => {
    const mapped = consultations.map((consultation: ConsultationApi) => {
      const normalizedStatus = consultation.termine ? "EFFECTUÉ" : (consultation.statut?.toUpperCase().replace(/_/g, ' ') || "EN ATTENTE");
      const formattedDate = new Date(consultation.date).toLocaleDateString('fr-FR');
      const dateKey = formatDateKey(consultation.date);
      const visitLabel = getVisiteLabel(consultation);
      const isControl =
        consultation.typeVisite?.toUpperCase() === 'CONTROLE' ||
        (consultation.ordreControle !== null && consultation.ordreControle !== undefined) ||
        (consultation.consultationParenteId !== null && consultation.consultationParenteId !== undefined);
      
      const searchText = [
        consultation.patient?.displayName ?? ([consultation.patient?.prenom, consultation.patient?.nom].filter(Boolean).join(' ') || 'Patient inconnu'),
        consultation.observation?.diagnostic ?? '',
        consultation.observation?.notes ?? '',
        visitLabel,
        normalizedStatus,
        formattedDate,
        consultation.heure,
        consultation.motif ?? '',
        consultation.patient?.prenom ?? '',
        consultation.patient?.nom ?? '',
        consultation.patient?.dossier ?? '',
      ].join(' ').toLowerCase();

      return {
        id: consultation.id,
        time: consultation.heure,
        name: consultation.patient?.displayName ?? ([consultation.patient?.prenom, consultation.patient?.nom].filter(Boolean).join(' ') || 'Patient inconnu'),
        date: formattedDate,
        dateKey,
        status: normalizedStatus,
        nature: isControl ? "Contrôle" : "Consultation initiale",
        visitType: isControl ? "CONTROLE" : "INITIALE",
        isUrgent: consultation.urgence,
        isControl,
        patientId: consultation.patientId,
        motif: consultation.motif || consultation.observation?.diagnostic || '',
        priseEnCharge: consultation.patient?.priseEnCharge ?? null,
        isArrived: Boolean(consultation.arriveeAccueil),
        isReport: Boolean(consultation.estReport),
        dossier: consultation.patient?.dossier || consultation.patientId,
        searchText,
        medecinId: consultation.medecinId,
        reference: String(consultation.consultationId ?? consultation.id),
        allergies: 'Aucune signalée',
        timeline: [],
      };
    });

    return mapped.sort((a: Appointment, b: Appointment) => {
      const aUrgent = a.isUrgent && a.status !== "EFFECTUÉ";
      const bUrgent = b.isUrgent && b.status !== "EFFECTUÉ";
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;

      const aCompleted = a.status === "EFFECTUÉ";
      const bCompleted = b.status === "EFFECTUÉ";
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;

      const aReport = a.isReport && !aCompleted;
      const bReport = b.isReport && !bCompleted;
      if (aReport && !bReport) return -1;
      if (!aReport && bReport) return 1;

      const aArrived = a.isArrived && !aCompleted;
      const bArrived = b.isArrived && !bCompleted;
      if (aArrived && !bArrived) return -1;
      if (!aArrived && bArrived) return 1;

      return a.time.localeCompare(b.time);
    });
  }, [consultations]);

  const filteredAppointments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return patients.filter((appointment) => {
      const searchableText = [
        appointment.name,
        appointment.patientId,
        appointment.motif,
        appointment.nature,
        appointment.status,
        appointment.visitType,
      ]
        .join(" ")
        .toLowerCase();

      if (query && !searchableText.includes(query)) {
        return false;
      }

      if (statusFilter !== "TOUS" && appointment.status !== statusFilter) {
        return false;
      }

      if (visitTypeFilter !== "TOUS" && appointment.visitType !== visitTypeFilter) {
        return false;
      }

      if (viewMode === "today" && appointment.dateKey !== getTodayDateKey()) {
        return false;
      }

      return true;
    });
  }, [patients, searchQuery, statusFilter, visitTypeFilter, viewMode]);

  // Ouverture depuis une notification. Le dossier visé n'est pas forcément du
  // jour : la vue bascule sur « Tous » avant de l'ouvrir. Le repère n'est
  // suivi qu'une fois, l'utilisateur reste libre de naviguer ensuite. Une
  // notification peut porter l'identifiant local comme celui du service qui a
  // créé la consultation : les deux sont acceptés.
  // Traité pendant le rendu (motif « ajuster l'état quand les props
  // changent ») : un effet aurait affiché la liste filtrée du jour avant de
  // basculer, avec un clignotement visible.
  const [focusHandled, setFocusHandled] = useState(false);
  const focusRequested = focusConsultationId ?? focusPatientId;

  if (focusRequested && !focusHandled && !isLoading) {
    const match = focusConsultationId
      ? patients.find(
          (item) => String(item.id) === focusConsultationId || item.reference === focusConsultationId
        )
      : patients.find((item) => item.patientId === focusPatientId);

    setFocusHandled(true);

    if (match) {
      setViewMode("all");
      handleOpenPatientInfo(match);
    } else {
      showError("Le dossier signalé par la notification n'est pas (ou plus) dans les consultations.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <TopBar title="Consultation" searchPlaceholder="Rechercher un patient, un motif..." />

        {/* Patient List View */}
        {!selectedPatient && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {/* Header with quota */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mes consultations du jour</h1>
                  {doctorName && <p className="text-sm text-gray-500 mt-1">{doctorName}</p>}
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-white px-4 py-2.5 shadow-[0px_4px_16px_rgba(17,17,26,0.05)]">
                  <div className="relative h-9 w-9 shrink-0">
                    <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                      <circle
                        cx="18" cy="18" r="15.5" fill="none"
                        stroke={progressPercent >= 100 ? "#10B981" : "#005b82"}
                        strokeWidth="4"
                        strokeDasharray={`${(progressPercent / 100) * 97.4} 97.4`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="leading-tight">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Quota aujourd&apos;hui</p>
                    <p className="text-[15px] font-black text-[#005b82]">
                      {todayTotal}<span className="text-gray-300 font-bold">/{quotaMax}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-6 space-y-2.5 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-[0px_4px_16px_rgba(17,17,26,0.04)]">
                <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
                  <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSetViewMode('today')}
                      className={cn(
                        'flex h-7 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition-colors whitespace-nowrap',
                        viewMode === 'today' ? 'bg-white text-[#005b82] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      Aujourd&apos;hui
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetViewMode('all')}
                      className={cn(
                        'h-7 rounded-lg px-3 text-[12px] font-semibold transition-colors whitespace-nowrap',
                        viewMode === 'all' ? 'bg-white text-[#005b82] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      Tous
                    </button>
                  </div>

                  <div className="hidden h-6 w-px bg-slate-200 sm:block" />

                  <div className="relative min-w-[160px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Rechercher un patient, un motif..."
                      className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-[12px] font-medium text-slate-700 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005b82]/30"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as PatientStatus)}
                    className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[12px] font-semibold text-slate-600 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005b82]/30"
                  >
                    <option value="TOUS">Tous les statuts</option>
                    <option value="EN ATTENTE">En attente</option>
                    <option value="EN COURS">En cours</option>
                    <option value="EFFECTUÉ">Effectué</option>
                  </select>

                  <select
                    value={visitTypeFilter}
                    onChange={(event) => setVisitTypeFilter(event.target.value as VisitType)}
                    className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[12px] font-semibold text-slate-600 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005b82]/30"
                  >
                    <option value="TOUS">Tous les types</option>
                    <option value="INITIALE">Consultation initiale</option>
                    <option value="CONTROLE">Contrôle</option>
                  </select>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="action-danger flex h-9 shrink-0 items-center gap-1 rounded-xl px-3 text-[12px] font-semibold"
                    >
                      <X className="h-3.5 w-3.5" />
                      Réinitialiser
                    </button>
                  )}
                </div>
              </div>

              {/* Patient List */}
              <div className="space-y-6">
                <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0px_4px_16px_rgba(17,17,26,0.05)]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm table-fixed">
                      <thead className="bg-slate-50 text-left text-gray-500">
                        <tr>
                          <th className="px-1.5 py-2.5 font-semibold whitespace-nowrap text-[11px] w-[9%]">Date & heure</th>
                          <th className="px-1.5 py-2.5 font-semibold whitespace-nowrap text-[11px] w-[16%]">Patient</th>
                          <th className="px-1.5 py-2.5 font-semibold whitespace-nowrap text-[11px] w-[14%]">Visite</th>
                          <th className="px-1.5 py-2.5 font-semibold whitespace-nowrap text-[11px] w-[9%]">Urgence</th>
                          <th className="px-1.5 py-2.5 font-semibold w-[22%]">Motif</th>
                          <th className="px-1.5 py-2.5 font-semibold whitespace-nowrap text-[11px] w-[12%]">Statut</th>
                          <th className="px-1.5 py-2.5 font-semibold text-right whitespace-nowrap text-[11px] w-[18%]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-2 py-14 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <Calendar className="w-8 h-8 text-slate-200" />
                                <p className="text-[14px] font-semibold text-slate-500">
                                  {viewMode === 'today'
                                    ? 'Aucun patient à traiter aujourd\'hui'
                                    : 'Aucune consultation ne correspond à ces filtres'}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                        {filteredAppointments.map((patient) => (
                          <tr key={patient.id} className={cn(
                            "border-t border-gray-100 hover:bg-slate-100 align-top transition-colors",
                            patient.priseEnCharge?.isActive ? "bg-[#EAF3FA]" : ""
                          )}>
                            <td className={cn(
                              "px-1.5 py-2.5 border-l-[6px]",
                              patient.priseEnCharge?.isActive ? "border-[#005b82]" : "border-transparent"
                            )}>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  {patient.isUrgent && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                                  <span className={cn(
                                    "font-semibold text-[12px] truncate",
                                    patient.status === "EFFECTUÉ" ? "text-slate-400" : "text-[#005b82]"
                                  )}>{patient.time}</span>
                                </div>
                                <span className="text-[10px] text-gray-500 truncate">{patient.date}</span>
                              </div>
                            </td>
                            <td className="px-1.5 py-2.5 overflow-hidden">
                              <p className="font-semibold text-gray-900 leading-tight truncate text-[12px]">{patient.name}</p>
                              {patient.priseEnCharge && (
                                <p className={cn(
                                  "mt-0.5 text-[9px] font-bold truncate",
                                  patient.priseEnCharge.isActive ? "text-[#005b82]" : "text-amber-600"
                                )}>
                                  {patient.priseEnCharge.companyName}
                                </p>
                              )}
                            </td>
                            <td className="px-1.5 py-2.5 overflow-hidden">
                              <div className="flex flex-wrap gap-1">
                                <span className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider",
                                  patient.visitType === "CONTROLE" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"
                                )}>
                                  {patient.visitType === "CONTROLE" ? "Contrôle" : "Initiale"}
                                </span>
                                {patient.isReport && (
                                  <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-orange-700">
                                    Reporté
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-1.5 py-2.5">
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap",
                                patient.isUrgent ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"
                              )}>
                                {patient.isUrgent ? "Urgent" : "Normal"}
                              </span>
                            </td>
                            <td className="px-1.5 py-2.5 overflow-hidden">
                              <p className="text-gray-600 line-clamp-2 leading-snug text-[11px]">{patient.motif}</p>
                            </td>
                            <td className="px-1.5 py-2.5">
                              <div className="flex flex-col items-start gap-1">
                                <span className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap",
                                  patient.status === "EFFECTUÉ" ? "bg-[#E6F4EA] text-[#059669]" : patient.isUrgent ? "bg-red-50 text-red-700" : "bg-[#EAF3FA] text-[#006A8C]"
                                )}>
                                  {patient.status}
                                </span>
                                <span className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider whitespace-nowrap",
                                  patient.isArrived ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                                )}>
                                  {patient.isArrived ? "Arrivé" : "À confirmer"}
                                </span>
                              </div>
                            </td>
                            <td className="px-1.5 py-2.5">
                              <div className="flex flex-wrap justify-end gap-1">
                                <ActionButton
                                  permission="consultation:treat"
                                  onClick={() => handleStart(patient)}
                                  className="bg-[#005b82] hover:bg-[#004a6b] text-white rounded-lg px-2 py-1.5 h-auto text-[10px] font-bold whitespace-nowrap"
                                >
                                  Ouvrir
                                </ActionButton>
                                <ActionButton
                                  permission="consultation:read"
                                  onClick={() => handleOpenPatientInfo(patient)}
                                  className="text-[#005b82] hover:bg-slate-50 h-auto px-1.5 py-1.5 text-[10px] font-bold whitespace-nowrap"
                                >
                                  Infos
                                </ActionButton>
                                <ActionButton
                                  permission="consultation:treat"
                                  onClick={() => toggleArrival(patient)}
                                  pending={markArrivalMutation.isPending}
                                  title={patient.isArrived ? "Annuler l'arrivée" : "Marquer le patient comme arrivé"}
                                  className={cn(
                                    "h-auto rounded-lg px-1.5 py-1.5 text-[10px] font-bold whitespace-nowrap",
                                    patient.isArrived
                                      ? "text-emerald-700 hover:bg-emerald-50"
                                      : "text-slate-500 hover:bg-slate-50"
                                  )}
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                </ActionButton>
                                <ActionButton
                                  permission="consultation:treat"
                                  onClick={() => openReport(patient)}
                                  title="Reporter à un autre jour"
                                  className="text-orange-600 hover:bg-orange-50 h-auto px-1.5 py-1.5 text-[10px] font-bold whitespace-nowrap"
                                >
                                  <CalendarClock className="h-3.5 w-3.5" />
                                </ActionButton>
                                {patient.status === "EFFECTUÉ" && (
                                  <ActionButton
                                    permission="archive:list"
                                    hideWhenDenied
                                    onClick={() => archiveConsultation(patient)}
                                    pending={archiveMutation.isPending}
                                    title="Archiver la consultation"
                                    className="text-slate-500 hover:bg-slate-100 h-auto px-1.5 py-1.5 text-[10px] font-bold whitespace-nowrap"
                                  >
                                    <ArchiveIcon className="h-3.5 w-3.5" />
                                  </ActionButton>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Patient Detail View */}
        {selectedPatient && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <button
                onClick={() => setSelectedPatient(null)}
                className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                ← Retour à la liste
              </button>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Patient Info & Clinical Parameters */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Patient Header */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">{selectedPatient.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedPatient.isUrgent && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">URGENCE</span>
                        )}
                        <span className={cn(
                          "px-4 py-2 text-sm font-semibold rounded-lg",
                          selectedPatient.status === "EFFECTUÉ"
                            ? "bg-emerald-100 text-emerald-700"
                            : selectedPatient.status === "EN COURS"
                              ? "bg-green-500 text-white"
                              : "bg-slate-100 text-slate-600"
                        )}>
                          {selectedPatient.status}
                        </span>
                        <ActionButton
                          permission="consultation:treat"
                          onClick={() => handleStart(selectedPatient)}
                          className="px-4 py-2 bg-[#005b82] hover:bg-[#004a6b] text-white text-sm font-semibold rounded-lg"
                        >
                          Traiter le patient
                        </ActionButton>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Heure de rendez-vous</p>
                        <p className="font-semibold text-gray-900">{selectedPatient.time}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Priorité</p>
                        <p className="font-semibold text-gray-900">{selectedPatient.isUrgent ? "Urgence" : "Normal"}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-700 block mb-2">Motif de consultation</label>
                      <textarea
                        value={selectedPatient.motif}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Clinical Parameters */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres cliniques</h3>
                    <div className="space-y-3">
                      {clinicalParameters.map((parameter) => (
                        <div key={parameter.id} className="grid grid-cols-[1.2fr_1fr_.6fr_auto] gap-3">
                          <input
                            type="text"
                            value={parameter.nom}
                            onChange={(event) => updateParameter(parameter.id, "nom", event.target.value)}
                            placeholder="Paramètre"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={parameter.valeur}
                            onChange={(event) => updateParameter(parameter.id, "valeur", event.target.value)}
                            placeholder="Valeur"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={parameter.unite}
                            onChange={(event) => updateParameter(parameter.id, "unite", event.target.value)}
                            placeholder="Unité"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setClinicalParameters((rows) => rows.filter((row) => row.id !== parameter.id))}
                            aria-label={`Supprimer ${parameter.nom || "le paramètre"}`}
                            className="rounded-lg px-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <ActionButton
                      permission="consultation:treat"
                      onClick={() =>
                        setClinicalParameters((rows) => [...rows, { id: Date.now(), nom: "", valeur: "", unite: "" }])
                      }
                      className="action-primary mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </ActionButton>
                  </div>

                  {/* Medical Observations */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Observations médicales</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="observation-notes" className="text-sm font-medium text-gray-700 block mb-2">OBSERVATIONS MÉDICALES</label>
                        <textarea
                          id="observation-notes"
                          rows={4}
                          value={observationNotes}
                          onChange={(event) => setObservationNotes(event.target.value)}
                          placeholder="Saisir les notes d'observation clinique..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="diagnostic-suspicion" className="text-sm font-medium text-gray-700 block mb-2">SUSPICION DIAGNOSTIQUE</label>
                        <textarea
                          id="diagnostic-suspicion"
                          rows={3}
                          value={diagnosticSuspicion}
                          onChange={(event) => setDiagnosticSuspicion(event.target.value)}
                          placeholder="Écrire la suspicion clinique..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="diagnostic-retenu" className="text-sm font-medium text-gray-700 block mb-2">DIAGNOSTIC RETENU</label>
                        <textarea
                          id="diagnostic-retenu"
                          rows={3}
                          value={diagnosticRetenu}
                          onChange={(event) => setDiagnosticRetenu(event.target.value)}
                          placeholder="Écrire le diagnostic retenu..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Patient Details & Help */}
                <div className="space-y-6">
                  {/* Patient Details */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails Patient</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Identité</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{selectedPatient.name}</p>
                        <p className="text-xs text-gray-500">{selectedPatient.dossier}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Prise en charge</p>
                        <p className={cn(
                          "text-sm font-semibold mt-1",
                          selectedPatient.priseEnCharge?.isActive ? "text-blue-600" : "text-amber-600"
                        )}>
                          {selectedPatient.priseEnCharge?.companyName || "NON PRIS EN CHARGE"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Urgence</p>
                        <div className="flex items-center gap-2 mt-1">
                          {selectedPatient.isUrgent && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                          <p className="text-sm font-semibold text-gray-900">{selectedPatient.isUrgent ? "Urgence" : "Normal"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Allergies connues</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{selectedPatient.allergies}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Historique clinique</p>
                        <div className="mt-2 space-y-2">
                          {!showHistory && (
                            <p className="text-xs text-gray-500">
                              Ouvrez le dossier historique pour charger les consultations précédentes.
                            </p>
                          )}
                          {showHistory && isHistoryLoading && (
                            <p className="text-xs text-gray-500">Chargement de l&apos;historique…</p>
                          )}
                          {showHistory && !isHistoryLoading && patientHistory.length === 0 && (
                            <p className="text-xs text-gray-500">Aucun antécédent de consultation.</p>
                          )}
                          {showHistory &&
                            (patientHistory as ConsultationHistoryEntry[]).map((item) => (
                              <div key={item.id} className="border-l-2 border-blue-500 pl-3">
                                <p className="text-xs font-semibold text-gray-900">
                                  {item.typeVisite === "CONTROLE" ? "Contrôle" : "Consultation"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(item.date).toLocaleDateString("fr-FR")} · {item.heure}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {item.diagnostic || item.observations || "Consultation sans observation"}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Help Section */}
                  <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">AIDE AU DIAGNOSTIC</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Consultez les antécédents médicaux complets du patient pour affiner votre diagnostic.
                    </p>
                    <ActionButton
                      permission="consultation:read"
                      onClick={() => setShowHistory((open) => !open)}
                      className="action-secondary flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
                    >
                      {showHistory ? "Masquer le dossier historique" : "Consulter le dossier historique"}
                      <ChevronRight className={cn("w-4 h-4 transition-transform", showHistory && "rotate-90")} />
                    </ActionButton>
                  </div>

                  {/* Save Button */}
                  <ActionButton
                    permission="consultation:treat"
                    onClick={saveConsultation}
                    pending={saveObservationMutation.isPending}
                    pendingLabel="Enregistrement…"
                    className="action-success w-full py-3 rounded-lg font-semibold"
                  >
                    Sauvegarder la consultation
                  </ActionButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Reporter la consultation
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-900">{reportTarget.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Actuellement le {reportTarget.date} à {reportTarget.time}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                aria-label="Fermer"
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="report-date" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Nouvelle date
                </label>
                <input
                  id="report-date"
                  type="date"
                  value={reportDate}
                  min={getTodayDateKey()}
                  onChange={(event) => setReportDate(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#005b82]/30"
                />
              </div>
              <div>
                <label htmlFor="report-time" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Nouvelle heure
                </label>
                <input
                  id="report-time"
                  type="time"
                  value={reportTime}
                  onChange={(event) => setReportTime(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#005b82]/30"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="rounded-2xl px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50"
              >
                Annuler
              </button>
              <ActionButton
                permission="consultation:treat"
                onClick={submitReport}
                disabled={!reportDate}
                pending={traiterMutation.isPending}
                pendingLabel="Report en cours…"
                className="action-warning rounded-2xl px-4 py-2 text-sm font-bold"
              >
                Confirmer le report
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
