"use client";

/**
 * Archive du Centre de sommeil (28/11/2026) : chaque prescription terminée
 * avec ses détails — prescrite le, débutée le, terminée le, durée et
 * résultat (compte rendu). Lecture seule, imprimable.
 */
import { useEffect, useMemo, useState } from "react";
import { psgApi, type PsgExam } from "@/lib/api/psg";
import { compteRenduApi, type CompteRendu } from "@/lib/api/comptes-rendus";
import { printDocument } from "@/lib/download";

const dateHeure = (v?: string | null) =>
  v
    ? new Date(v).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

function duree(debut?: string | null, fin?: string | null): string {
  if (!debut || !fin) return "—";
  const min = Math.round((new Date(fin).getTime() - new Date(debut).getTime()) / 60000);
  if (!Number.isFinite(min) || min < 0) return "—";
  const h = Math.floor(min / 60);
  return h ? `${h} h ${String(min % 60).padStart(2, "0")}` : `${min} min`;
}

const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Ligne = { examen: PsgExam; cr: CompteRendu | null };

export default function ExamensTermines() {
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [detail, setDetail] = useState<Ligne | null>(null);

  useEffect(() => {
    Promise.all([psgApi.list("TERMINE"), compteRenduApi.list().catch(() => [] as CompteRendu[])])
      .then(([examens, crs]) => {
        const parPsg = new Map<string, CompteRendu>();
        // Le compte rendu validé l'emporte sur un brouillon.
        for (const cr of crs) {
          if (!cr.psgId) continue;
          const deja = parPsg.get(cr.psgId);
          if (!deja || (deja.statut !== "VALIDE" && cr.statut === "VALIDE")) parPsg.set(cr.psgId, cr);
        }
        setLignes(
          examens
            .map((examen) => ({ examen, cr: parPsg.get(examen.id) ?? null }))
            .sort((a, b) => new Date(b.examen.termineLe ?? b.examen.updatedAt).getTime() - new Date(a.examen.termineLe ?? a.examen.updatedAt).getTime()),
        );
      })
      .catch((e) => setErreur(e instanceof Error ? e.message : "Archive indisponible pour le moment."));
  }, []);

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return (lignes ?? []).filter(({ examen }) =>
      !q || `${examen.patientNom} ${examen.patientPrenom} ${examen.motif}`.toLowerCase().includes(q),
    );
  }, [lignes, recherche]);

  const imprimer = ({ examen, cr }: Ligne) => {
    const patient = `${examen.patientNom ?? ""} ${examen.patientPrenom ?? ""}`.trim();
    printDocument(
      `Polysomnographie — ${patient}`,
      `<h1>Polysomnographie</h1>
       <table style="border-collapse:collapse;width:100%;font-size:13px">
         ${[
           ["Patient", patient],
           ["Motif", examen.motif || "—"],
           ["Prescrite le", dateHeure(examen.createdAt)],
           ["Débutée le", dateHeure(examen.demarreLe)],
           ["Terminée le", dateHeure(examen.termineLe)],
           ["Durée", duree(examen.demarreLe, examen.termineLe)],
           ["Salle", examen.salle || "—"],
         ]
           .map(([k, v]) => `<tr><td style="border:1px solid #cbd5e1;padding:6px;width:160px;background:#f1f5f9;font-weight:bold">${k}</td><td style="border:1px solid #cbd5e1;padding:6px">${echapper(v)}</td></tr>`)
           .join("")}
       </table>
       <h2 style="font-size:15px;margin-top:18px">Résultat</h2>
       ${
         cr
           ? `<div style="white-space:pre-line">${echapper(cr.contenu || "")}</div>
              ${cr.conclusion ? `<p><strong>Conclusion :</strong> ${echapper(cr.conclusion)}</p>` : ""}
              <p style="font-size:12px;color:#64748b">${cr.statut === "VALIDE" ? `Validé le ${dateHeure(cr.valideLe)}${cr.validePar ? ` par ${echapper(cr.validePar)}` : ""}` : "Compte rendu non encore validé"}</p>`
           : "<p>Compte rendu non encore rédigé.</p>"
       }`,
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100">
        <div>
          <h2 className="text-[#0F172A] font-extrabold text-lg flex items-center gap-3">
            Examens terminés
            <span className="bg-[#F1F5F9] text-[#64748B] text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200">{lignes?.length ?? 0}</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-1">Chaque prescription : début, fin et résultat.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-lg">search</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Patient ou motif..." className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-[#006A8C]/20" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#F8FAFC]">
              {["Patient", "Prescrite le", "Débutée le", "Terminée le", "Durée", "Résultat", ""].map((t) => (
                <th key={t} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {erreur ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-[#B91C1C]">{erreur}</td></tr>
            ) : lignes === null ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-[#94A3B8]">Chargement…</td></tr>
            ) : visibles.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-[#94A3B8]">Aucun examen terminé.</td></tr>
            ) : (
              visibles.map((l) => (
                <tr key={l.examen.id} className="hover:bg-[#F1F5F9]/40 cursor-pointer" onClick={() => setDetail(l)}>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[#1E293B] block">{`${l.examen.patientNom ?? ""} ${l.examen.patientPrenom ?? ""}`.trim() || "Patient"}</span>
                    <span className="text-[11px] text-[#94A3B8]">{l.examen.motif || "Polysomnographie"}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#475569]">{dateHeure(l.examen.createdAt)}</td>
                  <td className="px-6 py-4 text-sm text-[#475569]">{dateHeure(l.examen.demarreLe)}</td>
                  <td className="px-6 py-4 text-sm text-[#475569]">{dateHeure(l.examen.termineLe)}</td>
                  <td className="px-6 py-4 text-sm text-[#475569]">{duree(l.examen.demarreLe, l.examen.termineLe)}</td>
                  <td className="px-6 py-4 text-sm text-[#475569] max-w-[260px]">
                    {l.cr ? (
                      <>
                        <span className="block truncate">{l.cr.conclusion || l.cr.titre}</span>
                        <span className={`text-[10px] font-bold uppercase ${l.cr.statut === "VALIDE" ? "text-[#166534]" : "text-[#92400E]"}`}>{l.cr.statut === "VALIDE" ? "Validé" : "Brouillon"}</span>
                      </>
                    ) : (
                      <span className="text-[#94A3B8]">Compte rendu à rédiger</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button type="button" title="Imprimer" onClick={(e) => { e.stopPropagation(); imprimer(l); }} className="p-2 text-[#94A3B8] hover:text-[#006A8C] rounded-xl">
                      <span className="material-symbols-outlined text-xl">print</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={(e) => e.target === e.currentTarget && setDetail(null)}>
          <div role="dialog" aria-modal="true" className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="px-8 py-5 border-b border-slate-100 bg-[#F8FAFC] flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#0F172A]">{`${detail.examen.patientNom ?? ""} ${detail.examen.patientPrenom ?? ""}`.trim()}</h3>
                <p className="text-sm text-[#64748B]">Polysomnographie — {detail.examen.motif || "sans motif"}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="p-2 text-[#94A3B8] hover:text-[#0F172A]"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  ["Prescrite le", dateHeure(detail.examen.createdAt)],
                  ["Débutée le", dateHeure(detail.examen.demarreLe)],
                  ["Terminée le", dateHeure(detail.examen.termineLe)],
                  ["Durée", duree(detail.examen.demarreLe, detail.examen.termineLe)],
                  ["Salle", detail.examen.salle || "—"],
                  ["Urgence", detail.examen.urgence ? "Urgent" : "Normal"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[#F8FAFC] rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">{k}</p>
                    <p className="text-sm font-bold text-[#0F172A] mt-1">{v}</p>
                  </div>
                ))}
              </div>
              <section>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#006A8C] mb-2">Résultat</h4>
                {detail.cr ? (
                  <div className="rounded-xl border border-slate-100 p-4 space-y-2">
                    <p className="text-sm font-bold text-[#0F172A]">{detail.cr.titre}</p>
                    <p className="text-sm text-[#334155] whitespace-pre-line">{detail.cr.contenu}</p>
                    {detail.cr.conclusion && <p className="text-sm text-[#334155]"><span className="font-semibold">Conclusion : </span>{detail.cr.conclusion}</p>}
                    <p className="text-xs text-[#64748B]">{detail.cr.statut === "VALIDE" ? `Validé le ${dateHeure(detail.cr.valideLe)}${detail.cr.validePar ? ` par ${detail.cr.validePar}` : ""}` : "Compte rendu non encore validé"}</p>
                  </div>
                ) : (
                  <p className="text-sm text-[#94A3B8]">Compte rendu non encore rédigé.</p>
                )}
              </section>
            </div>
            <div className="px-8 py-4 border-t border-slate-100 bg-[#F8FAFC] flex justify-end gap-3">
              <button type="button" onClick={() => setDetail(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#64748B] hover:bg-white">Fermer</button>
              <button type="button" onClick={() => imprimer(detail)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl action-primary text-sm font-bold"><span className="material-symbols-outlined text-lg">print</span>Imprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
