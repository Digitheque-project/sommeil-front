"use client";

import { useQuery } from "@tanstack/react-query";
import { getSommeilApiUrl } from "@/lib/api/consultation-config";

const BACKEND_STATUS_POLLING_INTERVAL = 15_000;

/**
 * Ping léger de la racine de l'API (route non protégée, cf. AppController)
 * pour refléter dans le header si sommeil-back répond -- pas de websocket
 * disponible côté sommeil, donc pas de signal "temps réel" comme côté
 * pharmacie, mais un polling toutes les 15s suffit pour ce point vert.
 */
export function useBackendStatus() {
  const { data } = useQuery({
    queryKey: ["backend-status"],
    queryFn: async () => {
      const res = await fetch(getSommeilApiUrl(""), { method: "GET" });
      return res.ok;
    },
    refetchInterval: BACKEND_STATUS_POLLING_INTERVAL,
    retry: false,
    staleTime: 0,
  });

  return data ?? false;
}
