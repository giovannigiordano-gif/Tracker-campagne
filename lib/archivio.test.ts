// Test dell'archivio dei dati: file in locale e Vercel Blob (con un finto spazio Blob in memoria).
// Si lanciano con: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { BlobPreconditionFailedError } from "@vercel/blob";
import { creaArchivioBlob, creaArchivioFile, type ClientBlob } from "./archivio";

process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");

// Finto spazio Blob privato: conserva testo ed ETag, rifiuta le scritture con un ETag superato
function spazioFinto() {
  const voci = new Map<string, { testo: string; etag: string }>();
  let versione = 0;
  const conteggi = { get: 0, put: 0 };
  let primaDiScrivere: (() => void) | null = null; // per simulare un altro salvataggio nel mezzo
  const client = {
    async get(pathname: string) {
      conteggi.get++;
      const v = voci.get(pathname);
      if (!v) return null;
      return {
        statusCode: 200,
        stream: new Response(v.testo).body,
        headers: new Headers(),
        blob: { etag: `W/${v.etag}`, pathname, contentType: "text/plain", size: v.testo.length }, // come Vercel con risposta compressa
      };
    },
    async put(pathname: string, testo: string, opzioni: { ifMatch?: string }) {
      conteggi.put++;
      if (primaDiScrivere) {
        const f = primaDiScrivere;
        primaDiScrivere = null;
        f();
      }
      const attuale = voci.get(pathname);
      if (opzioni.ifMatch && attuale?.etag !== opzioni.ifMatch) {
        // Vercel a volte lo segnala come errore generico: l'archivio deve riconoscerlo lo stesso
        throw conteggi.put % 2 ? new BlobPreconditionFailedError() : new Error("Vercel Blob: Precondition failed: ETag mismatch.");
      }
      const etag = `"v${++versione}"`;
      voci.set(pathname, { testo, etag });
      return { pathname, etag };
    },
    async del(pathname: string) {
      voci.delete(pathname);
    },
  };
  return {
    client: client as unknown as ClientBlob,
    voci,
    conteggi,
    simulaAltroSalvataggio: (f: () => void) => (primaDiScrivere = f),
  };
}

test("archivio su file: legge il predefinito, poi quello che ha salvato", async () => {
  const archivio = creaArchivioFile(mkdtempSync(path.join(tmpdir(), "archivio-")));
  assert.deepEqual(await archivio.leggi("secrets/prova.json", { n: 0 }), { n: 0 });
  await archivio.modifica("secrets/prova.json", { n: 0 }, (v) => ({ n: v.n + 1 }));
  await archivio.modifica("secrets/prova.json", { n: 0 }, (v) => ({ n: v.n + 1 }));
  assert.deepEqual(await archivio.leggi("secrets/prova.json", { n: 0 }), { n: 2 });
  await archivio.cancella("secrets/prova.json");
  assert.deepEqual(await archivio.leggi("secrets/prova.json", { n: 0 }), { n: 0 });
});

test("archivio Blob: salva cifrato, rilegge in chiaro", async () => {
  const { client, voci } = spazioFinto();
  const archivio = creaArchivioBlob(client);
  await archivio.modifica("accounts.json", [] as string[], (l) => [...l, "cliente di prova"]);
  const salvato = voci.get("dati/accounts.json");
  assert.ok(salvato);
  assert.ok(!salvato.testo.includes("cliente di prova"), "sul Blob il testo deve essere cifrato");
  assert.deepEqual(await creaArchivioBlob(client).leggi("accounts.json", []), ["cliente di prova"]);
});

test("archivio Blob: se qualcun altro salva nel mezzo, rilegge e non perde nessuna modifica", async () => {
  const spazio = spazioFinto();
  const io = creaArchivioBlob(spazio.client);
  const collaboratore = creaArchivioBlob(spazio.client);
  await io.modifica("lista.json", [] as string[], () => ["a"]);
  // Mentre "io" sto salvando "b", il collaboratore salva "c"
  spazio.simulaAltroSalvataggio(() => {
    spazio.simulaAltroSalvataggio(() => {}); // il salvataggio del collaboratore non viene interrotto
    void collaboratore.modifica("lista.json", [] as string[], (l) => [...l, "c"]);
  });
  await io.modifica("lista.json", [] as string[], (l) => [...l, "b"]);
  await new Promise((r) => setTimeout(r, 10));
  const finale = await creaArchivioBlob(spazio.client).leggi("lista.json", [] as string[]);
  assert.deepEqual([...finale].sort(), ["a", "b", "c"]);
});

test("archivio Blob: letture ravvicinate servite dalla memoria", async () => {
  const spazio = spazioFinto();
  const archivio = creaArchivioBlob(spazio.client);
  await archivio.modifica("accounts.json", [] as string[], () => ["x"]);
  const prima = spazio.conteggi.get;
  await archivio.leggi("accounts.json", []);
  await archivio.leggi("accounts.json", []);
  assert.equal(spazio.conteggi.get, prima, "dopo un salvataggio le letture non devono tornare sul Blob");
});

test("archivio Blob: chi legge non può modificare per sbaglio la copia in memoria", async () => {
  const archivio = creaArchivioBlob(spazioFinto().client);
  await archivio.modifica("oggetto.json", { a: 1 }, () => ({ a: 1 }));
  const letto = await archivio.leggi("oggetto.json", { a: 0 });
  letto.a = 99;
  assert.deepEqual(await archivio.leggi("oggetto.json", { a: 0 }), { a: 1 });
});

test("archivio Blob: senza dati restituisce il predefinito; cancella toglie i dati", async () => {
  const archivio = creaArchivioBlob(spazioFinto().client);
  assert.deepEqual(await archivio.leggi("vuoto.json", { vuoto: true }), { vuoto: true });
  await archivio.modifica("da-togliere.json", 0, () => 5);
  await archivio.cancella("da-togliere.json");
  assert.equal(await creaArchivioBlob(spazioFinto().client).leggi("da-togliere.json", 0), 0);
});

test("archivio Blob: una seconda modifica funziona anche con l'ETag \"debole\" restituito in lettura", async () => {
  const archivio = creaArchivioBlob(spazioFinto().client);
  await archivio.modifica("contatore.json", 0, (n) => n + 1);
  await archivio.modifica("contatore.json", 0, (n) => n + 1);
  await archivio.modifica("contatore.json", 0, (n) => n + 1);
  assert.equal(await archivio.leggi("contatore.json", 0), 3);
});
