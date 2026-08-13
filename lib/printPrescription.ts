export function openSummaryWindow(title: string, content: string) {
  const popup = window.open("", "_blank", "width=650,height=550");
  if (!popup) return;
  popup.document.write(`<html><head><title>${title}</title></head><body>${content}</body></html>`);
  popup.document.close();
  popup.print();
}
