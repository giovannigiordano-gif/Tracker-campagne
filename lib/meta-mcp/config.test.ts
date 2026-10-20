// Test della scelta degli strumenti Meta che l'AI può usare (solo lettura).
// Si lanciano con: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { classificaStrumenti, META_MCP_SCOPE } from "./config";

test("abilita solo gli strumenti di lettura dell'elenco", () => {
  const { abilitati, esclusi } = classificaStrumenti([
    { name: "ads_get_ad_entities" },
    { name: "ads_get_ad_accounts" },
    { name: "ads_create_campaign" },
    { name: "ads_activate_entity" },
    { name: "ads_delete_custom_audience" },
  ]);
  assert.deepEqual(abilitati, ["ads_get_ad_accounts", "ads_get_ad_entities"]);
  assert.equal(esclusi, 3);
});

test("uno strumento nuovo di Meta resta spento finché non lo approviamo", () => {
  const { abilitati } = classificaStrumenti([{ name: "ads_strumento_nuovo_di_lettura" }]);
  assert.deepEqual(abilitati, []);
});

test("se Meta segnala uno strumento dell'elenco come modifica, resta spento", () => {
  const { abilitati } = classificaStrumenti([
    { name: "ads_get_ad_entities", annotations: { readOnlyHint: false } },
    { name: "ads_get_errors", annotations: { destructiveHint: true } },
    { name: "ads_get_ad_accounts", annotations: { readOnlyHint: true } },
  ]);
  assert.deepEqual(abilitati, ["ads_get_ad_accounts"]);
});

test("i permessi chiesti a Meta non includono la scrittura", () => {
  const permessi = META_MCP_SCOPE.split(" ");
  assert.ok(permessi.includes("ads_read"));
  for (const scrittura of ["ads_management", "business_management", "catalog_management", "pages_manage_ads"]) {
    assert.ok(!permessi.includes(scrittura), scrittura);
  }
});
