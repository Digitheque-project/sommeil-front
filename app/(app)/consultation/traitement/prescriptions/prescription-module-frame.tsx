"use client";

import { useRouter } from "next/navigation";
import PrescriptionLayout from "@/components/prescription/PrescriptionLayout";

export default function PrescriptionModuleFrame({ params }: Readonly<{ params: Record<string, string> }>) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#F5F8FA]">
      <div className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-200 bg-white px-4 py-2 sm:px-6">
        <button
          type="button"
          onClick={() => router.push(`/consultation/traitement?id=${encodeURIComponent(params.consultationId ?? "")}${params.origin ? `&origin=${encodeURIComponent(params.origin)}` : ""}`)}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-[#006A8C] hover:bg-[#EAF3FA]"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Retour au traitement
        </button>
        <div className="border-l border-slate-200 pl-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Traitement / Examens</p>
          <p className="text-sm font-bold text-slate-700">Prescriptions para-cliniques</p>
        </div>
        <div className="ml-auto hidden rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-bold text-[#006A8C] md:block">
          {[params.patientPrenom, params.patientNom].filter(Boolean).join(" ") || "Patient"}
        </div>
      </div>
      <div className="rx-scope" style={{ minHeight: "calc(100vh - 4.25rem)", background: "var(--bg)" }}>
        <PrescriptionLayout
          patient={{ id: params.patientId ?? "", nom: params.patientNom, prenom: params.patientPrenom, sexe: params.patientSexe, dateNaissance: params.patientDateNaissance }}
          prescripteur={{ id: params.prescripteurId, nom: "Centre de Sommeil", service: "Centre de Sommeil" }}
          onBack={() => router.push(`/consultation/traitement?id=${encodeURIComponent(params.consultationId ?? "")}${params.origin ? `&origin=${encodeURIComponent(params.origin)}` : ""}`)}
        />
      </div>
    </main>
  );
}
