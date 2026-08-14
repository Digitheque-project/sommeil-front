// Base URL du backend sommeil-back (sans préfixe ni suffixe). Le préfixe global
// de l'API (par défaut "sommeil/api") est ajouté ici.
const DEFAULT_SOMMEIL_BASE_URL = 'http://localhost:8888';
const DEFAULT_API_PREFIX = 'sommeil/api';

const getPrescriptionBaseUrl = () => {
  const configuredUrl = (
    process.env.NEXT_PUBLIC_SOMMEIL_API_URL ||
    process.env.NEXT_PUBLIC_PRESCRIPTION_URL ||
    DEFAULT_SOMMEIL_BASE_URL
  );
  const baseUrl = configuredUrl.replace(/\/+$/, '');
  const apiPrefix = process.env.NEXT_PUBLIC_SOMMEIL_API_PREFIX || DEFAULT_API_PREFIX;
  return `${baseUrl}/${apiPrefix}`;
};

const authHeaders = (): Record<string, string> => {
  // Mêmes clés que celles posées par AuthContext : `token` seul laissait
  // partir les requêtes sans en-tête d'autorisation.
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP error! status: ${res.status}`);
  }
  return res.json();
};

export type PolysomnographieItem = {
  id: string;
  patientId: string;
  patientNom: string;
  patientPrenom: string;
  motif: string;
  statut: string;
  urgence: boolean;
  createdAt: string;
  rdvDate?: string | null;
  rdvHeure?: string | null;
};

export const prescriptionApi = {
  async getPatientPrescriptions(patientId: string, chuId?: string) {
    const params = new URLSearchParams();
    if (chuId) params.set('chuId', chuId);
    
    const queryString = params.toString();
    const res = await fetch(`${getPrescriptionBaseUrl()}/prescriptions/patient/${patientId}${queryString ? `?${queryString}` : ''}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async updatePrescriptionStatus(id: string, statut: string, actionParId?: string) {
    const res = await fetch(`${getPrescriptionBaseUrl()}/prescriptions/${id}/statut`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ statut, actionParId }),
    });
    return handleResponse(res);
  },

  async getPolysomnographies(): Promise<PolysomnographieItem[]> {
    const res = await fetch(`${getPrescriptionBaseUrl()}/prescriptions/polysomnographie`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async schedulePolysomnographie(id: string, payload: { rdvDate: string; rdvHeure?: string }) {
    const res = await fetch(`${getPrescriptionBaseUrl()}/prescriptions/polysomnographie/${id}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },
};
