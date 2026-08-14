import { sommeilApi } from "./http";

export type StatsPeriod = "7j" | "30j" | "annee";

export type Stats = {
  periode: StatsPeriod;
  debut: string;
  fin: string;
  indicateurs: {
    examensRealises: number;
    consultations: number;
    comptesRendusValides: number;
    tauxValidation: number;
    urgences: number;
  };
  volumeExamens: Array<{ label: string; precedent: number; courant: number }>;
  typesExamens: Array<{ label: string; value: number }>;
  severite: Array<{ label: string; value: number }>;
  occupationSalles: Array<{ label: string; percent: number }>;
};

export type StatsExport = Stats & { genereLe: string };

export const statsApi = {
  get: (periode: StatsPeriod) => sommeilApi<Stats>("/stats", { query: { periode } }),
  export: (periode: StatsPeriod) => sommeilApi<StatsExport>("/stats/export", { query: { periode } }),
};
