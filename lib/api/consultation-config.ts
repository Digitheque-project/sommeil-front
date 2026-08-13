// Filet de secours pour le dev local uniquement (correspond au port par défaut du
// backend sommeil-back). En production, l'absence de configuration doit être
// visible immédiatement — voir l'avertissement ci-dessous — pas silencieuse.
const DEFAULT_CONSULTATION_BASE_URL = 'http://localhost:8888';
const DEFAULT_API_PREFIX = 'sommeil/api';

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

let warnedMissingConfig = false;

export const getConsultationBaseUrl = () => {
  // Accès statique littéral obligatoire : Next.js/webpack ne peut pas substituer process.env[key] dynamique
  const configuredUrl = (
    process.env.NEXT_PUBLIC_SOMMEIL_API_URL ||
    process.env.NEXT_PUBLIC_CONSULTATION_URL ||
    process.env.NEXT_PUBLIC_CONSULTATION_EXTERNE_URL ||
    DEFAULT_CONSULTATION_BASE_URL
  );

  if (!warnedMissingConfig && !process.env.NEXT_PUBLIC_SOMMEIL_API_URL && !process.env.NEXT_PUBLIC_CONSULTATION_URL && !process.env.NEXT_PUBLIC_CONSULTATION_EXTERNE_URL) {
    console.warn(
      '[Consultation Config] NEXT_PUBLIC_SOMMEIL_API_URL non configuré — fallback sur localhost:8888. ' +
      'Configurez cette variable en production.'
    );
    warnedMissingConfig = true;
  }

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
