import { sommeilApi } from "./http";

export type Archive = {
  id: string;
  type: string;
  referenceId: string;
  titre: string;
  description?: string | null;
  donnees: Record<string, unknown>;
  restored: boolean;
  restoredAt?: string | null;
  restoredBy?: string | null;
  archivedAt: string;
  archivedBy?: string | null;
};

export type ArchiveFilters = { type?: string; includeRestored?: boolean };

export const archiveApi = {
  list: (filters?: ArchiveFilters) =>
    sommeilApi<Archive[]>("/archives", {
      query: { type: filters?.type, includeRestored: filters?.includeRestored },
    }),

  get: (id: string) => sommeilApi<Archive>(`/archives/${id}`),

  create: (data: {
    type: string;
    referenceId: string;
    titre: string;
    description?: string;
    donnees: unknown;
    archivedBy?: string;
  }) => sommeilApi<Archive>("/archives", { method: "POST", body: data }),

  restore: (id: string, restoredBy?: string) =>
    sommeilApi<{ success: boolean; archive: Archive }>(`/archives/${id}/restore`, {
      method: "POST",
      body: { restoredBy },
    }),

  remove: (id: string) =>
    sommeilApi<{ success: boolean; id: string }>(`/archives/${id}`, { method: "DELETE" }),

  export: (id: string) => sommeilApi<Archive & { genereLe: string }>(`/archives/${id}/export`),

  exportAll: (filters?: ArchiveFilters) =>
    sommeilApi<{ genereLe: string; total: number; archives: Archive[] }>("/archives/export", {
      query: { type: filters?.type, includeRestored: filters?.includeRestored },
    }),
};
