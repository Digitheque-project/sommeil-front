"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";

const summaryMetrics = [
  { label: "Index Apnées (IAH)", value: "32.4 /h", color: "text-error" },
  { label: "Saturation min SpO2", value: "84 %", color: "text-secondary" },
  { label: "Temps de sommeil total", value: "6h 12m", color: "text-primary" },
  { label: "Efficacité du sommeil", value: "78.5 %", color: "text-secondary" },
];

const templates = [
  {
    title: "SAOS Sévère",
    preview: "Patient présentant un index élevé avec désaturations...",
  },
  {
    title: "Examen Normal",
    preview: "Architecture du sommeil respectée, absence d'apnées...",
  },
  {
    title: "Insomnie Initiale",
    preview: "Allongement de la latence d'endormissement...",
  },
];

type SaveState = "idle" | "saving" | "saved";

export default function CompteRenduPage() {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    setSaveState("saving");
    setTimeout(() => {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 3000);
    }, 1200);
  };

  return (
    <>
      <TopBar
        title="Rédaction du Compte Rendu"
        searchPlaceholder="Rechercher un dossier..."
        doctorName="Dr. Morel"
        doctorRole="Somnologue"
      />

      <div className="max-w-6xl mx-auto px-container-padding py-section-gap">
        {/* Patient Header Info */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 mb-gutter shadow-sm flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary-fixed rounded-full flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined filled">
                person
              </span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary">
                Jean-Luc DUBOIS
              </h2>
              <div className="flex flex-wrap gap-4 mt-1">
                <span className="text-on-surface-variant text-body-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">
                    calendar_today
                  </span>{" "}
                  12/05/1974 (49 ans)
                </span>
                <span className="text-on-surface-variant text-body-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">
                    fingerprint
                  </span>{" "}
                  ID: #PSG-2023-8942
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-right">
              <p className="text-label-sm text-on-surface-variant uppercase">
                Date de l&apos;examen
              </p>
              <p className="font-label-md text-label-md text-primary">
                24 Octobre 2023
              </p>
            </div>
            <div className="w-px h-10 bg-outline-variant mx-2" />
            <div className="text-right">
              <p className="text-label-sm text-on-surface-variant uppercase">
                Type d&apos;examen
              </p>
              <p className="font-label-md text-label-md text-primary">
                Polysomnographie Complète
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-gutter">
          {/* Summary Metrics */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <h3 className="font-label-md text-label-md text-on-surface-variant mb-4 uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  insights
                </span>{" "}
                Synthèse des données
              </h3>
              <div className="space-y-4">
                {summaryMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="flex justify-between items-end border-b border-outline-variant pb-2"
                  >
                    <span className="text-body-sm text-on-surface-variant">
                      {metric.label}
                    </span>
                    <span
                      className={`font-data-mono text-headline-sm ${metric.color}`}
                    >
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-2 px-4 border border-secondary text-secondary rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">
                  visibility
                </span>{" "}
                Voir le tracé complet
              </button>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <h3 className="font-label-md text-label-md text-on-surface-variant mb-3 uppercase">
                Templates de rédaction
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {templates.map((template) => (
                  <button
                    key={template.title}
                    onClick={() =>
                      setNotes((prev) =>
                        prev ? `${prev}\n\n${template.preview}` : template.preview
                      )
                    }
                    className="text-left p-2.5 rounded border border-outline-variant hover:bg-surface-container-high transition-colors text-body-sm"
                  >
                    <span className="font-semibold block mb-0.5">
                      {template.title}
                    </span>
                    <span className="text-on-surface-variant truncate block">
                      {template.preview}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Free Text Editor */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col h-full">
              <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-headline-sm text-headline-sm text-primary">
                  Observations &amp; Conclusion Médicale
                </h3>
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">
                    history
                  </span>
                  <span className="text-label-sm">
                    Dernière sauvegarde: 14:02
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant flex gap-4">
                <div className="flex gap-1">
                  <button
                    className="p-1 hover:bg-surface-container-high rounded transition-colors"
                    aria-label="Gras"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      format_bold
                    </span>
                  </button>
                  <button
                    className="p-1 hover:bg-surface-container-high rounded transition-colors"
                    aria-label="Italique"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      format_italic
                    </span>
                  </button>
                  <button
                    className="p-1 hover:bg-surface-container-high rounded transition-colors"
                    aria-label="Liste à puces"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      format_list_bulleted
                    </span>
                  </button>
                </div>
                <div className="w-px h-6 bg-outline-variant" />
                <div className="flex gap-1">
                  <button
                    className="p-1 hover:bg-surface-container-high rounded transition-colors"
                    aria-label="Ajouter un lien"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      add_link
                    </span>
                  </button>
                  <button
                    className="p-1 hover:bg-surface-container-high rounded transition-colors"
                    aria-label="Joindre un fichier"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      attach_file
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-full min-h-[500px] border-none focus:ring-0 font-body-lg text-body-lg placeholder:text-on-surface-variant/40 resize-none outline-none"
                  placeholder="Saisissez ici vos conclusions détaillées sur l'examen de M. DUBOIS..."
                />
              </div>

              <div className="p-6 border-t border-outline-variant bg-surface-bright flex flex-wrap items-center justify-between gap-4 rounded-b-xl">
                <div className="flex gap-4">
                  <button className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md px-4 py-2 hover:bg-surface-container-high rounded-lg transition-colors">
                    <span className="material-symbols-outlined">print</span>{" "}
                    Imprimer le brouillon
                  </button>
                  <button className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md px-4 py-2 hover:bg-surface-container-high rounded-lg transition-colors">
                    <span className="material-symbols-outlined">share</span>{" "}
                    Partager
                  </button>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saveState === "saving"}
                  className={`px-8 py-3 rounded-lg font-headline-sm flex items-center gap-3 shadow-lg active:scale-95 transition-all disabled:cursor-not-allowed ${
                    saveState === "saved"
                      ? "bg-green-600 text-white"
                      : "bg-secondary text-on-secondary hover:brightness-110"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined filled ${
                      saveState === "saving" ? "animate-spin" : ""
                    }`}
                  >
                    {saveState === "saving"
                      ? "sync"
                      : saveState === "saved"
                        ? "check_circle"
                        : "archive"}
                  </span>
                  {saveState === "saving"
                    ? "Traitement..."
                    : saveState === "saved"
                      ? "Archivé avec succès"
                      : "Enregistrer et Archiver"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contextual Assistant */}
        <div className="mt-section-gap bg-primary-container text-on-primary-container p-6 rounded-xl border border-primary-container flex items-start gap-4">
          <span className="material-symbols-outlined text-[32px]">
            lightbulb
          </span>
          <div>
            <h4 className="font-headline-sm text-headline-sm mb-1">
              Aide au diagnostic
            </h4>
            <p className="text-body-md opacity-90 max-w-3xl">
              Basé sur les données de polysomnographie, ce patient présente
              une fragmentation sévère du sommeil avec une prédominance
              d&apos;événements obstructifs en position supine. Un traitement
              par PPC (Pression Positive Continue) est fortement recommandé.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
