import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionApi } from '@/lib/api/prescription';

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
  });
}

export function useSchedulePolysomnographie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rdvDate, rdvHeure }: { id: string; rdvDate: string; rdvHeure?: string }) =>
      prescriptionApi.schedulePolysomnographie(id, { rdvDate, rdvHeure }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polysomnographies'] });
    },
  });
}
