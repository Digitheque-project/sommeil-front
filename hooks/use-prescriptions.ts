import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionApi, type PolysomnographieItem } from '@/lib/api/prescription';

export function usePatientPrescriptions(patientId: string, chuId?: string) {
  return useQuery({
    queryKey: ['prescriptions', patientId, chuId],
    queryFn: () => prescriptionApi.getPatientPrescriptions(patientId, chuId),
    enabled: !!patientId,
  });
}

export function useUpdatePrescriptionStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, statut, actionParId }: { id: string; statut: string; actionParId?: string }) =>
      prescriptionApi.updatePrescriptionStatus(id, statut, actionParId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
}

export function usePolysomnographies() {
  return useQuery({
    queryKey: ['polysomnographies'],
    queryFn: () => prescriptionApi.getPolysomnographies(),
    refetchOnMount: 'always',
  });
}

export function useSchedulePolysomnographie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rdvDate, rdvHeure }: { id: string; rdvDate: string; rdvHeure?: string }) =>
      prescriptionApi.schedulePolysomnographie(id, { rdvDate, rdvHeure }),
    onSuccess: (scheduled, variables) => {
      queryClient.setQueryData<PolysomnographieItem[]>(['polysomnographies'], (current = []) => {
        const updated = scheduled as PolysomnographieItem;
        const exists = current.some((item) => item.id === variables.id);
        const nextItem: PolysomnographieItem = {
          ...(exists ? current.find((item) => item.id === variables.id)! : updated),
          ...updated,
          id: variables.id,
          statut: 'PLANIFIE',
          rdvDate: variables.rdvDate,
          rdvHeure: variables.rdvHeure ?? updated.rdvHeure,
        };
        return exists
          ? current.map((item) => item.id === variables.id ? nextItem : item)
          : [...current, nextItem];
      });
      queryClient.invalidateQueries({ queryKey: ['polysomnographies'] });
    },
  });
}
