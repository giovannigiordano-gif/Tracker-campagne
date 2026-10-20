// Test dei calcoli della sezione "Campagne Meta" e delle criticità (dati di fantasia).
// Si lanciano con: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Canale } from "../ghl/types";
import { leadDaAzioni, normalizzaInsight, type DatiMeta, type InsightGiorno } from "../meta/normalize";
import { calcolaCriticita } from "./criticita";
import type { LeadRow, OppRow } from "./dashboard";
import { kpiIncrocio, kpiMeta, righeCampagne, serieGiornaliera } from "./meta";

const ACT = "act_1";
const giorni = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"];
const giorniPrec = ["2026-09-27", "2026-09-28", "2026-09-29", "2026-09-30"];

function riga(giorno: string, campagnaId: string, spesa: number, leadMeta = 0, frequenza = 1): InsightGiorno {
  return { act: ACT, giorno, campagnaId, campagna: `Campagna ${campagnaId}`, spesa, impression: spesa * 100, reach: spesa * 50, frequenza, clic: spesa * 2, clicLink: spesa, leadMeta };
}
function lead(giorno: string, canale: Canale, campagnaId: string | null = null): LeadRow {
  return { id: Math.random().toString(36), giorno, canale, campagnaId, campagna: campagnaId, fonte: "", tags: [], attribuito: !!campagnaId };
}
function opp(creata: string, campagnaId: string, status: "open" | "won" = "open", valore = 0): OppRow {
  return { id: Math.random().toString(36), pipelineId: "p", stageId: "s", status, valore, creata, chiusa: status === "won" ? creata : null, canale: "Meta Ads", campagnaId, campagna: campagnaId, fonte: "", tags: [] };
}
function dati(parziale: Partial<DatiMeta> = {}): DatiMeta {
  return {
    account: [{ id: ACT, nome: "Account di prova", valuta: "EUR", stato: 1, fuso: "Europe/Rome" }],
    righe: [],
    campagne: [
      { act: ACT, id: "c1", nome: "Campagna c1", stato: "ACTIVE", obiettivo: "OUTCOME_LEADS" },
      { act: ACT, id: "c2", nome: "Campagna c2", stato: "ACTIVE", obiettivo: "OUTCOME_LEADS" },
    ],
    problemi: [],
    frequenza7g: { [ACT]: 1.5 },
    errori: [],
    aggiornatoIl: 0,
    ...parziale,
  };
}

// ---------------------------------------------------------------- lettura dei dati Meta
test("i lead secondo Meta sono l'azione 'lead', i numeri arrivano come testo", () => {
  assert.equal(leadDaAzioni([{ action_type: "link_click", value: "40" }, { action_type: "lead", value: "7" }, { action_type: "onsite_conversion.lead_grouped", value: "5" }]), 7);
  assert.equal(leadDaAzioni(undefined), 0);
  const r = normalizzaInsight({ date_start: "2026-10-01", campaign_id: "c1", campaign_name: "Prova", spend: "12.50", impressions: "1000", clicks: "20", actions: [{ action_type: "lead", value: "2" }] }, ACT);
  assert.equal(r.spesa, 12.5);
  assert.equal(r.impression, 1000);
  assert.equal(r.leadMeta, 2);
});

// ---------------------------------------------------------------- numeri chiave
test("kpiMeta somma solo i giorni del periodo e calcola costo per lead, CTR, CPC, CPM", () => {
  const k = kpiMeta([riga("2026-10-01", "c1", 50, 2), riga("2026-10-02", "c1", 50, 3), riga("2026-09-30", "c1", 999, 9)], new Set(giorni));
  assert.equal(k.spesa, 100);
  assert.equal(k.leadMeta, 5);
  assert.equal(k.cplMeta, 20);
  assert.equal(k.impression, 10000);
  assert.equal(k.ctr, 2); // 200 clic / 10.000 impression = 2%
  assert.equal(k.cpc, 0.5);
  assert.equal(k.cpm, 10);
});

