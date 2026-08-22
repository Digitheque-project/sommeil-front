// Client du hub de notification centralisé du CHU.
// Base URL du hub (sans préfixe ni suffixe) : les routes REST sont exposées
// directement à la racine (ex. /notifications), les clients temps réel sur
// /socket.io/. Le swagger, lui, est monté sous /notification/api/docs.
import { API_BASE_URLS, SLEEP_SERVICE_ID } from '../config';

export type NotificationItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  source: string;
  data?: Record<string, unknown> | null;
  createdAt: string;
  read: boolean;
  priority: 'normal' | 'urgent' | 'critical';
};

const getNotificationHubUrl = () => API_BASE_URLS.notificationHub;

// Les notifications diffusées à un service sont consultables sous
// l'utilisateur pseudo "broadcast:service:{serviceId}".
const getBroadcastUserId = () => `broadcast:service:${SLEEP_SERVICE_ID}`;

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP error! status: ${res.status}`);
  }
  return res.json();
};

/**
 * Second verrou côté client : le hub scope déjà par pseudo-utilisateur, mais
 * une notification qui désigne explicitement un AUTRE service ne doit jamais
 * s'afficher ici. Celles qui ne déclarent aucun service sont conservées —
 * elles nous sont adressées par construction.
 */
const isForSleepService = (item: NotificationItem): boolean => {
  const data = (item.data ?? {}) as Record<string, unknown>;
  const declared = [data.serviceDestId, data.serviceId]
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  return declared.length === 0 || declared.includes(SLEEP_SERVICE_ID);
};

export const notificationApi = {
  // Notifications diffusées au service sommeil (broadcast:service:{id}).
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${getNotificationHubUrl()}/notifications/user/${encodeURIComponent(getBroadcastUserId())}`, {
      cache: 'no-store',
    });
    const items = (await handleResponse(res)) as NotificationItem[];
    return Array.isArray(items) ? items.filter(isForSleepService) : [];
  },

  // Accuse de lecture PERSONNEL (userId = pseudo utilisateur du service) :
  // les collègues d'un même service conservent leur propre indice de lecture.
  async markNotificationsRead(ids: string[]): Promise<{ updated: number; ignored: number }> {
    const res = await fetch(`${getNotificationHubUrl()}/notifications/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, userId: getBroadcastUserId() }),
    });
    return handleResponse(res);
  },
};
