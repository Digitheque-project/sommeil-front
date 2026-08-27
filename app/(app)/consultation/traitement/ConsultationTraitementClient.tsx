"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import ActionButton from "@/components/ActionButton";
import { useConsultation, useFinalizeConsultation, usePatientConsultationHistory } from "@/hooks/use-consultations";
import { consultationApi, type HospitalisationServiceOption } from "@/lib/api/consultation";
import { creerOrdonnanceMedicale, creerPrescriptionMedicale, creerPrescriptionNonMedicale } from "@/lib/prescription-api";
import type { ClinicalParameter as ApiClinicalParameter, ConsultationHistoryEntry } from "@/lib/api/consultation";
import type { PharmacieArticle } from "@/lib/prescription-api";
import { MedicamentAutocomplete } from "@/components/prescription/medicament-autocomplete";
import { CHU_ID } from "@/lib/config";
import { useAuth } from "@/context/AuthContext";

type ClinicalParameter = { id: number; nom: string; valeur: string; unite: string };
type Medication = { id: number; nom: string; dosage: string; quantite: number; quantiteType: string; voie: string; frequenceType: string; frequenceValeur: number; dureeJours: number; instructions: string; remarques: string };
type CareInstruction = { id: number; type: string; libelle: string; dureeJours: number; frequenceType: string; frequenceValeur: number; instructions: string };

const defaultParameters: ClinicalParameter[] = [
  { id: 1, nom: "Tension", valeur: "", unite: "mmHg" },
  { id: 2, nom: "Température", valeur: "", unite: "°C" },
  { id: 3, nom: "Poids", valeur: "", unite: "kg" },
  { id: 4, nom: "Taille", valeur: "", unite: "cm" },
  { id: 5, nom: "Fréquence cardiaque", valeur: "", unite: "bpm" },
  { id: 6, nom: "Saturation O₂", valeur: "", unite: "%" },
];

const fieldClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#006A8C] focus:bg-white focus:ring-2 focus:ring-[#006A8C]/10";
const createMedication = (): Medication => ({ id: Date.now(), nom: "", dosage: "", quantite: 1, quantiteType: "COMPRIME", voie: "", frequenceType: "", frequenceValeur: 0, dureeJours: 0, instructions: "", remarques: "" });
const createInstruction = (): CareInstruction => ({ id: Date.now(), type: "HYGIENE", libelle: "", dureeJours: 0, frequenceType: "", frequenceValeur: 0, instructions: "" });

