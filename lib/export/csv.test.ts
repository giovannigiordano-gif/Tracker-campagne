// Test del CSV per Excel in italiano
import assert from "node:assert/strict";
import { test } from "node:test";
import { creaCsv, testoCella } from "./csv";
import { nomeFileExport } from "./tabella";

test("CSV con punto e virgola, virgola decimale, date italiane e percentuali indicate nel titolo", () => {
  const csv = creaCsv({
    nome: "Prova",
    colonne: [{ titolo: "Giorno", tipo: "data" }, { titolo: "Lead", tipo: "intero" }, { titolo: "Spesa (EUR)", tipo: "valuta" }, { titolo: "Chiusura", tipo: "percentuale" }, { titolo: "Nota" }],
    righe: [["2026-10-01", 1250, 1234.5, 23.45, 'Detto "bene"; ok']],
  });
  const [intestazione, riga] = csv.split("\r\n");
  assert.equal(intestazione, '"Giorno";"Lead";"Spesa (EUR)";"Chiusura (%)";"Nota"');
  assert.equal(riga, '"01/10/2026";"1250";"1234,50";"23,5";"Detto ""bene""; ok"');
});

test("le celle che sembrano formule restano testo", () => {
  assert.equal(creaCsv({ nome: "x", colonne: [{ titolo: "A" }], righe: [["=1+1"], ["+cmd"], ["-5"]] }).split("\r\n").slice(1).join("|"), `"'=1+1"|"'+cmd"|"-5"`);
});

test("valori mancanti vuoti e numeri non validi vuoti", () => {
  assert.equal(testoCella(null, { titolo: "x", tipo: "valuta" }), "");
  assert.equal(testoCella(undefined, { titolo: "x" }), "");
  assert.equal(testoCella(Number.NaN, { titolo: "x", tipo: "intero" }), "");
  assert.equal(testoCella(Number.POSITIVE_INFINITY, { titolo: "x" }), "");
});

test("nome del file senza caratteri strani", () => {
  assert.equal(nomeFileExport(["Vendite", "Cliente S.r.l. – Città", "2026-10-01", "2026-10-30"], "xlsx"), "vendite-cliente-s-r-l-citta-2026-10-01-2026-10-30.xlsx");
});
