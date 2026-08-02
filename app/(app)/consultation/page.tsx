import TopBar from "@/components/TopBar";

const queue = [
  {
    name: "MARCEL, Sophie",
    time: "14:30",
    timeColor: "text-secondary font-semibold",
    id: "#29481",
    reason: "Consultation initiale",
    active: true,
    tags: [
      { label: "Urgent", className: "bg-error-container text-on-error-container" },
      { label: "Apnée suspectée", className: "bg-surface-dim text-on-surface-variant" },
    ],
  },
  {
    name: "LEFEBVRE, Thomas",
    time: "15:15",
    id: "#30122",
    reason: "Suivi CPAP",
    tags: [
      {
        label: "Régulier",
        className: "bg-surface-container-highest text-on-surface-variant",
      },
    ],
  },
  {
    name: "GARCIA, Elena",
    time: "16:00",
    id: "#28854",
    reason: "Résultats Poly",
    tags: [
      {
        label: "Résultats",
        className: "bg-surface-container-highest text-on-surface-variant",
      },
    ],
  },
  {
    name: "DUMONT, Robert",
    time: "16:45",
    id: "#19283",
    reason: "Consultation",
    faded: true,
    tags: [],
  },
];

const timeline = [
  {
    title: "Consultation de Suivi Trimestriel",
    date: "12 Jan 2024",
    body: "Patient rapporte une amélioration significative de la fatigue diurne. Somnolence (Epworth: 6/24). Ajustement de la pression CPAP à 10cm H2O.",
    dot: "bg-secondary",
    attachment: { icon: "attachment", label: "ORDONNANCE_JAN24.PDF", className: "bg-tertiary-fixed text-on-tertiary-fixed" },
  },
  {
    title: "Polysomnographie Niveau 1",
    date: "15 Oct 2023",
    body: "Diagnostic d'AOS sévère. Saturation moyenne 89%. Présence de ronflements positionnels.",
    dot: "bg-outline-variant",
    attachment: {
      icon: "bar_chart",
      label: "RAPPORT_EXAMEN.XLSX",
      className: "bg-secondary-container text-on-secondary-container",
    },
  },
];

