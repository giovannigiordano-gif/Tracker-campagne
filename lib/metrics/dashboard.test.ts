// Test dei conteggi per canale usati dalle schede della Panoramica.
// Si lanciano con: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Canale } from "../ghl/types";
import { calcolaKpi, FILTRI_VUOTI, filtraLead, filtraOpp, leadPerCanale, raggruppaCanali, type LeadRow, type OppRow } from "./dashboard";

function lead(giorno: string, canale: Canale, pipelines: string[] = []): LeadRow {
  return { id: Math.random().toString(36), giorno, canale, campagnaId: null, campagna: null, fonte: "", tags: [], attribuito: false, pipelines };
}

const giorni = new Set(["2026-10-01", "2026-10-02"]);

test("leadPerCanale conta solo i lead del periodo, dal canale più grande", () => {
  const righe = [
    lead("2026-10-01", "Meta Ads"),
    lead("2026-10-01", "Meta Ads"),
    lead("2026-10-02", "Diretto"),
    lead("2026-09-30", "Meta Ads"), // fuori periodo
  ];
  assert.deepEqual(leadPerCanale(righe, giorni), [
    { canale: "Meta Ads", lead: 2 },
    { canale: "Diretto", lead: 1 },
  ]);
});

test("leadPerCanale senza lead nel periodo restituisce un elenco vuoto", () => {
  assert.deepEqual(leadPerCanale([lead("2026-09-01", "Meta Ads")], giorni), []);
});

test("a parità di lead i canali sono in ordine alfabetico", () => {
  const righe = [lead("2026-10-01", "Referral"), lead("2026-10-01", "Diretto")];
  assert.deepEqual(
    leadPerCanale(righe, giorni).map((c) => c.canale),
    ["Diretto", "Referral"]
  );
});

test("raggruppaCanali tiene i primi N e somma il resto in Altro, sempre in fondo", () => {
  const canali = [
    { canale: "Meta Ads" as const, lead: 10 },
    { canale: "Altro" as const, lead: 6 },
    { canale: "Diretto" as const, lead: 5 },
    { canale: "Referral" as const, lead: 3 },
    { canale: "Sconosciuto" as const, lead: 2 },
  ];
  assert.deepEqual(raggruppaCanali(canali, 3), [
    { canale: "Meta Ads", lead: 10 },
    { canale: "Diretto", lead: 5 },
    { canale: "Referral", lead: 3 },
    { canale: "Altro", lead: 8 }, // 6 del canale "Altro" + 2 di Sconosciuto
  ]);
});

test("raggruppaCanali senza resto non aggiunge Altro", () => {
  const canali = [
    { canale: "Meta Ads" as const, lead: 4 },
    { canale: "Diretto" as const, lead: 1 },
  ];
  assert.deepEqual(raggruppaCanali(canali, 3), canali);
});

test("i numeri contano a parte i lead da annunci Meta e da annunci LinkedIn", () => {
  const k = calcolaKpi([lead("2026-10-01", "Meta Ads"), lead("2026-10-01", "LinkedIn Ads"), lead("2026-10-02", "LinkedIn Ads"), lead("2026-10-02", "Diretto")], [], giorni);
  assert.equal(k.lead, 4);
  assert.equal(k.leadMeta, 1);
  assert.equal(k.leadLinkedin, 2);
});

test("con una pipeline scelta contano solo i lead con un'opportunità in quella pipeline", () => {
  const righe = [lead("2026-10-01", "Meta Ads", ["p1"]), lead("2026-10-01", "LinkedIn Ads", ["p1", "p2"]), lead("2026-10-02", "Meta Ads", ["p2"]), lead("2026-10-02", "Diretto")];
  const opp: OppRow[] = [
    { id: "o1", pipelineId: "p1", stageId: "s", status: "open", valore: 0, creata: "2026-10-01", chiusa: null, canale: "Meta Ads", campagnaId: null, campagna: null, fonte: "", tags: [] },
    { id: "o2", pipelineId: "p2", stageId: "s", status: "won", valore: 500, creata: "2026-10-02", chiusa: "2026-10-02", canale: "Meta Ads", campagnaId: null, campagna: null, fonte: "", tags: [] },
  ];
  // Senza filtro: tutti i lead
  assert.equal(filtraLead(righe, FILTRI_VUOTI).length, 4);
  const f = { ...FILTRI_VUOTI, pipeline: "p1" };
  const k = calcolaKpi(filtraLead(righe, f), filtraOpp(opp, f), giorni);
  assert.deepEqual([k.lead, k.leadMeta, k.leadLinkedin, k.oppCreate, k.vinte], [2, 1, 1, 1, 0]);
  const k2 = calcolaKpi(filtraLead(righe, { ...FILTRI_VUOTI, pipeline: "p2" }), filtraOpp(opp, { ...FILTRI_VUOTI, pipeline: "p2" }), giorni);
  assert.deepEqual([k2.lead, k2.leadMeta, k2.leadLinkedin, k2.vinte, k2.venduto], [2, 1, 1, 1, 500]);
});
