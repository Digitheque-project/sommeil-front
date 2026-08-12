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

export const API_BASE_URLS = {
  consultation: process.env.NEXT_PUBLIC_CONSULTATION_URL ?? "https://consultation-back.onrender.com/consultation/api",
  accueil: process.env.NEXT_PUBLIC_ACCUEIL_URL ?? "https://acceuil-back.onrender.com/accueil/api",
  dossierPatient: process.env.NEXT_PUBLIC_DOSSIER_PATIENT_URL ?? "https://dossier-patient-back-ri3e.onrender.com/dossier-patient/api",
  prescriptions: process.env.NEXT_PUBLIC_PRESCRIPTIONS_URL ?? "https://prescriptionback-production.up.railway.app/prescriptions/api",
};
