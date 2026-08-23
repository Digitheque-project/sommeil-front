import { getSommeilApiUrl } from './consultation-config';
import { redirectToLogin } from '@/lib/auth';

export type ConsultationHistoryEntry = {
  id: string;
  date: string;
  heure: string;
  statut: string;
  typeVisite?: string;
  ordreControle?: number | null;
  diagnostic: string;
  observations: string;
  nonMedicamentPrescriptions?: Array<{
    rdvMotif?: string | null;
    rdvDate?: string | null;
    examenService?: string | null;
    hospitalisationService?: string | null;
  }>;
};

export type ClinicalParameter = {
  id?: number;
  nom: string;
  valeur: string;
  unite?: string | null;
};

export type ConsultationListFilters = {
  arrived?: boolean;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  archived?: boolean;
};

export type ConsultationApi = {
  /** Identifiant dans le centre de sommeil (cuid). */
  id: string;
  /** Identifiant dans le service qui a créé la consultation, s'il en vient un. */
  consultationId?: string;
  date: string;
  heure: string;
  patientId: string;
  motif?: string;
  patient?: {
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
  medecinId: string;
  statut: string;
  urgence: boolean;
  termine: boolean;
  arriveeAccueil?: boolean;
  arriveeAccueilAt?: string | null;
  createdAt?: string;
  typeVisite?: string;
  ordreControle?: number | null;
  consultationParenteId?: number | null;
  estReport?: boolean;
  observation?: {
    diagnostic?: string;
    diagnosticSuspicion?: string | null;
    diagnosticRetenu?: string | null;
    notes?: string;
    noteControle?: string;
  } | null;
  parametresCliniques?: ClinicalParameter[];
  nonMedicamentPrescriptions?: Array<any>;
};

export type HospitalisationServiceOption = {
  id: string;
  name: string;
};

export const getVisiteLabel = (
  consultation: Pick<ConsultationApi, 'typeVisite' | 'ordreControle' | 'consultationParenteId'>
) => {
  const normalizedType = consultation.typeVisite?.toUpperCase();
  const hasControlFields =
    normalizedType === 'CONTROLE' ||
    consultation.ordreControle !== null && consultation.ordreControle !== undefined ||
    consultation.consultationParenteId !== null && consultation.consultationParenteId !== undefined;

  if (hasControlFields) {
    const order = consultation.ordreControle ?? 1;
    if (order === 1) {
      return '1er contrôle';
    }
    if (order > 1) {
      return `${order}e contrôle`;
    }
    return 'Contrôle';
  }

  return 'Consultation initiale';
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

export const consultationApi = {
  async getAllConsultations(filters?: ConsultationListFilters) {
    const params = new URLSearchParams();
    if (filters?.arrived !== undefined) params.set('arrived', String(filters.arrived));
    if (filters?.date) params.set('date', filters.date);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    if (filters?.archived) params.set('archived', 'true');
    
    const queryString = params.toString();
    const res = await fetch(`${getSommeilApiUrl('/consultations')}${queryString ? `?${queryString}` : ''}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async getWaitingConsultations() {
    const res = await fetch(getSommeilApiUrl('/consultations/waiting'), {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async getControlConsultations() {
    const res = await fetch(getSommeilApiUrl('/consultations/controls'), {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async getConsultationById(id: string | number) {
    const res = await fetch(getSommeilApiUrl(`/consultations/${id}`), {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async getPatientConsultationHistory(patientId: string | number) {
    const res = await fetch(getSommeilApiUrl(`/consultations/patient/${patientId}/history`), {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async markConsultationArrival(id: string | number, payload: { arriveeAccueil?: boolean; arriveeAccueilAt?: string | Date | null }) {
    const res = await fetch(getSommeilApiUrl(`/consultations/${id}/arrival`), {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async finalizeConsultation(id: string | number, payload: any) {
    const res = await fetch(getSommeilApiUrl(`/consultations/${id}/finalize`), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async saveControlNote(id: string | number, note: string) {
    const res = await fetch(getSommeilApiUrl(`/consultations/${id}/control-note`), {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ note }),
    });
    return handleResponse(res);
  },

  async traiterConsultation(id: string | number, action: 'ouvrir' | 'annuler' | 'terminer' | 'controle' | 'examen' | 'hospitalisation' | 'reporter', extra?: Record<string, any>) {
    const res = await fetch(getSommeilApiUrl(`/consultations/${id}/traiter`), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action, ...extra }),
    });
    return handleResponse(res);
  },

  async getHospitalisationServices() {
    const res = await fetch(getSommeilApiUrl('/services/hospitalisation'), {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return handleResponse(res);
  },

  /** Enregistre observation et diagnostic sans clore la consultation. */
  async addObservation(
    id: string | number,
    payload: { diagnostic?: string; notes?: string }
  ) {
    const res = await fetch(getSommeilApiUrl(`/consultations/${id}/observations`), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async archiveConsultation(id: string | number) {
    const res = await fetch(getSommeilApiUrl(`/consultations/${id}/archive`), {
      method: 'POST',
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async getCompteRendus(id: string | number) {
    const res = await fetch(getSommeilApiUrl(`/consultations/${id}/compte-rendus`), {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },
};
