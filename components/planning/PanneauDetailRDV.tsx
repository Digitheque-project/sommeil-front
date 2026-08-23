"use client";

import { useState } from "react";
import { X, Pencil, CalendarX, UserCheck } from "lucide-react";
import ActionButton from "@/components/ActionButton";
import type { RendezVousPlanning } from "@/lib/api/planning";

interface PanneauDetailRDVProps {
  rdv: RendezVousPlanning;
  onFermer: () => void;
  onModifier: () => void;
  onAnnuler: () => Promise<unknown>;
  onMarquerNonRealise: () => Promise<unknown>;
  /** Réception du patient : ouvre la consultation et bascule sur son traitement. */
  onRecevoirPatient: () => Promise<unknown>;
}

const STATUT_LABEL: Record<string, string> = {
  EN_ATTENTE: "En attente",
  REALISE: "Réalisé",
  NON_REALISE: "Non réalisé",
  ANNULE: "Annulé",
};

const STATUT_BADGE: Record<string, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-800",
  REALISE: "bg-emerald-100 text-emerald-800",
  NON_REALISE: "bg-slate-200 text-slate-700",
  ANNULE: "bg-red-100 text-red-700",
};

const PRIORITE_LABEL: Record<string, string> = {
  TRES_URGENTE: "Très urgente",
  URGENTE: "Urgente",
  NORMALE: "Normale",
};

const PRIORITE_BARRE: Record<string, string> = {
  TRES_URGENTE: "bg-red-500",
  URGENTE: "bg-orange-500",
  NORMALE: "bg-blue-500",
};

export default function PanneauDetailRDV({
  rdv,
  onFermer,
  onModifier,
  onAnnuler,
  onMarquerNonRealise,
  onRecevoirPatient,
}: PanneauDetailRDVProps) {
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  // Un RDV réalisé est figé : ni modification, ni annulation possible.
  const estRealise = rdv.statut === "REALISE";

  const action = async (type: string, fn: () => Promise<unknown>) => {
    setEnCours(type);
    setErreur(null);
    try {
      await fn();
    } catch (error) {
      setErreur(error instanceof Error ? error.message : "L'action a échoué.");
    } finally {
      setEnCours(null);
    }
  };

  return (
    <>
      {/* Backdrop — plein écran sur mobile, où le panneau prend toute la largeur */}
      <div
        aria-hidden
        onClick={onFermer}
        className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
      />
      <div className="fixed right-0 top-16 h-[calc(100vh-64px)] w-full max-w-md bg-white border-l border-slate-200 shadow-xl z-30 flex flex-col">
        {/* Header */}
        <div className={`h-1.5 ${PRIORITE_BARRE[rdv.priorite]}`} />
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUT_BADGE[rdv.statut]}`}>
                {STATUT_LABEL[rdv.statut] ?? rdv.statut}
              </span>
              <span className="text-xs text-slate-400">{PRIORITE_LABEL[rdv.priorite] ?? rdv.priorite}</span>
            </div>
            <p className="font-semibold text-slate-900">
              {rdv.patientPrenom} {rdv.patientNom}
            </p>
            {rdv.patientDossier && <p className="text-xs text-slate-400">Dossier {rdv.patientDossier}</p>}
          </div>
          <button type="button" onClick={onFermer} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Horaire</p>
              <p className="text-sm font-medium text-slate-700">
                {rdv.heureDebut} – {rdv.heureFin}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Durée</p>
              <p className="text-sm font-medium text-slate-700">{rdv.dureeMinutes} min</p>
            </div>
          </div>

          {rdv.motif && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Motif</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 leading-relaxed">{rdv.motif}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-slate-100 space-y-2">
          {erreur && <p className="text-xs text-red-600 pb-1">{erreur}</p>}
          {estRealise && <p className="text-xs text-slate-400 text-center pb-1">RDV déjà réalisé — non modifiable</p>}
          {rdv.statut === "EN_ATTENTE" && (
            <ActionButton
              permission="consultation:treat"
              disabled={enCours !== null}
              onClick={() => action("recevoir", onRecevoirPatient)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#006A8C] px-4 py-2 text-sm font-bold text-white hover:bg-[#004D66]"
            >
              <UserCheck size={16} />
              {enCours === "recevoir" ? "Ouverture..." : "Recevoir le patient"}
            </ActionButton>
          )}
          <ActionButton
            permission="planning:update"
            disabled={estRealise}
            onClick={onModifier}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={16} /> Modifier
          </ActionButton>
          {rdv.statut === "EN_ATTENTE" && (
            <ActionButton
              permission="planning:update"
              disabled={enCours !== null}
              onClick={() => action("non-realise", onMarquerNonRealise)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
            >
              <CalendarX size={16} />
              {enCours === "non-realise" ? "En cours..." : "Marquer non réalisé"}
            </ActionButton>
          )}
          {rdv.statut !== "ANNULE" && (
            <ActionButton
              permission="planning:update"
              disabled={enCours !== null || estRealise}
              onClick={() => action("annuler", onAnnuler)}
              className="w-full rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              {enCours === "annuler" ? "En cours..." : "Annuler le RDV"}
            </ActionButton>
          )}
        </div>
      </div>
    </>
  );
}
