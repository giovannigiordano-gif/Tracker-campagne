// Test del riepilogo per Claude (dati di fantasia): numeri giusti e NESSUN dato personale, anche se
// per errore le righe in ingresso ne contenessero.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { DatiCliente } from "../data/cliente";
import type { LeadRow, OppRow } from "../metrics/dashboard";
import { riepilogoCliente } from "./riepilogo";

const giorni = ["2026-10-01", "2026-10-02", "2026-10-03"];
const giorniPrec = ["2026-09-28", "2026-09-29", "2026-09-30"];

const PERSONALI = ["Mario Rossi", "mario.rossi@example.com", "+393331234567", "Opportunità Mario Rossi"];

function lead(giorno: string, campagnaId: string | null, conPersona = false): LeadRow {
  return {
    id: `contatto-${Math.random().toString(36).slice(2)}`,
    giorno,
    canale: campagnaId ? "Meta Ads" : "Diretto",
    campagnaId,
    campagna: campagnaId ? `Campagna ${campagnaId}` : null,
    fonte: "Modulo sito",
    tags: ["nuovo"],
    attribuito: !!campagnaId,
    ...(conPersona ? { persona: { data: giorno, nome: PERSONALI[0], email: PERSONALI[1], telefono: PERSONALI[2], gruppo: "", annuncio: "" } } : {}),
  };
}

function opp(giorno: string, status: OppRow["status"], valore: number): OppRow {
  return {
    id: `opp-${Math.random().toString(36).slice(2)}`,
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
    nome: PERSONALI[3],
  };
}

function dati(): DatiCliente {
  return {
    cliente: { locationId: "loc123456", nome: "Cliente di prova", valuta: "EUR", fuso: "Europe/Rome" },
    periodo: { giorni, giorniPrec, daGiorno: giorni[0], aGiorno: giorni[2], daGiornoPrec: giorniPrec[0], aGiornoPrec: giorniPrec[2] },
    pipelines: [{ id: "p1", name: "Vendite", stages: [{ id: "s1", name: "Nuovo", position: 0 }, { id: "s2", name: "Chiuso", position: 1 }] }],
    lead: [lead("2026-10-01", "c1", true), lead("2026-10-02", "c1"), lead("2026-10-03", null, true), lead("2026-09-29", "c1")],
    opp: [opp("2026-10-02", "won", 1000), opp("2026-10-03", "open", 0)],
    aperte: { p1: { s1: { n: 1, valore: 0, giorniMedi: 2 } } },
    aggiornatoIl: Date.UTC(2026, 9, 3),
    meta: {
      stato: "ok",
      dati: {
        account: [{ id: "act_1", nome: "Account di prova", valuta: "EUR", stato: 1, fuso: "Europe/Rome" }],
        righe: giorni.map((g) => ({ act: "act_1", giorno: g, campagnaId: "c1", campagna: "Campagna c1", spesa: 50, impression: 5000, reach: 2500, frequenza: 2, clic: 100, clicLink: 50, leadMeta: 1 })),
        campagne: [{ act: "act_1", id: "c1", nome: "Campagna c1", stato: "ACTIVE", obiettivo: "OUTCOME_LEADS" }],
        problemi: [],
        frequenza7g: { act_1: 2 },
        errori: [],
        aggiornatoIl: 0,
      },
    },
    linkedin: { stato: "non-associato" },
    obiettivoCpl: 40,
  };
}

test("il riepilogo per Claude non contiene dati personali né ID dei contatti", () => {
  const d = dati();
  const json = JSON.stringify(riepilogoCliente(d, { notes: "Fotovoltaico, obiettivo 30 lead al mese", thresholds: { maxCpl: 40 } }));
  for (const p of PERSONALI) assert.ok(!json.includes(p), `trovato dato personale: ${p}`);
  for (const r of [...d.lead, ...d.opp]) assert.ok(!json.includes(r.id), "trovato l'ID di un contatto o di un'opportunità");
});

test("il riepilogo ha i numeri di GHL, di Meta e l'incrocio, con fonte e periodo", () => {
  const r = riepilogoCliente(dati(), { notes: "", thresholds: { maxCpl: 40 } });
  assert.equal(r.periodo.da, "2026-10-01");
  assert.equal(r.ghl.numeri.attuale.lead, 3);
  assert.equal(r.ghl.numeri.precedente.lead, 1);
  assert.equal(r.ghl.numeri.attuale.vinte, 1);
  assert.equal(r.ghl.numeri.attuale.venduto, 1000);
  assert.equal(r.ghl.percentualeAttribuiti, 66.67);
  assert.ok(r.ghl.fonte.includes("GoHighLevel"));
  const meta = r.meta as { stato: string; numeri: { attuale: { spesa: number } }; incrocio: { attuale: { lead: number; costoPerLead: number; roas: number } } };
  assert.equal(meta.stato, "ok");
  assert.equal(meta.numeri.attuale.spesa, 150);
  assert.equal(meta.incrocio.attuale.lead, 2);
  assert.equal(meta.incrocio.attuale.costoPerLead, 75);
  assert.equal(meta.incrocio.attuale.roas, 6.67);
  assert.equal(r.cliente.obiettivoCostoPerLead, 40);
});

