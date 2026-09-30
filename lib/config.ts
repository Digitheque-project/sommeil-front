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

// Une variable vide (`FOO=` dans un .env) doit retomber sur la valeur par
// défaut, d'où `||` et non `??`.
const originOr = (value: string | undefined, fallback: string) =>
  stripTrailingSlash(value || fallback);

/**
 * Passerelle API du CHU : point d'entrée unique des microservices. Elle
 * relaie chaque chemin tel quel vers le service concerné (`/accueil/...`,
 * `/services`, `/notifications`, `/sommeil/api/...`) et vérifie elle-même le
 * jeton porteur — tout appel qui la traverse doit donc envoyer
 * `Authorization: Bearer …`, sinon 401 « Token manquant ».
 */
export const API_GATEWAY_URL = originOr(
  process.env.NEXT_PUBLIC_API_GATEWAY_URL,
  "https://gateway-5pqs.onrender.com",
);

/**
 * Base URLs (origine seule) des services de la plateforme CHU. Par défaut,
 * tout passe par la passerelle ; une variable propre au service permet de
 * la contourner (appel direct) au cas par cas.
 */
export const SERVICE_ORIGINS = {
  auth: originOr(process.env.NEXT_PUBLIC_AUTH_SERVICE_URL, API_GATEWAY_URL),
  users: originOr(process.env.NEXT_PUBLIC_USER_SERVICE_URL, API_GATEWAY_URL),
  chu: originOr(process.env.NEXT_PUBLIC_CHU_SERVICE_URL, API_GATEWAY_URL),
  services: originOr(process.env.NEXT_PUBLIC_SERVICE_REGISTRY_URL, API_GATEWAY_URL),
  dossierPatient: originOr(process.env.NEXT_PUBLIC_DOSSIER_PATIENT_URL, API_GATEWAY_URL),
  notificationHub: originOr(process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL, API_GATEWAY_URL),
  accueil: originOr(process.env.NEXT_PUBLIC_ACCUEIL_URL, API_GATEWAY_URL),
  consultation: originOr(process.env.NEXT_PUBLIC_CONSULTATION_URL, API_GATEWAY_URL),
  // Le service prescriptions n'est PAS exposé par la passerelle
  // (`/prescriptions/...` y répond 404) : appel direct.
  prescriptions: originOr(
    process.env.NEXT_PUBLIC_PRESCRIPTIONS_URL,
    "https://prescriptionback-production.up.railway.app",
  ),
};
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
  prescriptionsDocs: `${SERVICE_ORIGINS.prescriptions}/prescriptions/api/docs`,
  consultationDocs: `${API_GATEWAY_URL}/consultation/api/docs`,
  sommeilDocs: `${API_GATEWAY_URL}/sommeil/api/docs`,
};

/**
 * Identifiant de l'établissement. Le service accueil exige `chuId` sur chacun
 * de ses endpoints patients.
 */
export const CHU_ID = process.env.NEXT_PUBLIC_CHU_ID ?? "1e5bbbb7-fa10-4d59-8848-2d0ce96a9394";

/**
 * Identifiant du service Centre de Sommeil dans l'annuaire du CHU.
 *
 * Source de vérité unique : c'est ce même identifiant qui sert de
 * `serviceIdDest` pour les prescriptions et de destinataire des notifications
 * (`broadcast:service:{id}`). Les payloads reçus le confirment —
 * `serviceDestId: "82238f37-…"`, `serviceDestNom: "Centre de Sommeil"`.
 */
export const SLEEP_SERVICE_ID =
  process.env.NEXT_PUBLIC_SLEEP_SERVICE_ID ?? "82238f37-2df8-4614-9ea7-3b789e5a7e39";

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
