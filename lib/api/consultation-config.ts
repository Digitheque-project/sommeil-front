// Filet de secours pour le dev local uniquement (correspond au port par défaut du
// backend, cf. BACKEND_PORT). En production, l'absence de configuration doit être
// visible immédiatement — voir l'avertissement ci-dessous — pas silencieuse.
const DEFAULT_CONSULTATION_BASE_URL = 'http://localhost:3333';
const DEFAULT_API_PREFIX = 'consultation/api';

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

let warnedMissingConfig = false;

export const getConsultationBaseUrl = () => {
  // Accès statique littéral obligatoire : Next.js/webpack ne peut pas substituer process.env[key] dynamique
  const configuredUrl = (
    process.env.NEXT_PUBLIC_CONSULTATION_URL ||
    process.env.NEXT_PUBLIC_CONSULTATION_EXTERNE_URL ||
    DEFAULT_CONSULTATION_BASE_URL
  );

  if (!warnedMissingConfig && !process.env.NEXT_PUBLIC_CONSULTATION_URL && !process.env.NEXT_PUBLIC_CONSULTATION_EXTERNE_URL) {
    console.warn(
      '[Consultation Config] NEXT_PUBLIC_CONSULTATION_URL non configuré — fallback sur localhost:3333. ' +
      'Configurez cette variable en production.'
    );
    warnedMissingConfig = true;
  }

  return normalizeBaseUrl(configuredUrl);
};

export const getConsultationExterneApiUrl = (path: string) => {
  const baseUrl = getConsultationBaseUrl();
  const apiPrefix = process.env.NEXT_PUBLIC_CONSULTATION_API_PREFIX || DEFAULT_API_PREFIX;
  return `${baseUrl}/${apiPrefix}${path.startsWith('/') ? path : `/${path}`}`;
};