test("a Claude arrivano solo i lead del CRM: niente lead contati da Meta né costo per lead di Meta", () => {
  const json = JSON.stringify(riepilogoCliente(dati(), { notes: "", thresholds: {} }));
  assert.ok(!/"(leadMeta|cplMeta|leadGhl|cplReale)"/.test(json), "trovato un campo con i lead di Meta o il vecchio nome");
  const r = riepilogoCliente(dati(), { notes: "", thresholds: {} });
  assert.equal(r.ghl.numeri.attuale.leadDaMetaAds, 2);
});

test("senza account Meta il riepilogo lo dice invece di inventare numeri", () => {
  const r = riepilogoCliente({ ...dati(), meta: { stato: "non-associato" } }, { notes: "", thresholds: {} });
  assert.equal((r.meta as { stato: string }).stato, "non-associato");
  assert.equal((r.linkedin as { stato: string }).stato, "non-associato");
});

test("LinkedIn: spesa incrociata solo con i lead del canale LinkedIn Ads, abbinati anche per nome", () => {
  const d = dati();
  const leadLinkedIn = (giorno: string, campagna: string | null): LeadRow => ({
    ...lead(giorno, null),
    canale: "LinkedIn Ads",
    campagna,
    attribuito: !!campagna,
  });
  d.lead.push(leadLinkedIn("2026-10-01", "Campagna LinkedIn B2B"), leadLinkedIn("2026-10-02", "campagna linkedin b2b"), leadLinkedIn("2026-10-03", null));
  d.linkedin = {
    stato: "ok",
    dati: {
      account: [{ id: "500100", nome: "Account LinkedIn di prova", valuta: "EUR", stato: 0, fuso: "UTC", statoTesto: "In pausa" }],
      righe: giorni.map((g) => ({ act: "500100", giorno: g, campagnaId: "900200", campagna: "Campagna LinkedIn B2B", spesa: 100, impression: 1000, reach: 0, frequenza: 0, clic: 10, clicLink: 8, leadMeta: 2 })),
      campagne: [{ act: "500100", id: "900200", nome: "Campagna LinkedIn B2B", stato: "ACTIVE", obiettivo: "LEAD_GENERATION" }],
      problemi: [],
      campagneFerme: [{ act: "500100", campagnaId: "900200", motivo: "il pubblico è troppo piccolo" }],
      frequenza7g: { "500100": null },
      errori: [],
      aggiornatoIl: 0,
    },
  };
  const r = riepilogoCliente(d, { notes: "", thresholds: {} });
  const li = r.linkedin as {
    stato: string;
    fonte: string;
    account: { stato: string }[];
    incrocio: { attuale: { lead: number; costoPerLead: number } };
    campagne: { id: string | null; lead: number }[];
    criticita: { tipo: string; testo: string }[];
  };
  // Nei testi le righe LinkedIn sono "gruppi di annunci", come in Campaign Manager
  assert.equal(
    li.criticita.find((c) => c.tipo === "campagna-ferma")?.testo,
    "Il gruppo di annunci Campagna LinkedIn B2B è attivo ma non viene pubblicato: il pubblico è troppo piccolo."
  );
  assert.equal(li.stato, "ok");
  assert.ok(li.fonte.includes("LinkedIn"));
  assert.equal(li.account[0].stato, "In pausa");
  // 3 lead LinkedIn Ads nel CRM (i lead Meta non contano), 300 di spesa
  assert.equal(li.incrocio.attuale.lead, 3);
  assert.equal(li.incrocio.attuale.costoPerLead, 100);
  // Due abbinati alla campagna per nome (maiuscole diverse), uno senza campagna
  assert.equal(li.campagne.find((c) => c.id === "900200")?.lead, 2);
  assert.equal(li.campagne.find((c) => c.id === null)?.lead, 1);
  // Meta resta com'era: i lead LinkedIn non entrano nel suo costo per lead
  assert.equal((r.meta as { incrocio: { attuale: { lead: number } } }).incrocio.attuale.lead, 2);
  const json = JSON.stringify(r.linkedin);
  assert.ok(!/"(leadMeta|cplMeta|leadGhl|cplReale)"/.test(json), "trovato un campo con i lead della piattaforma");
});
