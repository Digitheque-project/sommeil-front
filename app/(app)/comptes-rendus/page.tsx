"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";

type SaveState = "idle" | "saving" | "saved";

type ExamReport = {
  id: number;
  name: string;
  performedAt: string;
  status: string;
  report: string;
  draftReport: string;
  lastSaved: string;
  saveState: SaveState;
};

type Patient = {
  id: number;
  name: string;
  birthDate: string;
  age: string;
  dossier: string;
  examReports: ExamReport[];
};


const initialPatients: Patient[] = [
  {
    id: 1,
    name: "Jean-Luc DUBOIS",
    birthDate: "12/05/1974",
    age: "49 ans",
    dossier: "#PSG-2023-8942",
    examReports: [
      {
        id: 1,
        name: "Polysomnographie Complète",
        performedAt: "24 octobre 2023",
        status: "Réalisé",
        report: "",
        draftReport: "",
        lastSaved: "Jamais",
        saveState: "idle",
      },
      {
        id: 2,
        name: "EEG de nuit",
        performedAt: "24 octobre 2023",
        status: "Réalisé",
        report: "",
        draftReport: "",
        lastSaved: "Jamais",
        saveState: "idle",
      },
    ],
  },
  {
    id: 2,
    name: "Claire MARTIN",
    birthDate: "07/11/1982",
    age: "43 ans",
    dossier: "#PSG-2024-2107",
    examReports: [
      {
        id: 3,
        name: "Polysomnographie Complète",
        performedAt: "15 janvier 2024",
        status: "Réalisé",
        report: "",
        draftReport: "",
        lastSaved: "Jamais",
        saveState: "idle",
      },
      {
        id: 4,
        name: "Test CPAP",
        performedAt: "15 janvier 2024",
        status: "Réalisé",
        report: "",
        draftReport: "",
        lastSaved: "Jamais",
        saveState: "idle",
      },
    ],
  },
];