export default function ConsultationTraitementClient({
  patient,
  consultationId,
  mode,
  origin,
}: Readonly<{ patient?: string; consultationId?: string; mode?: string; origin?: string }>) {
  const router = useRouter();
  const { data: consultation, isLoading, error } = useConsultation(consultationId ?? "");
  const { data: history = [] } = usePatientConsultationHistory(consultation?.patientId ?? null);
  const finalizeMutation = useFinalizeConsultation();
  const { user } = useAuth();
  // Repli sur le praticien connecté quand la consultation n'a pas de médecin
  // assigné : sans identifiant valide, l'API prescription rejette tout envoi
  // avec « prescripteurId must be a string ».
  const prescripteurId = consultation?.medecinId || user?.userId;

  const [activeSection, setActiveSection] = useState<"medicament" | "non-medicament">("medicament");
  const [diagnosticSuspicion, setDiagnosticSuspicion] = useState("");
  const [diagnosticRetenu, setDiagnosticRetenu] = useState("");
  const [notes, setNotes] = useState("");
  const [parameters, setParameters] = useState<ClinicalParameter[]>(defaultParameters);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [instructions, setInstructions] = useState<CareInstruction[]>([]);
  const [followUp, setFollowUp] = useState({ motif: "", niveau: "NIVEAU_1", date: "" });
  const [hospitalisation, setHospitalisation] = useState({ motif: "", service: "" });
  const [toast, setToast] = useState<string | null>(null);
  const [hospitalisationServices, setHospitalisationServices] = useState<HospitalisationServiceOption[]>([]);
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [savingHospitalisation, setSavingHospitalisation] = useState(false);
  const [followUpSaved, setFollowUpSaved] = useState(false);
  const [hospitalisationStatus, setHospitalisationStatus] = useState<"VALIDE" | "EN_ATTENTE" | null>(null);
  const [noTreatmentReason, setNoTreatmentReason] = useState("");
  const [showNoTreatmentModal, setShowNoTreatmentModal] = useState(false);
  const [pendingOrdonnance, setPendingOrdonnance] = useState<{ id: string; medicaments: Array<Medication & { selected: boolean; ordonnanceQuantite: number }> } | null>(null);
  const [ordonnanceLoading, setOrdonnanceLoading] = useState(false);
  const [followUpConsultationId, setFollowUpConsultationId] = useState<string | null>(null);

  // Même contrat de navigation que Consultation Externe. Les différentes vues
  // externes sont regroupées dans la liste Consultation du centre de sommeil.
  const backHref = "/consultation";
  const isControlMode = mode === "controle";
  const goToParacliniques = () => {
    const params = new URLSearchParams({ patientId: consultation?.patientId ?? "", consultationId: consultationId ?? "" });
    if (consultation?.patient?.nom) params.set("patientNom", consultation.patient.nom);
    if (consultation?.patient?.prenom) params.set("patientPrenom", consultation.patient.prenom);
    if (consultation?.patient?.sexe) params.set("patientSexe", consultation.patient.sexe);
    if (consultation?.patient?.dateNaissance) params.set("patientDateNaissance", consultation.patient.dateNaissance);
    // Un médecin non renseigné ne doit pas se transmettre en « null » textuel :
    // le module de prescription le prendrait pour un identifiant valide.
    // À défaut de médecin assigné à la consultation, on retombe sur le
    // praticien connecté plutôt que de laisser prescripteurId absent.
    if (prescripteurId) params.set("prescripteurId", prescripteurId);
    if (origin) params.set("origin", origin);
    router.push(`/consultation/traitement/prescriptions?${params.toString()}`);
  };

  // Remplissage du formulaire depuis la consultation chargée.
  //
  // Fait pendant le rendu (motif documenté « ajuster l'état quand les props
  // changent ») et non dans un effet : un effet provoquait un rendu en
  // cascade avec un formulaire vide visible entre les deux.
  //
  // Le garde par identifiant est essentiel : un refetch de react-query
  // (retour sur l'onglet, invalidation après enregistrement) renvoie un
  // nouvel objet, et sans lui la saisie en cours du praticien était écrasée.
  const [hydratedConsultationId, setHydratedConsultationId] = useState<string | null>(null);

  if (consultation && hydratedConsultationId !== String(consultation.id)) {
    setHydratedConsultationId(String(consultation.id));
    setDiagnosticSuspicion(consultation.observation?.diagnosticSuspicion ?? "");
    setDiagnosticRetenu(consultation.observation?.diagnosticRetenu ?? consultation.observation?.diagnostic ?? "");
    setNotes(consultation.observation?.notes ?? "");
    setParameters(
      consultation.parametresCliniques?.length
        ? consultation.parametresCliniques.map((item: ApiClinicalParameter, index: number) => ({
            id: item.id ?? index + 1,
            nom: item.nom,
            valeur: item.valeur,
            unite: item.unite ?? "",
          }))
        : defaultParameters
    );

    const existingNonMedical = consultation.nonMedicamentPrescriptions?.[0];
    if (existingNonMedical) {
      setFollowUp({
        motif: existingNonMedical.rdvMotif ?? "",
        niveau: existingNonMedical.rdvNiveau ?? "NIVEAU_1",
        date: existingNonMedical.rdvDate ? new Date(existingNonMedical.rdvDate).toISOString().slice(0, 10) : "",
      });
      setHospitalisation({
        motif: existingNonMedical.hospitalisationMotif ?? "",
        service: existingNonMedical.hospitalisationService ?? "",
      });
      // Une demande déjà enregistrée reste signalée après rechargement :
      // sinon le praticien la ressaisissait sans savoir qu'elle était partie.
      setFollowUpSaved(Boolean(existingNonMedical.rdvDate));
      setHospitalisationStatus(existingNonMedical.hospitalisationStatus ?? null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    consultationApi.getHospitalisationServices()
      .then((services) => { if (!cancelled) setHospitalisationServices(services); })
      .catch(() => { if (!cancelled) setHospitalisationServices([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const updateParameter = (id: number, field: keyof Omit<ClinicalParameter, "id">, value: string) =>
    setParameters((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));

  const updateMedication = (id: number, field: keyof Omit<Medication, "id">, value: string) =>
    setMedications((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));

  // Sélection d'un article du stock pharmacie : préremplit nom + dosage
  // plutôt que de laisser le praticien les ressaisir à la main.
  const selectMedicationArticle = (id: number, article: PharmacieArticle) =>
    setMedications((items) => items.map((item) => item.id === id
      ? { ...item, nom: `${article.dci}${article.conditionnement ? ` — ${article.conditionnement}` : ""}`, dosage: article.dosage || item.dosage }
      : item));

  const finishConsultation = async () => {
    if (!consultationId) return;
    // Les demandes déjà enregistrées (contrôle, hospitalisation) ne sont pas
    // renvoyées : le backend les conserve, les réémettre vides les écraserait.
    const nonMedicaments = {
      recommandationsNotes: instructions.map((item) => item.libelle).filter(Boolean).join("\n"),
      ...(followUpSaved ? {} : { rdvMotif: followUp.motif, rdvNiveau: followUp.niveau, rdvDate: followUp.date }),
      ...(hospitalisationStatus ? {} : { hospitalisationMotif: hospitalisation.motif, hospitalisationService: hospitalisation.service }),
    };
    const observation = { diagnosticSuspicion, diagnosticRetenu, diagnostic: diagnosticRetenu, notes };

    try {
      const finalizeResult = await finalizeMutation.mutateAsync({
        id: consultationId,
        data: {
          // Champs directs pour le service Sommeil et structure complète pour
          // l'API Consultation Externe lorsqu'elle est disponible.
          diagnostic: diagnosticRetenu,
          notes,
          observation,
          parametres: parameters.filter((item) => item.nom.trim() || item.valeur.trim()),
          nonMedicaments,
          medicaments: medications.filter((item) => item.nom.trim()),
        },
      });
      const generatedFollowUpId = (finalizeResult as { followUp?: { id?: string | number } })?.followUp?.id;
      const generatedFollowUpIdAsString = generatedFollowUpId != null ? String(generatedFollowUpId) : null;
      if (generatedFollowUpIdAsString) setFollowUpConsultationId(generatedFollowUpIdAsString);
      const validMedications = medications.filter((item) => item.nom.trim());
      if (validMedications.length > 0) {
        try {
          const prescription = await creerPrescriptionMedicale({
            patientId: consultation.patientId,
            prescripteurId,
            urgence: consultation.urgence ? "URGENT" : "NORMAL",
            medicaments: validMedications.map((item) => ({
              nom: item.nom, dose: item.dosage, quantite: item.quantite, quantiteType: item.quantiteType,
              voie: item.voie || undefined, frequenceType: item.frequenceType || undefined,
              frequenceValeur: item.frequenceValeur || undefined, dureeJours: item.dureeJours || undefined,
              instructions: item.instructions || undefined, remarques: item.remarques || undefined,
            })),
          });
          setPendingOrdonnance({
            id: (prescription as { id: string }).id,
            medicaments: validMedications.map((item) => ({ ...item, selected: true, ordonnanceQuantite: item.quantite })),
          });
          return;
        } catch (prescriptionError) {
          setToast(`Consultation finalisée, mais l'envoi à la pharmacie a échoué : ${prescriptionError instanceof Error ? prescriptionError.message : "erreur inconnue"}`);
          return;
        }
      }
      await sendNonMedicalAndLeave(generatedFollowUpIdAsString);
    } catch (submitError) {
      setToast(submitError instanceof Error ? submitError.message : "La consultation n'a pas pu être finalisée.");
    }
  };

  const sendNonMedicalAndLeave = async (newFollowUpId?: string | null) => {
    const validInstructions = instructions.filter((item) => item.libelle.trim());
    if (validInstructions.length > 0) {
      try {
        await creerPrescriptionNonMedicale({
          patientId: consultation.patientId,
          prescripteurId,
          urgence: consultation.urgence ? "URGENT" : "NORMAL",
          items: validInstructions.map((item) => ({ type: item.type, typeLabel: item.type, description: item.libelle, dureeJours: item.dureeJours || undefined, frequenceType: item.frequenceType || undefined, frequenceValeur: item.frequenceValeur || undefined, instructions: item.instructions || undefined })),
        });
      } catch (prescriptionError) {
        setToast(`Consultation finalisée, mais la prescription non médicamenteuse n'a pas été envoyée : ${prescriptionError instanceof Error ? prescriptionError.message : "erreur inconnue"}`);
        return;
      }
    }
    setToast("Consultation finalisée avec succès.");
    const controlId = newFollowUpId ?? followUpConsultationId;
    if (controlId) {
      window.setTimeout(() => router.push(`/consultation/traitement?id=${controlId}&mode=controle${origin ? `&origin=${encodeURIComponent(origin)}` : ""}`), 700);
      return;
    }
    window.setTimeout(() => router.push(backHref), 700);
  };

  const submit = () => {
    if (!medications.some((item) => item.nom.trim()) && !noTreatmentReason.trim()) {
      setShowNoTreatmentModal(true);
      return;
    }
    void finishConsultation();
  };

  const saveFollowUp = async () => {
    // Une date est indispensable : un contrôle sans date n'est pas un
    // rendez-vous et ne peut pas être matérialisé en consultation de suivi.
    if (!consultationId || !followUp.date) return;
    setSavingFollowUp(true);
    try {
      const result = await consultationApi.traiterConsultation(consultationId, "controle", { rdvMotif: followUp.motif || null, rdvDate: followUp.date || null, rdvNiveau: followUp.niveau });
      // La consultation de contrôle créée par le backend devient la cible du
      // redirect de fin : sans son identifiant, l'écran retombait sur la liste.
      const createdId = (result as { followUp?: { id?: string | number } })?.followUp?.id;
      if (createdId != null) setFollowUpConsultationId(String(createdId));
      setFollowUpSaved(true); setToast("Rendez-vous de contrôle enregistré.");
    } catch (saveError) { setToast(saveError instanceof Error ? saveError.message : "Le rendez-vous n'a pas pu être enregistré."); }
    finally { setSavingFollowUp(false); }
  };

  const saveHospitalisation = async () => {
    if (!consultationId || !hospitalisation.motif.trim()) return;
    setSavingHospitalisation(true);
    try {
      const result = await consultationApi.traiterConsultation(consultationId, "hospitalisation", { hospitalisationMotif: hospitalisation.motif, hospitalisationService: hospitalisation.service || null });
      setHospitalisationStatus((result as { consultation?: { hospitalisationStatus?: "EN_ATTENTE" | "VALIDE" } })?.consultation?.hospitalisationStatus === "EN_ATTENTE" ? "EN_ATTENTE" : "VALIDE");
      setToast("Demande d'hospitalisation enregistrée.");
    } catch (saveError) { setToast(saveError instanceof Error ? saveError.message : "La demande n'a pas pu être enregistrée."); }
    finally { setSavingHospitalisation(false); }
  };

  /** Retour simple : la consultation reste ouverte et retrouvable dans le fil. */
  const goBack = () => router.push(backHref);

  /**
   * Annulation explicite — action destructrice, confirmée. Elle était
   * auparavant déclenchée aussi par la flèche « Retour aux consultations » :
   * un praticien qui revenait en arrière annulait la consultation sans le
   * savoir.
   */
  const cancelConsultation = async () => {
    if (!window.confirm("Annuler définitivement cette consultation ? Le patient devra être reprogrammé.")) return;
    if (consultationId) {
      try {
        await consultationApi.traiterConsultation(consultationId, "annuler");
      } catch (cancelError) {
        setToast(cancelError instanceof Error ? cancelError.message : "L'annulation n'a pas pu être enregistrée.");
        return;
      }
    }
    router.push(backHref);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#F5F8FA] p-8"><div className="mx-auto max-w-7xl animate-pulse space-y-6"><div className="h-16 w-72 rounded-2xl bg-slate-200" /><div className="h-[520px] rounded-[32px] bg-white" /></div></div>;
  }
  if (!consultationId || error || !consultation) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F5F8FA] p-6 text-center text-slate-500">La consultation demandée est introuvable ou ne peut pas être chargée.</div>;
  }

  const patientName = consultation.patient?.displayName ?? patient ?? "Patient inconnu";
  const visitLabel = consultation.typeVisite?.toUpperCase() === "CONTROLE" ? "Consultation de contrôle" : "Consultation initiale";
  const historyEntries = (history as ConsultationHistoryEntry[]).slice(0, 4);

  return <>
    <TopBar title={isControlMode ? "Gestion du contrôle" : "Traitement de la consultation"} searchPlaceholder="Rechercher un patient..." />
    <main className="min-h-screen bg-[#F5F8FA] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-fade-in">
        <button type="button" onClick={goBack} className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-white hover:text-[#006A8C]">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span> Retour aux consultations
        </button>

        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#006A8C]">Consultation externe</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">{isControlMode ? "Gestion du contrôle" : "Traitement de la consultation"}</h1>
            <p className="mt-1 text-sm text-slate-500">{isControlMode ? "Le contrôle est géré dans l’interface de consultation." : "Saisissez les éléments cliniques et les prescriptions du patient."}</p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${consultation.urgence ? "bg-red-50 text-red-600" : "bg-[#EAF3FA] text-[#006A8C]"}`}>{consultation.urgence ? "Urgence" : visitLabel}</span>
        </div>

        <nav aria-label="Étapes du traitement" className="mb-7 grid gap-2 rounded-2xl border border-slate-200 bg-white p-2 sm:grid-cols-3">
          <span className="flex items-center gap-2 rounded-xl bg-[#EAF3FA] px-3 py-2 text-xs font-bold text-[#006A8C]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#006A8C] text-[10px] text-white">1</span> Évaluation clinique</span>
          <span className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-500"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px]">2</span> Prescriptions et examens</span>
          <span className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-500"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px]">3</span> Suivi et finalisation</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(17,17,26,.05)]">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#006A8C]"><span className="material-symbols-outlined">person</span></div>
                <div><h2 className="text-lg font-black text-slate-900">{patientName}</h2><p className="text-xs font-medium text-slate-400">Dossier {consultation.patient?.dossier ?? "non renseigné"} · Consultation #{consultation.id}</p></div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{consultation.statut.replaceAll("_", " ")}</span>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Motif de consultation</p><p className="mt-2 text-sm font-semibold text-slate-700">{consultation.motif || "Non renseigné"}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rendez-vous</p><p className="mt-2 text-sm font-semibold text-slate-700">{new Date(consultation.date).toLocaleDateString("fr-FR")} · {consultation.heure}</p></div>
            </div>
            <div className="border-t border-slate-100 bg-[#F8FAFC] p-6">
              <div className="mb-4 flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.15em] text-slate-500">Paramètres cliniques</p><p className="mt-1 text-xs text-slate-500">Tension, température, poids, saturation, etc.</p></div><button type="button" onClick={() => setParameters((items) => [...items, { id: Date.now(), nom: "Nouveau paramètre", valeur: "", unite: "" }])} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#006A8C] hover:bg-[#EAF3FA]">+ Ajouter</button></div>
              <div className="space-y-3">{parameters.map((parameter) => <div key={parameter.id} className="grid gap-3 md:grid-cols-[1.2fr_.9fr_.7fr_auto]"><input value={parameter.nom} onChange={(e) => updateParameter(parameter.id, "nom", e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#006A8C]" placeholder="Paramètre" /><input value={parameter.valeur} onChange={(e) => updateParameter(parameter.id, "valeur", e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#006A8C]" placeholder="Valeur" /><input value={parameter.unite} onChange={(e) => updateParameter(parameter.id, "unite", e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#006A8C]" placeholder="Unité" /><button type="button" onClick={() => setParameters((items) => items.filter((item) => item.id !== parameter.id))} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Supprimer le paramètre"><span className="material-symbols-outlined">delete</span></button></div>)}</div>
            </div>
            <div className="border-t border-slate-100 p-6">
              <div className="mb-5 flex items-center gap-2"><span className="material-symbols-outlined text-[#006A8C]">clinical_notes</span><h3 className="font-black text-slate-900">Synthèse clinique</h3></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Diagnostic de suspicion<textarea value={diagnosticSuspicion} onChange={(e) => setDiagnosticSuspicion(e.target.value)} className={`${fieldClass} h-24 resize-none normal-case tracking-normal font-normal`} placeholder="Hypothèse diagnostique..." /></label>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Diagnostic retenu<textarea value={diagnosticRetenu} onChange={(e) => setDiagnosticRetenu(e.target.value)} className={`${fieldClass} h-24 resize-none normal-case tracking-normal font-normal`} placeholder="Diagnostic final..." /></label>
              </div>
              <label className="mt-4 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Observations et conduite à tenir<textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${fieldClass} h-28 resize-none normal-case tracking-normal font-normal`} placeholder="Observations cliniques, conseils et évolution..." /></label>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(17,17,26,.05)]"><div className="mb-5 flex items-center gap-2"><span className="material-symbols-outlined text-[#006A8C]">person</span><h2 className="text-sm font-black uppercase tracking-wide text-slate-800">Détails patient</h2></div><div className="space-y-4 text-sm"><div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Identité</p><p className="mt-1 font-bold text-slate-800">{patientName}</p><p className="text-xs text-slate-500">Dossier : {consultation.patient?.dossier ?? "non renseigné"}</p></div><div className="border-t border-slate-100 pt-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Prise en charge</p><p className="mt-1 font-semibold text-slate-700">{consultation.patient?.priseEnCharge?.companyName ?? "Non pris en charge"}</p></div><div className="border-t border-slate-100 pt-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Urgence</p><p className="mt-1 font-semibold text-slate-700">{consultation.urgence ? "Urgence" : "Normal"}</p></div><div className="border-t border-slate-100 pt-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Allergies connues</p><p className="mt-1 font-semibold text-slate-700">Aucune signalée</p></div></div></section>
            <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(17,17,26,.05)]"><div className="mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[#006A8C]">history</span><h2 className="text-sm font-black uppercase tracking-wide text-slate-800">Historique clinique</h2></div>{historyEntries.length ? <div className="space-y-4">{historyEntries.map((item) => <div key={item.id} className="border-l-2 border-[#B9DDEB] pl-3"><p className="text-xs font-bold text-slate-700">{new Date(item.date).toLocaleDateString("fr-FR")}</p><p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{item.diagnostic || item.observations || "Consultation sans observation"}</p></div>)}</div> : <p className="text-sm text-slate-400">Aucun antécédent de consultation.</p>}</section>
            <section className="rounded-[28px] border border-[#CFE7F2] bg-[#EAF3FA] p-6"><span className="material-symbols-outlined text-[#006A8C]">info</span><h2 className="mt-2 text-sm font-black text-[#00516B]">Parcours de soin</h2><p className="mt-1 text-xs leading-5 text-[#357087]">Ajoutez les prescriptions et les demandes de suivi avant de finaliser la consultation.</p></section>
          </aside>
        </div>

        <section className="mt-7 overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(17,17,26,.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6">
            <div className="flex overflow-x-auto">
              {[["medicament", "Médicaments", "medication"], ["non-medicament", "Prescriptions non médicamenteuses", "assignment"]].map(([key, label, icon]) => <button key={key} type="button" onClick={() => setActiveSection(key as typeof activeSection)} className={`relative flex shrink-0 items-center gap-2 px-4 py-5 text-[12px] font-extrabold uppercase tracking-wide transition ${activeSection === key ? "text-[#006A8C]" : "text-slate-400 hover:text-slate-700"}`}><span className="material-symbols-outlined text-[18px]">{icon}</span>{label}{activeSection === key && <span className="absolute inset-x-4 bottom-0 h-1 rounded-t-full bg-[#006A8C]" />}</button>)}
            </div>
            <ActionButton permission="prescription:create" onClick={goToParacliniques} className="flex shrink-0 items-center gap-2 rounded-xl bg-[#EAF3FA] px-4 py-2.5 text-[12px] font-bold text-[#006A8C] hover:bg-[#D1E5F5]"><span className="material-symbols-outlined text-[18px]">biotech</span> Examens para-cliniques <span className="material-symbols-outlined text-[16px]">arrow_forward</span></ActionButton>
          </div>
          <div className="p-6 sm:p-8">
            {activeSection === "medicament" ? <>
              <div className="mb-6 flex items-start justify-between gap-4"><div><h2 className="text-lg font-black text-slate-900">Liste des médicaments</h2><p className="mt-1 text-sm text-slate-500">Posologie, voie, fréquence et durée sont transmises à la pharmacie.</p></div><span className="rounded-full bg-[#EAF3FA] px-3 py-1 text-[10px] font-black text-[#006A8C]">{medications.length} MÉDICAMENT(S)</span></div>
              <div className="space-y-4">{medications.map((medication) => <div key={medication.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="mb-3 flex justify-end"><button type="button" onClick={() => setMedications((items) => items.filter((item) => item.id !== medication.id))} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Supprimer le médicament"><span className="material-symbols-outlined">delete</span></button></div><div className="grid gap-3 md:grid-cols-4"><MedicamentAutocomplete value={medication.nom} onChangeText={(value) => updateMedication(medication.id, "nom", value)} onSelectArticle={(article) => selectMedicationArticle(medication.id, article)} chuId={CHU_ID} className={fieldClass.replace("mt-1.5 ", "")} placeholder="Rechercher dans le stock pharmacie... *" /><input value={medication.dosage} onChange={(e) => updateMedication(medication.id, "dosage", e.target.value)} className={fieldClass.replace("mt-1.5 ", "")} placeholder="Dose *" /><input type="number" min="1" value={medication.quantite} onChange={(e) => updateMedication(medication.id, "quantite", e.target.value)} className={fieldClass.replace("mt-1.5 ", "")} placeholder="Quantité" /><select value={medication.quantiteType} onChange={(e) => updateMedication(medication.id, "quantiteType", e.target.value)} className={fieldClass.replace("mt-1.5 ", "")}><option>COMPRIME</option><option>GELULE</option><option>ML</option><option>FLACON</option><option>AMPOULE</option></select><select value={medication.voie} onChange={(e) => updateMedication(medication.id, "voie", e.target.value)} className={fieldClass.replace("mt-1.5 ", "")}><option value="">Voie d&apos;administration</option><option value="Orale">Orale</option><option value="Intraveineuse">Intraveineuse</option><option value="Intramusculaire">Intramusculaire</option><option value="Sous-cutanée">Sous-cutanée</option></select><select value={medication.frequenceType} onChange={(e) => updateMedication(medication.id, "frequenceType", e.target.value)} className={fieldClass.replace("mt-1.5 ", "")}><option value="">Fréquence</option><option value="PAR_JOUR">Fois par jour</option><option value="HEURES">Toutes les X heures</option><option value="SOS">Si besoin</option><option value="CONTINU">En continu</option></select><input type="number" min="0" value={medication.frequenceValeur || ""} onChange={(e) => updateMedication(medication.id, "frequenceValeur", e.target.value)} className={fieldClass.replace("mt-1.5 ", "")} placeholder="Valeur fréquence" /><input type="number" min="0" value={medication.dureeJours || ""} onChange={(e) => updateMedication(medication.id, "dureeJours", e.target.value)} className={fieldClass.replace("mt-1.5 ", "")} placeholder="Durée (jours)" /></div><div className="mt-3 grid gap-3 md:grid-cols-2"><input value={medication.instructions} onChange={(e) => updateMedication(medication.id, "instructions", e.target.value)} className={fieldClass.replace("mt-1.5 ", "")} placeholder="Instructions" /><input value={medication.remarques} onChange={(e) => updateMedication(medication.id, "remarques", e.target.value)} className={fieldClass.replace("mt-1.5 ", "")} placeholder="Remarques" /></div></div>)}</div>
              <ActionButton permission="prescription:create" onClick={() => setMedications((items) => [...items, createMedication()])} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#B9DDEB] px-4 py-2.5 text-sm font-bold text-[#006A8C] hover:bg-[#EAF3FA]"><span className="material-symbols-outlined text-[18px]">add</span> Ajouter un médicament</ActionButton>
            </> : <>
              <div className="mb-6"><h2 className="text-lg font-black text-slate-900">Prescriptions non médicamenteuses</h2><p className="mt-1 text-sm text-slate-500">Régime, mobilisation, hygiène, contention et recommandations.</p></div>
              <div className="space-y-4">{instructions.map((instruction) => <div key={instruction.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="grid gap-3 md:grid-cols-[.8fr_1.5fr_1fr_auto]"><select value={instruction.type} onChange={(e) => setInstructions((items) => items.map((item) => item.id === instruction.id ? { ...item, type: e.target.value } : item))} className={fieldClass.replace("mt-1.5 ", "")}><option value="REGIME">Régime</option><option value="MOBILISATION">Mobilisation</option><option value="HYGIENE">Hygiène</option><option value="CONTENTION">Contention</option></select><input value={instruction.libelle} onChange={(e) => setInstructions((items) => items.map((item) => item.id === instruction.id ? { ...item, libelle: e.target.value } : item))} className={fieldClass.replace("mt-1.5 ", "")} placeholder="Description précise *" /><input type="number" min="0" value={instruction.dureeJours || ""} onChange={(e) => setInstructions((items) => items.map((item) => item.id === instruction.id ? { ...item, dureeJours: Number(e.target.value) || 0 } : item))} className={fieldClass.replace("mt-1.5 ", "")} placeholder="Durée (jours)" /><button type="button" onClick={() => setInstructions((items) => items.filter((item) => item.id !== instruction.id))} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"><span className="material-symbols-outlined">delete</span></button></div><input value={instruction.instructions} onChange={(e) => setInstructions((items) => items.map((item) => item.id === instruction.id ? { ...item, instructions: e.target.value } : item))} className={`${fieldClass} mt-3`} placeholder="Instructions pour l'équipe soignante" /></div>)}</div>
              <ActionButton permission="prescription:create" onClick={() => setInstructions((items) => [...items, createInstruction()])} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#B9DDEB] px-4 py-2.5 text-sm font-bold text-[#006A8C] hover:bg-[#EAF3FA]"><span className="material-symbols-outlined text-[18px]">add</span> Ajouter une prescription</ActionButton>
            </>}
          </div>
        </section>

        <section className="mt-7 rounded-[30px] border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(17,17,26,.05)] sm:p-8"><div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-[#EAF3FA] p-2 text-[#006A8C]"><span className="material-symbols-outlined">event_available</span></div><div><h2 className="font-black text-slate-900">Suivi et demandes</h2><p className="text-sm text-slate-500">Chaque demande peut être enregistrée immédiatement, sans terminer la consultation.</p></div></div><div className="grid gap-6 lg:grid-cols-2"><div className="flex flex-col rounded-2xl border-t-4 border-[#006A8C] bg-slate-50 p-5"><h3 className="font-black text-slate-800">Contrôle / rendez-vous de suivi</h3><label className="mt-4 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Motif<textarea value={followUp.motif} onChange={(e) => setFollowUp({ ...followUp, motif: e.target.value })} className={`${fieldClass} h-20 resize-none normal-case tracking-normal font-normal`} placeholder="Motif du prochain contrôle..." /></label><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Priorité<select value={followUp.niveau} onChange={(e) => setFollowUp({ ...followUp, niveau: e.target.value })} className={fieldClass}><option value="NIVEAU_1">Routine</option><option value="NIVEAU_2">Prioritaire</option><option value="NIVEAU_3">Urgent</option><option value="NIVEAU_4">STAT</option></select></label><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date souhaitée<input type="date" value={followUp.date} onChange={(e) => setFollowUp({ ...followUp, date: e.target.value })} className={fieldClass} required /></label></div><p className="mt-2 text-[11px] text-slate-400">La date est requise : c&apos;est elle qui crée la consultation de contrôle.</p><ActionButton permission="consultation:treat" onClick={saveFollowUp} disabled={!followUp.date} pending={savingFollowUp} pendingLabel="Enregistrement..." className="mt-4 rounded-xl bg-[#006A8C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#004D66]">{followUpSaved ? "Rendez-vous enregistré" : "Enregistrer le rendez-vous"}</ActionButton></div><div className="flex flex-col rounded-2xl border-t-4 border-[#006A8C] bg-slate-50 p-5"><div className="flex items-center justify-between"><h3 className="font-black text-slate-800">Demande d&apos;hospitalisation</h3>{hospitalisationStatus && <span className={`rounded-full px-2 py-1 text-[9px] font-black ${hospitalisationStatus === "VALIDE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{hospitalisationStatus === "VALIDE" ? "CONFIRMÉE" : "EN ATTENTE"}</span>}</div><label className="mt-4 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Motif<textarea value={hospitalisation.motif} onChange={(e) => setHospitalisation({ ...hospitalisation, motif: e.target.value })} className={`${fieldClass} h-20 resize-none normal-case tracking-normal font-normal`} placeholder="Motif clinique justifiant l'hospitalisation..." /></label><label className="mt-3 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Service d&apos;accueil<select value={hospitalisation.service} onChange={(e) => setHospitalisation({ ...hospitalisation, service: e.target.value })} className={fieldClass}><option value="">Sélectionner un service clinique...</option>{hospitalisationServices.map((service) => <option key={service.id} value={service.name}>{service.name}</option>)}</select></label><ActionButton permission="consultation:treat" onClick={saveHospitalisation} disabled={!hospitalisation.motif.trim()} pending={savingHospitalisation} pendingLabel="Confirmation..." className="mt-5 rounded-xl bg-[#006A8C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#004D66]">{hospitalisationStatus === "VALIDE" ? "Hospitalisation confirmée" : hospitalisationStatus === "EN_ATTENTE" ? "Demande envoyée" : "Confirmer l'hospitalisation"}</ActionButton></div></div></section>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3"><button type="button" onClick={cancelConsultation} className="rounded-full px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50">Annuler la consultation</button><ActionButton permission="consultation:treat" onClick={submit} pending={finalizeMutation.isPending} pendingLabel={<><span className="material-symbols-outlined text-[19px]">check_circle</span>Finalisation...</>} className="inline-flex items-center gap-2 rounded-full bg-[#006A8C] px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#006A8C]/20 transition hover:bg-[#004D66]"><span className="material-symbols-outlined text-[19px]">check_circle</span>Terminer la consultation</ActionButton></div>
      </div>
    </main>
    {toast && <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl">{toast}</div>}
    {showNoTreatmentModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-black text-slate-900">Aucun traitement prescrit</h2><p className="mt-2 text-sm text-slate-500">Indiquez pourquoi aucun médicament n&apos;est nécessaire avant de terminer la consultation.</p><textarea value={noTreatmentReason} onChange={(e) => setNoTreatmentReason(e.target.value)} className={`${fieldClass} h-28 resize-none`} placeholder="Ex. conseil hygiéno-diététique uniquement..." autoFocus /><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowNoTreatmentModal(false)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50">Annuler</button><button type="button" disabled={!noTreatmentReason.trim()} onClick={() => { setShowNoTreatmentModal(false); void finishConsultation(); }} className="rounded-xl bg-[#006A8C] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">Confirmer et terminer</button></div></div></div>}
    {pendingOrdonnance && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-black text-slate-900">Ordonnance à envoyer à la pharmacie</h2><p className="mt-2 text-sm text-slate-500">Sélectionnez les médicaments à transmettre et ajustez les quantités si besoin.</p><div className="mt-5 divide-y divide-slate-100">{pendingOrdonnance.medicaments.map((medication) => <div key={medication.id} className="flex items-center gap-3 py-3"><input type="checkbox" checked={medication.selected} onChange={() => setPendingOrdonnance((current) => current ? { ...current, medicaments: current.medicaments.map((item) => item.id === medication.id ? { ...item, selected: !item.selected } : item) } : current)} /><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-800">{medication.nom} {medication.dosage}</p><p className="text-xs text-slate-500">{medication.frequenceType || "Fréquence non précisée"} · {medication.dureeJours || "—"} jour(s)</p></div><label className="text-xs text-slate-500">Qté <input type="number" min="0" value={medication.ordonnanceQuantite} disabled={!medication.selected} onChange={(e) => setPendingOrdonnance((current) => current ? { ...current, medicaments: current.medicaments.map((item) => item.id === medication.id ? { ...item, ordonnanceQuantite: Number(e.target.value) || 0 } : item) } : current)} className="ml-1 w-16 rounded-lg border border-slate-200 p-1.5 text-center disabled:opacity-40" /></label></div>)}</div><div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" disabled={ordonnanceLoading} onClick={() => { setPendingOrdonnance(null); void sendNonMedicalAndLeave(); }} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50">Ne pas faire d&apos;ordonnance</button><ActionButton permission="prescription:sign" disabled={pendingOrdonnance.medicaments.every((item) => !item.selected || item.ordonnanceQuantite <= 0)} pending={ordonnanceLoading} pendingLabel="Envoi..." onClick={async () => { const selected = pendingOrdonnance.medicaments.filter((item) => item.selected && item.ordonnanceQuantite > 0); setOrdonnanceLoading(true); try { await creerOrdonnanceMedicale(pendingOrdonnance.id, selected.map((item) => ({ nom: item.nom, dose: item.dosage, quantite: item.ordonnanceQuantite, quantiteType: item.quantiteType, voie: item.voie || undefined, frequenceType: item.frequenceType || undefined, frequenceValeur: item.frequenceValeur || undefined, dureeJours: item.dureeJours || undefined, instructions: item.instructions || undefined, remarques: item.remarques || undefined }))); setPendingOrdonnance(null); await sendNonMedicalAndLeave(); } catch (ordonnanceError) { setToast(ordonnanceError instanceof Error ? ordonnanceError.message : "L'ordonnance n'a pas pu être envoyée."); } finally { setOrdonnanceLoading(false); } }} className="rounded-xl bg-[#006A8C] px-4 py-2.5 text-sm font-bold text-white">Créer et envoyer l&apos;ordonnance</ActionButton></div></div></div>}
  </>;
}
