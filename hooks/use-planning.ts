import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  planningApi,
  type CreerRdvInput,
  type ModifierRdvInput,
  type PlanningListFilters,
} from "@/lib/api/planning";

const PLANNING_QUERY_KEY = "planning-rdvs";

export function usePlanningRdvs(filters?: PlanningListFilters) {
  return useQuery({
    queryKey: [PLANNING_QUERY_KEY, filters],
    queryFn: () => planningApi.getRdvs(filters),
  });
}

export function usePlanningRdv(id: string | null) {
  return useQuery({
    queryKey: [PLANNING_QUERY_KEY, "detail", id],
    queryFn: () => planningApi.getRdvById(id as string),
    enabled: !!id,
  });
}

export function useCreerRdv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreerRdvInput) => planningApi.creerRdv(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PLANNING_QUERY_KEY] }),
  });
}

export function useModifierRdv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ModifierRdvInput }) =>
      planningApi.modifierRdv(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PLANNING_QUERY_KEY] }),
  });
}

export function useAnnulerRdv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => planningApi.annulerRdv(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PLANNING_QUERY_KEY] }),
  });
}

export function useMarquerNonRealise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => planningApi.marquerNonRealise(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PLANNING_QUERY_KEY] }),
  });
}
