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
 * `/services`, `/notifications`, `/prescriptions/...`, `/sommeil/api/...`)
 * et vérifie elle-même le jeton porteur. Une seule variable, sans adresse de
 * repli dans le code : changer d'hébergement = changer NEXT_PUBLIC_GATEWAY_URL.
 */
export const API_GATEWAY_URL = stripTrailingSlash(process.env.NEXT_PUBLIC_GATEWAY_URL || "");

/** Tous les services de la plateforme passent par la passerelle. */
export const SERVICE_ORIGINS = {
  auth: API_GATEWAY_URL,
  users: API_GATEWAY_URL,
  chu: API_GATEWAY_URL,
  services: API_GATEWAY_URL,
  dossierPatient: API_GATEWAY_URL,
  notificationHub: API_GATEWAY_URL,
  accueil: API_GATEWAY_URL,
  consultation: API_GATEWAY_URL,
  prescriptions: API_GATEWAY_URL,
};
export const AUTH_LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "";

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

/** Contenu du jeton de l'utilisateur connecté (posé par AuthContext). */
function tokenServices(): Array<{ serviceId?: string; serviceName?: string; chu?: { id?: string } }> {
  if (typeof window === "undefined") return [];
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("auth_token") || localStorage.getItem("token");
  const part = token?.split(".")[1];
  if (!part) return [];
  try {
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "="));
    const payload = JSON.parse(json) as { services?: unknown };
    return Array.isArray(payload.services) ? payload.services : [];
  } catch {
    return [];
  }
}

const sansAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Service « Centre de Sommeil » parmi ceux du jeton. */
function sleepServiceOfToken() {
  return tokenServices().find((s) => sansAccents(s.serviceName ?? "").includes("sommeil"));
}

/**
 * Identifiant de l'établissement, lu dans le jeton de l'utilisateur (le
 * service accueil exige `chuId` sur ses endpoints patients). Repli sur
 * NEXT_PUBLIC_CHU_ID ; jamais d'identifiant écrit en dur.
 */
export function getChuId(): string {
  return sleepServiceOfToken()?.chu?.id || tokenServices().find((s) => s.chu?.id)?.chu?.id || process.env.NEXT_PUBLIC_CHU_ID || "";
}

/**
 * Identifiant du service Centre de Sommeil dans l'annuaire du CHU, lu dans
 * le jeton : c'est le `serviceIdDest` des prescriptions et le destinataire
 * des notifications (`broadcast:service:{id}`). Repli sur
 * NEXT_PUBLIC_SLEEP_SERVICE_ID.
 */
export function getSleepServiceId(): string {
  return sleepServiceOfToken()?.serviceId || process.env.NEXT_PUBLIC_SLEEP_SERVICE_ID || "";
}

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