test("kpiIncrocio usa solo i lead e le opportunità di GHL arrivati da Meta", () => {
  const k = kpiIncrocio(
    100,
    [lead("2026-10-01", "Meta Ads", "c1"), lead("2026-10-02", "Meta Ads"), lead("2026-10-02", "Diretto"), lead("2026-09-30", "Meta Ads")],
    [opp("2026-10-01", "c1"), opp("2026-10-02", "c1", "won", 500)],
    new Set(giorni)
  );
  assert.equal(k.leadGhl, 2);
  assert.equal(k.cplReale, 50);
  assert.equal(k.opportunita, 2);
  assert.equal(k.vinte, 1);
  assert.equal(k.venduto, 500);
  assert.equal(k.costoVendita, 100);
  assert.equal(k.roas, 5);
});

test("senza spesa o senza lead i costi sono vuoti, non infiniti", () => {
  const k = kpiIncrocio(0, [], [], new Set(giorni));
  assert.equal(k.cplReale, null);
  assert.equal(k.roas, null);
  assert.equal(kpiMeta([], new Set(giorni)).cplMeta, null);
});

test("righeCampagne abbina i lead GHL alla campagna Meta tramite l'ID campagna", () => {
  const righe = righeCampagne(
    dati({ righe: [riga("2026-10-01", "c1", 60, 3), riga("2026-10-01", "c2", 40, 0)] }),
    [lead("2026-10-01", "Meta Ads", "c1"), lead("2026-10-01", "Meta Ads", "c1"), lead("2026-10-02", "Meta Ads")],
    [opp("2026-10-02", "c1", "won", 300)],
    new Set(giorni)
  );
  const c1 = righe.find((r) => r.id === "c1")!;
  assert.equal(c1.spesa, 60);
  assert.equal(c1.leadMeta, 3);
  assert.equal(c1.leadGhl, 2);
  assert.equal(c1.cplReale, 30);
  assert.equal(c1.venduto, 300);
  assert.equal(c1.roas, 5);
  assert.equal(righe.find((r) => r.id === "c2")!.leadGhl, 0);
  // Il lead Meta senza ID campagna finisce in una riga a parte
  assert.equal(righe.find((r) => r.id === "senza-campagna")?.leadGhl, 1);
  // Ordine: dalla campagna che spende di più
  assert.equal(righe[0].id, "c1");
});

test("serieGiornaliera dà spesa, lead Meta e lead GHL per ogni giorno del periodo", () => {
  const s = serieGiornaliera([riga("2026-10-02", "c1", 30, 2)], [lead("2026-10-02", "Meta Ads", "c1")], giorni);
  assert.equal(s.length, 4);
  assert.deepEqual(s[1], { giorno: "2026-10-02", spesa: 30, leadMeta: 2, leadGhl: 1 });
  assert.deepEqual(s[0], { giorno: "2026-10-01", spesa: 0, leadMeta: 0, leadGhl: 0 });
});

// ---------------------------------------------------------------- criticità
const base = { giorni, giorniPrec, valuta: "EUR" };

test("costo per lead reale sopra l'obiettivo: attenzione", () => {
  const c = calcolaCriticita({ ...base, meta: dati({ righe: [riga("2026-10-01", "c1", 200, 4)] }), lead: [lead("2026-10-01", "Meta Ads", "c1"), lead("2026-10-02", "Meta Ads", "c1")], obiettivoCpl: 50 });
  const cpl = c.find((x) => x.tipo === "cpl-alto");
  assert.ok(cpl, "deve segnalare il costo per lead alto");
  assert.equal(cpl.livello, "attenzione");
  assert.match(cpl.testo, /100/);
});

test("senza obiettivo: segnala il costo per lead peggiorato di oltre il 50%, solo con abbastanza lead", () => {
  const leadPrec = Array.from({ length: 5 }, () => lead("2026-09-28", "Meta Ads", "c1"));
  const leadOra = Array.from({ length: 5 }, () => lead("2026-10-02", "Meta Ads", "c1"));
  const peggiorato = calcolaCriticita({ ...base, meta: dati({ righe: [riga("2026-09-28", "c1", 100), riga("2026-10-02", "c1", 200)] }), lead: [...leadPrec, ...leadOra] });
  assert.ok(peggiorato.some((x) => x.tipo === "cpl-alto"));
  const pochiLead = calcolaCriticita({ ...base, meta: dati({ righe: [riga("2026-09-28", "c1", 10), riga("2026-10-02", "c1", 200)] }), lead: [lead("2026-09-28", "Meta Ads", "c1"), lead("2026-10-02", "Meta Ads", "c1")] });
  assert.ok(!pochiLead.some((x) => x.tipo === "cpl-alto"), "con meno di 5 lead è solo rumore");
});

