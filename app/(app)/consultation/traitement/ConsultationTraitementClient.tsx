"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
              Traitement — {patient}
            </span>
          </nav>

          <div className="rounded-[30px] border border-outline-variant bg-surface-container-lowest p-5 shadow-[0px_8px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="flex flex-col gap-5 border-b border-outline-variant pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Patient</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-on-surface">{patient}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary-container/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-secondary">
                  {fakeConsultation.status}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700">
                  {fakeConsultation.visitType}
                </span>
                <span className="rounded-full bg-surface-container px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
                  Consultation #{consultationId}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant bg-surface-container p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Motif</p>
                <p className="mt-2 text-sm font-semibold text-on-surface">{fakeConsultation.motif}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-surface-container p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Médecin traitant</p>
                <p className="mt-2 text-sm font-semibold text-on-surface">{fakeConsultation.doctor}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-bright p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Diagnostic</p>
              <p className="mt-2 text-sm text-on-surface">{fakeConsultation.diagnosis}</p>
            </div>

            <div className="mt-6">
              <div className="flex gap-2 rounded-full bg-surface-container p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as "medicament" | "non-medicament")}
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
                {activeTab === "medicament" ? (
                  <div className="space-y-3">
                    {[
                      { title: "Traitement CPAP", detail: "Pression 10 cm H2O" },
                      { title: "Melatonine 2 mg", detail: "1 gélule au coucher" },
                      { title: "Suivi à 3 mois", detail: "Consultation de contrôle" },
                    ].map((item) => (
                      <div key={item.title} className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container p-3">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{item.title}</p>
                          <p className="text-[12px] text-on-surface-variant">{item.detail}</p>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant">medication</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { title: "Hygiène du sommeil", detail: "Horaires réguliers, sieste limitée" },
                      { title: "Réduction de l’alcool en soirée", detail: "Aucune consommation 4h avant le coucher" },
                      { title: "Contrôle du poids et activité physique", detail: "30 min de marche quotidienne" },
                    ].map((item) => (
                      <div key={item.title} className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container p-3">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{item.title}</p>
                          <p className="text-[12px] text-on-surface-variant">{item.detail}</p>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant">self_improvement</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/consultation")}
                className="rounded-2xl border border-outline-variant bg-white px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Enregistrer et revenir
              </button>
              <button
                type="button"
                onClick={() => router.push("/consultation")}
                className="rounded-2xl bg-secondary px-4 py-2.5 text-sm font-bold text-on-secondary hover:bg-secondary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
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
