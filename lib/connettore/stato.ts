// Stato del connettore per Claude, nell'archivio (data/ in locale, Vercel Blob online): "secrets/connettore.json".
// Contiene solo la "generazione" dei token (incrementarla scollega Claude) e la data dell'ultimo collegamento.
// Nessun token: quelli sono firmati e non si salvano (vedi token.ts).
import { archivio } from "../archivio";
import { configAccesso } from "../accesso";
import type { Chiavi } from "./token";

const NOME = "secrets/connettore.json";

export type StatoConnettore = { generazione: number; ultimoCollegamento: string | null };

const VUOTO: StatoConnettore = { generazione: 1, ultimoCollegamento: null };

export async function leggiStato(): Promise<StatoConnettore> {
  return { ...VUOTO, ...(await archivio.leggi<Partial<StatoConnettore>>(NOME, VUOTO)) };
}

// Una scrittura per collegamento (rara): sui limiti del piano Hobby di Vercel pesa poco
export async function registraCollegamento() {
  await archivio.modifica<StatoConnettore>(NOME, VUOTO, (s) => ({ ...VUOTO, ...s, ultimoCollegamento: new Date().toISOString() }));
}

// Annulla tutti i token già dati a Claude: per usare di nuovo il connettore bisogna ricollegarlo
export async function scollegaClaude() {
  await archivio.modifica<StatoConnettore>(NOME, VUOTO, (s) => ({ generazione: (s.generazione ?? 1) + 1, ultimoCollegamento: null }));
}

// Chiavi per firmare e verificare i token. Null se l'app non ha password e segreto: senza, niente connettore.
// In locale senza password (accesso libero) il connettore resta spento: deve funzionare solo online e protetto.
export async function chiaviConnettore(): Promise<Chiavi | null> {
  const config = configAccesso();
  if (config.stato !== "pronto") return null;
  const { generazione } = await leggiStato();
  return { segreto: config.segreto, password: config.password, generazione };
}
