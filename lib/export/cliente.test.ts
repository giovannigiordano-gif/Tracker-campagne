// Test delle tabelle da scaricare del cliente (dati di fantasia): stessi numeri della dashboard, fogli giusti,
// criticità solo per l'agenzia, nessun lead "secondo Meta"
import assert from "node:assert/strict";
import { test } from "node:test";
import type { DatiCliente } from "../data/cliente";
import type { LeadRow, OppRow } from "../metrics/dashboard";
import { cartellaCliente, tabellaNumeri, tabelleAds } from "./cliente";
import { tabellaPanoramica } from "./panoramica";
import { creaXlsx } from "./xlsx";

const giorni = ["2026-10-01", "2026-10-02", "2026-10-03"];
const giorniPrec = ["2026-09-28", "2026-09-29", "2026-09-30"];

const lead = (giorno: string, campagnaId: string | null, persona = false): LeadRow => ({
  id: `c-${giorno}-${campagnaId}`,
  giorno,
  canale: campagnaId ? "Meta Ads" : "Diretto",
  campagnaId,
  campagna: campagnaId ? `Campagna ${campagnaId}` : null,
  fonte: "Modulo sito",
  tags: ["nuovo"],
  attribuito: !!campagnaId,
  pipelines: [],
  ...(persona ? { persona: { data: `${giorno}T10:00:00Z`, nome: "Persona di prova", email: "prova@example.com", telefono: "+390000000", gruppo: "", annuncio: "" } } : {}),
});

const opp = (giorno: string, status: OppRow["status"], valore: number): OppRow => ({
  id: `o-${giorno}-${status}`,
  pipelineId: "p1",
  stageId: status === "won" ? "s2" : "s1",
  status,
  valore,
  creata: giorno,
  chiusa: status === "won" || status === "lost" ? giorno : null,
  canale: "Meta Ads",
  campagnaId: "c1",
  campagna: "Campagna c1",
  fonte: "Modulo sito",
  tags: [],
  nome: "Opportunità di prova",
});

function dati(): DatiCliente {
  return {
    cliente: { locationId: "loc1", nome: "Cliente di prova", valuta: "EUR", fuso: "Europe/Rome" },
    periodo: { giorni, giorniPrec, daGiorno: giorni[0], aGiorno: giorni[2], daGiornoPrec: giorniPrec[0], aGiornoPrec: giorniPrec[2] },
    pipelines: [{ id: "p1", name: "Vendite", stages: [{ id: "s1", name: "Nuovo", position: 0 }, { id: "s2", name: "Chiuso", position: 1 }] }],
    lead: [lead("2026-10-01", "c1", true), lead("2026-10-02", "c1", true), lead("2026-10-03", null, true), lead("2026-09-29", "c1")],
    opp: [opp("2026-10-02", "won", 1000), opp("2026-10-03", "open", 0)],
    aperte: { p1: { s1: { n: 1, valore: 0, giorniMedi: 2 } } },
    aggiornatoIl: Date.UTC(2026, 9, 3),
    meta: {
      stato: "ok",
      dati: {
        account: [{ id: "act_1", nome: "Account di prova", valuta: "EUR", stato: 1, fuso: "Europe/Rome" }],
        righe: giorni.map((g) => ({ act: "act_1", giorno: g, campagnaId: "c1", campagna: "Campagna c1", spesa: 50, impression: 5000, reach: 2500, frequenza: 2, clic: 100, clicLink: 50, leadMeta: 7 })),
        campagne: [{ act: "act_1", id: "c1", nome: "Campagna c1", stato: "ACTIVE", obiettivo: "OUTCOME_LEADS" }],
        problemi: [],
        frequenza7g: { act_1: 4 },
        errori: [],
        aggiornatoIl: 0,
      },
    },
    linkedin: { stato: "non-associato" },
    obiettivoCpl: 40,
  };
}

test("numeri del CRM: periodo attuale e precedente come nella dashboard", () => {
  const d = dati();
  const t = tabellaNumeri(d.lead, d.opp, d.periodo, "EUR");
  const [attuale, precedente] = t.righe;
  const col = (titolo: string) => t.colonne.findIndex((c) => c.titolo === titolo);
  assert.equal(attuale[col("Lead")], 3);
  assert.equal(attuale[col("Lead da Meta Ads")], 2);
  assert.equal(attuale[col("Vinte")], 1);
  assert.equal(attuale[col("Venduto (EUR)")], 1000);
  assert.equal(precedente[col("Lead")], 1);
});

