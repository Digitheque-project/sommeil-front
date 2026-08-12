"use client";

import { useState } from "react";

type Urgence = "NORMAL" | "URGENT" | "TRES_URGENT";

interface Props {
  patient?: {
    id: string;
    nom?: string;
    prenom?: string;
    sexe?: string;
    dateNaissance?: string;
    allergies?: string[];
  };
  prescripteur?: {
    id?: string;
    nom?: string;
    prenom?: string;
    service?: string;
  };
}

const urgenceClasses: Record<Urgence, string> = {
  NORMAL: "bg-green-50 border-green-200",
  URGENT: "bg-orange-50 border-orange-200",
  TRES_URGENT: "bg-red-50 border-red-200",
};

export default function PolysomnographieForm({ patient, prescripteur }: Props) {
  const [urgence, setUrgence] = useState<Urgence>("NORMAL");
  const [alertes, setAlertes] = useState("");
  const [renseignements, setRenseignements] = useState("");
  const [remarques, setRemarques] = useState("");
  const [loading, setLoading] = useState(false);

  const calcAge = (dateNaissance?: string) => {
    if (!dateNaissance) return null;
    const birth = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calcAge(patient?.dateNaissance);
  const sexeLabel = patient?.sexe === "M" ? "Masculin" : patient?.sexe === "F" ? "Féminin" : patient?.sexe;

  const isFormValid = !!renseignements.trim();

  async function handleSubmit() {
    setLoading(true);
    try {
      const prescriptionData = {
        patientId: patient?.id,
        prescripteurId: prescripteur?.id,
        urgence,
        alertes,
        renseignements,
        remarques,
        patientNom: patient?.nom,
        patientPrenom: patient?.prenom,
        prescripteurNom: prescripteur?.nom,
        prescripteurPrenom: prescripteur?.prenom,
        prescripteurService: prescripteur?.service,
      };

      console.log("Prescription Polysomnographie:", prescriptionData);
      // TODO: Send to API
      alert("Prescription envoyée avec succès");
      setUrgence("NORMAL");
      setAlertes("");
      setRenseignements("");
      setRemarques("");
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      alert("Erreur lors de l'envoi de la prescription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-50 rounded-2xl border border-gray-200 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 block mb-2">
              Renseignements cliniques <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={renseignements}
              onChange={(e) => setRenseignements(e.target.value)}
              placeholder="Contexte clinique, indications pour la polysomnographie..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#005b82]/30"
            />
          </div>
          <div className="bg-slate-50 rounded-2xl border border-gray-200 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 block mb-2">
              Remarques
            </label>
            <textarea
              rows={3}
              value={remarques}
              onChange={(e) => setRemarques(e.target.value)}
              placeholder="Informations spécifiques..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#005b82]/30"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-2xl border border-gray-200 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 block mb-2">
              Degré d'urgence <span className="text-red-500">*</span>
            </label>
            <div className={`mb-3 rounded-xl border p-3 ${urgenceClasses[urgence]}`}>
              <select
                className="w-full bg-transparent text-sm font-semibold text-gray-700 focus:outline-none"
                value={urgence}
                onChange={(e) => setUrgence(e.target.value as Urgence)}
              >
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent</option>
                <option value="TRES_URGENT">Très urgent</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-red-500">⚠</span>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Précautions & Alertes
              </label>
            </div>
            <textarea
              rows={2}
              value={alertes}
              onChange={(e) => setAlertes(e.target.value)}
              placeholder="Précautions..."
              className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            className="w-full rounded-2xl bg-[#005b82] px-4 py-3 text-sm font-semibold text-white hover:bg-[#004a6b] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-300"
          >
            {loading ? "Envoi..." : "Valider"}
          </button>
        </div>
      </div>
    </div>
  );
}
