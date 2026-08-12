"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CalendarRange, CalendarClock, ArrowLeftRight, Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import TopBar from "@/components/TopBar";
import { ConsultationTabs } from "@/components/ConsultationTabs";
import { consultationApi, ConsultationApi } from "@/lib/api/consultation";
import { patientApi } from "@/lib/api/patient";
import { accueilApi } from "@/lib/api/accueil";

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

type PatientStatus = "TOUS" | "EN ATTENTE" | "EN COURS" | "EFFECTUÉ";
type VisitType = "TOUS" | "INITIALE" | "CONTROLE";

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

const formatAppointmentDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date).replace(/,/g, "");

const todayDateLabel = formatAppointmentDate(new Date());

const statusOptions: PatientStatus[] = ["TOUS", "EN ATTENTE", "EN COURS", "EFFECTUÉ"];
const visitOptions: VisitType[] = ["TOUS", "INITIALE", "CONTROLE"];

const formatDateKey = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDateKey = () => formatDateKey(new Date());

const getTomorrowDateKey = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatDateKey(date);
};

export default function PolysomnographiePage() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
  const [viewMode, setViewMode] = useState<"today" | "all">("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientStatus>("TOUS");
  const [visitTypeFilter, setVisitTypeFilter] = useState<VisitType>("TOUS");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<ConsultationApi | null>(null);
  const [reportTarget, setReportTarget] = useState<ConsultationApi | null>(null);
  const [reportDate, setReportDate] = useState("");
  const [appointmentsList, setAppointmentsList] = useState<ConsultationApi[]>([]);
  const [quotaMax, setQuotaMax] = useState(18);

  const updatePrescription = (id: number, nextStatus: PrescriptionItem["status"]) => {
    setPrescriptions((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return { ...item, status: nextStatus };
      })
    );
  };

  const handleOpenConsultation = (appointment: ConsultationApi) => {
    setAppointmentsList((current) =>
      current.map((item) =>
        item.id === appointment.id ? { ...item, statut: "EN COURS", arriveeAccueil: true } : item,
      ),
    );
    router.push(`/consultation/traitement?id=${appointment.id}&patient=${encodeURIComponent(appointment.patient?.displayName || '')}`);
  };

  const handleOpenPatientInfo = async (appointment: ConsultationApi) => {
    try {
      const patientInfo = await patientApi.getPatientById(appointment.patientId);
      setSelectedPatient({ ...appointment, patient: patientInfo });
    } catch (error) {
      console.error('Error fetching patient info:', error);
      setSelectedPatient(appointment);
    }
  };

  const handleReportPatient = (appointment: ConsultationApi) => {
    setReportTarget(appointment);
    setReportDate("");
  };

  const submitReport = async () => {
    if (!reportTarget || !reportDate) {
      return;
    }

    try {
      await consultationApi.traiterConsultation(reportTarget.id, 'reporter', { nouvelleDate: reportDate });
      
      const nextDate = formatAppointmentDate(new Date(reportDate));

      setAppointmentsList((current) =>
        current.map((item) =>
          item.id === reportTarget.id
            ? {
                ...item,
                date: nextDate,
                statut: "EN ATTENTE",
                arriveeAccueil: false,
                estReport: false,
              }
            : item,
        ),
      );

      setReportTarget(null);
      setReportDate("");
    } catch (error) {
      console.error('Error reporting consultation:', error);
    }
  };

  const handleSetViewMode = (mode: "today" | "all") => {
    setViewMode(mode);
    setDateFrom("");
    setDateTo("");
  };

  const handleResetFilters = () => {
    setViewMode("today");
    setSearchQuery("");
    setStatusFilter("TOUS");
    setVisitTypeFilter("TOUS");
    setDateFrom("");
    setDateTo("");
  };

  const doctorName = "Dr. Jean Dupont";

  // Quota d'aujourd'hui
  const todayKey = getTodayDateKey();
  const todayTotal = appointmentsList.filter((appt) => appt.date === todayDateLabel).length;
  const todayCompleted = appointmentsList.filter((appt) => appt.statut === "EFFECTUÉ" && appt.date === todayDateLabel).length;

  const progressPercent = quotaMax > 0 ? Math.min((todayTotal / quotaMax) * 100, 100) : 0;

  const filteredAppointments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return appointmentsList.filter((appointment) => {
      const searchableText = [
        appointment.patient?.displayName || '',
        appointment.patientId,
        appointment.motif || '',
        appointment.typeVisite || '',
        appointment.statut,
      ]
        .join(" ")
        .toLowerCase();

      if (query && !searchableText.includes(query)) {
        return false;
      }

      if (statusFilter !== "TOUS" && appointment.statut !== statusFilter) {
        return false;
      }

      if (visitTypeFilter !== "TOUS") {
        const visitType = appointment.typeVisite?.toUpperCase() === "CONTROLE" ? "CONTROLE" : "INITIALE";
        if (visitType !== visitTypeFilter) {
          return false;
        }
      }

      if (viewMode === "today" && appointment.date !== todayDateLabel) {
        return false;
      }

      if (viewMode === "all") {
        const appointmentDate = new Date(appointment.date);

        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (appointmentDate < fromDate) {
            return false;
          }
        }

        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (appointmentDate > toDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [appointmentsList, searchQuery, statusFilter, visitTypeFilter, viewMode, dateFrom, dateTo]);

  const hasDateRange = Boolean(dateFrom || dateTo);
  const hasActiveFilters = hasDateRange || searchQuery.trim().length > 0 || statusFilter !== "TOUS" || visitTypeFilter !== "TOUS" || viewMode !== "today";

  // Load consultations on mount
  useEffect(() => {
    const loadConsultations = async () => {
      try {
        const consultations = await consultationApi.getAllConsultations({ date: todayDateLabel });
        setAppointmentsList(consultations);
      } catch (error) {
        console.error('Error loading consultations:', error);
      }
    };
    loadConsultations();
  }, []);

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ConsultationTabs />

      <div className="p-4 sm:p-6 lg:p-8 flex-1">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 2xl:grid-cols-3 gap-8">

          {/* Left Column: Consultation List */}
          <div className="2xl:col-span-2">
            <div className="mb-6 sm:mb-8 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-[20px] sm:text-[26px] font-extrabold text-gray-900 leading-tight tracking-tight">Mes consultations du jour</h1>
                <p className="text-[12px] sm:text-[14px] text-gray-500 mt-1.5 font-medium">{doctorName}</p>
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
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Quota aujourd'hui</p>
                  <p className="text-[15px] font-black text-[#005b82]">
                    {todayTotal}<span className="text-gray-300 font-bold">/{quotaMax}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 space-y-2.5 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-[0px_4px_16px_rgba(17,17,26,0.04)]">
              {/* Ligne 1 : vue rapide + recherche */}
              <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('today')}
                    className={cn(
                      'flex h-7 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition-colors whitespace-nowrap',
                      viewMode === 'today' && !hasDateRange ? 'bg-white text-[#005b82] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Aujourd'hui
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('all')}
                    className={cn(
                      'h-7 rounded-lg px-3 text-[12px] font-semibold transition-colors whitespace-nowrap',
                      viewMode === 'all' && !hasDateRange ? 'bg-white text-[#005b82] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    Tous
                  </button>
                </div>

                <div className="hidden h-6 w-px bg-slate-200 sm:block" />

                {/* Recherche */}
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

              {/* Ligne 2 : statut, type de visite, plage de dates */}
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

                <div className={cn(
                  "flex h-9 min-w-0 flex-[2] items-center gap-1.5 rounded-xl border px-2.5 transition-colors",
                  hasDateRange ? "border-[#005b82]/40 bg-[#EAF3FA]" : "border-slate-200 bg-slate-50"
                )}>
                  <CalendarRange className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="h-full min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-slate-600 focus:outline-none"
                  />
                  <span className="shrink-0 text-slate-300">→</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="h-full min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-slate-600 focus:outline-none"
                  />
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex h-9 shrink-0 items-center gap-1 rounded-xl px-3 text-[12px] font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

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
                                {viewMode === 'today' && !hasDateRange
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
                          patient.patient?.priseEnCharge?.isActive ? "bg-[#EAF3FA]" : ""
                        )}>
                          <td className={cn(
                            "px-1.5 py-2.5 border-l-[6px]",
                            patient.patient?.priseEnCharge?.isActive ? "border-[#005b82]" : "border-transparent"
                          )}>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                {patient.urgence && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                                <span className={cn(
                                  "font-semibold text-[12px] truncate",
                                  patient.statut === "EFFECTUÉ" ? "text-slate-400" : "text-[#005b82]"
                                )}>{patient.heure}</span>
                              </div>
                              <span className="text-[10px] text-gray-500 truncate">{patient.date}</span>
                            </div>
                          </td>
                          <td className="px-1.5 py-2.5 overflow-hidden">
                            <p className="font-semibold text-gray-900 leading-tight truncate text-[12px]">{patient.patient?.displayName}</p>
                            {patient.patient?.priseEnCharge && (
                              <p className={cn(
                                "mt-0.5 text-[9px] font-bold truncate",
                                patient.patient.priseEnCharge.isActive ? "text-[#005b82]" : "text-amber-600"
                              )}>
                                {patient.patient.priseEnCharge.companyName}
                              </p>
                            )}
                          </td>
                          <td className="px-1.5 py-2.5 overflow-hidden">
                            <div className="flex flex-wrap gap-1">
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider",
                                patient.typeVisite?.toUpperCase() === "CONTROLE" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"
                              )}>
                                {patient.typeVisite?.toUpperCase() === "CONTROLE" ? "Contrôle" : "Initiale"}
                              </span>
                              {patient.estReport && (
                                <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-orange-700">
                                  Reporté
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-1.5 py-2.5">
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap",
                              patient.urgence ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"
                            )}>
                              {patient.urgence ? "Urgent" : "Normal"}
                            </span>
                          </td>
                          <td className="px-1.5 py-2.5 overflow-hidden">
                            <p className="text-gray-600 line-clamp-2 leading-snug text-[11px]">{patient.motif}</p>
                          </td>
                          <td className="px-1.5 py-2.5">
                            <div className="flex flex-col items-start gap-1">
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap",
                                patient.statut === "EFFECTUÉ" ? "bg-[#E6F4EA] text-[#059669]" : patient.urgence ? "bg-red-50 text-red-700" : "bg-[#EAF3FA] text-[#006A8C]"
                              )}>
                                {patient.statut}
                              </span>
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider whitespace-nowrap",
                                patient.arriveeAccueil ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                              )}>
                                {patient.arriveeAccueil ? "Arrivé" : "À confirmer"}
                              </span>
                            </div>
                          </td>
                          <td className="px-1.5 py-2.5">
                            <div className="flex flex-wrap justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenConsultation(patient)}
                                className="bg-[#005b82] hover:bg-[#004a6b] text-white rounded-lg px-2 py-1.5 h-auto text-[10px] font-bold whitespace-nowrap"
                              >
                                Ouvrir
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenPatientInfo(patient)}
                                className="text-[#005b82] hover:bg-slate-50 h-auto px-1.5 py-1.5 text-[10px] font-bold whitespace-nowrap"
                              >
                                Infos
                              </button>
                              <button
                                type="button"
                                title="Reporter à un autre jour"
                                onClick={() => handleReportPatient(patient)}
                                className="text-orange-600 hover:bg-orange-50 h-auto px-1.5 py-1.5 text-[10px] font-bold whitespace-nowrap"
                              >
                                <CalendarClock className="h-3.5 w-3.5" />
                              </button>
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

          {/* Right Column: Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-1 gap-6 sticky top-8 self-start">
            {/* Stats Widget */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#005b82] font-extrabold uppercase tracking-[0.1em] text-[11px] px-1">
                <Calendar className="w-4 h-4" />
                <span>Vue d'ensemble</span>
              </div>

              <div className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 shadow-[0px_4px_16px_rgba(17,17,26,0.05)] border border-gray-100">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">MON QUOTA AUJOURD'HUI</span>
                  <span className="text-[13px] sm:text-[14px] font-black text-[#005b82]">
                    {todayTotal}/{quotaMax}
                  </span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", progressPercent >= 100 ? "bg-emerald-500" : "bg-[#005b82]")}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between mt-8 gap-4">
                  <div className="flex-1 bg-[#F8FAFC] rounded-2xl p-4 flex flex-col items-center">
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 tracking-widest mb-2 uppercase">Aujourd'hui</span>
                    <span className="text-2xl sm:text-3xl font-black text-[#005b82] leading-none">
                      {todayTotal < 10 ? `0${todayTotal}` : todayTotal}
                    </span>
                  </div>
                  <div className="flex-1 bg-[#F8FAFC] rounded-2xl p-4 flex flex-col items-center">
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 tracking-widest mb-2 uppercase">Effectuées</span>
                    <span className="text-2xl sm:text-3xl font-black text-[#059669] leading-none">
                      {todayCompleted < 10 ? `0${todayCompleted}` : todayCompleted}
                    </span>
                  </div>
                  <div className="flex-1 bg-[#F8FAFC] rounded-2xl p-4 flex flex-col items-center">
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 tracking-widest mb-2 uppercase">Quota max</span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-500 leading-none">
                      {quotaMax < 10 ? `0${quotaMax}` : quotaMax}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Access */}
            <div className="bg-[#F5F8FA] rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 border border-[#EAF3FA]">
              <h3 className="text-[10px] sm:text-[11px] font-extrabold text-[#005b82] uppercase tracking-[0.1em] mb-5 sm:mb-6 px-1">ACCES RAPIDES</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/consultation/planning-complet')}
                  className="w-full cursor-pointer bg-white hover:bg-gray-50 transition-colors text-left px-4 sm:px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-sm border border-transparent"
                >
                  <Calendar className="w-5 h-5 text-[#005b82]" strokeWidth={2.5} />
                  <span className="text-[12px] sm:text-[13px] font-bold text-gray-900 leading-snug">Planning complet</span>
                </button>
                <button className="w-full cursor-pointer bg-white hover:bg-gray-50 transition-colors text-left px-4 sm:px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-sm border border-transparent">
                  <ArrowLeftRight className="w-5 h-5 text-[#005b82]" strokeWidth={2.5} />
                  <span className="text-[12px] sm:text-[13px] font-bold text-gray-900 leading-snug">Créneau alternatif</span>
                </button>
              </div>
            </div>

            {/* Prescriptions Section */}
            <div className="bg-white rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 shadow-[0px_4px_16px_rgba(17,17,26,0.05)] border border-gray-100">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[16px] font-semibold text-gray-900">
                    Prescriptions externes
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Planifier et gérer les examens
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                    {prescriptions.length}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF3FA] px-2 py-1 text-[10px] font-semibold text-[#005b82]">
                    {prescriptions.filter((item) => item.status === "started").length} en cours
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {prescriptions.map((item) => {
                  const statusLabel = statusLabels[item.status];
                  const statusClass = statusStyles[item.status];

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {item.detail}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Info Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Patient</p>
                <h2 className="mt-1 text-xl font-extrabold text-gray-900">{selectedPatient.patient?.displayName}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between gap-4">
                <span className="font-medium text-gray-500">ID patient</span>
                <span className="font-semibold text-gray-900">{selectedPatient.patientId}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-medium text-gray-500">Statut</span>
                <span className="font-semibold text-gray-900">{selectedPatient.statut}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-medium text-gray-500">Visite</span>
                <span className="font-semibold text-gray-900">{selectedPatient.typeVisite}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-medium text-gray-500">Motif</span>
                <span className="font-semibold text-gray-900 text-right">{selectedPatient.motif}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  handleOpenConsultation(selectedPatient);
                  setSelectedPatient(null);
                }}
                className="rounded-2xl bg-[#005b82] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#004a6b]"
              >
                Commencer la consultation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Reporter</p>
                <h2 className="mt-1 text-xl font-extrabold text-gray-900">{reportTarget.patient?.displayName}</h2>
              </div>
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
              Nouvelle date
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(event) => setReportDate(event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#005b82]/30"
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!reportDate}
                onClick={submitReport}
                className="rounded-2xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-200"
              >
                Reporter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
