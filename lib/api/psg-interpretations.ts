import { sommeilApi } from "./http";

export type PsgInterpretationStatut = "BROUILLON" | "VALIDE";
export type PsgSeverite = "NORMAL" | "LEGER" | "MODERE" | "SEVERE";

export type PsgInterpretation = {
  id: string;
  psgId: string;
  patientId: string;
  patientNom: string;
  patientPrenom: string;
  iah?: number | null;
  indexDesaturation?: number | null;
  spo2Moyenne?: number | null;
  spo2Min?: number | null;
  efficaciteSommeil?: number | null;
  latenceEndormissement?: number | null;
  latenceRem?: number | null;
  tempsSommeilTotal?: number | null;
  severite?: PsgSeverite | null;
  conclusion: string;
  recommandations?: string | null;
  statut: PsgInterpretationStatut;
  valideLe?: string | null;
  validePar?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PsgInterpretationPayload = {
  psgId?: string;
  iah?: number | null;
  indexDesaturation?: number | null;
  spo2Moyenne?: number | null;
  spo2Min?: number | null;
  efficaciteSommeil?: number | null;
  latenceEndormissement?: number | null;
  latenceRem?: number | null;
  tempsSommeilTotal?: number | null;
  severite?: PsgSeverite | null;
  conclusion?: string;
  recommandations?: string | null;
};

export type PsgInterpretationExport = {
  id: string;
  statut: PsgInterpretationStatut;
  iah?: number | null;
  indexDesaturation?: number | null;
  spo2Moyenne?: number | null;
  spo2Min?: number | null;
  efficaciteSommeil?: number | null;
  latenceEndormissement?: number | null;
  latenceRem?: number | null;
  tempsSommeilTotal?: number | null;
  severite?: PsgSeverite | null;
  conclusion: string;
  recommandations?: string | null;
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

  create: (data: PsgInterpretationPayload & { psgId: string; conclusion: string }) =>
    sommeilApi<PsgInterpretation>("/psg-interpretations", { method: "POST", body: data }),

  update: (id: string, data: PsgInterpretationPayload) =>
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
