// Test dei conteggi per canale usati dalle schede della Panoramica.
// Si lanciano con: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Canale } from "../ghl/types";
import { leadPerCanale, raggruppaCanali, type LeadRow } from "./dashboard";

function lead(giorno: string, canale: Canale): LeadRow {
  return { id: Math.random().toString(36), giorno, canale, campagnaId: null, campagna: null, fonte: "", tags: [], attribuito: false };
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
