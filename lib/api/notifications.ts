// Client du hub de notification centralisé du CHU.
// Base URL du hub (sans préfixe ni suffixe) : les routes REST sont exposées
// directement à la racine (ex. /notifications), les clients temps réel sur
// /socket.io/. Le swagger, lui, est monté sous /notification/api/docs.
import { API_BASE_URLS, SLEEP_SERVICE_ID } from '../config';
import { getSleepUserFromToken } from '../auth';

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

function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token');
  return getSleepUserFromToken(token)?.userId ?? null;
}

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP error! status: ${res.status}`);
  }
  return res.json();
};

/**
 * Le hub range chaque notification sous la clé de routage `userId` qu'on
 * interroge. Vérifié en direct sur le hub de production : des messages
 * génériques (`userId: "broadcast"`, sans suffixe de service — un autre
 * service qui diffuse "à tout le monde", ex. un examen d'imagerie terminé)
 * remontent quand même sur NOTRE requête `broadcast:service:{id}` et n'ont
 * rien à voir avec le centre de sommeil (4 des 11 notifications réelles
 * observées, toutes hors-sujet). On ne garde donc que ce qui est classé
 * exactement sous notre propre clé.
 *
 * Second verrou : si un service DIFFÉRENT est explicitement déclaré dans le
 * contenu, on rejette quand même — protège d'un bug de résolution en amont
 * plutôt que d'un simple defaut d'information.
 */
const isForSleepService = (item: NotificationItem): boolean => {
  if (item.userId !== getBroadcastUserId()) return false;

  const data = (item.data ?? {}) as Record<string, unknown>;
  const declared = [data.serviceDestId, data.serviceId]
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  return declared.length === 0 || declared.includes(SLEEP_SERVICE_ID);
};

/**
 * L'émetteur d'une notification ne doit jamais se la voir renvoyer. Le hub
 * route déjà par service destinataire (jamais vers le service source), mais
 * ça ne protège pas le cas où l'émetteur travaille aussi au centre de
 * sommeil : `data.userId`/`data.medecinId` porte l'identité réelle de la
 * personne à l'origine de l'action (cf. prescription-notifier côté service
 * prescriptions), à comparer à l'utilisateur courant.
 */
const isFromCurrentUser = (item: NotificationItem, currentUserId: string | null): boolean => {
  if (!currentUserId) return false;
  const data = (item.data ?? {}) as Record<string, unknown>;
  const emetteur = [data.userId, data.medecinId].find(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );
  return emetteur === currentUserId;
};

export const notificationApi = {
  // Notifications diffusées au service sommeil (broadcast:service:{id}),
  // moins celles émises par l'utilisateur courant lui-même.
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${getNotificationHubUrl()}/notifications/user/${encodeURIComponent(getBroadcastUserId())}`, {
      cache: 'no-store',
    });
    const items = (await handleResponse(res)) as NotificationItem[];
    if (!Array.isArray(items)) return [];

    const currentUserId = getCurrentUserId();
    return items.filter(
      (item) => isForSleepService(item) && !isFromCurrentUser(item, currentUserId),
    );
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
