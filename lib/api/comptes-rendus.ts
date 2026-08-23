import { sommeilApi } from "./http";

export type CompteRenduStatut = "BROUILLON" | "VALIDE";

export type CompteRendu = {
  id: string;
  consultationId?: string | null;
  psgId?: string | null;
  titre: string;
  contenu: string;
  conclusion?: string | null;
  photoUrl?: string | null;
  type: string;
  statut: CompteRenduStatut;
  valideLe?: string | null;
  validePar?: string | null;
  patientId?: string | null;
  patientNom?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompteRenduExport = {
  id: string;
  titre: string;
  contenu: string;
  conclusion?: string | null;
  photoUrl?: string | null;
  type: string;
  statut: CompteRenduStatut;
  valideLe?: string | null;
  validePar?: string | null;
  genereLe: string;
  patient: { id: string | null; nom: string | null; dossier: string | null };
  consultation: { id: string; date: string; heure: string; motif: string } | null;
  examen: { id: string; rdvDate: string; rdvHeure: string; motif: string; termineLe: string | null } | null;
};

export const compteRenduApi = {
  list: (filters?: {
    statut?: CompteRenduStatut;
    patientId?: string;
    consultationId?: string;
    psgId?: string;
  }) => sommeilApi<CompteRendu[]>("/comptes-rendus", { query: filters }),

  get: (id: string) => sommeilApi<CompteRendu>(`/comptes-rendus/${id}`),

  create: (data: {
    psgId: string;
    titre?: string;
    contenu: string;
    conclusion?: string;
    photoUrl?: string;
    type?: string;
    patientId?: string;
    patientNom?: string;
  }) => sommeilApi<CompteRendu>("/comptes-rendus", { method: "POST", body: data }),

  update: (
    id: string,
    data: { titre?: string; contenu?: string; conclusion?: string; photoUrl?: string | null; type?: string }
  ) => sommeilApi<CompteRendu>(`/comptes-rendus/${id}`, { method: "PUT", body: data }),

  validate: (id: string, validePar?: string) =>
    sommeilApi<CompteRendu & { prescripteurNotifie: boolean }>(`/comptes-rendus/${id}/validate`, {
      method: "POST",
      body: { validePar },
    }),

  remove: (id: string) =>
    sommeilApi<{ success: boolean; id: string }>(`/comptes-rendus/${id}`, { method: "DELETE" }),

  export: (id: string) => sommeilApi<CompteRenduExport>(`/comptes-rendus/${id}/export`),
};
