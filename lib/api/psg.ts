import { sommeilApi } from "./http";

export type PsgStatut = "PLANIFIE" | "EN_COURS" | "TERMINE";

export type PsgExam = {
  id: string;
  prescriptionId: string;
  patientId: string;
  patientNom: string;
  patientPrenom: string;
  motif: string;
  rdvDate: string;
  rdvHeure: string;
  statut: PsgStatut;
  urgence: boolean;
  demarreLe?: string | null;
  termineLe?: string | null;
  salle?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PsgExportData = {
  examen: {
    id: string;
    prescriptionId: string;
    statut: PsgStatut;
    salle: string | null;
    rdvDate: string;
    rdvHeure: string;
    demarreLe: string | null;
    termineLe: string | null;
    dureeMinutes: number | null;
  };
  patient: { id: string; nom: string; prenom: string };
  motif: string;
  urgence: boolean;
  signaux: unknown[];
  genereLe: string;
};

export const psgApi = {
  list: (statut?: PsgStatut) => sommeilApi<PsgExam[]>("/psg", { query: { statut } }),

  get: (id: string) => sommeilApi<PsgExam>(`/psg/${id}`),

  update: (id: string, data: { rdvDate?: string; rdvHeure?: string; salle?: string; motif?: string }) =>
    sommeilApi<PsgExam>(`/psg/${id}`, { method: "PUT", body: data }),

  start: (id: string, salle?: string) =>
    sommeilApi<PsgExam>(`/psg/${id}/start`, { method: "POST", body: { salle } }),

  stop: (id: string) => sommeilApi<PsgExam>(`/psg/${id}/stop`, { method: "POST" }),

  remove: (id: string) =>
    sommeilApi<{ success: boolean; id: string }>(`/psg/${id}`, { method: "DELETE" }),

  exportData: (id: string) => sommeilApi<PsgExportData>(`/psg/${id}/export`),
};
