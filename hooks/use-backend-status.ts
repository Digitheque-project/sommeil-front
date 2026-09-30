"use client";

import { useQuery } from "@tanstack/react-query";
import { getSommeilApiUrl } from "@/lib/api/consultation-config";
import { getAuthToken } from "@/lib/api/http";

const BACKEND_STATUS_POLLING_INTERVAL = 15_000;

/**
 * Ping léger de la racine de l'API (route non protégée, cf. AppController)
 * pour refléter dans le header si sommeil-back répond -- pas de websocket
 * disponible côté sommeil, donc pas de signal "temps réel" comme côté
 * pharmacie, mais un polling toutes les 15s suffit pour ce point vert.
 *
 * La route est publique côté sommeil-back, mais la passerelle API exige un
 * jeton sur tout ce qu'elle relaie : sans lui, 401 et point rouge à tort.
 */
export function useBackendStatus() {
  const { data } = useQuery({
    queryKey: ["backend-status"],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch(getSommeilApiUrl(""), {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.ok;
    },
    refetchInterval: BACKEND_STATUS_POLLING_INTERVAL,
    retry: false,
    staleTime: 0,
  });

  return data ?? false;
}
