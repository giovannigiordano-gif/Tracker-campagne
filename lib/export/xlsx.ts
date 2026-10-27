// File Excel (.xlsx) scritto a mano, senza librerie: un .xlsx è un archivio ZIP di file XML (formato Office Open
// XML, ECMA-376). Ogni tabella diventa un foglio con intestazione in grassetto, riga bloccata in alto, filtri e
// colonne larghe quanto basta; numeri, importi, percentuali e date restano veri numeri e date, utilizzabili nei
// calcoli di Excel. L'archivio non è compresso (metodo "stored"): Excel lo apre senza problemi.
// Funzione pura, testata in xlsx.test.ts.
import { numero, type ColonnaExport, type TabellaExport, type ValoreExport } from "./tabella";

// ---------------------------------------------------------------- XML
const VIETATI_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
const MASSIMO_TESTO = 32_767; // limite di Excel per una cella

export function xml(s: string) {
  return s
    .replace(VIETATI_XML, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// A, B, ... Z, AA, AB ...
export function lettereColonna(i: number) {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

// Nomi dei fogli: al massimo 31 caratteri, niente []:*?/\ , unici e mai vuoti
export function nomiFogli(nomi: string[]) {
  const usati = new Set<string>();
  return nomi.map((n, i) => {
    const base = (n.replace(/[[\]:*?/\\]/g, " ").replace(/^'+|'+$/g, "").replace(/\s+/g, " ").trim() || `Foglio ${i + 1}`).slice(0, 31);
    let nome = base;
    for (let k = 2; usati.has(nome.toLowerCase()); k++) nome = `${base.slice(0, 31 - ` (${k})`.length)} (${k})`;
    usati.add(nome.toLowerCase());
    return nome;
  });
}

// Stili (indici in styles.xml): 0 testo, 1 intestazione, 2 intero, 3 decimale/valuta, 4 data, 5 data e ora, 6 percentuale
const STILE: Record<NonNullable<ColonnaExport["tipo"]>, number> = { testo: 0, intero: 2, decimale: 3, valuta: 3, data: 4, dataora: 5, percentuale: 6 };

// Giorni dal 30/12/1899: è così che Excel rappresenta le date
const seriale = (anno: number, mese: number, giorno: number) => Date.UTC(anno, mese - 1, giorno) / 86_400_000 + 25_569;

function valoreNumerico(v: ValoreExport, c: ColonnaExport): number | null {
  const tipo = c.tipo ?? "testo";
  if (tipo === "data" && typeof v === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
    return m ? seriale(+m[1], +m[2], +m[3]) : null;
  }
  if (tipo === "dataora" && typeof v === "string") {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return null;
    // Ora del computer di chi scarica, come nella tabella dell'app
    return seriale(d.getFullYear(), d.getMonth() + 1, d.getDate()) + (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86_400;
  }
  if (tipo === "testo") return null;
  const n = numero(v);
  if (n === null) return null;
  return tipo === "percentuale" ? n / 100 : n;
}

function cella(rif: string, v: ValoreExport, c: ColonnaExport, stile?: number): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number" && !Number.isFinite(v)) return ""; // NaN e infiniti: cella vuota
  const n = valoreNumerico(v, c);
  if (n !== null) return `<c r="${rif}" s="${stile ?? STILE[c.tipo ?? "testo"]}"><v>${n}</v></c>`;
  const testo = String(v).slice(0, MASSIMO_TESTO);
  return `<c r="${rif}" t="inlineStr"${stile ? ` s="${stile}"` : ""}><is><t xml:space="preserve">${xml(testo)}</t></is></c>`;
}

// Larghezza delle colonne in caratteri, dal testo più lungo (tra 8 e 60)
function larghezze(t: TabellaExport) {
  return t.colonne.map((c, i) => {
    let max = c.titolo.length + 2;
    for (const r of t.righe.slice(0, 500)) {
      const v = r[i];
      const lungo = c.tipo === "data" ? 10 : c.tipo === "dataora" ? 16 : v === null || v === undefined ? 0 : String(v).length + 2;
      if (lungo > max) max = lungo;
    }
    return Math.min(Math.max(max, 8), 60);
  });
}

function foglio(t: TabellaExport): string {
  const ultima = lettereColonna(Math.max(t.colonne.length - 1, 0));
  const righe = [
    `<row r="1">${t.colonne.map((c, i) => cella(`${lettereColonna(i)}1`, c.titolo, { titolo: "", tipo: "testo" }, 1)).join("")}</row>`,
    ...t.righe.map((r, j) => `<row r="${j + 2}">${t.colonne.map((c, i) => cella(`${lettereColonna(i)}${j + 2}`, r[i], c)).join("")}</row>`),
  ];
  const colonne = larghezze(t)
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>` +
    (colonne ? `<cols>${colonne}</cols>` : "") +
    `<sheetData>${righe.join("")}</sheetData>` +
    (t.colonne.length ? `<autoFilter ref="A1:${ultima}${t.righe.length + 1}"/>` : "") +
    `</worksheet>`
  );
}

const STILI =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  `<numFmts count="3"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy hh:mm"/><numFmt numFmtId="166" formatCode="0.0%"/></numFmts>` +
  `<fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>` +
  `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
  `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="7">` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
  `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
  `<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `</cellXfs>` +
  `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
  `</styleSheet>`;

function parti(tabelle: TabellaExport[]): { nome: string; testo: string }[] {
  const nomi = nomiFogli(tabelle.map((t) => t.nome));
  const n = tabelle.length;
  // Area dei filtri di ogni foglio (Excel la registra anche come nome nascosto)
  const filtri = tabelle
    .map((t, i) =>
      t.colonne.length
        ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xml(nomi[i].replace(/'/g, "''"))}'!$A$1:$${lettereColonna(t.colonne.length - 1)}$${t.righe.length + 1}</definedName>`
        : ""
    )
    .join("");
  return [
    {
      nome: "[Content_Types].xml",
      testo:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        tabelle.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("") +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        `</Types>`,
    },
    {
      nome: "_rels/.rels",
      testo:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`,
    },
    {
      nome: "xl/workbook.xml",
      testo:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets>${nomi.map((nome, i) => `<sheet name="${xml(nome)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>` +
        (filtri ? `<definedNames>${filtri}</definedNames>` : "") +
        `</workbook>`,
    },
    {
      nome: "xl/_rels/workbook.xml.rels",
      testo:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        tabelle.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("") +
        `<Relationship Id="rId${n + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`,
    },
    { nome: "xl/styles.xml", testo: STILI },
    ...tabelle.map((t, i) => ({ nome: `xl/worksheets/sheet${i + 1}.xml`, testo: foglio(t) })),
  ];
}

// ---------------------------------------------------------------- ZIP (senza compressione)
const TABELLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(dati: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < dati.length; i++) c = TABELLA_CRC[(c ^ dati[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function creaZip(file: { nome: string; dati: Uint8Array }[], quando = new Date(2026, 0, 1)): Uint8Array {
  const ora = (quando.getHours() << 11) | (quando.getMinutes() << 5) | Math.floor(quando.getSeconds() / 2);
  const data = ((Math.max(quando.getFullYear(), 1980) - 1980) << 9) | ((quando.getMonth() + 1) << 5) | quando.getDate();
  const enc = new TextEncoder();
  const locali: Uint8Array[] = [];
  const centrali: Uint8Array[] = [];
  let posizione = 0;
  for (const f of file) {
    const nome = enc.encode(f.nome);
    const crc = crc32(f.dati);
    const intestazione = new Uint8Array(30 + nome.length);
    const l = new DataView(intestazione.buffer);
    l.setUint32(0, 0x04034b50, true);
    l.setUint16(4, 20, true); // versione minima
    l.setUint16(6, 0x0800, true); // nomi in UTF-8
    l.setUint16(8, 0, true); // nessuna compressione
    l.setUint16(10, ora, true);
    l.setUint16(12, data, true);
    l.setUint32(14, crc, true);
    l.setUint32(18, f.dati.length, true);
    l.setUint32(22, f.dati.length, true);
    l.setUint16(26, nome.length, true);
    l.setUint16(28, 0, true);
    intestazione.set(nome, 30);
    locali.push(intestazione, f.dati);

    const centrale = new Uint8Array(46 + nome.length);
    const c = new DataView(centrale.buffer);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true);
    c.setUint16(12, ora, true);
    c.setUint16(14, data, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, f.dati.length, true);
    c.setUint32(24, f.dati.length, true);
    c.setUint16(28, nome.length, true);
    c.setUint32(42, posizione, true);
    centrale.set(nome, 46);
    centrali.push(centrale);
    posizione += intestazione.length + f.dati.length;
  }
  const dimensioneCentrale = centrali.reduce((s, c) => s + c.length, 0);
  const fine = new Uint8Array(22);
  const e = new DataView(fine.buffer);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, file.length, true);
  e.setUint16(10, file.length, true);
  e.setUint32(12, dimensioneCentrale, true);
  e.setUint32(16, posizione, true);

  const tutto = new Uint8Array(posizione + dimensioneCentrale + fine.length);
  let p = 0;
  for (const pezzo of [...locali, ...centrali, fine]) {
    tutto.set(pezzo, p);
    p += pezzo.length;
  }
  return tutto;
}

export function creaXlsx(tabelle: TabellaExport[], quando?: Date): Uint8Array {
  const enc = new TextEncoder();
  const daScrivere = tabelle.length ? tabelle : [{ nome: "Dati", colonne: [], righe: [] }];
  return creaZip(parti(daScrivere).map((p) => ({ nome: p.nome, dati: enc.encode(p.testo) })), quando);
}
