"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PlanningToolbar from "@/components/planning/PlanningToolbar";
import CalendrierSemaine from "@/components/planning/CalendrierSemaine";
import PanneauDetailRDV from "@/components/planning/PanneauDetailRDV";
import RdvFormModal from "@/components/planning/RdvFormModal";
import {
  usePlanningRdvs,
  useCreerRdv,
  useModifierRdv,
  useAnnulerRdv,
  useMarquerNonRealise,
  useMarquerRealise,
} from "@/hooks/use-planning";
import { dateISODansFuseauHopital, lundiDeLaSemaineHopital } from "@/lib/planning-dates";
import type { CreerRdvInput, RendezVousPlanning } from "@/lib/api/planning";
import { useToast } from "@/components/ToastProvider";

export default function PlanningPage() {
  const router = useRouter();
  const [dateDebut, setDateDebut] = useState<Date>(() => lundiDeLaSemaineHopital());
  const [rdvSelectionne, setRdvSelectionne] = useState<RendezVousPlanning | null>(null);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [rdvAModifier, setRdvAModifier] = useState<RendezVousPlanning | null>(null);
  const [creneauInitial, setCreneauInitial] = useState<{ dateRdv: string; heureDebut: string } | null>(null);
  const { showSuccess } = useToast();

  const dateFin = (() => {
    const d = new Date(dateDebut);
    d.setUTCDate(d.getUTCDate() + 6);
    return d;
  })();

  const { data: rdvs = [], isLoading } = usePlanningRdvs({
    dateDebut: dateISODansFuseauHopital(dateDebut),
    dateFin: dateISODansFuseauHopital(dateFin),
  });
  // Un RDV annulé n'a plus sa place dans le planning.
  const rdvsAffiches = rdvs.filter((r) => r.statut !== "ANNULE");

  const creerRdv = useCreerRdv();
  const modifierRdv = useModifierRdv();
  const annulerRdv = useAnnulerRdv();
  const marquerNonRealise = useMarquerNonRealise();
  const marquerRealise = useMarquerRealise();

  const semainePrecedente = () => {
    setDateDebut((d) => {
      const nd = new Date(d);
      nd.setUTCDate(d.getUTCDate() - 7);
      return nd;
    });
    setRdvSelectionne(null);
  };

  const semaineSuivante = () => {
    setDateDebut((d) => {
      const nd = new Date(d);
      nd.setUTCDate(d.getUTCDate() + 7);
      return nd;
    });
    setRdvSelectionne(null);
  };

  const ouvrirCreation = () => {
    setCreneauInitial(null);
    setRdvAModifier(null);
    setFormulaireOuvert(true);
  };

  const ouvrirCreationDepuisCreneau = (dateRdv: string, heureDebut: string) => {
    setCreneauInitial({ dateRdv, heureDebut });
    setRdvAModifier(null);
    setFormulaireOuvert(true);
  };

  const ouvrirModification = () => {
    if (!rdvSelectionne) return;
    setRdvAModifier(rdvSelectionne);
    setFormulaireOuvert(true);
  };

  const fermerFormulaire = () => {
    setFormulaireOuvert(false);
    setRdvAModifier(null);
    setCreneauInitial(null);
  };

  const handleConfirmerFormulaire = async (data: CreerRdvInput) => {
    if (rdvAModifier) {
      await modifierRdv.mutateAsync({ id: rdvAModifier.id, data });
      showSuccess("RDV modifié avec succès");
      setRdvSelectionne(null);
    } else {
      await creerRdv.mutateAsync(data);
      showSuccess("RDV planifié avec succès");
    }
    fermerFormulaire();
  };

  return (
    <div className="space-y-6">
      <PlanningToolbar
        dateDebut={dateDebut}
        onSemainePrecedente={semainePrecedente}
        onSemaineSuivante={semaineSuivante}
        onNouveauRdv={ouvrirCreation}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className={rdvSelectionne ? "mr-80" : ""}>
          <CalendrierSemaine
            dateDebut={dateDebut}
            rdvs={rdvsAffiches}
            onSelectRdv={setRdvSelectionne}
            onSelectCreneauLibre={ouvrirCreationDepuisCreneau}
          />
        </div>
      )}

      {rdvSelectionne && (
        <PanneauDetailRDV
          rdv={rdvSelectionne}
          onFermer={() => setRdvSelectionne(null)}
          onModifier={ouvrirModification}
          onAnnuler={async () => {
            await annulerRdv.mutateAsync(rdvSelectionne.id);
            showSuccess("RDV annulé");
            setRdvSelectionne(null);
          }}
          onMarquerNonRealise={async () => {
            await marquerNonRealise.mutateAsync(rdvSelectionne.id);
            showSuccess("RDV marqué non réalisé");
            setRdvSelectionne(null);
          }}
          onRecevoirPatient={async () => {
            // Le backend ouvre (ou retrouve) la consultation du rendez-vous :
            // on enchaîne directement sur son écran de traitement.
            const result = await marquerRealise.mutateAsync(rdvSelectionne.id);
            setRdvSelectionne(null);
            router.push(`/consultation/traitement?id=${encodeURIComponent(result.consultation.id)}`);
          }}
        />
      )}

      {formulaireOuvert && (
        <RdvFormModal
          titre={rdvAModifier ? "Modifier le RDV" : "Nouveau RDV"}
          valeurInitiale={
            rdvAModifier
              ? {
                  patientId: rdvAModifier.patientId,
                  patientNom: rdvAModifier.patientNom,
                  patientPrenom: rdvAModifier.patientPrenom,
                  patientDossier: rdvAModifier.patientDossier ?? undefined,
                  motif: rdvAModifier.motif ?? undefined,
                  priorite: rdvAModifier.priorite,
                  dateRdv: rdvAModifier.dateRdv,
                  heureDebut: rdvAModifier.heureDebut,
                  dureeMinutes: rdvAModifier.dureeMinutes,
                }
              : creneauInitial
                ? { dateRdv: creneauInitial.dateRdv, heureDebut: creneauInitial.heureDebut }
                : undefined
          }
          onClose={fermerFormulaire}
          onConfirm={handleConfirmerFormulaire}
        />
      )}
    </div>
  );
}
