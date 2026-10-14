// Test dei link di condivisione, su un archivio temporaneo (mai su data/).
// Si lanciano con: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { creaArchivioFile } from "./archivio";
import { creaArchivioCondivisioni } from "./condivisioni";

process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");

function archivioDiProva() {
  const cartella = mkdtempSync(path.join(tmpdir(), "condivisioni-"));
  const file = path.join(cartella, "secrets", "condivisioni.json");
  return { file, archivio: creaArchivioCondivisioni(creaArchivioFile(cartella)) };
}

test("un link creato riconosce il suo cliente e si può rileggere", async () => {
  const { archivio } = archivioDiProva();
  const codice = await archivio.crea("cliente1");
  assert.match(codice, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(await archivio.clienteDaCodice(codice), "cliente1");
  const letto = await archivio.leggi("cliente1");
  assert.equal(letto?.codice, codice);
  assert.ok(letto?.creatoIl);
});

test("un nuovo link sostituisce il vecchio, che smette di funzionare", async () => {
  const { archivio } = archivioDiProva();
  const vecchio = await archivio.crea("cliente1");
  const nuovo = await archivio.crea("cliente1");
  assert.notEqual(vecchio, nuovo);
  assert.equal(await archivio.clienteDaCodice(vecchio), null);
  assert.equal(await archivio.clienteDaCodice(nuovo), "cliente1");
});

test("un link disattivato non funziona più e non si rilegge", async () => {
  const { archivio } = archivioDiProva();
  const codice = await archivio.crea("cliente1");
  await archivio.disattiva("cliente1");
  assert.equal(await archivio.clienteDaCodice(codice), null);
  assert.equal(await archivio.leggi("cliente1"), null);
});

test("i link di clienti diversi restano separati", async () => {
  const { archivio } = archivioDiProva();
  const a = await archivio.crea("clienteA");
  const b = await archivio.crea("clienteB");
  await archivio.disattiva("clienteA");
  assert.equal(await archivio.clienteDaCodice(a), null);
  assert.equal(await archivio.clienteDaCodice(b), "clienteB");
});

test("codici malformati o sconosciuti vengono rifiutati", async () => {
  const { archivio } = archivioDiProva();
  await archivio.crea("cliente1");
  for (const codice of ["", "corto", "x".repeat(43), "a/b".padEnd(43, "c"), "z".repeat(200)]) {
    assert.equal(await archivio.clienteDaCodice(codice), null, codice);
  }
});

test("sul disco il codice non è mai scritto in chiaro", async () => {
  const { archivio, file } = archivioDiProva();
  const codice = await archivio.crea("cliente1");
  assert.ok(!readFileSync(file, "utf8").includes(codice));
});

test("senza archivio non c'è nessun link", async () => {
  const { archivio } = archivioDiProva();
  assert.equal(await archivio.leggi("cliente1"), null);
  assert.equal(await archivio.clienteDaCodice("a".repeat(43)), null);
});
