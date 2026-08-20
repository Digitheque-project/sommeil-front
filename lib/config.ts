export const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? "https://gateway-3g6c.onrender.com";
export const AUTH_LOGIN_URL = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? "https://authentification-front.vercel.app/login";

export const API_ROUTES = {
  authDocs: `${API_GATEWAY_URL}/auth/api/docs`,
  usersDocs: `${API_GATEWAY_URL}/users/api/docs`,
  servicesDocs: `${API_GATEWAY_URL}/services/api/docs`,
  chuDocs: `${API_GATEWAY_URL}/chu/api/docs`,
  dossierPatientDocs: `${API_GATEWAY_URL}/dossier-patient/api/docs`,
  accueilDocs: `${API_GATEWAY_URL}/accueil/api/docs`,
  prescriptionsDocs: `${API_GATEWAY_URL}/prescriptions/api/docs`,
  consultationDocs: `${API_GATEWAY_URL}/consultation/api/docs`,
};

/**
 * Identifiant de l'établissement. Le service accueil exige `chuId` sur chacun
 * de ses endpoints patients.
 */
export const CHU_ID = process.env.NEXT_PUBLIC_CHU_ID ?? "1e5bbbb7-fa10-4d59-8848-2d0ce96a9394";

export const API_BASE_URLS = {
  consultation: process.env.NEXT_PUBLIC_CONSULTATION_URL ?? "https://consultation-back.onrender.com/consultation/api",
  // Service accueil : source de vérité des informations patient.
  // Son swagger (/accueil/api/docs) expose les routes sous /accueil/patients —
  // il n'y a pas de segment /api dans les chemins appelés.
  accueil: process.env.NEXT_PUBLIC_ACCUEIL_URL ?? "https://acceuil-back-ytyd.onrender.com/accueil",
  dossierPatient: process.env.NEXT_PUBLIC_DOSSIER_PATIENT_URL ?? "https://dossier-patient-back-ri3e.onrender.com/dossier-patient/api",
  prescriptions: process.env.NEXT_PUBLIC_PRESCRIPTIONS_URL ?? "https://prescriptionback-production.up.railway.app/prescriptions/api",
};
