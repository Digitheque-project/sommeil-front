// L'hôpital est à Madagascar (UTC+3, sans heure d'été). Les filtres par date
// du planning doivent se baser sur ce fuseau, pas sur celui du navigateur —
// `toISOString()` calcule le jour en UTC et décale tout d'un jour entre
// 00h00 et 03h00 locales.
export const FUSEAU_HOPITAL = "Indian/Antananarivo";

export function dateISODansFuseauHopital(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSEAU_HOPITAL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
