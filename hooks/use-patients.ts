"use client";

import { useQuery } from "@tanstack/react-query";
import { accueilApi, type AccueilPatient } from "@/lib/api/accueil";

/**
 * Fiche patient issue du service accueil, source de vérité des informations
 * d'identité. La requête est désactivée tant qu'aucun identifiant n'est connu.
 */
export function usePatient(patientId?: string | null) {
  return useQuery({
    queryKey: ["accueil-patient", patientId],
    queryFn: () => accueilApi.getPatient(patientId as string),
    enabled: Boolean(patientId),
    // L'identité d'un patient bouge rarement pendant une session de rédaction.
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function usePatients() {
  return useQuery({
    queryKey: ["accueil-patients"],
    queryFn: () => accueilApi.listPatients(),
    staleTime: 5 * 60 * 1000,
  });
}

export type { AccueilPatient };
