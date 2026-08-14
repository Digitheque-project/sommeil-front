"use client";

import { useQuery } from "@tanstack/react-query";
import { statsApi, type StatsPeriod } from "@/lib/api/stats";

export function useStats(periode: StatsPeriod) {
  return useQuery({
    queryKey: ["stats", periode],
    queryFn: () => statsApi.get(periode),
  });
}

export type { StatsPeriod };
