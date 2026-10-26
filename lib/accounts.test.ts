// Test della regola "un account LinkedIn appartiene a un solo cliente" (dati di fantasia)
import assert from "node:assert/strict";
import { test } from "node:test";
import { conflittiLinkedIn, type Account } from "./accounts";

const cliente = (locationId: string, name: string, linkedinAdAccountIds: string[]): Account => ({
  locationId,
  name,
  metaAdAccountIds: [],
  linkedinAdAccountIds,
  currency: "EUR",
  timezone: "Europe/Rome",
  notes: "",
  active: true,
  thresholds: {},
});

const lista = [cliente("loc1", "Cliente Uno", ["500100"]), cliente("loc2", "Cliente Due", ["500200", "500300"])];

test("un account LinkedIn già di un altro cliente è un conflitto, con il nome di quel cliente", () => {
  assert.deepEqual(conflittiLinkedIn(lista, { locationId: "loc1", linkedinAdAccountIds: ["500100", "500300"] }), [
    { id: "500300", cliente: "Cliente Due" },
  ]);
});

test("gli account del cliente stesso e quelli liberi non sono conflitti", () => {
  assert.deepEqual(conflittiLinkedIn(lista, { locationId: "loc2", linkedinAdAccountIds: ["500200", "500300", "500999"] }), []);
  assert.deepEqual(conflittiLinkedIn(lista, { locationId: "loc3", linkedinAdAccountIds: [] }), []);
});

test("vale anche per un cliente nuovo e anche se l'altro cliente non è attivo", () => {
  const conInattivo = [...lista, { ...cliente("loc4", "Cliente Fermo", ["500400"]), active: false }];
  assert.deepEqual(conflittiLinkedIn(conInattivo, { locationId: "loc9", linkedinAdAccountIds: ["500400"] }), [
    { id: "500400", cliente: "Cliente Fermo" },
  ]);
});
