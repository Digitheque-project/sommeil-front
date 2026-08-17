"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  psgInterpretationApi,
  type PsgInterpretation,
  type PsgInterpretationStatut,
} from "@/lib/api/psg-interpretations";

const KEY = ["psg-interpretations"];

export function usePsgInterpretations(filters?: {
  statut?: PsgInterpretationStatut;
  psgId?: string;
  patientId?: string;
}) {
  return useQuery({
    queryKey: [...KEY, filters ?? null],
    queryFn: () => psgInterpretationApi.list(filters),
  });
}

function usePsgInterpretationMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreatePsgInterpretation() {
  return usePsgInterpretationMutation((data: Parameters<typeof psgInterpretationApi.create>[0]) =>
    psgInterpretationApi.create(data)
  );
}

export function useUpdatePsgInterpretation() {
  return usePsgInterpretationMutation(
    ({ id, ...data }: { id: string; titre?: string; contenu?: string }) =>
      psgInterpretationApi.update(id, data)
  );
}

export function useValidatePsgInterpretation() {
  return usePsgInterpretationMutation(({ id, validePar }: { id: string; validePar?: string }) =>
    psgInterpretationApi.validate(id, validePar)
  );
}

export function useDeletePsgInterpretation() {
  return usePsgInterpretationMutation((id: string) => psgInterpretationApi.remove(id));
}

export type { PsgInterpretation };
