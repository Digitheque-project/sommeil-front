import { API_BASE_URLS } from '../config';

export type PatientInfo = {
  id: string;
  prenom: string;
  nom: string;
  displayName: string;
  dossier: string;
  sexe?: string | null;
  dateNaissance?: string | null;
  cin?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  profession?: string | null;
  contactUrgence?: string | null;
  priseEnChargeId?: string | null;
  priseEnCharge?: { id: string; companyName: string; isActive: boolean } | null;
};

export type PatientTimelineEntry = {
  id: number;
  date: string;
  title: string;
  body: string;
  accent: string;
  attachment?: string;
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

export const patientApi = {
  async getPatientById(patientId: string): Promise<PatientInfo> {
    const res = await fetch(`${API_BASE_URLS.dossierPatient}/patients/${patientId}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async getPatientTimeline(patientId: string): Promise<PatientTimelineEntry[]> {
    const res = await fetch(`${API_BASE_URLS.dossierPatient}/patients/${patientId}/timeline`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return handleResponse(res);
  },

  async searchPatients(query: string): Promise<PatientInfo[]> {
    const res = await fetch(`${API_BASE_URLS.dossierPatient}/patients/search?q=${encodeURIComponent(query)}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return handleResponse(res);
  },
};
