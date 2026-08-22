/**
 * Configuration des services externes du CHU.
 *
 * RÈGLE : toute variable d'environnement d'URL ne contient QUE la base URL
 * (schéma + hôte), sans préfixe ni suffixe. Les préfixes de chemin sont
 * ajoutés ici, dans le code.
 *
 * Attention au piège des swaggers : chaque service publie sa documentation
 * sous `<base>/<nom>/api/docs`, mais `/<nom>/api` n'est QUE le point de
 * montage de la doc. Les routes réelles sont servies à la racine du service
 * (ex. `GET <base>/services`, `GET <base>/dossier-patient/patients/{id}`) —
 * vérifié en interrogeant les services : `<base>/services/api/services`
 * renvoie 404, `<base>/services` renvoie 401 (route existante, jeton requis).
 */

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, "");

/** Base URLs (origine seule) des services de la plateforme CHU. */
export const SERVICE_ORIGINS = {
  auth: stripTrailingSlash(
    process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ?? "https://auth-service-4q6g.onrender.com",
  ),
  users: stripTrailingSlash(
    process.env.NEXT_PUBLIC_USER_SERVICE_URL ?? "https://user-services-w0h3.onrender.com",
  ),
  chu: stripTrailingSlash(
    process.env.NEXT_PUBLIC_CHU_SERVICE_URL ?? "https://chu-service-fec1.onrender.com",
  ),
  services: stripTrailingSlash(
    process.env.NEXT_PUBLIC_SERVICE_REGISTRY_URL ?? "https://service-service-8cgb.onrender.com",
  ),
  dossierPatient: stripTrailingSlash(
    process.env.NEXT_PUBLIC_DOSSIER_PATIENT_URL ?? "https://dossier-patient-back-ri3e.onrender.com",
  ),
  notificationHub: stripTrailingSlash(
    process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL ??
      "https://service-notificqtion-v2-production.up.railway.app",
  ),
  accueil: stripTrailingSlash(
    process.env.NEXT_PUBLIC_ACCUEIL_URL ?? "https://acceuil-back.onrender.com",
  ),
  consultation: stripTrailingSlash(
    process.env.NEXT_PUBLIC_CONSULTATION_URL ?? "https://consultation-back.onrender.com",
  ),
  prescriptions: stripTrailingSlash(
    process.env.NEXT_PUBLIC_PRESCRIPTIONS_URL ??
      "https://prescriptionback-production.up.railway.app",
  ),
};

export const API_GATEWAY_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? "https://gateway-3g6c.onrender.com",
);
export const AUTH_LOGIN_URL =
  process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? "https://authentification-front.vercel.app/login";

/** Documentations swagger, servies sous `<base>/<nom>/api/docs`. */
export const API_ROUTES = {
  authDocs: `${SERVICE_ORIGINS.auth}/auth/api/docs`,
  usersDocs: `${SERVICE_ORIGINS.users}/users/api/docs`,
  servicesDocs: `${SERVICE_ORIGINS.services}/services/api/docs`,
  chuDocs: `${SERVICE_ORIGINS.chu}/chu/api/docs`,
  dossierPatientDocs: `${SERVICE_ORIGINS.dossierPatient}/dossier-patient/api/docs`,
  notificationDocs: `${SERVICE_ORIGINS.notificationHub}/notification/api/docs`,
  accueilDocs: `${API_GATEWAY_URL}/accueil/api/docs`,
  prescriptionsDocs: `${API_GATEWAY_URL}/prescriptions/api/docs`,
  consultationDocs: `${API_GATEWAY_URL}/consultation/api/docs`,
};

/**
 * Identifiant de l'établissement. Le service accueil exige `chuId` sur chacun
 * de ses endpoints patients.
 */
export const CHU_ID = process.env.NEXT_PUBLIC_CHU_ID ?? "1e5bbbb7-fa10-4d59-8848-2d0ce96a9394";

/**
 * Racines d'appel = base URL + préfixe de chemin réel du service (celui des
 * contrôleurs, pas celui de la doc swagger).
 */
export const API_BASE_URLS = {
  consultation: `${SERVICE_ORIGINS.consultation}/consultation/api`,
  // Service accueil : source de vérité des informations patient. Ses routes
  // sont exposées sous /accueil/patients — il n'y a pas de segment /api.
  accueil: `${SERVICE_ORIGINS.accueil}/accueil`,
  // Routes réelles : /dossier-patient/patients/{id}/historique, etc.
  dossierPatient: `${SERVICE_ORIGINS.dossierPatient}/dossier-patient`,
  prescriptions: `${SERVICE_ORIGINS.prescriptions}/prescriptions/api`,
  // Registre des services du CHU : routes /services à la racine.
  services: SERVICE_ORIGINS.services,
  // Hub de notification : routes /notifications à la racine.
  notificationHub: SERVICE_ORIGINS.notificationHub,
};
