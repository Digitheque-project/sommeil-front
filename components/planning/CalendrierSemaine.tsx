"use client";

import { Plus } from "lucide-react";
import type { RendezVousPlanning } from "@/lib/api/planning";

interface CalendrierSemaineProps {
  dateDebut: Date;
  rdvs: RendezVousPlanning[];
  onSelectRdv: (rdv: RendezVousPlanning) => void;
  onSelectCreneauLibre?: (dateRDV: string, heureDebut: string) => void;
}

// Lundi à vendredi uniquement — impossible de planifier un RDV le week-end.
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
const NB_JOURS = JOURS.length;

const HEURES_BASE = Array.from({ length: 11 }, (_, i) => i + 8); // 08..18

const PRIORITE_COULEUR: Record<string, string> = {
  TRES_URGENTE: "bg-red-50 border-red-500 text-red-700",
  URGENTE: "bg-orange-50 border-orange-500 text-orange-700",
  NORMALE: "bg-blue-50 border-blue-500 text-blue-700",
};

/** "2026-07-12T05:00:00.000Z" → "2026-07-12" — insensible à un éventuel
 * résidu d'heure non nul dans dateRdv (ne devrait porter que le jour). */
function jourIso(dateRdv: string): string {
  return dateRdv.split("T")[0];
}

/** Formate un Date local en "YYYY-MM-DD", pour comparaison directe avec
 * jourIso() sans jamais passer par toISOString() (qui décale le jour
 * selon le fuseau horaire du navigateur). */
function jourLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendrierSemaine({
  dateDebut,
  rdvs,
  onSelectRdv,
  onSelectCreneauLibre,
}: CalendrierSemaineProps) {
  const jours = Array.from({ length: NB_JOURS }, (_, i) => {
    const d = new Date(dateDebut);
    d.setDate(dateDebut.getDate() + i);
    return d;
  });

  // Étend la grille si un RDV tombe hors de la plage 08h-18h, pour ne
  // jamais faire disparaître silencieusement un créneau saisi librement.
  const heuresRdvs = rdvs
    .map((r) => parseInt(r.heureDebut.split(":")[0], 10))
    .filter((h) => !Number.isNaN(h));
  const heureMin = Math.min(HEURES_BASE[0], ...heuresRdvs);
  const heureMax = Math.max(HEURES_BASE[HEURES_BASE.length - 1], ...heuresRdvs);
  const HEURES = Array.from(
    { length: heureMax - heureMin + 1 },
    (_, i) => `${String(heureMin + i).padStart(2, "0")}:00`
  );

  const aujourdhui = jourLocal(new Date());

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Défilement horizontal partagé entre l'en-tête et les lignes, pour
          que les colonnes restent alignées au lieu de s'écraser sur mobile. */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Header colonnes */}
          <div className="grid grid-cols-6 border-b border-slate-100">
            <div className="p-3 text-xs text-slate-400 text-center border-r border-slate-100">
              Heure
            </div>
            {jours.map((jour, i) => {
              const estAujourdhui = jourLocal(jour) === aujourdhui;
              return (
                <div
                  key={i}
                  className={`p-3 text-center border-r border-slate-100 last:border-r-0 ${
                    estAujourdhui ? "bg-blue-50" : ""
                  }`}
                >
                  <p className={`text-xs font-semibold ${estAujourdhui ? "text-blue-700" : "text-slate-500"}`}>
                    {JOURS[i]}
                  </p>
                  <p className={`text-sm font-bold ${estAujourdhui ? "text-blue-700" : "text-slate-800"}`}>
                    {jour.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Grille heures */}
          <div className="overflow-y-auto max-h-[600px]">
            {HEURES.map((heure) => (
              <div key={heure} className="grid grid-cols-6 border-b border-slate-50 min-h-[64px]">
                <div className="p-2 text-xs text-slate-400 text-center border-r border-slate-100 pt-2">
                  {heure}
                </div>
                {jours.map((jour, i) => {
                  const jourCol = jourLocal(jour);
                  const rdvsColonne = rdvs.filter(
                    (r) => jourIso(r.dateRdv) === jourCol && r.heureDebut.startsWith(heure.split(":")[0])
                  );
                  const caseLibre = rdvsColonne.length === 0;
                  const cliquable = caseLibre && !!onSelectCreneauLibre;

                  return (
                    <div
                      key={i}
                      onClick={
                        cliquable
                          ? () => onSelectCreneauLibre!(new Date(jourCol).toISOString(), heure)
                          : undefined
                      }
                      className={`p-1 border-r border-slate-50 last:border-r-0 space-y-1 group ${
                        cliquable ? "cursor-pointer hover:bg-blue-50/60 transition-colors" : ""
                      }`}
                    >
                      {rdvsColonne.map((rdv) => {
                        // Un RDV réalisé est figé : on le garde consultable (vue
                        // détail en lecture) mais visuellement estompé, pour ne
                        // pas laisser croire qu'il reste modifiable/annulable.
                        const estRealise = rdv.statut === "REALISE";
                        return (
                          <button
                            key={rdv.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRdv(rdv);
                            }}
                            title={estRealise ? "RDV déjà réalisé" : undefined}
                            className={`w-full text-left text-xs p-1.5 rounded-lg border-l-2 transition-opacity hover:opacity-80 ${
                              estRealise
                                ? "opacity-40 grayscale-[0.6] border-slate-300 bg-slate-50 text-slate-500"
                                : PRIORITE_COULEUR[rdv.priorite]
                            }`}
                          >
                            <p className="font-semibold truncate">{rdv.heureDebut}</p>
                            <p className="truncate">
                              {rdv.patientPrenom} {rdv.patientNom}
                            </p>
                          </button>
                        );
                      })}
                      {cliquable && (
                        <div className="hidden group-hover:flex items-center justify-center h-full min-h-[48px] text-blue-600">
                          <Plus size={16} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
