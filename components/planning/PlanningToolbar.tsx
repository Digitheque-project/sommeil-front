"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import ActionButton from "@/components/ActionButton";

interface PlanningToolbarProps {
  dateDebut: Date;
  onSemainePrecedente: () => void;
  onSemaineSuivante: () => void;
  onNouveauRdv: () => void;
}

function formatSemaine(dateDebut: Date): string {
  const dateFin = new Date(dateDebut);
  dateFin.setDate(dateDebut.getDate() + 6);
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  const optionsFin: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  return `Semaine du ${dateDebut.toLocaleDateString("fr-FR", options)} — ${dateFin.toLocaleDateString("fr-FR", optionsFin)}`;
}

export default function PlanningToolbar({
  dateDebut,
  onSemainePrecedente,
  onSemaineSuivante,
  onNouveauRdv,
}: PlanningToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Planning</h1>
        <p className="text-sm text-slate-500 mt-1">{formatSemaine(dateDebut)}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 shadow-sm p-1">
          <button
            type="button"
            onClick={onSemainePrecedente}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 rounded-lg hover:bg-slate-50"
          >
            <ChevronLeft size={16} /> Précédente
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <button
            type="button"
            onClick={onSemaineSuivante}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 rounded-lg hover:bg-slate-50"
          >
            Suivante <ChevronRight size={16} />
          </button>
        </div>

        <ActionButton
          permission="planning:create"
          onClick={onNouveauRdv}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Nouveau RDV
        </ActionButton>
      </div>
    </div>
  );
}
