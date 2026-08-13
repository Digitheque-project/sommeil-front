"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CalendarRange, CalendarClock, Search, Filter, X, Bell, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAllConsultations, useConsultationEventsSubscription, useTraiterConsultation } from "@/hooks/use-consultations";
import { consultationApi, getVisiteLabel, type ConsultationApi } from "@/lib/api/consultation";

type PatientStatus = "TOUS" | "EN ATTENTE" | "EN COURS" | "EFFECTUÉ";
type VisitType = "TOUS" | "INITIALE" | "CONTROLE";

type Appointment = {
  id: number;
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

export default function ConsultationPage() {
  const router = useRouter();
  const [selectedPatient, setSelectedPatient] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<"today" | "all">("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientStatus>("TOUS");
  const [visitTypeFilter, setVisitTypeFilter] = useState<VisitType>("TOUS");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  useConsultationEventsSubscription();
  const { mutateAsync: traiterMutation } = useTraiterConsultation();

  const hasDateRange = Boolean(dateFrom || dateTo);
  const hasActiveFilters = hasDateRange || searchQuery.trim().length > 0 || statusFilter !== 'TOUS' || visitTypeFilter !== 'TOUS' || viewMode !== 'today';

  const queryFilters = hasDateRange
    ? { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }
    : viewMode === 'today'
      ? { date: getTodayDateKey() }
      : undefined;

  const { data: consultations = [], isLoading, error } = useAllConsultations(queryFilters);
  const { data: todayConsultationsRaw = [] } = useAllConsultations({ date: getTodayDateKey() });

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
  };

  const handleClosePatientInfo = () => {
    setSelectedPatient(null);
  };

  const doctorName = "Dr. Sarobidy RAMAMPIONOSON";

  // Quota d'aujourd'hui
  const todayTotal = todayConsultationsRaw.length;
  const todayCompleted = todayConsultationsRaw.filter(
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
  }, [patients, searchQuery, statusFilter, visitTypeFilter, viewMode, dateFrom, dateTo]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bonjour Sarobidy</p>
              <p className="text-lg font-semibold text-gray-900">{doctorName}</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  SR
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Patient List View */}
        {!selectedPatient && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {/* Header with quota */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mes consultations du jour</h1>
                  <p className="text-sm text-gray-500 mt-1">{doctorName}</p>
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

              {/* Filters */}
              <div className="mb-6 space-y-2.5 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-[0px_4px_16px_rgba(17,17,26,0.04)]">
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
                                <button
                                  type="button"
                                  onClick={() => handleStart(patient)}
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
                        <button className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg">EN COURS</button>
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
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Tension</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="120/80"
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-500 self-center">mmHg</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Température</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="37.0"
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-500 self-center">°C</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Poids</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="70"
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-500 self-center">kg</span>
                        </div>
                      </div>
                    </div>
                    <button className="action-primary mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium">
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>

                  {/* Medical Observations */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Observations médicales</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1">Fréquence cardiaque</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="72"
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-500 self-center">bpm</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1">Saturation O2</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="98"
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-500 self-center">%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">OBSERVATIONS MÉDICALES</label>
                        <textarea
                          rows={4}
                          placeholder="Saisir les notes d'observation clinique..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">SUSPICION DIAGNOSTIQUE</label>
                        <textarea
                          rows={3}
                          placeholder="Écrire la suspicion clinique..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">DIAGNOSTIC RETENU</label>
                        <textarea
                          rows={3}
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
                          {selectedPatient.timeline?.map((item, index) => (
                            <div key={index} className="border-l-2 border-blue-500 pl-3">
                              <p className="text-xs font-semibold text-gray-900">{item.title}</p>
                              <p className="text-xs text-gray-500">{item.date}</p>
                              <p className="text-xs text-gray-600 mt-1">{item.body}</p>
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
                    <button className="action-secondary flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium">
                      Consulter le dossier historique
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Save Button */}
                  <button
                    className="action-success w-full py-3 rounded-lg font-semibold"
                  >
                    Sauvegarder la consultation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
