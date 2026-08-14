/** Déclenche le téléchargement d'un contenu généré côté navigateur. */
export function downloadBlob(content: BlobPart, filename: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadJson(data: unknown, filename: string) {
  downloadBlob(JSON.stringify(data, null, 2), filename, "application/json;charset=utf-8");
}

/** Échappe une valeur pour un CSV séparé par des points-virgules (Excel FR). */
function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[";\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function downloadCsv(
  rows: Array<Record<string, unknown>>,
  columns: Array<{ key: string; label: string }>,
  filename: string
) {
  const header = columns.map((column) => csvCell(column.label)).join(";");
  const body = rows.map((row) => columns.map((column) => csvCell(row[column.key])).join(";"));
  // BOM UTF-8 : sans lui Excel casse les accents.
  downloadBlob(`﻿${[header, ...body].join("\n")}`, filename, "text/csv;charset=utf-8");
}

/**
 * Ouvre l'aperçu avant impression d'un document autonome.
 * Utilisé pour les exports PDF : c'est le moteur d'impression du navigateur
 * qui produit le fichier, sans dépendance supplémentaire.
 */
export function printDocument(title: string, bodyHtml: string) {
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    throw new Error("L'aperçu avant impression n'a pas pu être ouvert.");
  }

  doc.open();
  doc.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8" /><title>${title}</title>
<style>
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #0f172a; margin: 32px; line-height: 1.55; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #64748b; font-size: 12px; margin-bottom: 24px; }
  .content { white-space: pre-wrap; font-size: 13px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
  th { background: #f1f5f9; }
</style></head><body>${bodyHtml}</body></html>`);
  doc.close();

  const cleanUp = () => window.setTimeout(() => frame.remove(), 1000);
  frame.contentWindow?.addEventListener("afterprint", cleanUp);
  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  // Filet de sécurité si `afterprint` n'est pas émis (Safari).
  window.setTimeout(cleanUp, 60_000);
}
