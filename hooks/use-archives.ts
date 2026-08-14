"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { archiveApi, type Archive, type ArchiveFilters } from "@/lib/api/archives";

const KEY = ["archives"];

export function useArchives(filters?: ArchiveFilters) {
  return useQuery({
    queryKey: [...KEY, filters ?? null],
    queryFn: () => archiveApi.list(filters),
  });
}

export function useRestoreArchive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, restoredBy }: { id: string; restoredBy?: string }) =>
      archiveApi.restore(id, restoredBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      // Une consultation restaurée réapparaît dans le fil de travail.
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}

export function useDeleteArchive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export type { Archive };