export default function ConsultationPage() {
  return (
    <>
      <TopBar
        title="Consultation"
        searchPlaceholder="Rechercher un patient (Nom, ID, Date de naissance)..."
        doctorName="Dr. Jean Dupont"
        doctorRole="Somnologue Senior"
      />

      <div className="p-container-padding space-y-section-gap">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary">
              Consultation &amp; Suivi Médical
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Gestion des dossiers patients et planification des séances de
              diagnostic.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-outline-variant rounded-lg text-label-md font-label-md flex items-center gap-2 hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[20px]">
                filter_list
              </span>
              Filtres
            </button>
            <button className="px-4 py-2 bg-secondary text-on-secondary rounded-lg text-label-md font-label-md flex items-center gap-2 shadow-sm hover:brightness-110 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[20px]">
                event_available
              </span>
              Planifier Rendez-vous
            </button>
          </div>
        </div>

        {/* Bento Grid Content */}
        <div className="grid grid-cols-12 gap-gutter">
          {/* Left Column: Patient Queue */}
          <div className="col-span-12 lg:col-span-4 space-y-gutter">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline-sm text-headline-sm text-primary">
                  File d&apos;attente
                </h3>
                <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-label-sm">
                  {queue.length * 2} Patients
                </span>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2">
                {queue.map((patient) => (
                  <div
                    key={patient.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                      patient.active
                        ? "bg-surface-container-low border-secondary hover:bg-surface-container-high"
                        : "bg-surface-container-lowest border-outline-variant hover:bg-surface-container-low"
                    } ${patient.faded ? "opacity-60" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-label-md font-bold text-primary">
                        {patient.name}
                      </span>
                      <span
                        className={`text-label-sm ${
                          patient.timeColor ?? "text-on-surface-variant"
                        }`}
                      >
                        {patient.time}
                      </span>
                    </div>
                    <p
                      className={`text-body-sm text-on-surface-variant ${
                        patient.tags.length ? "mb-3" : ""
                      }`}
                    >
                      ID: {patient.id} - {patient.reason}
                    </p>
                    {patient.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {patient.tags.map((tag) => (
                          <span
                            key={tag.label}
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${tag.className}`}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Medical History & Details */}
          <div className="col-span-12 lg:col-span-8 space-y-gutter">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className="flex items-center gap-1 text-green-600 font-label-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Dossier Actif
                </span>
              </div>
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-xl bg-secondary-fixed-dim flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined filled text-[40px]">
                    person
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary">
                    Sophie MARCEL
                  </h3>
                  <div className="flex flex-wrap gap-4 mt-1 text-body-sm text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">
                        cake
                      </span>{" "}
                      42 ans (12/05/1982)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">
                        fingerprint
                      </span>{" "}
                      ID: 29481-FR
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">
                        male
                      </span>{" "}
                      Sexe: F
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-8">
                <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant">
                  <p className="text-label-sm text-on-surface-variant uppercase mb-1">
                    Dernière Etude
                  </p>
                  <p className="text-headline-sm text-primary">15 Oct 2023</p>
                  <p className="text-label-sm text-secondary mt-1">
                    Polysomnographie complète
                  </p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant">
                  <p className="text-label-sm text-on-surface-variant uppercase mb-1">
                    Indice IAH
                  </p>
                  <p className="text-headline-sm text-error">
                    32.4 <span className="text-body-sm font-normal">/h</span>
                  </p>
                  <p className="text-label-sm text-on-error-container mt-1">
                    Apnée Sévère
                  </p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant">
                  <p className="text-label-sm text-on-surface-variant uppercase mb-1">
                    Observance CPAP
                  </p>
                  <p className="text-headline-sm text-primary">94%</p>
                  <p className="text-label-sm text-green-600 mt-1">
                    Excellente
                  </p>
                </div>
              </div>

              {/* Historical Timeline */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-label-md text-label-md text-primary">
                    Historique Médical &amp; Consultations
                  </h4>
                  <button className="text-secondary text-label-sm hover:underline">
                    Voir tout l&apos;historique
                  </button>
                </div>
                <div className="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-0 before:bottom-0 before:w-0.5 before:bg-outline-variant">
                  {timeline.map((entry) => (
                    <div key={entry.title} className="relative">
                      <div
                        className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full ${entry.dot} border-4 border-surface`}
                      />
                      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 hover:border-secondary transition-all">
                        <div className="flex justify-between mb-2">
                          <span className="text-label-md font-bold text-primary">
                            {entry.title}
                          </span>
                          <span className="text-data-mono font-data-mono text-xs text-on-surface-variant">
                            {entry.date}
                          </span>
                        </div>
                        <p className="text-body-sm text-on-surface-variant mb-3">
                          {entry.body}
                        </p>
                        <div className="flex gap-2">
                          <button
                            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded ${entry.attachment.className}`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {entry.attachment.icon}
                            </span>{" "}
                            {entry.attachment.label}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions & Next Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
                <h4 className="font-headline-sm text-headline-sm text-primary mb-4">
                  Prescription Actuelle
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-surface-bright rounded border border-outline-variant">
                    <div>
                      <p className="text-label-md text-primary">
                        Traitement CPAP
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        Pression: 10cm H2O • Masque Nasal
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-secondary">
                      check_circle
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-bright rounded border border-outline-variant">
                    <div>
                      <p className="text-label-md text-primary">
                        Mélatonine 2mg
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        1 gélule au coucher • 3 mois
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">
                      history
                    </span>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 border-2 border-dashed border-outline-variant text-on-surface-variant rounded-lg text-label-md hover:border-secondary hover:text-secondary transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">
                    add_circle
                  </span>
                  Nouvelle Prescription
                </button>
              </div>

              <div className="bg-primary text-on-primary rounded-xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <span className="material-symbols-outlined text-[120px]">
                    calendar_month
                  </span>
                </div>
                <h4 className="font-headline-sm text-headline-sm mb-4 relative z-10">
                  Planification Suivant
                </h4>
                <div className="space-y-4 relative z-10">
                  <div>
                    <p className="text-label-sm text-primary-fixed-dim uppercase">
                      Prochain Examen Recommandé
                    </p>
                    <p className="text-body-lg font-bold">
                      Contrôle Polygraphique (6 mois)
                    </p>
                  </div>
                  <div className="flex items-center gap-4 py-3 px-4 bg-primary-container rounded-lg">
                    <span className="material-symbols-outlined">event</span>
                    <div>
                      <p className="text-label-md">18 Avril 2024</p>
                      <p className="text-label-sm text-on-primary-container">
                        Salle d&apos;Examen B • 21:00
                      </p>
                    </div>
                  </div>
                  <button className="w-full bg-secondary text-on-secondary py-3 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-secondary-fixed-dim hover:text-on-secondary-fixed transition-colors active:scale-95 duration-150">
                    Confirmer le créneau
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
