"use client";

import { useState } from "react";
import { Calendar, X, Check } from "lucide-react";
import { dateISODansFuseauHopital } from "@/lib/planning-dates";
import type { CreerRdvInput, PrioriteRdv } from "@/lib/api/planning";

interface RdvFormModalProps {
  titre: string;
  valeurInitiale?: Partial<CreerRdvInput>;
  onClose: () => void;
  onConfirm: (data: CreerRdvInput) => Promise<void>;
}

/** "YYYY-MM-DD" (ou ISO complet) → vrai si samedi ou dimanche.
 * new Date("YYYY-MM-DD") est toujours interprété en UTC minuit, donc
 * getUTCDay() est fiable quel que soit le fuseau du navigateur. */
function estWeekend(date: string): boolean {
  const jour = new Date(date.split("T")[0]).getUTCDay();
  return jour === 0 || jour === 6;
}

const PRIORITES: PrioriteRdv[] = ["NORMALE", "URGENTE", "TRES_URGENTE"];
const PRIORITE_LABEL: Record<PrioriteRdv, string> = {
  NORMALE: "Normale",
  URGENTE: "Urgente",
  TRES_URGENTE: "Très urgente",
};
// Code couleur d'urgence de l'hôpital : bleue = normale, orange = urgente,
// rouge = très urgente -- même code que PanneauDetailRDV / CalendrierSemaine.
const PRIORITE_STYLE_SELECTIONNE: Record<PrioriteRdv, string> = {
  NORMALE: "border-blue-500 bg-blue-50 text-blue-700",
  URGENTE: "border-orange-500 bg-orange-50 text-orange-700",
  TRES_URGENTE: "border-red-500 bg-red-50 text-red-700",
};

export default function RdvFormModal({ titre, valeurInitiale, onClose, onConfirm }: RdvFormModalProps) {
  const [patientNom, setPatientNom] = useState(valeurInitiale?.patientNom ?? "");
  const [patientPrenom, setPatientPrenom] = useState(valeurInitiale?.patientPrenom ?? "");
  const [patientDossier, setPatientDossier] = useState(valeurInitiale?.patientDossier ?? "");
  const [motif, setMotif] = useState(valeurInitiale?.motif ?? "");
  const [priorite, setPriorite] = useState<PrioriteRdv>(valeurInitiale?.priorite ?? "NORMALE");
  const [date, setDate] = useState(valeurInitiale?.dateRdv?.split("T")[0] ?? "");
  const [heureDebut, setHeureDebut] = useState(valeurInitiale?.heureDebut ?? "08:00");
  const [dureeMinutesStr, setDureeMinutesStr] = useState(String(valeurInitiale?.dureeMinutes ?? 60));
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const dateEstWeekend = date !== "" && estWeekend(date);
  const dureeMinutes = parseInt(dureeMinutesStr, 10);
  const dureeValide = !isNaN(dureeMinutes) && dureeMinutes > 0;
  const patientValide = patientNom.trim() !== "" && patientPrenom.trim() !== "";
  const formValide = patientValide && !!date && !!heureDebut && !dateEstWeekend && dureeValide;

  const handleConfirm = async () => {
    if (!formValide) return;
    setConfirming(true);
    setErreur(null);
    try {
      await onConfirm({
        patientId: valeurInitiale?.patientId ?? crypto.randomUUID(),
        patientNom: patientNom.trim(),
        patientPrenom: patientPrenom.trim(),
        patientDossier: patientDossier.trim() || undefined,
        motif: motif.trim() || undefined,
        priorite,
        dateRdv: new Date(date).toISOString(),
        heureDebut,
        dureeMinutes,
      });
    } catch (error) {
      setErreur(error instanceof Error ? error.message : "Le rendez-vous n'a pas pu être enregistré.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            {titre}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">
                Nom <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={patientNom}
                onChange={(e) => setPatientNom(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">
                Prénom <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={patientPrenom}
                onChange={(e) => setPatientPrenom(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">
              N° dossier
            </label>
            <input
              type="text"
              value={patientDossier}
              onChange={(e) => setPatientDossier(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Motif</label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Priorité</label>
            <div className="flex gap-2">
              {PRIORITES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriorite(p)}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    priorite === p
                      ? PRIORITE_STYLE_SELECTIONNE[p]
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {PRIORITE_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">
              Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={dateISODansFuseauHopital()}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {dateEstWeekend && (
              <p className="text-xs text-red-600 mt-1.5">
                Impossible de planifier un RDV le week-end — choisissez un jour de semaine.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">
                Heure début <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                value={heureDebut}
                onChange={(e) => setHeureDebut(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Durée (min)</label>
              <input
                type="number"
                min={1}
                value={dureeMinutesStr}
                onChange={(e) => setDureeMinutesStr(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {erreur && <p className="text-xs text-red-600">{erreur}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!formValide || confirming}
            onClick={handleConfirm}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} />
            {confirming ? "Enregistrement..." : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
