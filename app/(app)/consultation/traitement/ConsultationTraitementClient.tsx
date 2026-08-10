"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";

const fakeConsultation = {
  patientName: "MARCEL, Sophie",
  status: "EN COURS",
  visitType: "INITIALE",
  motif: "Apnée suspectée / fatigue diurne",
  diagnosis: "AOS légère à modérée, suspicion de troubles respiratoires nocturnes",
  doctor: "Dr. Jean Dupont",
};

export default function ConsultationTraitementClient({
  patient,
  consultationId,
}: Readonly<{
  patient: string;
  consultationId: string;
}>) {
  const [activeTab, setActiveTab] = useState<"medicament" | "non-medicament">("medicament");
  const tabs = useMemo(
    () => [
      { key: "medicament", label: "Médicament" },
      { key: "non-medicament", label: "Non médicamenteux" },
    ],
    [],
  );

  const router = useRouter();

  return (
    <>
      <TopBar
        title="Consultation"
        searchPlaceholder="Rechercher un patient..."
        doctorName="Dr. Jean Dupont"
        doctorRole="Somnologue Senior"
      />

      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/consultation")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              ← Retour
            </button>
            <div className="rounded-full bg-[#EAF3FA] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#005b82]">
              Consultation #{consultationId}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0px_8px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Patient</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{patient}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#EAF3FA] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#005b82]">
                  {fakeConsultation.status}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700">
                  {fakeConsultation.visitType}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Motif</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{fakeConsultation.motif}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Médecin traitant</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{fakeConsultation.doctor}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Diagnostic</p>
              <p className="mt-2 text-sm text-slate-700">{fakeConsultation.diagnosis}</p>
            </div>

            <div className="mt-6">
              <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as "medicament" | "non-medicament")}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      activeTab === tab.key
                        ? "bg-white text-[#005b82] shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                {activeTab === "medicament" ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                      Traitement CPAP — Pression 10 cm H2O
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                      Melatonine 2 mg — 1 gélule au coucher
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                      Suivi à 3 mois
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                      Hygiène du sommeil
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                      Réduction de l’alcool en soirée
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                      Contrôle du poids et activité physique
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/consultation")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Enregistrer et revenir
              </button>
              <button
                type="button"
                onClick={() => router.push("/consultation")}
                className="rounded-xl bg-[#005b82] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#004a6b]"
              >
                Valider la consultation
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
