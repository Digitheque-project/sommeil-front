"use client";

import { useMemo, useState } from "react";
import TopBar from "@/components/TopBar";

type RecordStatus = "Tous" | "Terminés" | "En attente";

const records = [
  { initials: "JD", initialsBg: "bg-[#DBEAFE]", initialsColor: "text-[#1D4ED8]", name: "Jean Dupont", id: "#SLEEP-2023-8941", exam: "Polysomnographie (Nuit)", examTag: "Diagnostic initial", examTagColor: "text-[#2563EB]", date: "12/10/2023", status: "Validé" },
  { initials: "ML", initialsBg: "bg-[#E0E7FF]", initialsColor: "text-[#4338CA]", name: "Marie Laurent", id: "#SLEEP-2023-9002", exam: "Actimétrie (7 jours)", examTag: "Suivi CPAP", examTagColor: "text-[#4F46E5]", date: "08/10/2023", status: "Archivé" },
  { initials: "PB", initialsBg: "bg-[#FEE2E2]", initialsColor: "text-[#DC2626]", name: "Pierre Bernard", id: "#SLEEP-2023-9115", exam: "Polygraphie ventilatoire", examTag: "Critique / SAOS", examTagColor: "text-[#DC2626]", date: "05/10/2023", status: "Signature requise", urgent: true },
  { initials: "SM", initialsBg: "bg-[#E2E8F0]", initialsColor: "text-[#475569]", name: "Sophie Martin", id: "#SLEEP-2023-8822", exam: "Test de latence (TILE)", examTag: "Évaluation diurne", examTagColor: "text-[#64748B]", date: "02/10/2023", status: "Validé" },
];

const parseRecordDate = (value: string) => {
  const [day, month, year] = value.split("/").map(Number);
  return new Date(year, month - 1, day);
};

