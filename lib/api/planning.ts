import { sommeilApi } from "./http";

export type StatutRdv = "EN_ATTENTE" | "REALISE" | "NON_REALISE" | "ANNULE";
export type PrioriteRdv = "TRES_URGENTE" | "URGENTE" | "NORMALE";

export type RendezVousPlanning = {
  id: string;
  patientId: string;
  patientNom: string;
  patientPrenom: string;
  patientDossier?: string | null;
  motif?: string | null;
  priorite: PrioriteRdv;
  statut: StatutRdv;
  dateRdv: string;
  heureDebut: string;
  heureFin: string;
  dureeMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type PlanningListFilters = {
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  patientId?: string;
};

export type CreerRdvInput = {
  patientId: string;
  patientNom: string;
  patientPrenom: string;
  patientDossier?: string;
  motif?: string;
  priorite?: PrioriteRdv;
  dateRdv: string;
  heureDebut: string;
  dureeMinutes?: number;
};

export type ModifierRdvInput = Partial<CreerRdvInput>;

export const planningApi = {
  getRdvs: (filters?: PlanningListFilters) =>
    sommeilApi<RendezVousPlanning[]>("/planning", { query: filters }),

  getRdvById: (id: string) => sommeilApi<RendezVousPlanning>(`/planning/${id}`),

  creerRdv: (data: CreerRdvInput) =>
    sommeilApi<RendezVousPlanning>("/planning", { method: "POST", body: data }),

  modifierRdv: (id: string, data: ModifierRdvInput) =>
    sommeilApi<RendezVousPlanning>(`/planning/${id}`, { method: "PATCH", body: data }),

  annulerRdv: (id: string) =>
    sommeilApi<RendezVousPlanning>(`/planning/${id}/annuler`, { method: "PATCH" }),

  marquerNonRealise: (id: string) =>
    sommeilApi<RendezVousPlanning>(`/planning/${id}/non-realise`, { method: "PATCH" }),

  supprimerRdv: (id: string) =>
    sommeilApi<void>(`/planning/${id}`, { method: "DELETE" }),
};
