"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import ActionButton from "@/components/ActionButton";
import { useArchives, useDeleteArchive, useRestoreArchive } from "@/hooks/use-archives";
import { archiveApi, type Archive } from "@/lib/api/archives";
import { useAuth } from "@/context/AuthContext";
import { downloadCsv, printDocument } from "@/lib/download";

type RecordStatus = "Tous" | "Actifs" | "Restaurés";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const initialsOf = (titre: string) =>
  titre
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "??";

const CSV_COLUMNS = [
  { key: "titre", label: "Dossier" },
  { key: "type", label: "Type" },
  { key: "referenceId", label: "Référence" },
  { key: "archivedAt", label: "Archivé le" },
  { key: "archivedBy", label: "Archivé par" },
  { key: "statut", label: "Statut" },
];

export default function ArchivesPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<RecordStatus>("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<Archive | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const pageSize = 8;

  // `includeRestored` : le registre montre l'historique complet, le filtre
  // « Actifs / Restaurés » se fait ensuite côté interface.
  const { data: archives = [], isLoading } = useArchives({ includeRestored: true });
  const restoreMutation = useRestoreArchive();
  const deleteMutation = useDeleteArchive();

  const actor = user ? `${user.firstName} ${user.lastName}`.trim() : undefined;

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const types = useMemo(
    () => [...new Set((archives as Archive[]).map((archive) => archive.type))],
    [archives]
  );

  const filteredRecords = useMemo(
    () =>
      (archives as Archive[]).filter((archive) => {
        const query = searchQuery.trim().toLowerCase();
        if (
          query &&
          ![archive.titre, archive.referenceId, archive.type, archive.description ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
          return false;
        if (statusFilter === "Actifs" && archive.restored) return false;
        if (statusFilter === "Restaurés" && !archive.restored) return false;
        if (typeFilter !== "all" && archive.type !== typeFilter) return false;

        const date = new Date(archive.archivedAt);
        if (dateFrom && date < new Date(`${dateFrom}T00:00:00`)) return false;
        if (dateTo && date > new Date(`${dateTo}T23:59:59`)) return false;
        return true;
      }),
    [archives, dateFrom, dateTo, searchQuery, statusFilter, typeFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const visibleRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);
  const restoredCount = (archives as Archive[]).filter((archive) => archive.restored).length;
  const latestRecord = (archives as Archive[]).reduce<Archive | null>(
    (latest, archive) =>
      !latest || new Date(archive.archivedAt) > new Date(latest.archivedAt) ? archive : latest,
    null
  );

  const resetFilters = () => {
    setStatusFilter("Tous");
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setTypeFilter("all");
    setPage(1);
  };

  const setFilterPage = (callback: () => void) => {
    callback();
    setPage(1);
  };

  /** `archive:export` — registre complet au format CSV. */
  const exportRegister = () => {
    downloadCsv(
      filteredRecords.map((archive) => ({
        ...archive,
        archivedAt: formatDate(archive.archivedAt),
        statut: archive.restored ? "Restauré" : "Scellé",
      })),
      CSV_COLUMNS,
      "archives-sommeil.csv"
    );
    setToast(`${filteredRecords.length} dossier(s) exporté(s).`);
  };

  /** `archive:export` — export d'un dossier isolé. */
  const exportOne = async (archive: Archive) => {
    try {
      const data = await archiveApi.export(archive.id);
      printDocument(
        data.titre,
        `<h1>${data.titre}</h1>
         <p class="meta">
           Type : ${data.type} · Référence : ${data.referenceId}<br />
           Archivé le ${formatDateTime(data.archivedAt)}${data.archivedBy ? ` par ${data.archivedBy}` : ""}<br />
           ${data.restored ? `Restauré le ${formatDateTime(data.restoredAt)}` : "Dossier scellé"}<br />
           Édité le ${formatDateTime(data.genereLe)}
         </p>
         ${data.description ? `<p>${data.description}</p>` : ""}
         <div class="content">${JSON.stringify(data.donnees, null, 2).replaceAll("<", "&lt;")}</div>`
      );
    } catch (error) {
      setToast(error instanceof Error ? error.message : "L'export a échoué.");
    }
  };

  /** `archive:restore` — réactive le dossier sans le détruire. */
  const restore = async (archive: Archive) => {
    if (!window.confirm(`Restaurer le dossier « ${archive.titre} » ?`)) return;
    try {
      await restoreMutation.mutateAsync({ id: archive.id, restoredBy: actor });
      setToast("Dossier restauré.");
      setSelectedRecord(null);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "La restauration a échoué.");
    }
  };

  /** `archive:delete` — suppression définitive. */
  const remove = async (archive: Archive) => {
    if (!window.confirm(`Supprimer DÉFINITIVEMENT le dossier « ${archive.titre} » ? Cette action est irréversible.`))
      return;
    try {
      await deleteMutation.mutateAsync(archive.id);
      setToast("Dossier supprimé définitivement.");
      setSelectedRecord(null);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "La suppression a échoué.");
    }
  };

  return (
    <>
      <TopBar title="Archives" searchPlaceholder="Rechercher un dossier..." />
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
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748B]"><span className="material-symbols-outlined text-sm">calendar_month</span>PÉRIODE D&apos;ARCHIVAGE</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2"><span className="text-[9px] font-bold text-[#94A3B8] w-4">DU</span><input type="date" value={dateFrom} onChange={(e) => setFilterPage(() => setDateFrom(e.target.value))} className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-lg py-1.5 px-2 text-[11px] outline-none focus:ring-1 focus:ring-[#2563EB]/20" /></label>
              <label className="flex items-center gap-2"><span className="text-[9px] font-bold text-[#94A3B8] w-4">AU</span><input type="date" value={dateTo} onChange={(e) => setFilterPage(() => setDateTo(e.target.value))} className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-lg py-1.5 px-2 text-[11px] outline-none focus:ring-1 focus:ring-[#2563EB]/20" /></label>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748B]"><span className="material-symbols-outlined text-sm">biotech</span>TYPE DE DOSSIER</div>
            <div className="relative"><select value={typeFilter} onChange={(e) => setFilterPage(() => setTypeFilter(e.target.value))} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg py-2.5 px-3 text-xs font-semibold text-[#475569] appearance-none outline-none"><option value="all">Tous les types</option>{types.map((type) => <option key={type} value={type}>{type}</option>)}</select><span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none text-sm">expand_more</span></div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748B]"><span className="material-symbols-outlined text-sm">verified</span>ÉTAT DU DOSSIER</div>
            <select value={statusFilter} onChange={(e) => setFilterPage(() => setStatusFilter(e.target.value as RecordStatus))} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg py-2.5 px-3 text-xs font-semibold text-[#475569] outline-none"><option>Tous</option><option>Actifs</option><option>Restaurés</option></select>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748B]"><span className="material-symbols-outlined text-sm">filter_alt</span>FILTRES RAPIDES</div>
            <p className="text-xs font-semibold text-[#475569]">{filteredRecords.length} dossier(s) affiché(s)</p>
            <button type="button" onClick={resetFilters} className="text-[11px] font-bold text-[#2563EB] hover:underline">Réinitialiser les filtres</button>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 flex flex-col sm:flex-row justify-between items-center border-b border-slate-100 gap-4">
            <div>
              <h2 className="text-[#0F172A] font-extrabold text-lg flex items-center gap-3">Résultats de la recherche <span className="bg-[#F1F5F9] text-[#64748B] text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200">{filteredRecords.length} Documents</span></h2>
              <div className="relative mt-3 max-w-md"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-lg">search</span><input value={searchQuery} onChange={(e) => setFilterPage(() => setSearchQuery(e.target.value))} placeholder="Dossier, référence ou type..." className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-[#2563EB]/20" /></div>
            </div>
            <ActionButton permission="archive:export" onClick={exportRegister} disabled={filteredRecords.length === 0} className="flex items-center gap-2 text-[#2563EB] text-xs font-extrabold uppercase tracking-widest hover:bg-[#F1F5F9] px-4 py-2 rounded-xl transition-all">
              <span className="material-symbols-outlined text-lg">download</span>EXPORTER LE REGISTRE (CSV)
            </ActionButton>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8FAFC]">
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">DOSSIER / RÉFÉRENCE</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">TYPE</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">DATE D&apos;ARCHIVAGE</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">STATUT</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B] text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && (
                  <tr><td colSpan={5} className="px-8 py-12 text-center text-[#94A3B8] font-medium">Chargement du registre…</td></tr>
                )}
                {!isLoading && visibleRecords.length === 0 && (
                  <tr><td colSpan={5} className="px-8 py-12 text-center text-[#94A3B8] font-medium">Aucun document trouvé.</td></tr>
                )}
                {!isLoading && visibleRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-[#F1F5F9]/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] flex items-center justify-center text-[#1D4ED8] font-bold text-sm">{initialsOf(record.titre)}</div>
                        <div>
                          <span className="text-sm font-bold text-[#1E293B] block leading-tight">{record.titre}</span>
                          <span className="text-[11px] font-medium text-[#94A3B8]">{record.referenceId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5"><span className="text-sm font-semibold text-[#475569] block">{record.type}</span>{record.description && <span className="text-[10px] uppercase font-bold text-[#64748B]">{record.description}</span>}</td>
                    <td className="px-8 py-5"><span className="text-sm font-medium text-[#64748B]">{formatDate(record.archivedAt)}</span></td>
                    <td className="px-8 py-5">
                      {record.restored ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] text-[10px] font-extrabold uppercase tracking-widest border border-[#FDE68A]"><span className="material-symbols-outlined text-[10px]">restore</span>RESTAURÉ</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#166534] text-[10px] font-extrabold uppercase tracking-widest border border-[#BBF7D0]"><span className="material-symbols-outlined text-[10px]">lock</span>SCELLÉ</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <ActionButton permission="archive:read" onClick={() => setSelectedRecord(record)} title="Voir le détail" className="p-2 text-[#94A3B8] hover:text-[#2563EB] hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100"><span className="material-symbols-outlined text-xl">visibility</span></ActionButton>
                        <ActionButton permission="archive:export" onClick={() => exportOne(record)} title="Exporter / imprimer" className="p-2 text-[#94A3B8] hover:text-[#2563EB] hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100"><span className="material-symbols-outlined text-xl">print</span></ActionButton>
                        <ActionButton permission="archive:restore" onClick={() => restore(record)} disabled={record.restored} pending={restoreMutation.isPending} title="Restaurer le dossier" className="p-2 text-[#94A3B8] hover:text-[#15803D] hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100"><span className="material-symbols-outlined text-xl">restore</span></ActionButton>
                        <ActionButton permission="archive:delete" hideWhenDenied onClick={() => remove(record)} pending={deleteMutation.isPending} title="Supprimer définitivement" className="p-2 text-[#94A3B8] hover:text-[#DC2626] hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100"><span className="material-symbols-outlined text-xl">delete_forever</span></ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-5 bg-[#F8FAFC] flex justify-between items-center border-t border-slate-100">
            <span className="text-xs font-semibold text-[#64748B]">Affichage de {filteredRecords.length ? (page - 1) * pageSize + 1 : 0} à {Math.min(page * pageSize, filteredRecords.length)} sur {filteredRecords.length} documents</span>
            <div className="flex gap-1.5">
              <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-40"><span className="material-symbols-outlined text-base">chevron_left</span></button>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#2563EB] text-white font-extrabold text-xs shadow-md">{page}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-40"><span className="material-symbols-outlined text-base">chevron_right</span></button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-[28px] relative overflow-hidden border border-slate-100 shadow-sm min-h-[160px]"><div className="absolute top-0 left-0 w-1.5 h-full bg-[#2563EB]" /><div className="flex justify-between items-start"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#64748B]">DOSSIERS ARCHIVÉS</p><span className="material-symbols-outlined text-[#2563EB] text-2xl">folder_copy</span></div><p className="text-3xl font-black text-[#0F172A] tracking-tight mt-8">{archives.length.toLocaleString("fr-FR")}</p><p className="text-[11px] text-[#94A3B8] font-medium mt-1 uppercase tracking-wider">Historique complet</p></div>
          <div className="bg-white p-7 rounded-[28px] relative overflow-hidden border border-slate-100 shadow-sm min-h-[160px]"><div className="absolute top-0 left-0 w-1.5 h-full bg-[#10B981]" /><div className="flex justify-between items-start"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#64748B]">DOSSIERS SCELLÉS</p><span className="material-symbols-outlined text-[#10B981] text-2xl">verified</span></div><p className="text-3xl font-black text-[#0F172A] tracking-tight mt-8">{archives.length ? Math.round(((archives.length - restoredCount) / archives.length) * 100) : 0}%</p><p className="text-[11px] text-[#94A3B8] font-medium mt-1 uppercase tracking-wider">{archives.length - restoredCount}/{archives.length} dossiers scellés</p></div>
          <div className="bg-white p-7 rounded-[28px] relative overflow-hidden border border-slate-100 shadow-sm min-h-[160px]"><div className="absolute top-0 left-0 w-1.5 h-full bg-[#F59E0B]" /><div className="flex justify-between items-start"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#64748B]">DERNIER ARCHIVAGE</p><span className="material-symbols-outlined text-[#F59E0B] text-2xl">schedule</span></div><p className="text-xl font-black text-[#0F172A] tracking-tight mt-8">{latestRecord ? formatDate(latestRecord.archivedAt) : "—"}</p><p className="text-[11px] text-[#94A3B8] font-medium mt-1 uppercase tracking-wider">{latestRecord ? `${latestRecord.titre} (${latestRecord.referenceId})` : "Aucun dossier"}</p></div>
        </div>
      </div>

      {selectedRecord && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-40" onClick={() => setSelectedRecord(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div role="dialog" aria-modal="true" aria-label="Détail de l'archive" className="w-full max-w-xl bg-white rounded-[24px] shadow-2xl overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-[#F8FAFC]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#DBEAFE] flex items-center justify-center text-[#1D4ED8] font-bold">{initialsOf(selectedRecord.titre)}</div>
                  <div><h3 className="text-lg font-extrabold text-[#0F172A]">{selectedRecord.titre}</h3><p className="text-sm text-[#64748B] font-semibold">{selectedRecord.referenceId}</p></div>
                </div>
                <button type="button" onClick={() => setSelectedRecord(null)} className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-white rounded-lg"><span className="material-symbols-outlined">close</span></button>
              </div>
              <div className="p-8 grid grid-cols-2 gap-4">
                <div className="bg-[#F8FAFC] rounded-xl p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Type</p><p className="text-sm font-bold text-[#0F172A] mt-1">{selectedRecord.type}</p></div>
                <div className="bg-[#F8FAFC] rounded-xl p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Archivé le</p><p className="text-sm font-bold text-[#0F172A] mt-1">{formatDateTime(selectedRecord.archivedAt)}</p></div>
                <div className="bg-[#F8FAFC] rounded-xl p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Archivé par</p><p className="text-sm font-bold text-[#0F172A] mt-1">{selectedRecord.archivedBy ?? "—"}</p></div>
                <div className="bg-[#F8FAFC] rounded-xl p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Statut</p><p className="text-sm font-bold text-[#0F172A] mt-1">{selectedRecord.restored ? `Restauré le ${formatDateTime(selectedRecord.restoredAt)}` : "Scellé"}</p></div>
                {selectedRecord.description && <div className="bg-[#F8FAFC] rounded-xl p-4 col-span-2"><p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Description</p><p className="text-sm font-medium text-[#0F172A] mt-1">{selectedRecord.description}</p></div>}
              </div>
              <div className="px-8 py-5 border-t border-slate-100 bg-[#F8FAFC] flex justify-end gap-3">
                <button type="button" onClick={() => setSelectedRecord(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#64748B] hover:bg-white">Fermer</button>
                <ActionButton permission="archive:restore" onClick={() => restore(selectedRecord)} disabled={selectedRecord.restored} pending={restoreMutation.isPending} className="flex items-center gap-2 px-5 py-2.5 rounded-xl action-warning text-sm font-bold"><span className="material-symbols-outlined text-lg">restore</span>Restaurer</ActionButton>
                <ActionButton permission="archive:export" onClick={() => exportOne(selectedRecord)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl action-primary text-sm font-bold"><span className="material-symbols-outlined text-lg">print</span>Imprimer</ActionButton>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl">{toast}</div>
      )}
    </>
  );
}
