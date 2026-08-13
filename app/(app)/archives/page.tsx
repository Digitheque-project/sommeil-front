import TopBar from "@/components/TopBar";

const stats = [
  {
    label: "Total Dossiers",
    value: "1,284",
    icon: "folder_shared",
    iconBg: "bg-secondary-container",
    iconColor: "text-on-secondary-container",
    valueColor: "text-primary",
  },
  {
    label: "Analyses PDF",
    value: "842",
    icon: "picture_as_pdf",
    iconBg: "bg-tertiary-fixed",
    iconColor: "text-primary",
    valueColor: "text-primary",
  },
  {
    label: "Taux d'Urgence",
    value: "4.2%",
    icon: "priority_high",
    iconBg: "bg-error-container",
    iconColor: "text-error",
    valueColor: "text-error",
  },
  {
    label: "Stockage Cloud",
    value: "68%",
    icon: "cloud_done",
    iconBg: "bg-secondary-fixed",
    iconColor: "text-secondary",
    valueColor: "text-secondary",
  },
];

const records = [
  {
    initials: "JD",
    initialsBg: "bg-secondary-fixed",
    initialsColor: "text-secondary",
    name: "Jean Dupont",
    id: "#SLEEP-2023-8941",
    exam: "Polysomnographie (Nuit)",
    examTag: "Diagnostic Initial",
    examTagColor: "text-secondary",
    date: "12/10/2023",
    status: "Validé",
    statusColor: "bg-green-100 text-green-800",
    reportAction: "Consulter",
    reportIcon: "visibility",
  },
  {
    initials: "ML",
    initialsBg: "bg-tertiary-fixed",
    initialsColor: "text-primary",
    name: "Marie Laurent",
    id: "#SLEEP-2023-9002",
    exam: "Actimétrie (7 jours)",
    examTag: "Suivi CPAP",
    examTagColor: "text-primary",
    date: "08/10/2023",
    status: "Archivé",
    statusColor: "bg-blue-100 text-blue-800",
    reportAction: "Consulter",
    reportIcon: "visibility",
  },
  {
    initials: "PB",
    initialsBg: "bg-error-container",
    initialsColor: "text-error",
    name: "Pierre Bernard",
    id: "#SLEEP-2023-9115",
    exam: "Polygraphie Ventilatoire",
    examTag: "Critique / SAOS",
    examTagColor: "text-error",
    date: "05/10/2023",
    status: "Signature Requise",
    statusColor: "bg-orange-100 text-orange-800",
    reportAction: "Signer",
    reportIcon: "edit_note",
    urgent: true,
  },
  {
    initials: "SM",
    initialsBg: "bg-surface-container-high",
    initialsColor: "text-primary",
    name: "Sophie Martin",
    id: "#SLEEP-2023-8822",
    exam: "Test de Latence (TILE)",
    examTag: "Évaluation Diurne",
    examTagColor: "text-on-surface-variant",
    date: "02/10/2023",
    status: "Validé",
    statusColor: "bg-green-100 text-green-800",
    reportAction: "Consulter",
    reportIcon: "visibility",
  },
];

const auditLog = [
  {
    icon: "history_edu",
    iconBg: "bg-secondary-fixed",
    iconColor: "text-secondary",
    id: 'audit-1',
    text: (
      <>
        <span className="font-bold">Dr. Lefebvre</span> a validé le rapport de
        Jean Dupont.
      </>
    ),
    meta: "Il y a 14 minutes • IP: 192.168.1.45",
  },
  {
    id: 'audit-2',
    icon: "download",
    iconBg: "bg-surface-container-high",
    iconColor: "text-on-surface-variant",
    text: (
      <>
        <span className="font-bold">Admin Clinique</span> a téléchargé
        l&apos;archive mensuelle (Septembre 2023).
      </>
    ),
    meta: "Aujourd'hui, 09:24 • IP: 192.168.1.12",
  },
];

