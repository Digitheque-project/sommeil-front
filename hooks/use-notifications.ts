"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api/notifications";

const NOTIFICATIONS_POLLING_INTERVAL = 30_000;

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getNotifications(),
    refetchInterval: NOTIFICATIONS_POLLING_INTERVAL,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => notificationApi.markNotificationsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
