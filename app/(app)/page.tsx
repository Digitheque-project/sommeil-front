import Link from "next/link";
import TopBar from "@/components/TopBar";
import BarChart from "@/components/charts/BarChart";

const activityFeed = [
  {
    icon: "upload_file",
    iconBg: "bg-surface-container-high",
    iconColor: "text-primary",
    title: "Données PSG téléchargées",
    subtitle: "Patient: Mme. Sophie Martin · ID #4429",
    time: "Il y a 12 min",
    badge: undefined as string | undefined,
  },
  {
    icon: "verified",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    title: "Compte-rendu validé",
    subtitle: "Par Dr. Leroy · Patient: M. Pierre Adam",
    time: "Il y a 1h",
    badge: "TERMINÉ",
  },
  {
    icon: "edit_calendar",
    iconBg: "bg-secondary-container/20",
    iconColor: "text-secondary",
    title: "Nouvelle Consultation",
    subtitle: "Patient: Emma Bernard · Demain à 09:00",
    time: "Il y a 2h",
    badge: undefined as string | undefined,
  },
];

const weeklyExamTrend = [
  { label: "S1", values: { courant: 38 } },
  { label: "S2", values: { courant: 41 } },
  { label: "S3", values: { courant: 29 } },
  { label: "S4", values: { courant: 44 } },
  { label: "S5", values: { courant: 52 } },
];

const calendarDays = [
  { day: 25, muted: true },
  { day: 26, muted: true },
  { day: 27, muted: true },
  { day: 28, muted: true },
  { day: 29, muted: true },
  { day: 30, muted: true },
  ...Array.from({ length: 24 }, (_, i) => ({ day: i + 1, muted: false })),
];

const agenda = [
  { time: "14:30", label: "J. Dupont (PSG)", dot: "bg-secondary" },
  { time: "16:00", label: "Staff Technique", dot: "bg-orange-400" },
];

const quickActions = [
  { icon: "assignment_ind", label: "Dossier Patient" },
  { icon: "monitor_heart", label: "Direct Chambre 04" },
  { icon: "science", label: "Protocoles" },
];

