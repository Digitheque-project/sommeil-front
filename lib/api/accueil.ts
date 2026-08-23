import { API_BASE_URLS, CHU_ID } from '../config';
import { redirectToLogin } from '@/lib/auth';

/**
 * Patient tel que renvoyé par le service accueil (swagger /accueil/api/docs).
 * Le swagger ne décrit que les DTO d'écriture : les champs de lecture sont
 * donc tous traités comme facultatifs.
 */
export type AccueilPatient = {
  id: string;
  nom?: string | null;
  prenom?: string | null;
  sexe?: 'MALE' | 'FEMALE' | string | null;
  dateNaissance?: string | null;
  cin?: string | null;
  profession?: string | null;
  adresse?: string | null;
  allergie?: string | null;
  telephone?: string | null;
  contactUrgence?: string | null;
  chuId?: string | null;
  priseEnChargeId?: string | null;
  createdAt?: string | null;
};

export type DoctorQuota = {
  medecinId: string;
  date: string;
  totalConsultations: number;
  completedConsultations: number;
  quotaMax: number;
  progressPercent: number;
};

export type DailyStats = {
  date: string;
  totalExamens: number;
  compteRendusEnAttente: number;
  compteRendusPrioritaires: number;
  occupationLits: number;
  totalLits: number;
};

export type ActivityFeedItem = {
  id: string;
  type: 'upload' | 'validation' | 'consultation' | 'examen';
  title: string;
  subtitle: string;
  time: string;
  badge?: string;
  icon: string;
  iconBg: string;
  iconColor: string;
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token')
  );
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function handleResponse(res: Response) {
  if (res.status === 401) {
    redirectToLogin();
    throw new Error('Session expirée, redirection vers la connexion…');
  }
  if (!res.ok) {
    let message = `Erreur HTTP ${res.status}`;
    try {
      const error = await res.json();
      if (Array.isArray(error?.message)) {
        message = error.message.join(', ');
      } else if (error?.message) {
        message = error.message;
      }
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export const accueilApi = {
  /**
   * Fiche patient du service accueil. Renvoie `null` quand le patient est
   * inconnu du CHU (404) : l'appelant retombe alors sur l'identité portée par
   * l'examen, sans faire échouer l'écran.
   */
  async getPatient(id: string, chuId: string = CHU_ID): Promise<AccueilPatient | null> {
    const res = await fetch(
      `${API_BASE_URLS.accueil}/patients/${encodeURIComponent(id)}?chuId=${encodeURIComponent(chuId)}`,
      { headers: authHeaders() },
    );
    if (res.status === 404) return null;
    return handleResponse(res);
  },

  /** Liste des patients enregistrés pour le CHU. */
  async listPatients(chuId: string = CHU_ID): Promise<AccueilPatient[]> {
    const res = await fetch(
      `${API_BASE_URLS.accueil}/patients?chuId=${encodeURIComponent(chuId)}`,
      { headers: authHeaders() },
    );
    if (!res.ok) return [];
    return handleResponse(res);
  },

  async getDoctorQuota(medecinId: string, date?: string): Promise<DoctorQuota> {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    
    const queryString = params.toString();
    const res = await fetch(`${API_BASE_URLS.accueil}/medecins/${medecinId}/quota${queryString ? `?${queryString}` : ''}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async getDailyStats(date?: string): Promise<DailyStats> {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    
    const queryString = params.toString();
    const res = await fetch(`${API_BASE_URLS.accueil}/stats/daily${queryString ? `?${queryString}` : ''}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async getActivityFeed(limit: number = 10): Promise<ActivityFeedItem[]> {
    const res = await fetch(`${API_BASE_URLS.accueil}/activity-feed?limit=${limit}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return handleResponse(res);
  },

  async getWeeklyExamTrend(weeks: number = 5): Promise<Array<{ label: string; values: { courant: number } }>> {
    const res = await fetch(`${API_BASE_URLS.accueil}/stats/exam-trend?weeks=${weeks}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return handleResponse(res);
  },
};
