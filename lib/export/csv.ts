// CSV per Excel in italiano: separatore ";", virgola per i decimali, date gg/mm/aaaa.
// Il BOM UTF-8 (per le lettere accentate) si aggiunge al momento dello scaricamento. Funzione pura (csv.test.ts).
import { numero, type ColonnaExport, type TabellaExport, type ValoreExport } from "./tabella";

const due = (n: number) => String(n).padStart(2, "0");

function numeroIt(n: number, decimali: { min: number; max: number }) {
  return n.toLocaleString("it-IT", { useGrouping: false, minimumFractionDigits: decimali.min, maximumFractionDigits: decimali.max });
}

export function testoCella(v: ValoreExport, c: ColonnaExport): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number" && !Number.isFinite(v)) return ""; // NaN e infiniti: cella vuota
  const tipo = c.tipo ?? "testo";
  if (tipo === "data" && typeof v === "string") {
    const [a, m, g] = v.slice(0, 10).split("-");
    return g && m && a ? `${g}/${m}/${a}` : v;
  }
  if (tipo === "dataora" && typeof v === "string") {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return `${due(d.getDate())}/${due(d.getMonth() + 1)}/${d.getFullYear()} ${due(d.getHours())}:${due(d.getMinutes())}`;
  }
  const n = numero(v);
  if (n !== null && tipo !== "testo") {
    if (tipo === "intero") return numeroIt(n, { min: 0, max: 0 });
    if (tipo === "percentuale") return numeroIt(n, { min: 0, max: 1 });
    if (tipo === "valuta") return numeroIt(n, { min: 2, max: 2 });
    return numeroIt(n, { min: 0, max: 2 });
  }
  return String(v);
}

function cella(s: string) {
  // Evita che Excel interpreti il contenuto come una formula
  if (/^[=@]/.test(s) || /^[+-][^\d\s]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function creaCsv(t: TabellaExport): string {
  const intestazione = t.colonne.map((c) => (c.tipo === "percentuale" ? `${c.titolo} (%)` : c.titolo));
  const righe = t.righe.map((r) => t.colonne.map((c, i) => testoCella(r[i], c)));
  return [intestazione, ...righe].map((r) => r.map(cella).join(";")).join("\r\n");
}
