"use client";

/**
 * Contenu complet d'une archive (compte rendu, consultation, examen PSG…),
 * tel qu'il a été scellé : tous les champs renseignés, lisibles, sans les
 * identifiants techniques. Sert à vérifier après coup ce qui a été fait.
 */

const TECHNIQUE = /(^id$|Id$|^chuId$|^serviceId|Hash$|^token|^password)/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

const libelle = (k: string) =>
  k
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());

const vide = (v: unknown): boolean =>
  v === null ||
  v === undefined ||
  v === "" ||
  (Array.isArray(v) && v.every(vide)) ||
  (typeof v === "object" && !Array.isArray(v) && Object.entries(v as object).every(([k, x]) => TECHNIQUE.test(k) || vide(x)));

function Valeur({ v }: { v: unknown }) {
  if (typeof v === "boolean") return <>{v ? "Oui" : "Non"}</>;
  if (typeof v === "string" && ISO.test(v))
    return <>{new Date(v).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</>;
  if (Array.isArray(v)) {
    const items = v.filter((x) => !vide(x));
    if (items.every((x) => typeof x !== "object")) return <>{items.map(String).join(", ")}</>;
    return (
      <ul className="mt-1 space-y-2">
        {items.map((x, i) => (
          <li key={i} className="rounded-lg border border-slate-100 bg-white p-2">
            <Champs donnees={x as Record<string, unknown>} />
          </li>
        ))}
      </ul>
    );
  }
  if (typeof v === "object" && v) return <div className="mt-1 border-l-2 border-slate-200 pl-3"><Champs donnees={v as Record<string, unknown>} /></div>;
  return <span className="whitespace-pre-wrap">{String(v)}</span>;
}

function Champs({ donnees }: { donnees: Record<string, unknown> }) {
  const entrees = Object.entries(donnees ?? {}).filter(([k, v]) => !TECHNIQUE.test(k) && !vide(v));
  if (!entrees.length) return <p className="text-xs italic text-slate-400">Aucun contenu.</p>;
  return (
    <dl className="space-y-1.5">
      {entrees.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">{libelle(k)}</dt>
          <dd className="text-sm text-[#0F172A]">
            <Valeur v={v} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function ContenuArchive({ donnees }: { donnees: Record<string, unknown> | null | undefined }) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] p-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Contenu du dossier</p>
      <Champs donnees={donnees ?? {}} />
    </div>
  );
}

/** Même contenu, en HTML simple pour l'impression (pas de JSON brut, pas d'identifiants). */
export function contenuEnHtml(donnees: unknown): string {
  const echapper = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const valeur = (v: unknown): string => {
    if (typeof v === "boolean") return v ? "Oui" : "Non";
    if (typeof v === "string" && ISO.test(v)) return new Date(v).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
    if (Array.isArray(v)) {
      const items = v.filter((x) => !vide(x));
      if (items.every((x) => typeof x !== "object")) return echapper(items.map(String).join(", "));
      return `<ul>${items.map((x) => `<li>${champs(x)}</li>`).join("")}</ul>`;
    }
    if (typeof v === "object" && v) return champs(v);
    return echapper(String(v)).replace(/\n/g, "<br />");
  };
  const champs = (d: unknown): string => {
    const entrees = Object.entries((d as Record<string, unknown>) ?? {}).filter(([k, v]) => !TECHNIQUE.test(k) && !vide(v));
    return `<dl>${entrees.map(([k, v]) => `<dt><b>${echapper(libelle(k))}</b></dt><dd>${valeur(v)}</dd>`).join("")}</dl>`;
  };
  return champs(donnees);
}
