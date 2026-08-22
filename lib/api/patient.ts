/**
 * Informations patient.
 *
 * L'identité du patient vient du service ACCUEIL (source de vérité du CHU) :
 * `GET <accueil>/patients` et `GET <accueil>/patients/{id}`, `chuId` étant
 * obligatoire sur les deux. Le service dossier-patient n'expose aucune route
 * d'identité — seulement le dossier médical, dont la timeline agrégée
 * (`/dossier-patient/patients/{id}/historique`) utilisée par `getPatientTimeline`.
 */
import { API_BASE_URLS, CHU_ID } from '../config';
import { accueilApi, type AccueilPatient } from './accueil';

export type PatientInfo = {
  id: string;
  prenom: string;
  nom: string;
  displayName: string;
  /** Numéro de dossier, quand le service accueil en fournit un. */
  dossier?: string | null;
  sexe?: string | null;
  dateNaissance?: string | null;
  cin?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  profession?: string | null;
  allergie?: string | null;
  contactUrgence?: string | null;
  priseEnChargeId?: string | null;
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

/** Fiche accueil → forme attendue par les écrans du centre de sommeil. */
function toPatientInfo(patient: AccueilPatient): PatientInfo {
  const prenom = patient.prenom ?? '';
  const nom = patient.nom ?? '';

  return {
    id: patient.id,
    prenom,
    nom,
    displayName: `${prenom} ${nom}`.trim() || patient.id,
    // Le swagger accueil ne décrit pas de numéro de dossier : on le relaie
    // s'il est présent dans la réponse, sinon on laisse vide.
    dossier: (patient as { dossier?: string | null }).dossier ?? null,
    sexe: patient.sexe ?? null,
    dateNaissance: patient.dateNaissance ?? null,
    cin: patient.cin ?? null,
    telephone: patient.telephone ?? null,
    adresse: patient.adresse ?? null,
    profession: patient.profession ?? null,
    allergie: patient.allergie ?? null,
    contactUrgence: patient.contactUrgence ?? null,
    priseEnChargeId: patient.priseEnChargeId ?? null,
  };
}

export const patientApi = {
  /** Identité du patient telle qu'enregistrée à l'accueil du CHU. */
  async getPatientById(patientId: string, chuId: string = CHU_ID): Promise<PatientInfo> {
    const patient = await accueilApi.getPatient(patientId, chuId);
    if (!patient) {
      throw new Error(`Patient ${patientId} inconnu du service accueil`);
    }
    return toPatientInfo(patient);
  },

  /**
   * Timeline agrégée du dossier médical (observations, diagnostics, suivis,
   * paramètres, sorties). Tous services du CHU confondus.
   */
  async getPatientTimeline(
    patientId: string,
    chuId: string = CHU_ID,
  ): Promise<PatientTimelineEntry[]> {
    const res = await fetch(
      `${API_BASE_URLS.dossierPatient}/patients/${encodeURIComponent(patientId)}/historique` +
        `?chuId=${encodeURIComponent(chuId)}`,
      { headers: authHeaders() },
    );
    if (!res.ok) return [];

    const entries = await res.json();
    return Array.isArray(entries) ? entries : [];
  },

  /**
   * Recherche par nom, prénom ou identifiant. Le service accueil n'expose pas
   * d'endpoint de recherche : on filtre la liste du CHU côté client.
   */
  async searchPatients(query: string, chuId: string = CHU_ID): Promise<PatientInfo[]> {
    const needle = query.trim().toLowerCase();
    const patients = await accueilApi.listPatients(chuId);
    const infos = patients.map(toPatientInfo);
    if (!needle) return infos;

    return infos.filter(
      (patient) =>
        patient.displayName.toLowerCase().includes(needle) ||
        patient.id.toLowerCase().includes(needle) ||
        (patient.cin ?? '').toLowerCase().includes(needle),
    );
  },
};
