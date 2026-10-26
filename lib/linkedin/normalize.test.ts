// Test della traduzione dei dati di LinkedIn e degli indirizzi Rest.li (risposte di fantasia nel formato ufficiale)
import assert from "node:assert/strict";
import { test } from "node:test";
import { campagnaFerma, frequenzaDaCopertura, normalizzaAccountLinkedIn, normalizzaCampagnaLinkedIn, normalizzaStatisticaLinkedIn } from "./normalize";
import { dataRestli, giornoDaData, idDaUrn, queryCampagne, queryStatisticheCampagne } from "./restli";

test("indirizzi Rest.li: date senza zeri, URN codificati, struttura non codificata", () => {
  assert.equal(dataRestli("2026-10-01"), "(year:2026,month:10,day:1)");
  assert.equal(giornoDaData({ year: 2026, month: 9, day: 5 }), "2026-09-05");
  assert.equal(idDaUrn("urn:li:sponsoredCampaign:1234567"), "1234567");
  const q = queryStatisticheCampagne("502840441", "2026-09-27", "2026-10-26");
  assert.ok(q.includes("q=analytics&pivot=CAMPAIGN&timeGranularity=DAILY"));
  assert.ok(q.includes("dateRange=(start:(year:2026,month:9,day:27),end:(year:2026,month:10,day:26))"));
  assert.ok(q.includes("accounts=List(urn%3Ali%3AsponsoredAccount%3A502840441)"));
  assert.ok(q.includes("fields=dateRange,pivotValues,costInLocalCurrency,impressions,clicks,landingPageClicks,oneClickLeads"));
  assert.equal(queryCampagne(), "q=search&search=(test:false)&pageSize=1000");
  assert.ok(queryCampagne("Dg/G=").endsWith("pageToken=Dg%2FG%3D"));
});

test("statistica giornaliera: spesa da testo, giorno, campagna con nome", () => {
  const r = normalizzaStatisticaLinkedIn(
    {
      pivotValues: ["urn:li:sponsoredCampaign:145282384"],
      dateRange: { start: { year: 2026, month: 10, day: 3 }, end: { year: 2026, month: 10, day: 3 } },
      costInLocalCurrency: "19.91833",
      impressions: 165,
      clicks: 12,
      landingPageClicks: 11,
      oneClickLeads: 2,
    },
    "506333826",
    new Map([["145282384", "Lead gen ottobre"]])
  );
  assert.equal(r.giorno, "2026-10-03");
  assert.equal(r.campagnaId, "145282384");
  assert.equal(r.campagna, "Lead gen ottobre");
  assert.equal(r.spesa, 19.91833);
  assert.equal(r.clicLink, 11);
  assert.equal(r.leadMeta, 2);
});

test("campagne: obiettivo e campagne attive ma ferme", () => {
  assert.deepEqual(normalizzaCampagnaLinkedIn({ id: 1, name: "C1", status: "ACTIVE", objectiveType: "LEAD_GENERATION" }, "9"), {
    act: "9",
    id: "1",
    nome: "C1",
    stato: "ACTIVE",
    obiettivo: "LEAD_GENERATION",
  });
  assert.equal(campagnaFerma({ id: 1, status: "ACTIVE", servingStatuses: ["RUNNABLE"] }, "9"), null);
  assert.equal(campagnaFerma({ id: 1, status: "PAUSED", servingStatuses: ["STOPPED"] }, "9"), null);
  assert.equal(campagnaFerma({ id: 1, status: "ACTIVE", servingStatuses: ["CAMPAIGN_START_DATE_HOLD"] }, "9"), null);
  assert.equal(campagnaFerma({ id: 1, status: "ACTIVE", servingStatuses: ["CAMPAIGN_TOTAL_BUDGET_HOLD"] }, "9")?.motivo, "il budget totale del gruppo di annunci è esaurito");
});

test("account: attivo solo se pubblica, altrimenti il motivo in italiano", () => {
  assert.equal(normalizzaAccountLinkedIn({ id: 5, name: "A", currency: "EUR", status: "ACTIVE", servingStatuses: ["RUNNABLE"] }, "5").stato, 1);
  const fermo = normalizzaAccountLinkedIn({ id: 5, name: "A", currency: "EUR", status: "ACTIVE", servingStatuses: ["BILLING_HOLD"] }, "5");
  assert.equal(fermo.stato, 0);
  assert.equal(fermo.statoTesto, "fermo (l'account è bloccato per un problema di pagamento)");
  assert.equal(normalizzaAccountLinkedIn({ id: 5, name: "A", status: "CANCELED" }, "5").statoTesto, "chiuso");
});

test("frequenza: impression diviso persone raggiunte, nulla senza copertura", () => {
  assert.equal(frequenzaDaCopertura({ impressions: 900, approximateMemberReach: 300 }), 3);
  assert.equal(frequenzaDaCopertura({ impressions: 900 }), null);
  assert.equal(frequenzaDaCopertura(undefined), null);
});
