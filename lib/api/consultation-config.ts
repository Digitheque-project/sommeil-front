import { API_GATEWAY_URL } from '../config';

// sommeil-back est joint via la passerelle API du CHU, qui relaie
// /sommeil/api/... vers le backend.
const DEFAULT_API_PREFIX = 'sommeil/api';

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

export const getConsultationBaseUrl = () => {
  return normalizeBaseUrl(API_GATEWAY_URL);
};

// URL complète du backend sommeil-back = base URL + préfixe global de l'API + chemin.
// La variable d'environnement ne doit contenir que la base URL (sans préfixe ni suffixe) ;
// le préfixe (par défaut "sommeil/api") est ajouté ici.
export const getSommeilApiUrl = (path: string) => {
  const baseUrl = getConsultationBaseUrl();
  const apiPrefix = DEFAULT_API_PREFIX;
  return `${baseUrl}/${apiPrefix}${path.startsWith('/') ? path : `/${path}`}`;
};

// Alias conservé pour la rétro-compatibilité.
export const getConsultationExterneApiUrl = getSommeilApiUrl;
