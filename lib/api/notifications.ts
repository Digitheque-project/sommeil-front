// Client du hub de notification centralisé du CHU.
// Base URL du hub (sans préfixe ni suffixe). Les routes REST sont exposées
// directement à la racine (ex. /notifications), les clients temps réel sur
// /socket.io/.
const DEFAULT_NOTIFICATION_HUB_URL = 'https://notification-back-xrl2.onrender.com';
// Identifiant du service sommeil dans la plateforme CHU. Les notifications
// diffusées à un service sont consultables sous l'utilisateur pseudo
// "broadcast:service:{serviceId}".
const DEFAULT_NOTIFICATION_SERVICE_ID = '79beaa8b-24ef-4f46-81ca-9a2b7c99a56b';

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

const getNotificationHubUrl = () =>
  (process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL || DEFAULT_NOTIFICATION_HUB_URL).replace(/\/+$/, '');

const getNotificationServiceId = () =>
  process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_ID || DEFAULT_NOTIFICATION_SERVICE_ID;

const getBroadcastUserId = () => `broadcast:service:${getNotificationServiceId()}`;

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP error! status: ${res.status}`);
  }
  return res.json();
};

export const notificationApi = {
  // Notifications diffusées au service sommeil (broadcast:service:{id}).
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${getNotificationHubUrl()}/notifications/user/${encodeURIComponent(getBroadcastUserId())}`, {
      cache: 'no-store',
    });
    return handleResponse(res);
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
