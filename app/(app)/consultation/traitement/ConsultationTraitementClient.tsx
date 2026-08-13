"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { useConsultation, useFinalizeConsultation, usePatientConsultationHistory } from "@/hooks/use-consultations";
import { consultationApi } from "@/lib/api/consultation";

export default function ConsultationTraitementClient({
  patient,
  consultationId,
}: Readonly<{
  patient?: string;
  consultationId?: string;
}>) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"observation" | "parametres" | "prescriptions">("observation");
  const [observation, setObservation] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [parametres, setParametres] = useState<Array<{ nom: string; valeur: string; unite?: string }>>([
    { nom: 'Tension', valeur: '', unite: 'mmHg' },
    { nom: 'Température', valeur: '', unite: '°C' },
    { nom: 'Poids', valeur: '', unite: 'kg' },
    { nom: 'Taille', valeur: '', unite: 'cm' },
    { nom: 'Fréquence cardiaque', valeur: '', unite: 'bpm' },
    { nom: 'Saturation O2', valeur: '', unite: '%' },
  ]);

  const { data: consultation, isLoading, error } = useConsultation(consultationId ?? '');
  const { data: historyData = [] } = usePatientConsultationHistory(consultation?.patientId ?? null);
  const finalizeMutation = useFinalizeConsultation();

  const tabs = useMemo(
    () => [
      { key: "observation", label: "Observation" },
      { key: "parametres", label: "Paramètres cliniques" },
      { key: "prescriptions", label: "Prescriptions" },
    ],
    [],
  );

  const handleFinalize = async () => {
    try {
      await finalizeMutation.mutateAsync({
        id: consultationId!,
        data: {
          observation: {
            diagnostic,
            notes: observation,
          },
          parametres,
          nonMedicaments: {
            recommandationsNotes: observation,
          },
        },
      });
      router.push('/consultation');
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!consultationId || error || !consultation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <p className="text-on-surface-variant">La consultation demandée est introuvable ou ne peut pas être chargée.</p>
      </div>
    );
  }

  const consultationData = consultation;

  return (
    <>
      <TopBar
        title="Consultation"
        searchPlaceholder="Rechercher un patient..."
        doctorName="Dr. Sarobidy RAMAMPIONOSON"
        doctorRole="Somnologue Senior"
      />

      <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
        <div className="mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <nav
            aria-label="Fil d'Ariane"
            className="mb-5 flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-on-surface-variant"
          >
            <Link
              href="/consultation"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-surface-container hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              Consultation
            </Link>
            <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
            <span aria-current="page" className="px-1 text-secondary">
              Traitement — {consultationData.patient?.displayName ?? patient ?? "Patient"}
            </span>
          </nav>

          <div className="rounded-[30px] border border-outline-variant bg-surface-container-lowest p-5 shadow-[0px_8px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="flex flex-col gap-5 border-b border-outline-variant pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Patient</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-on-surface">{consultationData.patient?.displayName ?? patient ?? "Patient"}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary-container/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-secondary">
                  {consultationData.statut}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700">
                  {consultationData.typeVisite}
                </span>
                <span className="rounded-full bg-surface-container px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
                  Consultation #{consultationId}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant bg-surface-container p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Motif</p>
                <p className="mt-2 text-sm font-semibold text-on-surface">{consultationData.motif}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-surface-container p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Médecin traitant</p>
                <p className="mt-2 text-sm font-semibold text-on-surface">Dr. Sarobidy RAMAMPIONOSON</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-bright p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Diagnostic actuel</p>
              <p className="mt-2 text-sm text-on-surface">{consultationData.observation?.diagnostic || 'Non renseigné'}</p>
            </div>

            <div className="mt-6">
              <div className="flex gap-2 rounded-full bg-surface-container p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as "observation" | "parametres" | "prescriptions")}
                    className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                      activeTab === tab.key
                        ? "bg-white text-secondary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                {activeTab === "observation" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Diagnostic</label>
                      <textarea
                        value={diagnostic}
                        onChange={(e) => setDiagnostic(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container p-3 text-sm text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                        rows={3}
                        placeholder="Saisir le diagnostic..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Notes d'observation</label>
                      <textarea
                        value={observation}
                        onChange={(e) => setObservation(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container p-3 text-sm text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                        rows={4}
                        placeholder="Saisir les notes d'observation..."
                      />
                    </div>
                  </div>
                )}
                {activeTab === "parametres" && (
                  <div className="space-y-3">
                    {parametres.map((param, index) => (
                      <div key={index} className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container p-3">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{param.nom}</label>
                          <input
                            type="text"
                            value={param.valeur}
                            onChange={(e) => {
                              const newParametres = [...parametres];
                              newParametres[index].valeur = e.target.value;
                              setParametres(newParametres);
                            }}
                            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-bright p-2 text-sm text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                            placeholder="Valeur"
                          />
                        </div>
                        <span className="text-xs text-on-surface-variant">{param.unite}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "prescriptions" && (
                  <div className="space-y-3">
                    <p className="text-sm text-on-surface-variant">Les prescriptions seront intégrées via le service prescription externe.</p>
                    <button
                      type="button"
                      onClick={() => window.open(`/prescriptions?patientId=${consultation?.patientId}&consultationId=${consultationId}`, '_blank')}
                      className="action-primary rounded-xl px-4 py-2 text-sm font-bold"
                    >
                      Ouvrir le module de prescription
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/consultation")}
                className="action-secondary rounded-2xl px-4 py-2.5 text-sm font-bold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={finalizeMutation.isPending}
                className="action-success rounded-2xl px-4 py-2.5 text-sm font-bold disabled:opacity-50"
              >
                {finalizeMutation.isPending ? 'Finalisation...' : 'Finaliser la consultation'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
