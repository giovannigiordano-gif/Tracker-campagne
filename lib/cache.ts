// Cache in due livelli: memoria (tutto) + file JSON in data/cache/ (solo dati aggregati).
// I contatti grezzi stanno SOLO in memoria: per loro si usa persist: false (il default).
import { promises as fs } from "node:fs";
import { dataPath, deleteFile, readJson, writeJsonAtomic } from "./files";

// Scadenze previste dal progetto
export const TTL = {
  oggi: 15 * 60 * 1000, // dati che includono la giornata di oggi
  passato: 24 * 60 * 60 * 1000, // giorni già conclusi
  anagrafica: 6 * 60 * 60 * 1000, // elenchi sub-account, pipeline, campi personalizzati
};

// Scadenza adatta a un intervallo di date: breve se arriva fino a oggi
export function ttlPerIntervallo(fine: Date) {
  return Date.now() - fine.getTime() < 24 * 60 * 60 * 1000 ? TTL.oggi : TTL.passato;
}

type Voce<T> = { value: T; updatedAt: number; expiresAt: number };

// Salvate su globalThis così sopravvivono ai ricaricamenti del codice in sviluppo
const g = globalThis as unknown as {
  __cacheMemoria?: Map<string, Voce<unknown>>;
  __cacheInCorso?: Map<string, Promise<Voce<unknown>>>;
};
const memoria: Map<string, Voce<unknown>> = (g.__cacheMemoria ??= new Map());
const inCorso: Map<string, Promise<Voce<unknown>>> = (g.__cacheInCorso ??= new Map());

function fileDellaChiave(key: string) {
  return dataPath("cache", `${key.replace(/[^a-zA-Z0-9_.-]/g, "_")}.json`);
}

export type Cached<T> = { value: T; updatedAt: number };

export async function get<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
  { persist = false }: { persist?: boolean } = {},
): Promise<Cached<T>> {
  const adesso = Date.now();

  const inMemoria = memoria.get(key) as Voce<T> | undefined;
  if (inMemoria && inMemoria.expiresAt > adesso) return inMemoria;

  if (persist) {
    const suFile = await readJson<Voce<T> | null>(fileDellaChiave(key), null);
    if (suFile && suFile.expiresAt > adesso) {
      memoria.set(key, suFile);
      return suFile;
    }
  }

  // Se la stessa richiesta è già in corso, si aspetta quella invece di rifarla
  const giaInCorso = inCorso.get(key) as Promise<Voce<T>> | undefined;
  if (giaInCorso) return giaInCorso;

  const promessa = (async () => {
    const value = await fetcher();
    const voce: Voce<T> = { value, updatedAt: Date.now(), expiresAt: Date.now() + ttl };
    memoria.set(key, voce);
    if (persist) await writeJsonAtomic(fileDellaChiave(key), voce);
    pulisciScaduti();
    return voce;
  })();
  inCorso.set(key, promessa);
  try {
    return await promessa;
  } finally {
    inCorso.delete(key);
  }
}

// Svuota la cache (tutta, o solo le chiavi che iniziano con un prefisso)
export async function invalidate(prefisso = "") {
  for (const key of memoria.keys()) if (key.startsWith(prefisso)) memoria.delete(key);
  const cartella = dataPath("cache");
  const nomePrefisso = prefisso.replace(/[^a-zA-Z0-9_.-]/g, "_");
  let files: string[] = [];
  try {
    files = await fs.readdir(cartella);
  } catch {
    return;
  }
  await Promise.all(
    files.filter((f) => f.startsWith(nomePrefisso)).map((f) => deleteFile(dataPath("cache", f))),
  );
}

function pulisciScaduti() {
  const adesso = Date.now();
  for (const [key, voce] of memoria) if (voce.expiresAt <= adesso) memoria.delete(key);
}
