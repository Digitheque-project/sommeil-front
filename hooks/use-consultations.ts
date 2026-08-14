import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consultationApi, type ConsultationListFilters, type ConsultationApi, type ConsultationHistoryEntry } from '@/lib/api/consultation';

export function useAllConsultations(filters?: ConsultationListFilters) {
  return useQuery({
    queryKey: ['consultations', filters],
    queryFn: () => consultationApi.getAllConsultations(filters),
  });
}

export function useConsultation(id: string | number) {
  return useQuery({
    queryKey: ['consultation', id],
    queryFn: () => consultationApi.getConsultationById(id),
    enabled: !!id,
  });
}

export function usePatientConsultationHistory(patientId: string | number | null) {
  return useQuery({
    queryKey: ['patient-history', patientId],
    queryFn: () => consultationApi.getPatientConsultationHistory(patientId || ''),
    enabled: !!patientId,
  });
}

export function useFinalizeConsultation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      consultationApi.finalizeConsultation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['consultation'] });
    },
  });
}

export function useTraiterConsultation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, action, extra }: { id: string | number; action: string; extra?: Record<string, any> }) =>
      consultationApi.traiterConsultation(id, action as any, extra),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['consultation'] });
    },
  });
}

export function useSaveObservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, diagnostic, notes }: { id: string | number; diagnostic?: string; notes?: string }) =>
      consultationApi.addObservation(id, { diagnostic, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['consultation'] });
    },
  });
}

export function useMarkArrival() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, arrived }: { id: string | number; arrived: boolean }) =>
      consultationApi.markConsultationArrival(id, {
        arriveeAccueil: arrived,
        arriveeAccueilAt: arrived ? new Date().toISOString() : null,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consultations'] }),
  });
}

export function useArchiveConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => consultationApi.archiveConsultation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['archives'] });
    },
  });
}

export function useConsultationEventsSubscription() {
  // Pour l'instant, cette fonction est un placeholder
  // Dans une implémentation complète, elle utiliserait WebSocket ou Server-Sent Events
  // pour s'abonner aux événements temps réel du service consultation externe
  const queryClient = useQueryClient();
  
  // Placeholder pour SSE ou WebSocket
  // useEffect(() => {
  //   const eventSource = new EventSource(`${getConsultationBaseUrl()}/consultations/events`);
  //   eventSource.onmessage = (event) => {
  //     const data = JSON.parse(event.data);
  //     queryClient.invalidateQueries({ queryKey: ['consultations'] });
  //   };
  //   return () => eventSource.close();
  // }, [queryClient]);
}