test("spesa senza risultati: campagna attiva che negli ultimi 3 giorni spende senza lead", () => {
  const c = calcolaCriticita({ ...base, meta: dati({ righe: [riga("2026-10-02", "c2", 20), riga("2026-10-03", "c2", 20), riga("2026-10-04", "c1", 5, 1)] }), lead: [] });
  const s = c.filter((x) => x.tipo === "spesa-senza-risultati");
  assert.equal(s.length, 1);
  assert.equal(s[0].campagnaId, "c2");
  assert.equal(s[0].livello, "errore");
});

test("spesa senza risultati non scatta se i lead arrivano in GHL o la spesa è sotto la soglia", () => {
  const conLeadGhl = calcolaCriticita({ ...base, meta: dati({ righe: [riga("2026-10-03", "c2", 40)] }), lead: [lead("2026-10-03", "Meta Ads", "c2")] });
  assert.ok(!conLeadGhl.some((x) => x.tipo === "spesa-senza-risultati"));
  const pocaSpesa = calcolaCriticita({ ...base, meta: dati({ righe: [riga("2026-10-03", "c2", 10)] }), lead: [] });
  assert.ok(!pocaSpesa.some((x) => x.tipo === "spesa-senza-risultati"));
  const conObiettivo = calcolaCriticita({ ...base, meta: dati({ righe: [riga("2026-10-03", "c2", 10)] }), lead: [], obiettivoCpl: 8 });
  assert.ok(conObiettivo.some((x) => x.tipo === "spesa-senza-risultati"), "con obiettivo 8 € bastano 10 € spesi");
});

test("spesa senza risultati non scatta per le campagne di notorietà", () => {
  const c = calcolaCriticita({
    ...base,
    meta: dati({
      campagne: [{ act: ACT, id: "c3", nome: "Notorietà", stato: "ACTIVE", obiettivo: "OUTCOME_AWARENESS" }],
      righe: [riga("2026-10-03", "c3", 100)],
    }),
    lead: [],
  });
  assert.ok(!c.some((x) => x.tipo === "spesa-senza-risultati"));
});

test("segnali di Meta: account non attivo, annunci con problemi nelle campagne attive, frequenza alta", () => {
  const c = calcolaCriticita({
    ...base,
    meta: dati({
      account: [{ id: ACT, nome: "Account di prova", valuta: "EUR", stato: 3, fuso: null }],
      campagne: [
        { act: ACT, id: "c1", nome: "Attiva", stato: "ACTIVE", obiettivo: null },
        { act: ACT, id: "c9", nome: "In pausa", stato: "PAUSED", obiettivo: null },
      ],
      problemi: [
        { act: ACT, annuncioId: "a1", campagnaId: "c1", stato: "DISAPPROVED", problema: "Testo non conforme" },
        { act: ACT, annuncioId: "a2", campagnaId: "c1", stato: "WITH_ISSUES", problema: null },
        { act: ACT, annuncioId: "a3", campagnaId: "c9", stato: "DISAPPROVED", problema: "Ignorato: campagna in pausa" },
      ],
      frequenza7g: { [ACT]: 4.2 },
    }),
    lead: [],
  });
  const account = c.find((x) => x.tipo === "account-non-attivo");
  assert.equal(account?.livello, "errore");
  assert.match(account!.testo, /pagamenti in sospeso/);
  const annunci = c.filter((x) => x.tipo === "annunci-con-problemi");
  assert.equal(annunci.length, 1, "solo la campagna attiva");
  assert.equal(annunci[0].livello, "errore", "c'è un annuncio rifiutato");
  assert.match(annunci[0].testo, /2 annunci/);
  assert.ok(c.some((x) => x.tipo === "frequenza-alta"));
});

test("nessuna criticità quando va tutto bene", () => {
  const c = calcolaCriticita({ ...base, meta: dati({ righe: [riga("2026-10-03", "c1", 30, 2)] }), lead: [lead("2026-10-03", "Meta Ads", "c1"), lead("2026-10-03", "Meta Ads", "c1")], obiettivoCpl: 50 });
  assert.deepEqual(c, []);
});
