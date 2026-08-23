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

/**
 * Lundi de la semaine contenant `reference`, ancré à minuit UTC de ce jour
 * calendaire hôpital (comme les `dateRdv` stockés). À partir de là, la
 * navigation entre semaines et l'affichage des colonnes du planning doivent
 * utiliser exclusivement les accesseurs UTC (getUTCDate, setUTCDate...) —
 * jamais les accesseurs locaux, qui réintroduiraient le même décalage d'un
 * jour que dateISODansFuseauHopital existe pour éviter.
 */
export function lundiDeLaSemaineHopital(reference: Date = new Date()): Date {
  const jourHopital = dateISODansFuseauHopital(reference);
  const d = new Date(`${jourHopital}T00:00:00.000Z`);
  const jourSemaine = d.getUTCDay();
  const diff = jourSemaine === 0 ? -6 : 1 - jourSemaine;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}