const formatRecordDate = (value: string) =>
  parseRecordDate(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export default function ArchivesPage() {
  const [statusFilter, setStatusFilter] = useState<RecordStatus>("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [examFilter, setExamFilter] = useState("all");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<(typeof records)[number] | null>(null);
  const pageSize = 5;

  const filteredRecords = useMemo(() => records.filter((record) => {
    const query = searchQuery.trim().toLowerCase();
    if (query && ![record.name, record.id, record.exam, record.status].join(" ").toLowerCase().includes(query)) return false;
    if (statusFilter === "Terminés" && record.status !== "Validé") return false;
    if (statusFilter === "En attente" && record.status === "Validé") return false;
    if (examFilter !== "all" && record.exam !== examFilter) return false;
    if (urgentOnly && !record.urgent) return false;
    const date = parseRecordDate(record.date);
    if (dateFrom && date < new Date(`${dateFrom}T00:00:00`)) return false;
    if (dateTo && date > new Date(`${dateTo}T23:59:59`)) return false;
    return true;
  }), [dateFrom, dateTo, examFilter, searchQuery, statusFilter, urgentOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const visibleRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);
  const validatedCount = records.filter((record) => record.status === "Validé").length;
  const latestRecord = records.reduce((latest, record) => parseRecordDate(record.date) > parseRecordDate(latest.date) ? record : latest);

  const resetFilters = () => {
    setStatusFilter("Tous"); setSearchQuery(""); setDateFrom(""); setDateTo(""); setExamFilter("all"); setUrgentOnly(false); setPage(1);
  };
  const exportRecords = () => {
    const csv = ["Patient;ID;Examen;Date;Statut", ...filteredRecords.map((record) => [record.name, record.id, record.exam, record.date, record.status].join(";"))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "archives-sommeil.csv"; link.click(); URL.revokeObjectURL(url);
  };
  const setFilterPage = (callback: () => void) => { callback(); setPage(1); };

  return (
    <>
      <TopBar title="Archives" searchPlaceholder="Rechercher un dossier..." doctorName="Dr. Morel" doctorRole="Spécialiste Sommeil" />
      <div className="min-h-[calc(100vh-4rem)] max-w-[1400px] mx-auto space-y-8 bg-[#F8FAFC] p-6 md:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          <div className="space-y-1">
            <h1 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight leading-tight">Registre des Archives</h1>
            <p className="text-[#64748B] text-sm">Consultation et traçabilité des dossiers médicaux du centre du sommeil.</p>
          </div>
          <div className="bg-[#EBF5FF] border border-[#BFDBFE] p-4 rounded-xl flex items-start gap-3 max-w-md">
            <span className="material-symbols-outlined text-[#3B82F6] text-xl mt-0.5">info</span>
            <p className="text-xs text-[#1E40AF] font-medium leading-relaxed">Les dossiers archivés sont scellés et conservés conformément aux règles hospitalières et au RGPD médical.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748B]"><span className="material-symbols-outlined text-sm">calendar_month</span>PÉRIODE D&apos;EXAMEN</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2"><span className="text-[9px] font-bold text-[#94A3B8] w-4">DU</span><input type="date" value={dateFrom} onChange={(e) => setFilterPage(() => setDateFrom(e.target.value))} className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-lg py-1.5 px-2 text-[11px] outline-none focus:ring-1 focus:ring-[#2563EB]/20" /></label>
              <label className="flex items-center gap-2"><span className="text-[9px] font-bold text-[#94A3B8] w-4">AU</span><input type="date" value={dateTo} onChange={(e) => setFilterPage(() => setDateTo(e.target.value))} className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-lg py-1.5 px-2 text-[11px] outline-none focus:ring-1 focus:ring-[#2563EB]/20" /></label>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748B]"><span className="material-symbols-outlined text-sm">biotech</span>TYPE D&apos;EXAMEN</div>
            <div className="relative"><select value={examFilter} onChange={(e) => setFilterPage(() => setExamFilter(e.target.value))} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg py-2.5 px-3 text-xs font-semibold text-[#475569] appearance-none outline-none"><option value="all">Tous les examens</option>{Array.from(new Set(records.map((record) => record.exam))).map((exam) => <option key={exam} value={exam}>{exam}</option>)}</select><span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none text-sm">expand_more</span></div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748B]"><span className="material-symbols-outlined text-sm">verified</span>ÉTAT DU DOSSIER</div>
            <select value={statusFilter} onChange={(e) => setFilterPage(() => setStatusFilter(e.target.value as RecordStatus))} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg py-2.5 px-3 text-xs font-semibold text-[#475569] outline-none"><option>Tous</option><option>Terminés</option><option>En attente</option></select>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748B]"><span className="material-symbols-outlined text-sm">filter_alt</span>FILTRES RAPIDES</div>
            <label className="flex items-center justify-between gap-3 text-xs font-semibold text-[#475569]"><span>Urgences uniquement</span><input type="checkbox" checked={urgentOnly} onChange={(e) => setFilterPage(() => setUrgentOnly(e.target.checked))} className="accent-[#2563EB] h-4 w-4" /></label>
            <button type="button" onClick={resetFilters} className="text-[11px] font-bold text-[#2563EB] hover:underline">Réinitialiser les filtres</button>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 flex flex-col sm:flex-row justify-between items-center border-b border-slate-100 gap-4">
            <div><h2 className="text-[#0F172A] font-extrabold text-lg flex items-center gap-3">Résultats de la recherche <span className="bg-[#F1F5F9] text-[#64748B] text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200">{filteredRecords.length} Documents</span></h2><div className="relative mt-3 max-w-md"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-lg">search</span><input value={searchQuery} onChange={(e) => setFilterPage(() => setSearchQuery(e.target.value))} placeholder="Patient, identifiant ou examen..." className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-[#2563EB]/20" /></div></div>
            <button type="button" onClick={exportRecords} className="flex items-center gap-2 text-[#2563EB] text-xs font-extrabold uppercase tracking-widest hover:bg-[#F1F5F9] px-4 py-2 rounded-xl transition-all"><span className="material-symbols-outlined text-lg">download</span>EXPORTER LE REGISTRE (CSV)</button>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-[#F8FAFC]"><th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">PATIENT / IDENTIFIANT</th><th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">TYPE D&apos;EXAMEN</th><th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">DATE D&apos;EXAMEN</th><th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">STATUT</th><th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B] text-right">ACTIONS</th></tr></thead><tbody className="divide-y divide-slate-100">
            {visibleRecords.length ? visibleRecords.map((record) => <tr key={record.id} className="hover:bg-[#F1F5F9]/30 transition-colors group"><td className="px-8 py-5"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl ${record.initialsBg} flex items-center justify-center ${record.initialsColor} font-bold text-sm`}>{record.initials}</div><div><span className="text-sm font-bold text-[#1E293B] block leading-tight">{record.name}</span><span className="text-[11px] font-medium text-[#94A3B8]">{record.id}</span></div></div></td><td className="px-8 py-5"><span className="text-sm font-semibold text-[#475569] block">{record.exam}</span><span className={`text-[10px] uppercase font-bold ${record.examTagColor}`}>{record.examTag}</span></td><td className="px-8 py-5"><span className="text-sm font-medium text-[#64748B]">{formatRecordDate(record.date)}</span></td><td className="px-8 py-5"><div className="flex items-center gap-2"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#166534] text-[10px] font-extrabold uppercase tracking-widest border border-[#BBF7D0]"><span className="material-symbols-outlined text-[10px] filled">lock</span>SCELLÉ</span><span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#475569] text-[10px] font-extrabold uppercase tracking-widest border border-slate-200">IMMUABLE</span></div></td><td className="px-8 py-5 text-right"><div className="flex justify-end gap-3"><button type="button" onClick={() => setSelectedRecord(record)} title="Voir le détail" className="p-2 text-[#94A3B8] hover:text-[#2563EB] hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100"><span className="material-symbols-outlined text-xl">visibility</span></button><button type="button" onClick={() => window.print()} title="Imprimer" className="p-2 text-[#94A3B8] hover:text-[#2563EB] hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100"><span className="material-symbols-outlined text-xl">print</span></button><button type="button" onClick={exportRecords} title="Exporter en CSV" className="p-2 text-[#94A3B8] hover:text-[#2563EB] hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100"><span className="material-symbols-outlined text-xl">download</span></button></div></td></tr>) : <tr><td colSpan={5} className="px-8 py-12 text-center text-[#94A3B8] font-medium">Aucun document trouvé.</td></tr>}
          </tbody></table></div>
          <div className="px-8 py-5 bg-[#F8FAFC] flex justify-between items-center border-t border-slate-100"><span className="text-xs font-semibold text-[#64748B]">Affichage de {filteredRecords.length ? (page - 1) * pageSize + 1 : 0} à {Math.min(page * pageSize, filteredRecords.length)} sur {filteredRecords.length} documents</span><div className="flex gap-1.5"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-40"><span className="material-symbols-outlined text-base">chevron_left</span></button><button type="button" className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#2563EB] text-white font-extrabold text-xs shadow-md">{page}</button><button type="button" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-40"><span className="material-symbols-outlined text-base">chevron_right</span></button></div></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white p-7 rounded-[28px] relative overflow-hidden border border-slate-100 shadow-sm min-h-[160px]"><div className="absolute top-0 left-0 w-1.5 h-full bg-[#2563EB]" /><div className="flex justify-between items-start"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#64748B]">DOSSIERS ARCHIVÉS</p><span className="material-symbols-outlined text-[#2563EB] text-2xl">folder_copy</span></div><p className="text-3xl font-black text-[#0F172A] tracking-tight mt-8">{records.length.toLocaleString("fr-FR")}</p><p className="text-[11px] text-[#94A3B8] font-medium mt-1 uppercase tracking-wider">Historique des examens</p></div><div className="bg-white p-7 rounded-[28px] relative overflow-hidden border border-slate-100 shadow-sm min-h-[160px]"><div className="absolute top-0 left-0 w-1.5 h-full bg-[#10B981]" /><div className="flex justify-between items-start"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#64748B]">DOCUMENTS VALIDÉS</p><span className="material-symbols-outlined text-[#10B981] text-2xl filled">verified</span></div><p className="text-3xl font-black text-[#0F172A] tracking-tight mt-8">{Math.round((validatedCount / records.length) * 100)}%</p><p className="text-[11px] text-[#94A3B8] font-medium mt-1 uppercase tracking-wider">{validatedCount}/{records.length} dossiers validés</p></div><div className="bg-white p-7 rounded-[28px] relative overflow-hidden border border-slate-100 shadow-sm min-h-[160px]"><div className="absolute top-0 left-0 w-1.5 h-full bg-[#F59E0B]" /><div className="flex justify-between items-start"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#64748B]">DERNIER ARCHIVAGE</p><span className="material-symbols-outlined text-[#F59E0B] text-2xl">schedule</span></div><p className="text-xl font-black text-[#0F172A] tracking-tight mt-8">{formatRecordDate(latestRecord.date)}</p><p className="text-[11px] text-[#94A3B8] font-medium mt-1 uppercase tracking-wider">{latestRecord.name} ({latestRecord.id})</p></div></div>
      </div>
      {selectedRecord && <><div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-40" onClick={() => setSelectedRecord(null)} /><div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div role="dialog" aria-modal="true" aria-label="Détail de l'archive" className="w-full max-w-xl bg-white rounded-[24px] shadow-2xl overflow-hidden"><div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-[#F8FAFC]"><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-2xl ${selectedRecord.initialsBg} flex items-center justify-center ${selectedRecord.initialsColor} font-bold`}>{selectedRecord.initials}</div><div><h3 className="text-lg font-extrabold text-[#0F172A]">{selectedRecord.name}</h3><p className="text-sm text-[#64748B] font-semibold">{selectedRecord.id}</p></div></div><button type="button" onClick={() => setSelectedRecord(null)} className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-white rounded-lg"><span className="material-symbols-outlined">close</span></button></div><div className="p-8 grid grid-cols-2 gap-4"><div className="bg-[#F8FAFC] rounded-xl p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Examen</p><p className="text-sm font-bold text-[#0F172A] mt-1">{selectedRecord.exam}</p></div><div className="bg-[#F8FAFC] rounded-xl p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Date d&apos;examen</p><p className="text-sm font-bold text-[#0F172A] mt-1">{formatRecordDate(selectedRecord.date)}</p></div><div className="bg-[#F8FAFC] rounded-xl p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Catégorie</p><p className="text-sm font-bold text-[#0F172A] mt-1">{selectedRecord.examTag}</p></div><div className="bg-[#F8FAFC] rounded-xl p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Statut</p><p className="text-sm font-bold text-[#0F172A] mt-1">{selectedRecord.status}</p></div></div><div className="px-8 py-5 border-t border-slate-100 bg-[#F8FAFC] flex justify-end gap-3"><button type="button" onClick={() => setSelectedRecord(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#64748B] hover:bg-white">Fermer</button><button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1E3A8A]"><span className="material-symbols-outlined text-lg">print</span>Imprimer</button></div></div></div></>}
    </>
  );
}