export default function ArchivesPage() {
  return (
    <>
      <TopBar
        title="Archives"
        searchPlaceholder="Rechercher un dossier..."
        doctorName="Dr. Morel"
        doctorRole="Spécialiste Sommeil"
      />

      <div className="p-container-padding">
        {/* Page Header & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="font-display-lg text-display-lg text-primary mb-1">
              Archives Médicales
            </h2>
            <p className="text-on-surface-variant font-body-md">
              Consultez et gérez l&apos;historique complet des diagnostics et
              rapports de sommeil.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-surface-container-lowest border border-outline-variant p-1 rounded-lg flex items-center">
              <button className="px-4 py-1.5 text-secondary font-semibold bg-secondary-container rounded-md font-label-md text-label-md">
                Tous
              </button>
              <button className="px-4 py-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-md font-label-md text-label-md">
                Terminés
              </button>
              <button className="px-4 py-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-md font-label-md text-label-md">
                En attente
              </button>
            </div>
            <button className="bg-surface-container-lowest border border-outline-variant px-4 py-2 flex items-center gap-2 font-label-md text-label-md rounded-lg hover:bg-surface-container-high transition-all">
              <span className="material-symbols-outlined text-lg">
                calendar_month
              </span>
              <span>Date Range</span>
            </button>
            <button className="bg-surface-container-lowest border border-outline-variant px-4 py-2 flex items-center gap-2 font-label-md text-label-md rounded-lg hover:bg-surface-container-high transition-all">
              <span className="material-symbols-outlined text-lg">
                filter_list
              </span>
              <span>Filtres</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-section-gap">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="col-span-1 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex flex-col justify-between"
            >
              <span className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-2">
                {stat.label}
              </span>
              <div className="flex items-end justify-between">
                <span
                  className={`text-display-lg font-display-lg ${stat.valueColor}`}
                >
                  {stat.value}
                </span>
                <div className={`p-2 ${stat.iconBg} rounded-lg`}>
                  <span
                    className={`material-symbols-outlined ${stat.iconColor}`}
                  >
                    {stat.icon}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-container-padding shadow-sm">
          <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent outline-none font-body-sm text-body-sm transition-all"
                placeholder="Rechercher par nom, ID patient ou type d'examen..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                className="action-secondary p-2.5 rounded-lg"
                title="Exporter vers Excel"
              >
                <span className="material-symbols-outlined text-on-surface-variant">
                  file_download
                </span>
              </button>
              <button
                className="action-secondary p-2.5 rounded-lg"
                title="Imprimer la sélection"
              >
                <span className="material-symbols-outlined text-on-surface-variant">
                  print
                </span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-tertiary-fixed border-b border-outline-variant">
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface uppercase tracking-wider">
                    Patient &amp; ID
                  </th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface uppercase tracking-wider">
                    Type d&apos;Examen
                  </th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface uppercase tracking-wider text-right">
                    Date d&apos;Examen
                  </th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface uppercase tracking-wider text-center">
                    Status
                  </th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface uppercase tracking-wider text-center">
                    Rapport
                  </th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-tertiary-fixed transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full ${record.initialsBg} flex items-center justify-center ${record.initialsColor} font-bold`}
                        >
                          {record.initials}
                        </div>
                        <div>
                          <div className="font-semibold text-primary">
                            {record.name}
                          </div>
                          <div className="text-xs font-data-mono text-on-surface-variant">
                            {record.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-on-surface-variant">
                        {record.exam}
                      </div>
                      <div
                        className={`text-[10px] uppercase font-bold ${record.examTagColor}`}
                      >
                        {record.examTag}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-data-mono text-on-surface-variant">
                      {record.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2.5 py-1 ${record.statusColor} text-[11px] font-bold rounded-full uppercase`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        className={`${record.reportAction === "Signer" ? "text-warning" : "text-secondary"} hover:underline flex items-center justify-center gap-1 mx-auto font-label-sm ${
                          record.urgent ? "font-bold" : ""
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-lg ${
                            record.urgent ? "filled" : ""
                          }`}
                        >
                          {record.reportIcon}
                        </span>
                        <span>{record.reportAction}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className={`p-2 rounded-lg transition-colors ${record.reportAction === "Signer" ? "text-warning hover:bg-orange-50" : "text-secondary hover:bg-secondary-container"}`}
                          title={record.reportAction}
                          aria-label={record.reportAction}
                        >
                          <span className="material-symbols-outlined">
                            {record.reportIcon}
                          </span>
                        </button>
                        <button
                          className="action-secondary p-2 rounded-lg"
                          title="Télécharger le rapport"
                          aria-label="Télécharger le rapport"
                        >
                          <span className="material-symbols-outlined">
                            download
                          </span>
                        </button>
                        <button
                          className="p-2 hover:bg-surface-container-highest rounded-lg text-on-surface-variant transition-colors"
                          title="Plus d'options"
                          aria-label="Plus d'options"
                        >
                          <span className="material-symbols-outlined">
                            more_vert
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 bg-surface-container-low flex flex-wrap items-center justify-between gap-4">
            <span className="text-body-sm text-on-surface-variant">
              Affichage de 1-4 sur 1,284 résultats
            </span>
            <div className="flex items-center gap-1">
              <button
                className="p-2 hover:bg-surface-container-high rounded-lg disabled:opacity-30"
                disabled
                aria-label="Page précédente"
              >
                <span className="material-symbols-outlined">
                  chevron_left
                </span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center bg-secondary text-white rounded-lg font-label-md text-label-md">
                1
              </button>
              <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-high rounded-lg font-label-md text-label-md">
                2
              </button>
              <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-high rounded-lg font-label-md text-label-md">
                3
              </button>
              <span className="px-2">...</span>
              <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-high rounded-lg font-label-md text-label-md">
                321
              </button>
              <button
                className="p-2 hover:bg-surface-container-high rounded-lg"
                aria-label="Page suivante"
              >
                <span className="material-symbols-outlined">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-4">
              Journal d&apos;Audit Récent
            </h3>
              <div className="space-y-4">
              {auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 pb-4 border-b border-outline-variant last:border-b-0 last:pb-0"
                >
                  <div
                    className={`mt-1 p-1.5 ${entry.iconBg} rounded-full ${entry.iconColor}`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {entry.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-body-sm text-on-surface">
                      {entry.text}
                    </p>
                    <p className="text-xs text-on-surface-variant font-data-mono">
                      {entry.meta}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary text-white p-6 rounded-xl shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-headline-sm text-headline-sm mb-4">
                Intégrité des Données
              </h3>
              <p className="text-on-primary-container mb-6 text-body-sm leading-relaxed">
                Vos archives sont protégées par un cryptage AES-256 et
                conformes aux normes RGPD médicales. Les sauvegardes sont
                effectuées toutes les 4 heures.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-primary-container h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary-container w-[88%] h-full rounded-full" />
                </div>
                <span className="font-data-mono text-xs">88% Capacity</span>
              </div>
              <button className="mt-8 w-full py-3 bg-white text-primary font-bold rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">
                  verified_user
                </span>
                <span>Vérifier l&apos;Intégrité</span>
              </button>
            </div>
            <div className="absolute -right-12 -bottom-12 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
              <span className="material-symbols-outlined text-[160px]">
                security
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
