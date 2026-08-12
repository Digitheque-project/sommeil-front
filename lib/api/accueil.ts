import { API_BASE_URLS } from '../config';

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
