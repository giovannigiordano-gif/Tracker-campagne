// Archivio dei dati dell'app (clienti, token cifrati, link condivisi): un solo modo di leggere e scrivere,
// due posti dove salvare.
// - In locale: file JSON nella cartella data/ (scrittura atomica, una scrittura alla volta), come sempre.
// - Su Vercel: Vercel Blob PRIVATO (Vercel non conserva i file su disco). Ogni contenuto è cifrato con
//   ENCRYPTION_KEY prima di uscire dall'app; le scritture usano l'ETag (ifMatch) così due salvataggi nello
//   stesso momento non si sovrascrivono: il secondo rilegge e riprova.
// Si sceglie da solo: Blob se lo spazio è collegato al progetto (BLOB_STORE_ID o BLOB_READ_WRITE_TOKEN),
// altrimenti i file. ARCHIVIO=file|blob nel .env forza la scelta.
import path from "node:path";
import { BlobPreconditionFailedError, del, get, put } from "@vercel/blob";
import { decrypt, encrypt } from "./crypto";
import { DATA_DIR, deleteFile, readJson, withFileLock, writeJsonAtomic } from "./files";

export type Archivio = {
  tipo: "file" | "blob" | "non-configurato";
  leggi<T>(nome: string, predefinito: T): Promise<T>;
  // Legge, modifica e riscrive in modo sicuro; restituisce il valore salvato
  modifica<T>(nome: string, predefinito: T, fn: (attuale: T) => T | Promise<T>): Promise<T>;
  cancella(nome: string): Promise<void>;
};

// ---------------------------------------------------------------- file in data/
export function creaArchivioFile(radice: string): Archivio {
  const file = (nome: string) => path.join(radice, nome);
  return {
    tipo: "file",
    leggi: (nome, predefinito) => readJson(file(nome), predefinito),
    modifica: (nome, predefinito, fn) =>
      withFileLock(file(nome), async () => {
        const nuovo = await fn(await readJson(file(nome), predefinito));
        await writeJsonAtomic(file(nome), nuovo);
        return nuovo;
      }),
    cancella: (nome) => withFileLock(file(nome), () => deleteFile(file(nome))),
  };
}

// ---------------------------------------------------------------- Vercel Blob privato
// Le sole funzioni del SDK che servono (così nei test si può usare un finto spazio Blob)
export type ClientBlob = {
  get: typeof get;
  put: typeof put;
  del: typeof del;
};

const PREFISSO = "dati/";
const MEMORIA_MS = 30_000; // letture ripetute entro 30 s servite dalla memoria: meno operazioni sul piano Hobby
const TENTATIVI = 4;

type Letto = { valore: unknown; etag: string | null; letto: number };

export function creaArchivioBlob(client: ClientBlob): Archivio {
  const memoria = new Map<string, Letto>();

  async function leggiDallOrigine<T>(nome: string, predefinito: T): Promise<{ valore: T; etag: string | null }> {
    const r = await client.get(PREFISSO + nome, { access: "private", useCache: false });
    if (!r || r.statusCode !== 200) return { valore: predefinito, etag: null };
    const testo = await new Response(r.stream).text();
    return { valore: JSON.parse(decrypt(testo)) as T, etag: r.blob.etag };
  }

  return {
    tipo: "blob",
    async leggi<T>(nome: string, predefinito: T) {
      const inMemoria = memoria.get(nome);
      if (inMemoria && Date.now() - inMemoria.letto < MEMORIA_MS) return structuredClone(inMemoria.valore) as T;
      const { valore, etag } = await leggiDallOrigine(nome, predefinito);
      memoria.set(nome, { valore, etag, letto: Date.now() });
      return structuredClone(valore);
    },

    async modifica<T>(nome: string, predefinito: T, fn: (attuale: T) => T | Promise<T>) {
      for (let tentativo = 1; ; tentativo++) {
        const { valore, etag } = await leggiDallOrigine(nome, predefinito);
        const nuovo = await fn(valore);
        try {
          const salvato = await client.put(PREFISSO + nome, encrypt(JSON.stringify(nuovo)), {
            access: "private",
            allowOverwrite: true,
            addRandomSuffix: false,
            contentType: "text/plain",
            cacheControlMaxAge: 60,
            ...(etag ? { ifMatch: etag } : {}),
          });
          memoria.set(nome, { valore: nuovo, etag: salvato.etag, letto: Date.now() });
          return structuredClone(nuovo);
        } catch (e) {
          // Qualcun altro ha salvato nel frattempo: si rilegge e si riprova
          if (e instanceof BlobPreconditionFailedError && tentativo < TENTATIVI) continue;
          throw e;
        }
      }
    },

    async cancella(nome: string) {
      await client.del(PREFISSO + nome);
      memoria.delete(nome);
    },
  };
}

// ---------------------------------------------------------------- Vercel senza spazio Blob collegato
// Letture vuote (l'app si apre), scritture con un errore che spiega cosa fare
function archivioNonConfigurato(): Archivio {
  const errore = () => {
    throw new Error("Su Vercel serve lo spazio Blob privato collegato al progetto: senza, l'app non può salvare nulla.");
  };
  return {
    tipo: "non-configurato",
    leggi: async (_nome, predefinito) => predefinito,
    modifica: async () => errore(),
    cancella: async () => errore(),
  };
}

// ---------------------------------------------------------------- archivio usato dall'app
function scegli(): Archivio {
  const forzato = process.env.ARCHIVIO?.trim();
  const blobCollegato = Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
  if (forzato === "file") return creaArchivioFile(DATA_DIR);
  if (forzato === "blob" || blobCollegato) return creaArchivioBlob({ get, put, del });
  if (process.env.VERCEL) return archivioNonConfigurato();
  return creaArchivioFile(DATA_DIR);
}

// Scelto al primo uso (le variabili d'ambiente si leggono quando l'app gira, non alla build)
const g = globalThis as unknown as { __archivio?: Archivio };
function scelto() {
  return (g.__archivio ??= scegli());
}

export const archivio: Archivio = {
  get tipo() {
    return scelto().tipo;
  },
  leggi: (nome, predefinito) => scelto().leggi(nome, predefinito),
  modifica: (nome, predefinito, fn) => scelto().modifica(nome, predefinito, fn),
  cancella: (nome) => scelto().cancella(nome),
};
