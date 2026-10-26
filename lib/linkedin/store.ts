// Stato del collegamento a LinkedIn Ads: credenziali dell'app LinkedIn (Client ID e Client Secret), token,
// ultima verifica. Si salva in "secrets/linkedin.json" nell'archivio (data/ in locale, Vercel Blob online) e il
// contenuto è cifrato con ENCRYPTION_KEY. Contiene segreti: non va mai mandato al browser.
// Al browser arriva solo riepilogoLinkedIn(). Le credenziali possono arrivare anche da LINKEDIN_CLIENT_ID e
// LINKEDIN_CLIENT_SECRET nelle variabili d'ambiente, che hanno la precedenza.
import { archivio } from "../archivio";
import { decrypt, encrypt } from "../crypto";
import type { AccountLinkedIn } from "./normalize";

const NOME = "secrets/linkedin.json";

export type VerificaLinkedIn = { il: string; ok: boolean; messaggio: string; account: AccountLinkedIn[] };

export type StatoLinkedIn = {
  credenziali?: { clientId: string; clientSecret: string; salvateIl: string };
  token?: {
    accesso: string;
    scadeIl: number; // ms
    rinnovo?: string; // token di rinnovo (dura un anno dal primo collegamento)
    rinnovoScadeIl?: number;
    permessi: string[];
  };
  collegatoIl?: string;
  ultimaVerifica?: VerificaLinkedIn;
  ultimoErrore?: { il: string; messaggio: string };
};

type Cifrato = { cifrato?: string };

export async function leggiStatoLinkedIn(): Promise<StatoLinkedIn> {
  const { cifrato } = await archivio.leggi<Cifrato>(NOME, {});
  return cifrato ? (JSON.parse(decrypt(cifrato)) as StatoLinkedIn) : {};
}

// Legge, modifica e risalva lo stato, una modifica alla volta (online: senza sovrascrivere salvataggi altrui)
export async function modificaStatoLinkedIn(fn: (stato: StatoLinkedIn) => void | Promise<void>): Promise<StatoLinkedIn> {
  let risultato: StatoLinkedIn = {};
  await archivio.modifica<Cifrato>(NOME, {}, async ({ cifrato }) => {
    const stato: StatoLinkedIn = cifrato ? JSON.parse(decrypt(cifrato)) : {};
    await fn(stato);
    risultato = stato;
    return { cifrato: encrypt(JSON.stringify(stato)) };
  });
  return risultato;
}

// Credenziali da usare: prima le variabili d'ambiente, poi quelle salvate dall'app
export function credenzialiDa(stato: StatoLinkedIn): { clientId: string; clientSecret: string; origine: "env" | "app" } | null {
  const id = process.env.LINKEDIN_CLIENT_ID?.trim();
  const segreto = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  if (id && segreto) return { clientId: id, clientSecret: segreto, origine: "env" };
  if (stato.credenziali) return { ...stato.credenziali, origine: "app" };
  return null;
}

// ---------------------------------------------------------------- riepilogo senza segreti (Impostazioni)
export type RiepilogoLinkedIn = {
  configurato: boolean; // ci sono Client ID e Client Secret
  origineCredenziali: "env" | "app" | null;
  clientIdFinale: string | null; // ultime 4 cifre del Client ID, per riconoscerlo
  collegato: boolean;
  collegatoIl: string | null;
  scadeIl: number | null;
  rinnovoFinoAl: number | null;
  permessi: string[];
  ultimaVerifica: VerificaLinkedIn | null;
  ultimoErrore: { il: string; messaggio: string } | null;
};

export async function riepilogoLinkedIn(): Promise<RiepilogoLinkedIn> {
  let s: StatoLinkedIn;
  try {
    s = await leggiStatoLinkedIn();
  } catch {
    // Succede se ENCRYPTION_KEY è cambiata dopo il salvataggio
    s = { ultimoErrore: { il: new Date().toISOString(), messaggio: "Non riesco a leggere il collegamento salvato (la chiave di cifratura è cambiata?): inserisci di nuovo le credenziali." } };
  }
  const cred = credenzialiDa(s);
  return {
    configurato: Boolean(cred),
    origineCredenziali: cred?.origine ?? null,
    clientIdFinale: cred ? cred.clientId.slice(-4) : null,
    collegato: Boolean(s.token?.accesso),
    collegatoIl: s.collegatoIl ?? null,
    scadeIl: s.token?.scadeIl ?? null,
    rinnovoFinoAl: s.token?.rinnovoScadeIl ?? null,
    permessi: s.token?.permessi ?? [],
    ultimaVerifica: s.ultimaVerifica ?? null,
    ultimoErrore: s.ultimoErrore ?? null,
  };
}
