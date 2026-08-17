import { sommeilApi } from "./http";

export type PsgInterpretationStatut = "BROUILLON" | "VALIDE";

export type PsgInterpretation = {
  id: string;
  psgId: string;
  patientId: string;
  patientNom: string;
  patientPrenom: string;
  titre: string;
  contenu: string;
  statut: PsgInterpretationStatut;
  valideLe?: string | null;
  validePar?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PsgInterpretationExport = {
  id: string;
  titre: string;
  contenu: string;
  statut: PsgInterpretationStatut;
  valideLe?: string | null;
  validePar?: string | null;
  genereLe: string;
  patient: { id: string; nom: string };
  examen: { id: string; rdvDate: string; demarreLe: string | null; termineLe: string | null; motif: string } | null;
};

export const psgInterpretationApi = {
  list: (filters?: { statut?: PsgInterpretationStatut; psgId?: string; patientId?: string }) =>
    sommeilApi<PsgInterpretation[]>("/psg-interpretations", { query: filters }),

  get: (id: string) => sommeilApi<PsgInterpretation>(`/psg-interpretations/${id}`),

  getByPsg: (psgId: string) =>
    sommeilApi<PsgInterpretation | null>(`/psg-interpretations/by-psg/${psgId}`),

  create: (data: { psgId: string; titre?: string; contenu: string }) =>
    sommeilApi<PsgInterpretation>("/psg-interpretations", { method: "POST", body: data }),

  update: (id: string, data: { titre?: string; contenu?: string }) =>
    sommeilApi<PsgInterpretation>(`/psg-interpretations/${id}`, { method: "PUT", body: data }),

  validate: (id: string, validePar?: string) =>
    sommeilApi<PsgInterpretation>(`/psg-interpretations/${id}/validate`, {
      method: "POST",
      body: { validePar },
    }),

  remove: (id: string) =>
    sommeilApi<{ success: boolean; id: string }>(`/psg-interpretations/${id}`, { method: "DELETE" }),

  export: (id: string) => sommeilApi<PsgInterpretationExport>(`/psg-interpretations/${id}/export`),
};
