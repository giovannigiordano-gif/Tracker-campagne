// Lettura e controllo della richiesta di collegamento che Claude apre nel browser (/oauth/autorizza).
// Funzione pura (testata): i controlli sul client (documento CIMD) sono in client.ts.
import { indirizzoMcp } from "./indirizzi";

export type RichiestaAutorizzazione = {
  clientId: string;
  ritorno: string; // redirect_uri
  challenge: string; // code_challenge (PKCE S256)
  stato: string | null; // state, da restituire tale e quale
  risorsa: string; // indirizzo /mcp di questa app
};

export const CAMPI_AUTORIZZAZIONE = ["response_type", "client_id", "redirect_uri", "code_challenge", "code_challenge_method", "state", "scope", "resource"] as const;

type Leggi = (nome: string) => string | null;

export function leggiRichiesta(leggi: Leggi, base: string): { ok: true; richiesta: RichiestaAutorizzazione } | { ok: false; errore: string } {
  const clientId = leggi("client_id");
  const ritorno = leggi("redirect_uri");
  if (!clientId || !ritorno) return { ok: false, errore: "Richiesta incompleta: apri il collegamento da Claude." };
  if (leggi("response_type") !== "code") return { ok: false, errore: "Tipo di richiesta non supportato." };
  const challenge = leggi("code_challenge");
  if (!challenge || !/^[A-Za-z0-9_-]{43}$/.test(challenge) || leggi("code_challenge_method") !== "S256") {
    return { ok: false, errore: "Richiesta senza protezione PKCE: collegamento bloccato." };
  }
  // Se Claude indica la risorsa, deve essere proprio l'indirizzo /mcp di questa app
  const risorsa = leggi("resource") ?? indirizzoMcp(base);
  if (risorsa.replace(/\/$/, "") !== indirizzoMcp(base)) return { ok: false, errore: "La richiesta è per un altro indirizzo: collegamento bloccato." };
  return { ok: true, richiesta: { clientId, ritorno, challenge, stato: leggi("state"), risorsa: indirizzoMcp(base) } };
}

// Indirizzo a cui rimandare Claude con il codice (o con l'errore)
export function indirizzoRisposta(ritorno: string, valori: Record<string, string | null>) {
  const url = new URL(ritorno);
  for (const [k, v] of Object.entries(valori)) if (v !== null) url.searchParams.set(k, v);
  return url.toString();
}