export default function DashboardPage() {
  return (
    <>
      <TopBar title="Tableau de bord" />

      <div className="p-container-padding space-y-section-gap max-w-7xl mx-auto">
        {/* Hero / Welcome Section */}
        <section className="grid gap-6 xl:grid-cols-[2.1fr_0.9fr]">
          <div className="rounded-[32px] border border-outline-variant bg-surface-bright p-8 shadow-sm">
            <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-2xl space-y-5">
                <h3 className="font-headline-md text-headline-md text-primary">
                  Bonjour, Dr. Morel
                </h3>
                <p className="text-on-surface-variant font-body-md leading-8">
                  Voici le résumé de l&apos;activité de la clinique pour
                  aujourd&apos;hui, 24 Octobre.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-[24px] border border-outline-variant bg-surface-container-lowest p-4">
                    <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant mb-3">
                      Examens
                    </p>
                    <p className="text-headline-sm font-semibold text-primary">14</p>
                  </div>
                  <div className="rounded-[24px] border border-outline-variant bg-surface-container-lowest p-4">
                    <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant mb-3">
                      En attente
                    </p>
                    <p className="text-headline-sm font-semibold text-primary">08</p>
                  </div>
                  <div className="rounded-[24px] border border-outline-variant bg-surface-container-lowest p-4">
                    <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant mb-3">
                      Taux d&apos;occupation
                    </p>
                    <p className="text-headline-sm font-semibold text-primary">92%</p>
                  </div>
                </div>
              </div>

                <div className="rounded-[32px] border border-outline-variant bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">
                      Synthèse rapide
                    </p>
                    <h3 className="font-headline-sm text-headline-sm text-primary">
                      Vue clinique
                    </h3>
                  </div>
                  <span className="rounded-full bg-secondary-container/20 px-3 py-2 text-secondary text-label-sm font-semibold">
                    +8% vs hier
                  </span>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-[24px] bg-surface-bright border border-outline-variant p-4">
                    <p className="text-label-sm text-on-surface-variant">Nouveaux patients</p>
                    <p className="text-headline-sm font-semibold text-primary">7</p>
                  </div>
                  <div className="rounded-[24px] bg-surface-bright border border-outline-variant p-4">
                    <p className="text-label-sm text-on-surface-variant">Nouveaux rapports</p>
                    <p className="text-headline-sm font-semibold text-primary">5</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button className="bg-secondary text-on-secondary px-5 py-2.5 rounded-2xl font-label-md text-label-md inline-flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm">
                    <span className="material-symbols-outlined icon-lg">
                      event
                    </span>
                    <span>Planning Hebdo</span>
                  </button>
                  <button className="bg-surface-container-lowest border border-outline-variant px-5 py-2.5 rounded-2xl font-label-md text-label-md inline-flex items-center justify-center gap-2 hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined icon-lg">
                      download
                    </span>
                    <span>Exporter</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white border border-outline-variant p-6 rounded-[28px] shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-secondary-container/15 text-secondary inline-flex">
                <span className="material-symbols-outlined icon-xl">
                  clinical_notes
                </span>
              </div>
              <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                +12%
              </span>
            </div>
            <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-[0.16em] mb-3">
              Examens Aujourd&apos;hui
            </p>
            <h4 className="font-display-lg text-display-lg text-primary">
              14
            </h4>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2.5 flex-1 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-secondary w-3/4 rounded-full" />
              </div>
              <span className="text-label-sm text-on-surface-variant">
                14/18
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-[28px] shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="mb-4">
              <div className="p-3 rounded-2xl bg-tertiary-fixed text-tertiary inline-flex">
                <span className="material-symbols-outlined icon-xl">
                  pending_actions
                </span>
              </div>
            </div>
            <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-[0.16em] mb-3">
              Comptes-rendus en attente
            </p>
            <h4 className="font-display-lg text-display-lg text-primary">
              08
            </h4>
            <p className="mt-4 text-label-sm text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-error">priority_high</span><span>3 dossiers prioritaires</span>
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-[28px] shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="mb-4">
              <div className="p-3 rounded-2xl bg-surface-container-high inline-flex">
                <span className="material-symbols-outlined icon-xl text-primary">
                  alarm
                </span>
              </div>
            </div>
            <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-[0.16em] mb-3">
              Prochain RDV
            </p>
            <h4 className="font-headline-md text-headline-md text-primary">
              14:30
            </h4>
            <p className="mt-3 text-body-sm font-semibold text-on-surface">
              M. Jean Dupont
            </p>
            <p className="text-label-sm text-on-surface-variant">
              Salle B-04 · Polysomnographie
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-[28px] shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="mb-4">
              <div className="p-3 rounded-2xl bg-secondary-container/10 inline-flex">
                <span className="material-symbols-outlined icon-xl text-secondary">
                  hotel
                </span>
              </div>
            </div>
            <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-[0.16em] mb-3">
              Occupation Lits
            </p>
            <h4 className="font-display-lg text-display-lg text-primary">
              92%
            </h4>
            <p className="mt-4 text-label-sm text-on-surface-variant">
              11 sur 12 lits réservés
            </p>
          </div>
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-section-gap">
          {/* Center Column */}
          <div className="lg:col-span-2 space-y-gutter">
            {/* Activité Récente */}
            <div className="bg-white border border-outline-variant rounded-[32px] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-headline-sm text-headline-sm text-primary">
                  Activité Récente
                </h3>
                <button className="rounded-full border border-outline-variant px-4 py-2 text-label-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
                  Voir tout
                </button>
              </div>
              <div className="divide-y divide-outline-variant">
                {activityFeed.map((item) => (
                  <div
                    key={item.title}
                    className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}
                      >
                        <span className="material-symbols-outlined icon-lg">
                          {item.icon}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-on-surface">
                          {item.title}
                        </div>
                        <div className="text-label-sm text-on-surface-variant">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <span className="text-label-sm text-on-surface-variant">
                        {item.time}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-bold uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4">
                <button className="w-full bg-tertiary text-on-tertiary rounded-2xl py-3 flex items-center justify-center gap-2 font-label-md text-label-md hover:opacity-90 transition-all">
                  <span className="material-symbols-outlined">add</span>
                  Créer une nouvelle entrée
                </button>
              </div>
            </div>

            {/* Exam Volume Preview */}
            <div className="bg-white border border-outline-variant rounded-[32px] p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    Volume d&apos;Examens
                  </h3>
                  <p className="text-label-sm text-on-surface-variant">
                    Tendance hebdomadaire
                  </p>
                </div>
                <Link
                  href="/rapports"
                  className="shrink-0 flex items-center gap-1 text-secondary text-label-sm font-semibold hover:underline"
                >
                  Voir les rapports
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </Link>
              </div>
              <BarChart
                data={weeklyExamTrend}
                series={[{ key: "courant", label: "Examens", color: "#2563eb" }]}
                height={140}
              />
            </div>
          </div>

          {/* Right Column: Calendar & Quick Tools */}
          <div className="space-y-gutter">
            <div className="bg-white border border-outline-variant rounded-[32px] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-primary text-on-primary">
                <h3 className="font-label-md text-label-md uppercase tracking-wider">
                  Calendrier
                </h3>
                <div className="flex gap-2">
                  <button
                    className="hover:bg-white/10 rounded-full p-2"
                    aria-label="Mois précédent"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_left
                    </span>
                  </button>
                  <button
                    className="hover:bg-white/10 rounded-full p-2"
                    aria-label="Mois suivant"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-lg font-semibold text-primary">Octobre 2023</p>
                  <span className="rounded-full bg-secondary-container/20 px-3 py-1 text-secondary text-label-sm font-semibold">
                    8 événements
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold text-on-surface-variant uppercase tracking-[0.2em] mb-3">
                  {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                    <span key={`${d}-${i}`} className={i === 6 ? 'text-error' : ''}>
                      {d}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {calendarDays.map((cell) => {
                    if (cell.muted) {
                      return (
                        <div
                          key={cell.day}
                          className="aspect-square rounded-2xl bg-surface-container text-label-sm text-on-surface-variant flex items-center justify-center"
                        >
                          {cell.day}
                        </div>
                      );
                    }
                    if (cell.day === 24) {
                      return (
                        <div
                          key={cell.day}
                          className="aspect-square rounded-3xl bg-secondary text-white font-bold flex items-center justify-center relative"
                        >
                          {cell.day}
                          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
                        </div>
                      );
                    }
                    if (cell.day === 25) {
                      return (
                        <div
                          key={cell.day}
                          className="aspect-square rounded-2xl border-2 border-secondary/30 bg-surface-container text-label-sm font-bold text-primary flex items-center justify-center"
                        >
                          {cell.day}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={cell.day}
                        className="aspect-square rounded-2xl bg-surface-container text-label-sm font-bold text-primary flex items-center justify-center"
                      >
                        {cell.day}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-5 border-t border-outline-variant bg-surface-container-lowest">
                <h4 className="text-label-sm font-bold text-primary mb-3 uppercase tracking-wide">
                  Agenda du jour
                </h4>
                <div className="space-y-3">
                  {agenda.map((entry) => (
                    <div key={entry.time} className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${entry.dot}`} />
                      <span className="text-body-sm text-on-surface">
                        {entry.time} - {entry.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Clinical Quick Actions */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-[32px] p-6 shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-4">
                Actions Rapides
              </h3>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    className="w-full flex items-center justify-between gap-4 rounded-[24px] border border-outline-variant bg-surface-container px-4 py-4 text-left shadow-sm transition hover:shadow-md hover:bg-surface-container-low"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-secondary-container/20 text-secondary icon-lg">
                        <span className="material-symbols-outlined">{action.icon}</span>
                      </span>
                      <span className="font-semibold text-primary">
                        {action.label}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">
                      chevron_right
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Status Display */}
            <div className="relative overflow-hidden rounded-[32px] border border-outline-variant bg-gradient-to-br from-surface-bright via-surface-container-low to-surface-container p-6 shadow-sm">
              <div className="relative z-10">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-3">
                  État du Réseau
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-label-sm font-semibold text-green-700">
                    Système Opérationnel
                  </span>
                </div>
                <p className="text-body-sm text-primary/80 leading-7">
                  Connecté au serveur central de l&apos;Unité de Diagnostic.
                  Synchronisation active.
                </p>
              </div>
              <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-primary/10 text-[140px] select-none">
                cloud_done
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-24 md:bottom-8 right-8 z-40">
        <button className="bg-secondary text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group">
          <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">
            add
          </span>
        </button>
      </div>
    </>
  );
}
