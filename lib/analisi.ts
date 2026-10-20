// Analisi scritte da Claude (tramite il connettore) e salvate nell'app: un file per cliente nell'archivio,
// "reports/<locationId>.json" (data/ in locale, Vercel Blob cifrato online). Si tengono le ultime 50.
// Contengono solo testo scritto a partire da dati aggregati: nessun dato personale dei contatti.
// (PROGETTO.md prevedeva un file .md per analisi: online un solo file per cliente consuma meno scritture.)
import { randomBytes } from "node:crypto";
import { archivio } from "./archivio";

export type Analisi = {
  id: string;
  creataIl: string; // ISO
  titolo: string;
  periodo: string; // es. "Dal 21/09/2026 al 20/10/2026"
  testo: string; // markdown
  autore: string; // es. "Claude (connettore)"
};

export const MASSIMO_ANALISI = 50;
export const MASSIMO_CARATTERI = 60_000;

const nomeFile = (locationId: string) => {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(locationId)) throw new Error("Cliente non valido");
  return `reports/${locationId}.json`;
};

// Dalla più recente alla più vecchia
export async function leggiAnalisi(locationId: string): Promise<Analisi[]> {
  const elenco = await archivio.leggi<Analisi[]>(nomeFile(locationId), []);
  return [...elenco].sort((a, b) => b.creataIl.localeCompare(a.creataIl));
}

export async function salvaAnalisi(locationId: string, dati: Omit<Analisi, "id" | "creataIl">): Promise<Analisi> {
  const nuova: Analisi = {
    id: `${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}-${randomBytes(3).toString("hex")}`,
    creataIl: new Date().toISOString(),
    titolo: dati.titolo.trim().slice(0, 140) || "Analisi",
    periodo: dati.periodo.trim().slice(0, 140),
    testo: dati.testo.slice(0, MASSIMO_CARATTERI),
    autore: dati.autore,
  };
  await archivio.modifica<Analisi[]>(nomeFile(locationId), [], (elenco) =>
    [nuova, ...elenco].sort((a, b) => b.creataIl.localeCompare(a.creataIl)).slice(0, MASSIMO_ANALISI)
  );
  return nuova;
}

export async function eliminaAnalisi(locationId: string, id: string) {
  await archivio.modifica<Analisi[]>(nomeFile(locationId), [], (elenco) => elenco.filter((a) => a.id !== id));
}
