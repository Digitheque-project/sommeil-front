"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { compteRenduApi, type CompteRendu, type CompteRenduStatut } from "@/lib/api/comptes-rendus";

const KEY = ["comptes-rendus"];

export function useComptesRendus(filters?: {
  statut?: CompteRenduStatut;
  patientId?: string;
  consultationId?: string;
  psgId?: string;
}) {
  return useQuery({
    queryKey: [...KEY, filters ?? null],
    queryFn: () => compteRenduApi.list(filters),
  });
}

function useCompteRenduMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreateCompteRendu() {
  return useCompteRenduMutation((data: Parameters<typeof compteRenduApi.create>[0]) =>
    compteRenduApi.create(data)
  );
}

export function useUpdateCompteRendu() {
  return useCompteRenduMutation(
    ({ id, ...data }: { id: string } & Parameters<typeof compteRenduApi.update>[1]) =>
      compteRenduApi.update(id, data)
  );
}

export function useValidateCompteRendu() {
  return useCompteRenduMutation(({ id, validePar }: { id: string; validePar?: string }) =>
    compteRenduApi.validate(id, validePar)
  );
}

export function useDeleteCompteRendu() {
  return useCompteRenduMutation((id: string) => compteRenduApi.remove(id));
}

export type { CompteRendu };
