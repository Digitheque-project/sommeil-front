import { API_GATEWAY_URL } from '../config';

// Sans variable dédiée, sommeil-back est joint via la passerelle API du CHU,
// qui relaie /sommeil/api/... vers le backend.
const DEFAULT_API_PREFIX = 'sommeil/api';

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

export const getConsultationBaseUrl = () => {
  // Accès statique littéral obligatoire : Next.js/webpack ne peut pas substituer process.env[key] dynamique
  const configuredUrl = (
    process.env.NEXT_PUBLIC_SOMMEIL_API_URL ||
    process.env.NEXT_PUBLIC_CONSULTATION_EXTERNE_URL ||
    API_GATEWAY_URL
  );

  return normalizeBaseUrl(configuredUrl);
};

// URL complète du backend sommeil-back = base URL + préfixe global de l'API + chemin.
// La variable d'environnement ne doit contenir que la base URL (sans préfixe ni suffixe) ;
// le préfixe (par défaut "sommeil/api") est ajouté ici.
export const getSommeilApiUrl = (path: string) => {
  const baseUrl = getConsultationBaseUrl();
  const apiPrefix = process.env.NEXT_PUBLIC_SOMMEIL_API_PREFIX || process.env.NEXT_PUBLIC_CONSULTATION_API_PREFIX || DEFAULT_API_PREFIX;
  return `${baseUrl}/${apiPrefix}${path.startsWith('/') ? path : `/${path}`}`;
};

// Alias conservé pour la rétro-compatibilité.
export const getConsultationExterneApiUrl = getSommeilApiUrl;