export default function CompteRenduPage() {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  const selectedPatient = selectedPatientId !== null ? patients.find((patient) => patient.id === selectedPatientId) ?? null : null;
  const selectedExam = selectedPatient && selectedExamId !== null ? selectedPatient.examReports.find((exam) => exam.id === selectedExamId) ?? null : null;

  const updateExamReportDraft = (patientId: number, examId: number, draftReport: string) => {
    setPatients((prev) =>
      prev.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              examReports: patient.examReports.map((exam) =>
                exam.id === examId ? { ...exam, draftReport } : exam
              ),
            }
          : patient
      )
    );
  };

  const saveExamReport = (patientId: number, examId: number) => {
    setPatients((prev) =>
      prev.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              examReports: patient.examReports.map((exam) =>
                exam.id === examId ? { ...exam, saveState: "saving" } : exam
              ),
            }
          : patient
      )
    );

    setTimeout(() => {
      const savedAt = new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === patientId
            ? {
                ...patient,
                examReports: patient.examReports.map((exam) =>
                  exam.id === examId
                    ? {
                        ...exam,
                        report: exam.draftReport,
                        saveState: "saved",
                        lastSaved: savedAt,
                      }
                    : exam
                ),
              }
            : patient
        )
      );

      setTimeout(() => {
        setPatients((prev) =>
          prev.map((patient) =>
            patient.id === patientId
              ? {
                  ...patient,
                  examReports: patient.examReports.map((exam) =>
                    exam.id === examId ? { ...exam, saveState: "idle" } : exam
                  ),
                }
              : patient
          )
        );
      }, 2500);
    }, 900);
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

      <main className="w-full mx-auto px-container-padding py-section-gap">
        <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 mb-6 shadow-sm">
          {selectedPatient ? (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-[0.18em] mb-2">
                  Patient
                </p>
                <h1 className="font-headline-sm text-headline-sm text-primary">
                  {selectedPatient.name}
                </h1>
                <p className="text-body-sm text-on-surface-variant mt-2">
                  {selectedPatient.birthDate} · {selectedPatient.age} · Dossier {selectedPatient.dossier}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-surface-container p-4 text-center">
                  <p className="text-label-sm text-on-surface-variant uppercase">Examen sélectionné</p>
                  <p className="font-label-md text-primary mt-2">{selectedExam?.name ?? "Aucun examen sélectionné"}</p>
                </div>
                <div className="rounded-3xl bg-surface-container p-4 text-center">
                  <p className="text-label-sm text-on-surface-variant uppercase">Date</p>
                  <p className="font-label-md text-primary mt-2">{selectedExam?.performedAt ?? "-"}</p>
                </div>
                <div className="rounded-3xl bg-surface-container p-4 text-center">
                  <p className="text-label-sm text-on-surface-variant uppercase">Statut</p>
                  <p className="font-label-md text-primary mt-2">{selectedExam?.status ?? "-"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="font-headline-sm text-headline-sm text-primary mb-2">Sélectionnez un patient pour commencer</p>
              <p className="text-body-sm text-on-surface-variant">Seul le patient choisi s’affichera ici.</p>
            </div>
          )}
        </section>

        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-4 space-y-4">
            <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-5 shadow-sm">
              <h2 className="font-label-md text-label-md text-on-surface-variant uppercase mb-5">
                Patients PSG
              </h2>
              <div className="space-y-3">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatientId(patient.id);
                      setSelectedExamId(patient.examReports[0]?.id ?? null);
                    }}
                    className={`w-full text-left rounded-3xl border px-4 py-4 transition-colors ${
                      selectedPatientId === patient.id
                        ? "border-primary bg-primary/10"
                        : "border-outline-variant bg-surface-container"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-on-surface">{patient.name}</p>
                        <p className="text-body-sm text-on-surface-variant mt-1">{patient.birthDate} · {patient.age}</p>
                        <p className="text-body-sm text-on-surface-variant mt-1">Dossier {patient.dossier}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

          </aside>

          <section className="col-span-12 lg:col-span-8">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-sm flex flex-col h-full">
              <div className="px-6 py-5 border-b border-outline-variant flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-[0.18em]">
                    Rapport libre
                  </p>
                  <h2 className="font-headline-sm text-headline-sm text-primary mt-2">
                    Rédigez votre compte rendu
                  </h2>
                </div>
                <div className="rounded-3xl bg-surface-container p-3 text-sm text-on-surface-variant">
                  Dernière sauvegarde: {selectedExam?.lastSaved}
                </div>
              </div>

              <div className="p-6">
                <textarea
                  value={selectedExam?.draftReport ?? ""}
                  onChange={(event) =>
                    selectedPatient && selectedExam && updateExamReportDraft(selectedPatient.id, selectedExam.id, event.target.value)
                  }
                  placeholder={selectedPatient ? "Rédigez ici votre compte rendu libre pour l'examen réalisé..." : "Sélectionnez un patient pour commencer"}
                  disabled={!selectedPatient || !selectedExam}
                  className="w-full min-h-[520px] resize-none rounded-3xl border border-outline-variant bg-background p-5 text-body-lg text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="px-6 py-5 border-t border-outline-variant bg-surface-bright rounded-b-3xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-body-sm text-on-surface-variant hidden md:block">
                  Votre texte est enregistré localement avant validation. Cliquez sur Enregistrer pour confirmer le rapport.
                </div>
                <div className="w-full sm:w-auto rounded-3xl bg-success/10 p-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => selectedPatient && selectedExam && saveExamReport(selectedPatient.id, selectedExam.id)}
                    disabled={!selectedExam?.draftReport || selectedExam.saveState === "saving"}
                    className={`inline-flex items-center justify-center gap-2 rounded-3xl px-6 py-3 text-body-md font-semibold transition-colors focus:outline-none focus:ring-0 ${
                      selectedExam?.saveState === "saving"
                        ? "bg-surface-container text-on-surface-variant"
                        : "bg-secondary text-on-secondary hover:bg-secondary/90"
                    } ${!selectedExam?.draftReport || selectedExam.saveState === "saving" ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <span className="material-symbols-outlined">
                      {selectedExam?.saveState === "saving" ? "sync" : "save"}
                    </span>
                    {selectedExam?.saveState === "saving" ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
