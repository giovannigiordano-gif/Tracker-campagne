// Test del file Excel scritto a mano: archivio ZIP valido (CRC giusti), fogli, formati di numeri e date, testi protetti
import assert from "node:assert/strict";
import { test } from "node:test";
import { crc32, creaXlsx, lettereColonna, nomiFogli, xml } from "./xlsx";
import type { TabellaExport } from "./tabella";

// Legge un archivio ZIP "stored" dalla directory centrale e controlla i CRC
function leggiZip(zip: Uint8Array): Map<string, string> {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const fine = zip.length - 22;
  assert.equal(v.getUint32(fine, true), 0x06054b50, "manca la fine dell'archivio");
  const n = v.getUint16(fine + 10, true);
  let p = v.getUint32(fine + 16, true);
  const dec = new TextDecoder();
  const file = new Map<string, string>();
  for (let i = 0; i < n; i++) {
    assert.equal(v.getUint32(p, true), 0x02014b50);
    const crc = v.getUint32(p + 16, true);
    const dimensione = v.getUint32(p + 20, true);
    const lunghezzaNome = v.getUint16(p + 28, true);
    const locale = v.getUint32(p + 42, true);
    const nome = dec.decode(zip.subarray(p + 46, p + 46 + lunghezzaNome));
    assert.equal(v.getUint32(locale, true), 0x04034b50);
    const inizio = locale + 30 + v.getUint16(locale + 26, true) + v.getUint16(locale + 28, true);
    const dati = zip.subarray(inizio, inizio + dimensione);
    assert.equal(crc32(dati), crc, `CRC sbagliato per ${nome}`);
    file.set(nome, dec.decode(dati));
    p += 46 + lunghezzaNome + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
  }
  return file;
}

const tabella: TabellaExport = {
  nome: "Campagne: Meta/LinkedIn [prova]",
  colonne: [
    { titolo: "Campagna" },
    { titolo: "Giorno", tipo: "data" },
    { titolo: "Lead", tipo: "intero" },
    { titolo: "Spesa (EUR)", tipo: "valuta" },
    { titolo: "Chiusura", tipo: "percentuale" },
  ],
  righe: [
    ["Fiera <Milano> & \"Roma\"", "2026-10-01", 12, 1234.5, 23.5],
    ["=SOMMA(A1)", "2026-10-02", null, Number.NaN, null],
  ],
};

test("CRC32 come da specifica ZIP", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
});

test("lettere delle colonne e nomi dei fogli validi per Excel", () => {
  assert.deepEqual([0, 25, 26, 27, 701, 702].map(lettereColonna), ["A", "Z", "AA", "AB", "ZZ", "AAA"]);
  const nomi = nomiFogli(["Campagne: Meta/LinkedIn [prova]", "", "Un nome lunghissimo che supera i trentuno caratteri", "campagne  meta linkedin  prova "]);
  assert.ok(nomi.every((n) => n.length > 0 && n.length <= 31 && !/[[\]:*?/\\]/.test(n)));
  assert.equal(nomi[1], "Foglio 2");
  assert.equal(new Set(nomi.map((n) => n.toLowerCase())).size, nomi.length, "nomi doppi");
});

test("l'archivio ha tutte le parti di un file .xlsx con CRC corretti", () => {
  const file = leggiZip(creaXlsx([tabella, { ...tabella, nome: "Secondo" }]));
  for (const p of ["[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"]) {
    assert.ok(file.has(p), `manca ${p}`);
  }
  assert.match(file.get("xl/workbook.xml")!, /<sheet name="Campagne Meta LinkedIn prova" sheetId="1" r:id="rId1"\/>/);
  assert.match(file.get("[Content_Types].xml")!, /sheet2\.xml/);
});

test("numeri, importi, percentuali e date diventano numeri di Excel; i testi sono protetti", () => {
  const foglio = leggiZip(creaXlsx([tabella])).get("xl/worksheets/sheet1.xml")!;
  // Intestazione in grassetto (stile 1)
  assert.match(foglio, /<c r="A1" t="inlineStr" s="1"><is><t xml:space="preserve">Campagna<\/t><\/is><\/c>/);
  // 01/10/2026 = 46296 giorni dal 30/12/1899
  assert.match(foglio, /<c r="B2" s="4"><v>46296<\/v><\/c>/);
  assert.match(foglio, /<c r="C2" s="2"><v>12<\/v><\/c>/);
  assert.match(foglio, /<c r="D2" s="3"><v>1234.5<\/v><\/c>/);
  assert.match(foglio, /<c r="E2" s="6"><v>0.235<\/v><\/c>/);
  assert.ok(foglio.includes("Fiera &lt;Milano&gt; &amp; &quot;Roma&quot;"));
  // Una "formula" resta testo (cella inlineStr, mai <f>)
  assert.match(foglio, /<c r="A3" t="inlineStr"><is><t xml:space="preserve">=SOMMA\(A1\)<\/t><\/is><\/c>/);
  assert.ok(!foglio.includes("<f>"));
  // Valori mancanti o non numerici: cella vuota
  assert.ok(!foglio.includes('r="C3"') && !foglio.includes('r="D3"'));
  // Riga bloccata e filtri su tutta la tabella
  assert.match(foglio, /state="frozen"/);
  assert.match(foglio, /<autoFilter ref="A1:E3"\/>/);
});

test("caratteri non ammessi in XML vengono tolti", () => {
  assert.equal(xml("a\u0001b\u0008c￿d"), "abcd");
  assert.equal(xml("tab\tok\nriga"), "tab\tok\nriga");
});

test("anche senza tabelle esce un file valido con un foglio", () => {
  const file = leggiZip(creaXlsx([]));
  assert.ok(file.has("xl/worksheets/sheet1.xml"));
});
