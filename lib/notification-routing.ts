import type { NotificationItem } from "@/lib/api/notifications";

/**
 * Destination d'une notification dans l'application.
 *
 * Le hub de notification est mutualisé : chaque service y publie ses propres
 * identifiants (`prescriptionId`, `consultationId`, `patientId`...) et parfois
 * une cible `redirectTo` construite pour SON interface. Cliquer sur une
 * notification doit ouvrir le dossier concerné ici, dans le centre de
 * sommeil — pas se contenter de la marquer comme lue, et surtout pas suivre
 * une route qui n'existe que dans une autre application.
 *
 * Renvoyer `null` est un résultat valide : certaines notifications sont
 * purement informatives et n'ont aucun écran à ouvrir.
 */

/** Rubriques réellement servies par cette application (cf. lib/nav.ts). */
const APP_ROUTES = new Set([
  "/",
  "/consultation",
  "/prescription",
  "/planning",
  "/polysomnographie",
  "/comptes-rendus",
  "/rapports",
  "/archives",
  "/aide",
]);

const asText = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number") return String(value);
  return null;
};

/**
 * Texte agrégé de la notification, utilisé pour reconnaître le domaine
 * métier quand aucun identifiant ne le dit explicitement.
 */
const buildHaystack = (item: NotificationItem, data: Record<string, unknown>): string =>
  [
    item.type,
    item.source,
    item.title,
    data.entiteRefType,
    data.referenceType,
    data.typePrescription,
    data.notificationKind,
  ]
    .map((value) => (typeof value === "string" ? value : ""))
    .join(" ")
    .toLowerCase();

const mentionsPolysomnographie = (haystack: string) =>
  haystack.includes("polysomno") || haystack.includes("psg") || haystack.includes("sommeil");

/**
 * `redirectTo` n'est suivi que s'il désigne une rubrique de CETTE
 * application. Les autres services y placent leurs propres routes
 * (`/modules/soin-traitement`...) : les suivre mènerait à une page 404.
 */
const redirectTargetForThisApp = (value: unknown): string | null => {
  const raw = asText(value);
  if (!raw || !raw.startsWith("/")) return null;

  const [pathname] = raw.split("?");
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const root = `/${normalized.split("/").filter(Boolean)[0] ?? ""}`;

  return APP_ROUTES.has(normalized) || APP_ROUTES.has(root) ? raw : null;
};

export function resolveNotificationTarget(item: NotificationItem): string | null {
  const data = (item.data ?? {}) as Record<string, unknown>;
  const haystack = buildHaystack(item, data);

  const explicit = redirectTargetForThisApp(data.redirectTo);
  if (explicit) return explicit;

  const consultationId = asText(data.consultationId);
  if (consultationId) {
    return `/consultation?consultationId=${encodeURIComponent(consultationId)}`;
  }

  // Un examen déjà planifié se gère depuis la page Polysomnographie ; une
  // prescription reçue attend encore son rendez-vous dans la page
  // Prescription. La page de destination retombe d'elle-même sur l'autre si
  // l'examen a changé d'étape entre-temps.
  const psgId = asText(data.psgId) ?? asText(data.examenId);
  if (psgId) return `/polysomnographie?focus=${encodeURIComponent(psgId)}`;

  const prescriptionId = asText(data.prescriptionId) ?? asText(data.referenceId);
  if (prescriptionId && mentionsPolysomnographie(haystack)) {
    return `/prescription?focus=${encodeURIComponent(prescriptionId)}`;
  }

  if (haystack.includes("compte") || haystack.includes("rendu")) {
    return "/comptes-rendus";
  }

  if (haystack.includes("rendez") || haystack.includes("rendez_vous") || haystack.includes("planning")) {
    return "/planning";
  }

  if (prescriptionId) {
    return `/prescription?focus=${encodeURIComponent(prescriptionId)}`;
  }

  const patientId = asText(data.patientId);
  if (patientId) return `/consultation?patientId=${encodeURIComponent(patientId)}`;

  return null;
}
