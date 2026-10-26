// Test del canale ricavato dall'attribuzione di GHL (dati di fantasia)
import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeAttribution, normalizeOpportunity } from "./normalize";

const canale = (a: Parameters<typeof normalizeAttribution>[0]) => normalizeAttribution(a).canale;

test("Meta: Paid Social con sorgente facebook è un annuncio, Social media no", () => {
  assert.equal(canale({ sessionSource: "Paid Social", utmSource: "facebook" }), "Meta Ads");
  assert.equal(canale({ sessionSource: "Social media", utmSource: "facebook" }), "Social organico");
});

test("LinkedIn: sorgente linkedin con un segnale di annuncio è LinkedIn Ads", () => {
  assert.equal(canale({ sessionSource: "Paid Social", utmSource: "linkedin" }), "LinkedIn Ads");
  assert.equal(canale({ utmSource: "linkedin", utmMedium: "paid_social" }), "LinkedIn Ads");
  assert.equal(canale({ utmSource: "LinkedIn", utmMedium: "cpc" }), "LinkedIn Ads");
  // utm_campaign numerico = ID campagna messo da LinkedIn con i parametri UTM dinamici
  assert.equal(canale({ utmSource: "linkedin", utmMedium: "social", utmCampaign: "366948955" }), "LinkedIn Ads");
});

test("LinkedIn: senza segnali di annuncio è social organico", () => {
  assert.equal(canale({ utmSource: "linkedin", utmMedium: "social", utmCampaign: "post-ottobre" }), "Social organico");
  assert.equal(canale({ sessionSource: "Social media", utmSource: "linkedin" }), "Social organico");
  // "badge" o "loads" non sono annunci: il medium a pagamento si riconosce a parole intere
  assert.equal(canale({ utmSource: "linkedin", utmMedium: "badge" }), "Social organico");
});

test("le opportunità usano le stesse regole (nomi dei campi diversi)", () => {
  const o = normalizeOpportunity({
    id: "o1",
    locationId: "l1",
    pipelineId: "p1",
    pipelineStageId: "s1",
    status: "open",
    createdAt: "2026-10-01T10:00:00Z",
    attributions: [{ isFirst: true, utmSource: "linkedin", utmMedium: "paid", utmCampaign: "366948955" }],
  });
  assert.equal(o.attribution.canale, "LinkedIn Ads");
  assert.equal(o.attribution.utmCampaign, "366948955");
});
