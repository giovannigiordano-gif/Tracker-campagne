// Scambio dei token (/oauth/token): codice → token, e rinnovo. Funzione pura (testata in scambio.test.ts).
// Errori con i codici dello standard OAuth (RFC 6749): Claude riconosce "invalid_grant" e chiede di ricollegare.
import {
  creaToken,
  DURATA_ACCESSO_MS,
  DURATA_RINNOVO_MS,
  leggiToken,
  pkceValido,
  SCOPE,
  type Chiavi,
} from "./token";

export type EsitoScambio = { stato: number; corpo: Record<string, unknown> };

const errore = (codice: string, descrizione: string, stato = 400): EsitoScambio => ({
  stato,
  corpo: { error: codice, error_description: descrizione },
});

function coppiaToken(cid: string, r: string, chiavi: Chiavi, ora: number) {
  return {
    access_token: creaToken<"accesso">({ t: "accesso", cid, r, sc: SCOPE }, DURATA_ACCESSO_MS, chiavi, ora),
    token_type: "Bearer",
    expires_in: Math.floor(DURATA_ACCESSO_MS / 1000),
    refresh_token: creaToken<"rinnovo">({ t: "rinnovo", cid, r, sc: SCOPE }, DURATA_RINNOVO_MS, chiavi, ora),
    scope: SCOPE,
  };
}

export function scambiaToken(form: URLSearchParams, chiavi: Chiavi, ora = Date.now()): EsitoScambio {
  const tipo = form.get("grant_type");
  const clientId = form.get("client_id");

  if (tipo === "authorization_code") {
    const codice = leggiToken(form.get("code"), "codice", chiavi, ora);
    if (!codice) return errore("invalid_grant", "Codice non valido o scaduto");
    if (clientId && clientId !== codice.cid) return errore("invalid_grant", "Il codice appartiene a un altro client");
    if (form.get("redirect_uri") !== codice.ru) return errore("invalid_grant", "Indirizzo di ritorno diverso da quello iniziale");
    if (!pkceValido(form.get("code_verifier"), codice.cc)) return errore("invalid_grant", "Verifica PKCE non riuscita");
    const risorsa = form.get("resource");
    if (risorsa && risorsa.replace(/\/$/, "") !== codice.r) return errore("invalid_target", "Risorsa diversa da quella autorizzata");
    return { stato: 200, corpo: coppiaToken(codice.cid, codice.r, chiavi, ora) };
  }

  if (tipo === "refresh_token") {
    const rinnovo = leggiToken(form.get("refresh_token"), "rinnovo", chiavi, ora);
    if (!rinnovo) return errore("invalid_grant", "Collegamento scaduto o revocato: ricollega il connettore");
    if (clientId && clientId !== rinnovo.cid) return errore("invalid_grant", "Il token appartiene a un altro client");
    // Ogni rinnovo restituisce anche un nuovo token di rinnovo (rotazione), come chiede OAuth 2.1 per i client pubblici
    return { stato: 200, corpo: coppiaToken(rinnovo.cid, rinnovo.r, chiavi, ora) };
  }

  return errore("unsupported_grant_type", "Tipo di richiesta non supportato");
}

// Controllo del token che Claude manda a /mcp: valido, non scaduto e rilasciato per questo indirizzo
export function accessoValido(intestazione: string | null, risorsa: string, chiavi: Chiavi, ora = Date.now()) {
  const m = intestazione?.match(/^Bearer\s+(\S+)$/i);
  const dati = leggiToken(m?.[1], "accesso", chiavi, ora);
  return dati !== null && dati.r === risorsa;
}
