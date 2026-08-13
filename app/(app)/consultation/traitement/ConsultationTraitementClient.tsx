"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { useConsultation, useFinalizeConsultation, usePatientConsultationHistory } from "@/hooks/use-consultations";
import type { ClinicalParameter as ApiClinicalParameter, ConsultationHistoryEntry } from "@/lib/api/consultation";

type ClinicalParameter = { id: number; nom: string; valeur: string; unite: string };
type Medication = { id: number; nom: string; dosage: string; posologie: string; duree: string };
type CareInstruction = { id: number; libelle: string };

const defaultParameters: ClinicalParameter[] = [
  { id: 1, nom: "Tension", valeur: "", unite: "mmHg" },
  { id: 2, nom: "Température", valeur: "", unite: "°C" },
  { id: 3, nom: "Poids", valeur: "", unite: "kg" },
  { id: 4, nom: "Taille", valeur: "", unite: "cm" },
  { id: 5, nom: "Fréquence cardiaque", valeur: "", unite: "bpm" },
  { id: 6, nom: "Saturation O₂", valeur: "", unite: "%" },
];

const fieldClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#006A8C] focus:bg-white focus:ring-2 focus:ring-[#006A8C]/10";

export default function ConsultationTraitementClient({
  patient,
  consultationId,
}: Readonly<{ patient?: string; consultationId?: string }>) {
  const router = useRouter();
  const { data: consultation, isLoading, error } = useConsultation(consultationId ?? "");
  const { data: history = [] } = usePatientConsultationHistory(consultation?.patientId ?? null);
  const finalizeMutation = useFinalizeConsultation();

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

  useEffect(() => {
    if (!consultation) return;
    setDiagnosticSuspicion(consultation.observation?.diagnosticSuspicion ?? "");
    setDiagnosticRetenu(consultation.observation?.diagnosticRetenu ?? consultation.observation?.diagnostic ?? "");
    setNotes(consultation.observation?.notes ?? "");
    if (consultation.parametresCliniques?.length) {
      setParameters(consultation.parametresCliniques.map((item: ApiClinicalParameter, index: number) => ({
        id: item.id ?? index + 1,
        nom: item.nom,
        valeur: item.valeur,
        unite: item.unite ?? "",
      })));
    }
  }, [consultation]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const updateParameter = (id: number, field: keyof Omit<ClinicalParameter, "id">, value: string) =>
    setParameters((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));

  const updateMedication = (id: number, field: keyof Omit<Medication, "id">, value: string) =>
    setMedications((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));

  const submit = async () => {
    if (!consultationId) return;
    const nonMedicaments = {
      recommandationsNotes: instructions.map((item) => item.libelle).filter(Boolean).join("\n"),
      rdvMotif: followUp.motif,
      rdvNiveau: followUp.niveau,
      rdvDate: followUp.date,
      hospitalisationMotif: hospitalisation.motif,
      hospitalisationService: hospitalisation.service,
    };
    const observation = { diagnosticSuspicion, diagnosticRetenu, diagnostic: diagnosticRetenu, notes };

    try {
      await finalizeMutation.mutateAsync({
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
      setToast("Consultation finalisée avec succès.");
      window.setTimeout(() => router.push("/consultation"), 700);
    } catch (submitError) {
      setToast(submitError instanceof Error ? submitError.message : "La consultation n'a pas pu être finalisée.");
    }
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
    <TopBar title="Traitement de la consultation" searchPlaceholder="Rechercher un patient..." doctorName="Dr. Sarobidy RAMAMPIONOSON" doctorRole="Somnologue Senior" />
    <main className="min-h-screen bg-[#F5F8FA] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-fade-in">
        <Link href="/consultation" className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-white hover:text-[#006A8C]">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span> Retour aux consultations
        </Link>

        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#006A8C]">Consultation externe</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Traitement de la consultation</h1>
            <p className="mt-1 text-sm text-slate-500">Saisissez les éléments cliniques et les prescriptions du patient.</p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${consultation.urgence ? "bg-red-50 text-red-600" : "bg-[#EAF3FA] text-[#006A8C]"}`}>{consultation.urgence ? "Urgence" : visitLabel}</span>
        </div>

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
            <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(17,17,26,.05)]"><div className="mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[#006A8C]">history</span><h2 className="text-sm font-black uppercase tracking-wide text-slate-800">Historique</h2></div>{historyEntries.length ? <div className="space-y-4">{historyEntries.map((item) => <div key={item.id} className="border-l-2 border-[#B9DDEB] pl-3"><p className="text-xs font-bold text-slate-700">{new Date(item.date).toLocaleDateString("fr-FR")}</p><p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{item.diagnostic || item.observations || "Consultation sans observation"}</p></div>)}</div> : <p className="text-sm text-slate-400">Aucun antécédent de consultation.</p>}</section>
            <section className="rounded-[28px] border border-[#CFE7F2] bg-[#EAF3FA] p-6"><span className="material-symbols-outlined text-[#006A8C]">info</span><h2 className="mt-2 text-sm font-black text-[#00516B]">Parcours de soin</h2><p className="mt-1 text-xs leading-5 text-[#357087]">Ajoutez les prescriptions et les demandes de suivi avant de finaliser la consultation.</p></section>
          </aside>
        </div>

        <section className="mt-7 overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(17,17,26,.05)]">
          <div className="flex overflow-x-auto border-b border-slate-100 px-6">
            {[["medicament", "Médicaments", "medication"], ["non-medicament", "Prescriptions non médicamenteuses", "assignment"]].map(([key, label, icon]) => <button key={key} type="button" onClick={() => setActiveSection(key as typeof activeSection)} className={`relative flex shrink-0 items-center gap-2 px-4 py-5 text-[12px] font-extrabold uppercase tracking-wide transition ${activeSection === key ? "text-[#006A8C]" : "text-slate-400 hover:text-slate-700"}`}><span className="material-symbols-outlined text-[18px]">{icon}</span>{label}{activeSection === key && <span className="absolute inset-x-4 bottom-0 h-1 rounded-t-full bg-[#006A8C]" />}</button>)}
            <button type="button" onClick={() => router.push(`/prescription?patientId=${consultation.patientId}&consultationId=${consultation.id}`)} className="ml-auto flex shrink-0 items-center gap-2 px-4 py-5 text-[12px] font-bold text-slate-400 hover:text-[#006A8C]"><span className="material-symbols-outlined text-[18px]">biotech</span> Examens</button>
          </div>
          <div className="p-6 sm:p-8">
            {activeSection === "medicament" ? <><div className="mb-6 flex items-start justify-between gap-4"><div><h2 className="text-lg font-black text-slate-900">Liste des médicaments</h2><p className="mt-1 text-sm text-slate-500">Ajoutez les produits et les posologies nécessaires.</p></div><span className="rounded-full bg-[#EAF3FA] px-3 py-1 text-[10px] font-black text-[#006A8C]">{medications.length} MÉDICAMENT(S)</span></div><div className="space-y-3">{medications.map((medication) => <div key={medication.id} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-[1.2fr_.8fr_1fr_.8fr_auto]"><input value={medication.nom} onChange={(e) => updateMedication(medication.id, "nom", e.target.value)} className={fieldClass.replace("mt-1.5 ", "")} placeholder="Médicament" /><input value={medication.dosage} onChange={(e) => updateMedication(medication.id, "dosage", e.target.value)} className={fieldClass.replace("mt-1.5 ", "")} placeholder="Dosage" /><input value={medication.posologie} onChange={(e) => updateMedication(medication.id, "posologie", e.target.value)} className={fieldClass.replace("mt-1.5 ", "")} placeholder="Posologie" /><input value={medication.duree} onChange={(e) => updateMedication(medication.id, "duree", e.target.value)} className={fieldClass.replace("mt-1.5 ", "")} placeholder="Durée" /><button type="button" onClick={() => setMedications((items) => items.filter((item) => item.id !== medication.id))} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Supprimer le médicament"><span className="material-symbols-outlined">delete</span></button></div>)}</div><button type="button" onClick={() => setMedications((items) => [...items, { id: Date.now(), nom: "", dosage: "", posologie: "", duree: "" }])} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#B9DDEB] px-4 py-2.5 text-sm font-bold text-[#006A8C] hover:bg-[#EAF3FA]"><span className="material-symbols-outlined text-[18px]">add</span> Ajouter un médicament</button></> : <><div className="mb-6"><h2 className="text-lg font-black text-slate-900">Prescriptions non médicamenteuses</h2><p className="mt-1 text-sm text-slate-500">Régime, hygiène de vie, mobilisation ou autres soins.</p></div><div className="space-y-3">{instructions.map((instruction) => <div key={instruction.id} className="flex gap-3"><input value={instruction.libelle} onChange={(e) => setInstructions((items) => items.map((item) => item.id === instruction.id ? { ...item, libelle: e.target.value } : item))} className={fieldClass.replace("mt-1.5 ", "")} placeholder="Ex. Mesures hygiéno-diététiques et suivi du sommeil" /><button type="button" onClick={() => setInstructions((items) => items.filter((item) => item.id !== instruction.id))} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"><span className="material-symbols-outlined">delete</span></button></div>)}</div><button type="button" onClick={() => setInstructions((items) => [...items, { id: Date.now(), libelle: "" }])} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#B9DDEB] px-4 py-2.5 text-sm font-bold text-[#006A8C] hover:bg-[#EAF3FA]"><span className="material-symbols-outlined text-[18px]">add</span> Ajouter une prescription</button></>}
          </div>
        </section>

        <section className="mt-7 rounded-[30px] border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(17,17,26,.05)] sm:p-8"><div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-[#EAF3FA] p-2 text-[#006A8C]"><span className="material-symbols-outlined">monitor_heart</span></div><div><h2 className="font-black text-slate-900">Paramètres cliniques</h2><p className="text-sm text-slate-500">Relevez les constantes disponibles pour cette consultation.</p></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{parameters.map((parameter) => <div key={parameter.id} className="flex gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3"><div className="min-w-0 flex-1"><input value={parameter.nom} onChange={(e) => updateParameter(parameter.id, "nom", e.target.value)} className="w-full bg-transparent text-xs font-bold uppercase tracking-wide text-slate-500 outline-none" /><input value={parameter.valeur} onChange={(e) => updateParameter(parameter.id, "valeur", e.target.value)} className="mt-1 w-full bg-transparent text-lg font-black text-slate-800 outline-none" placeholder="—" /></div><input value={parameter.unite} onChange={(e) => updateParameter(parameter.id, "unite", e.target.value)} className="mt-6 w-12 bg-transparent text-xs text-slate-400 outline-none" /></div>)}</div><button type="button" onClick={() => setParameters((items) => [...items, { id: Date.now(), nom: "Nouveau paramètre", valeur: "", unite: "" }])} className="mt-4 text-sm font-bold text-[#006A8C] hover:underline">+ Ajouter un paramètre</button></section>

        <section className="mt-7 rounded-[30px] border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(17,17,26,.05)] sm:p-8"><div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-[#EAF3FA] p-2 text-[#006A8C]"><span className="material-symbols-outlined">event_available</span></div><div><h2 className="font-black text-slate-900">Suivi et demandes</h2><p className="text-sm text-slate-500">Programmez le parcours nécessaire après cette consultation.</p></div></div><div className="grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border-t-4 border-[#006A8C] bg-slate-50 p-5"><h3 className="font-black text-slate-800">Contrôle / rendez-vous de suivi</h3><label className="mt-4 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Motif<textarea value={followUp.motif} onChange={(e) => setFollowUp({ ...followUp, motif: e.target.value })} className={`${fieldClass} h-20 resize-none normal-case tracking-normal font-normal`} placeholder="Motif du prochain contrôle..." /></label><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Priorité<select value={followUp.niveau} onChange={(e) => setFollowUp({ ...followUp, niveau: e.target.value })} className={fieldClass}><option value="NIVEAU_1">Routine</option><option value="NIVEAU_2">Prioritaire</option><option value="NIVEAU_3">Urgent</option><option value="NIVEAU_4">STAT</option></select></label><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date souhaitée<input type="date" value={followUp.date} onChange={(e) => setFollowUp({ ...followUp, date: e.target.value })} className={fieldClass} /></label></div></div><div className="rounded-2xl border-t-4 border-[#006A8C] bg-slate-50 p-5"><h3 className="font-black text-slate-800">Demande d'hospitalisation</h3><label className="mt-4 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Motif<textarea value={hospitalisation.motif} onChange={(e) => setHospitalisation({ ...hospitalisation, motif: e.target.value })} className={`${fieldClass} h-20 resize-none normal-case tracking-normal font-normal`} placeholder="Motif clinique justifiant l'hospitalisation..." /></label><label className="mt-3 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Service d'accueil<input value={hospitalisation.service} onChange={(e) => setHospitalisation({ ...hospitalisation, service: e.target.value })} className={fieldClass} placeholder="Sélectionner ou saisir un service" /></label></div></div></section>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3"><button type="button" onClick={() => router.push("/consultation")} className="rounded-full px-5 py-3 text-sm font-bold text-slate-500 hover:bg-white">Annuler</button><button type="button" onClick={submit} disabled={finalizeMutation.isPending} className="inline-flex items-center gap-2 rounded-full bg-[#006A8C] px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#006A8C]/20 transition hover:bg-[#004D66] disabled:opacity-50"><span className="material-symbols-outlined text-[19px]">check_circle</span>{finalizeMutation.isPending ? "Finalisation..." : "Terminer la consultation"}</button></div>
      </div>
    </main>
    {toast && <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl">{toast}</div>}
  </>;
}
