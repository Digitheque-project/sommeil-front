"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { psgApi, type PsgExam, type PsgStatut } from "@/lib/api/psg";

const KEY = ["psg-exams"];

export function usePsgExams(statut?: PsgStatut) {
  return useQuery({
    queryKey: [...KEY, statut ?? null],
    queryFn: () => psgApi.list(statut),
  });
}

function usePsgMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      // La liste des prescriptions affiche l'état de planification des examens.
      queryClient.invalidateQueries({ queryKey: ["polysomnographies"] });
    },
  });
}

export function useStartPsg() {
  return usePsgMutation(({ id, salle }: { id: string; salle?: string }) => psgApi.start(id, salle));
}

export function useStopPsg() {
  return usePsgMutation((id: string) => psgApi.stop(id));
}

export function useUpdatePsg() {
  return usePsgMutation(
    ({ id, ...data }: { id: string; rdvDate?: string; rdvHeure?: string; salle?: string; motif?: string }) =>
      psgApi.update(id, data)
  );
}

export function useDeletePsg() {
  return usePsgMutation((id: string) => psgApi.remove(id));
}

export type { PsgExam };
