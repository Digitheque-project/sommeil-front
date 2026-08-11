import Link from "next/link";
import TopBar from "@/components/TopBar";
import BarChart from "@/components/charts/BarChart";

const activityFeed = [
  {
    icon: "upload_file",
    iconBg: "bg-[#E2E8F0]",
    iconColor: "text-[#2563EB]",
    title: "Données PSG téléchargées",
    subtitle: "Patient: Mme. Sophie Martin · ID #4429",
    time: "Il y a 12 min",
    badge: undefined as string | undefined,
  },
  {
    icon: "verified",
    iconBg: "bg-[#D1FAE5]",
    iconColor: "text-[#059669]",
    title: "Compte-rendu validé",
    subtitle: "Par Dr. Leroy · Patient: M. Pierre Adam",
    time: "Il y a 1h",
    badge: "TERMINÉ",
  },
  {
    icon: "edit_calendar",
    iconBg: "bg-[#FEE2E2]",
    iconColor: "text-[#DC2626]",
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

const quickActions = [
  { icon: "assignment_ind", label: "Dossier Patient", href: "/consultation" },
  { icon: "monitor_heart", label: "Direct Chambre 04", href: "/polysomnographie" },
  { icon: "science", label: "Protocoles", href: "/polysomnographie" },
];

export default function DashboardPage() {
  return (
    <>
      <TopBar title="Tableau de bord" />

      <div className="p-8 flex flex-col min-h-[calc(100vh-4rem)] max-w-7xl mx-auto bg-[#F8FAFC] animate-fade-in">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-[28px] font-extrabold text-[#0F172A] font-headline">
            Bonjour, Dr. Morel
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            Bienvenue au centre de sommeil — voici l&apos;essentiel de l&apos;activité d&apos;aujourd&apos;hui.
          </p>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
          {/* Examens Aujourd'hui */}
          <div
            className="bg-[#1E3A8A] p-6 rounded-[24px] relative overflow-hidden flex flex-col justify-between h-[220px] cursor-pointer shadow-sm transition hover:brightness-105"
            role="button"
            tabIndex={0}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1 text-[#4FC3F7]">
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                  clinical_notes
                </span>
              </div>
              <div className="bg-[#1B5E20] text-[#81C784] border-[#4CAF50]/30 px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 border">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                +12%
              </div>
            </div>
            <div>
              <h3 className="text-white font-extrabold text-[48px] leading-none mb-1 font-headline">
                14
              </h3>
              <p className="text-[#94A3B8] font-semibold text-[11px] uppercase tracking-wide mb-1">
                EXAMENS (AUJOURD'HUI)
              </p>
              <p className="text-[#64748B] text-[11px]">vs 12 hier à la même heure</p>
            </div>
          </div>

          {/* Comptes-rendus en attente */}
          <div
            className="bg-white p-6 rounded-[24px] relative overflow-hidden cursor-pointer flex flex-col justify-between h-[220px] shadow-sm border border-[#E0E4E8]"
          >
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-[#2563EB] text-[32px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                pending_actions
              </span>
              <span className="bg-[#2563EB] text-white font-bold text-[10px] px-4 py-1.5 rounded-full uppercase tracking-wider">
                EN ATTENTE
              </span>
            </div>
            <div>
              <h3 className="text-[#0F172A] font-extrabold text-[48px] leading-none mb-1 font-headline">
                08
              </h3>
              <p className="text-[#64748B] font-semibold text-[11px] uppercase tracking-wider mb-4">
                COMPTES-RENDUS À VALIDER
              </p>
              <span className="text-[10px] font-semibold bg-[#FEE2E2] text-[#DC2626] px-3 py-1 rounded-lg">
                3 prioritaires
              </span>
            </div>
          </div>

          {/* Occupation Lits */}
          <div
            className="bg-white p-6 rounded-[24px] relative overflow-hidden cursor-pointer flex flex-col justify-between h-[220px] shadow-sm border border-[#E0E4E8]"
          >
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-[#0F766E] text-[32px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                hotel
              </span>
              <span className="bg-[#0F766E] text-white font-bold text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wider">
                SANTÉ
              </span>
            </div>
            <div>
              <h3 className="text-[#0F172A] font-extrabold text-[48px] leading-none mb-1 font-headline">
                92%
              </h3>
              <p className="text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
                OCCUPATION LITS
              </p>
              <p className="text-[#64748B] text-[11px] mt-2">11 sur 12 lits réservés</p>
            </div>
          </div>
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Center Column - Activité Récente */}
          <div className="lg:col-span-2 space-y-8">
            {/* Activité Récente */}
            <div className="bg-white border border-[#E0E4E8] rounded-[24px] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-[#E0E4E8] flex justify-between items-center">
                <h3 className="text-[20px] font-extrabold text-[#0F172A] font-headline">
                  Activité Récente
                </h3>
                <Link
                  href="/comptes-rendus"
                  className="text-[#2563EB] font-bold text-sm hover:underline flex items-center gap-1"
                >
                  Voir tout <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
              <div className="divide-y divide-[#E0E4E8]">
                {activityFeed.map((item) => (
                  <div
                    key={item.title}
                    className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {item.icon}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-[#0F172A]">
                          {item.title}
                        </div>
                        <div className="text-sm text-[#64748B]">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <span className="text-sm text-[#64748B]">
                        {item.time}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-bold uppercase bg-[#D1FAE5] text-[#059669] px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exam Volume Chart */}
            <div className="bg-white border border-[#E0E4E8] rounded-[24px] p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-[20px] font-extrabold text-[#0F172A] font-headline">
                    Volume d&apos;Examens
                  </h3>
                  <p className="text-sm text-[#64748B] mt-1">
                    Tendance hebdomadaire
                  </p>
                </div>
                <Link
                  href="/rapports"
                  className="shrink-0 flex items-center gap-1 text-[#2563EB] text-sm font-semibold hover:underline"
                >
                  Rapport
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
          <div className="space-y-8">
            {/* Calendar */}
            <div className="bg-white border border-[#E0E4E8] rounded-[24px] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#E0E4E8] flex items-center justify-between bg-[#2563EB] text-white">
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Octobre 2023
                </h3>
                <div className="flex gap-2">
                  <button
                    className="hover:bg-white/20 rounded-full p-2 transition-colors"
                    aria-label="Mois précédent"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_left
                    </span>
                  </button>
                  <button
                    className="hover:bg-white/20 rounded-full p-2 transition-colors"
                    aria-label="Mois suivant"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em] mb-4">
                  {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                    <span key={`${d}-${i}`} className={i >= 5 ? 'text-[#EF5350]' : ''}>
                      {d}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {calendarDays.map((cell, idx) => {
                    if (cell.muted) {
                      return (
                        <div
                          key={`${cell.day}-${idx}`}
                          className="aspect-square rounded-lg bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center"
                        >
                          {cell.day}
                        </div>
                      );
                    }
                    if (cell.day === 24) {
                      return (
                        <div
                          key={`${cell.day}-${idx}`}
                          className="aspect-square rounded-lg bg-[#2563EB] text-white font-bold flex items-center justify-center relative"
                        >
                          {cell.day}
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
                        </div>
                      );
                    }
                    if (cell.day === 25) {
                      return (
                        <div
                          key={`${cell.day}-${idx}`}
                          className="aspect-square rounded-lg border-2 border-[#2563EB]/30 bg-[#F1F5F9] font-semibold text-[#2563EB] flex items-center justify-center"
                        >
                          {cell.day}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={`${cell.day}-${idx}`}
                        className="aspect-square rounded-lg text-[#0F172A] flex items-center justify-center hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                      >
                        {cell.day}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-[#E0E4E8] rounded-[24px] p-6 shadow-sm">
              <h3 className="text-[20px] font-extrabold text-[#0F172A] font-headline mb-4">
                Accès Rapide
              </h3>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-[#E0E4E8] hover:bg-[#F8FAFC] hover:border-[#2563EB] transition-all group"
                  >
                    <div className="p-3 rounded-xl bg-[#DBEAFE] text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">
                        {action.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#0F172A] text-sm">
                        {action.label}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-[#94A3B8] group-hover:text-[#2563EB] transition-colors">
                      arrow_forward
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Prochain RDV */}
            <div className="bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] rounded-[24px] p-6 shadow-sm text-white overflow-hidden relative">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">
                  Prochain RDV
                </p>
                <h3 className="text-2xl font-extrabold font-headline mb-1">
                  14:30
                </h3>
                <p className="font-semibold text-base mb-3">
                  M. Jean Dupont
                </p>
                <p className="text-sm text-[#94A3B8]">
                  Salle B-04 · Polysomnographie
                </p>
                <Link
                  href="/polysomnographie"
                  className="mt-4 inline-flex items-center gap-2 bg-white text-[#2563EB] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#F1F5F9] transition-colors"
                >
                  Accéder
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