test("Meta: spesa, lead del CRM e costo per lead; nessun lead contato da Meta", () => {
  const d = dati();
  const tabelle = tabelleAds("meta", d.meta, d, "EUR", true);
  assert.deepEqual(tabelle.map((t) => t.nome), ["Meta - riepilogo", "Meta - andamento", "Meta - campagne", "Meta - account", "Meta - criticità"]);
  const r = tabelle[0];
  const col = (inizio: string) => r.colonne.findIndex((c) => c.titolo.startsWith(inizio));
  assert.equal(r.righe[0][col("Spesa")], 150);
  assert.equal(r.righe[0][col("Lead da Meta Ads nel CRM")], 2);
  assert.equal(r.righe[0][col("Costo per lead")], 75);
  // 7 lead al giorno "secondo Meta" (21) non devono comparire da nessuna parte
  const tutto = JSON.stringify(tabelle);
  assert.ok(!/secondo Meta|leadMeta/i.test(tutto));
  assert.ok(!tabelle.some((t) => t.righe.some((riga) => riga.includes(21))), "trovati i lead contati da Meta");
  // Frequenza 4 > 3: criticità presente per l'agenzia
  assert.ok(tabelle[4].righe.some((riga) => String(riga[1]).includes("Frequenza")));
});

test("piattaforma senza account: nessun foglio", () => {
  const d = dati();
  assert.deepEqual(tabelleAds("linkedin", d.linkedin, d, "EUR", true), []);
});

test("Excel completo: tutti i fogli, criticità solo per l'agenzia", () => {
  const agenzia = cartellaCliente(dati(), { modo: "agenzia", scaricatoIl: "oggi" }).map((t) => t.nome);
  assert.deepEqual(agenzia, [
    "Info",
    "Numeri",
    "Andamento giornaliero",
    "Canali",
    "Campagne",
    "Fonti",
    "Tag",
    "Pipeline",
    "Vendite",
    "Contatti",
    "Meta - riepilogo",
    "Meta - andamento",
    "Meta - campagne",
    "Meta - account",
    "Meta - criticità",
  ]);
  const condivisa = cartellaCliente(dati(), { modo: "condivisa", scaricatoIl: "oggi" }).map((t) => t.nome);
  assert.ok(!condivisa.some((n) => n.includes("criticità")));
  const tabelle = cartellaCliente(dati(), { modo: "agenzia", scaricatoIl: "oggi" });
  assert.equal(tabelle.find((t) => t.nome === "Contatti")!.righe.length, 3);
  assert.equal(tabelle.find((t) => t.nome === "Vendite")!.righe.length, 1);
  assert.equal(tabelle.find((t) => t.nome === "Andamento giornaliero")!.righe.length, 3);
  // Il file si crea senza errori
  assert.ok(creaXlsx(tabelle).length > 1000);
});

test("Panoramica: una riga per cliente, celle vuote se mancano i dati", () => {
  const t = tabellaPanoramica([
    {
      locationId: "a",
      nome: "Cliente A",
      valuta: "EUR",
      daGiorno: "2026-10-01",
      aGiorno: "2026-10-30",
      fuso: "Europe/Rome",
      kpi: { lead: 10, leadMeta: 4, leadLinkedin: 1, oppCreate: 5, vinte: 2, perse: 1, venduto: 3000, tassoChiusura: 66.7, valoreMedio: 1500 },
      kpiPrec: { lead: 8, leadMeta: 3, leadLinkedin: 0, oppCreate: 4, vinte: 1, perse: 1, venduto: 1000, tassoChiusura: 50, valoreMedio: 1000 },
      leadGiornalieri: [],
      canali: [],
      avvisi: [{ livello: "attenzione", testo: "Lead in calo" }],
      meta: { spesa: 400, spesaPrec: 300, cplReale: 100, cplRealePrec: 100 },
      linkedin: null,
      problemaToken: false,
      aggiornatoIl: null,
    },
    { locationId: "b", nome: "Cliente B", valuta: "EUR", daGiorno: "2026-10-01", aGiorno: "2026-10-30", fuso: "Europe/Rome", kpi: null, kpiPrec: null, leadGiornalieri: [], canali: [], avvisi: [], meta: null, linkedin: null, problemaToken: true, aggiornatoIl: null },
  ]);
  assert.equal(t.righe.length, 2);
  const col = (titolo: string) => t.colonne.findIndex((c) => c.titolo === titolo);
  assert.equal(t.righe[0][col("Spesa Meta")], 400);
  assert.equal(t.righe[0][col("Spesa LinkedIn")], null);
  assert.equal(t.righe[1][col("Lead")], null);
  assert.equal(t.righe[0][col("Avvisi")], "Lead in calo");
});
