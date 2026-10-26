// Accesso a LinkedIn Ads con OAuth 2.0 (Authorization Code Flow a 3 parti), SOLA LETTURA.
// Fonte: learn.microsoft.com/linkedin/shared/authentication (authorization-code-flow, programmatic-refresh-tokens),
// verificata il 2026-10-26:
// - pagina di consenso https://www.linkedin.com/oauth/v2/authorization (response_type=code, client_id,
//   redirect_uri, state, scope separati da spazio);
// - scambio e rinnovo su https://www.linkedin.com/oauth/v2/accessToken (form urlencoded, con client_secret);
// - il token dura 60 giorni; il token di rinnovo (app dell'Advertising API) dura 365 giorni dal primo accesso.
// Permessi chiesti: solo r_ads (account e campagne) e r_ads_reporting (statistiche).
import { modificaStatoLinkedIn, leggiStatoLinkedIn, credenzialiDa } from "./store";

export const LINKEDIN_PERMESSI = ["r_ads", "r_ads_reporting"];
const AUTORIZZAZIONE = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN = "https://www.linkedin.com/oauth/v2/accessToken";
const RINNOVA_PRIMA_MS = 7 * 24 * 60 * 60 * 1000; // si rinnova quando mancano meno di 7 giorni alla scadenza

export class ErroreCollegamento extends Error {}

export async function urlConsenso(ritorno: string, state: string): Promise<string> {
  const cred = credenzialiDa(await leggiStatoLinkedIn());
  if (!cred) throw new ErroreCollegamento("Mancano Client ID e Client Secret dell'app LinkedIn: inseriscili in Impostazioni.");
  const u = new URL(AUTORIZZAZIONE);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", cred.clientId);
  u.searchParams.set("redirect_uri", ritorno);
  u.searchParams.set("state", state);
  u.searchParams.set("scope", LINKEDIN_PERMESSI.join(" "));
  return u.toString();
}

type RispostaToken = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

async function chiediToken(parametri: Record<string, string>): Promise<RispostaToken> {
  const r = await fetch(TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(parametri),
    cache: "no-store",
  });
  const j = (await r.json().catch(() => ({}))) as RispostaToken;
  if (!r.ok || !j.access_token) throw new ErroreCollegamento(`LinkedIn ha rifiutato la richiesta (${j.error_description ?? j.error ?? `risposta ${r.status}`}).`);
  return j;
}

function salvaToken(j: RispostaToken, ora: number, primoAccesso: boolean) {
  return modificaStatoLinkedIn((s) => {
    s.token = {
      accesso: j.access_token!,
      scadeIl: ora + (j.expires_in ?? 60 * 24 * 3600) * 1000,
      rinnovo: j.refresh_token ?? s.token?.rinnovo,
      rinnovoScadeIl: j.refresh_token_expires_in ? ora + j.refresh_token_expires_in * 1000 : s.token?.rinnovoScadeIl,
      permessi: j.scope?.split(/[\s,]+/).filter(Boolean) ?? LINKEDIN_PERMESSI,
    };
    if (primoAccesso) s.collegatoIl = new Date(ora).toISOString();
    delete s.ultimoErrore;
  });
}

// Scambio del codice ricevuto al ritorno da LinkedIn
export async function completaAccesso(codice: string, ritorno: string) {
  const cred = credenzialiDa(await leggiStatoLinkedIn());
  if (!cred) throw new ErroreCollegamento("Mancano le credenziali dell'app LinkedIn.");
  const j = await chiediToken({
    grant_type: "authorization_code",
    code: codice,
    client_id: cred.clientId,
    client_secret: cred.clientSecret,
    redirect_uri: ritorno,
  });
  await salvaToken(j, Date.now(), true);
}

export type EsitoToken = { esito: "ok"; token: string } | { esito: "non-collegato" } | { esito: "scaduto" };

// Token valido per le letture; se sta per scadere lo rinnova con il token di rinnovo
export async function tokenLinkedIn(): Promise<EsitoToken> {
  const s = await leggiStatoLinkedIn();
  if (!s.token?.accesso) return { esito: "non-collegato" };
  const ora = Date.now();
  if (s.token.scadeIl - ora > RINNOVA_PRIMA_MS) return { esito: "ok", token: s.token.accesso };

  const cred = credenzialiDa(s);
  const rinnovoValido = s.token.rinnovo && (!s.token.rinnovoScadeIl || s.token.rinnovoScadeIl > ora);
  if (cred && rinnovoValido) {
    try {
      const j = await chiediToken({
        grant_type: "refresh_token",
        refresh_token: s.token.rinnovo!,
        client_id: cred.clientId,
        client_secret: cred.clientSecret,
      });
      await salvaToken(j, ora, false);
      return { esito: "ok", token: j.access_token! };
    } catch (e) {
      await registraErroreLinkedIn(`Rinnovo dell'accesso non riuscito: ${(e as Error).message}`).catch(() => {});
    }
  }
  // Senza rinnovo: il token vale fino alla scadenza, poi serve un nuovo collegamento
  return s.token.scadeIl > ora ? { esito: "ok", token: s.token.accesso } : { esito: "scaduto" };
}

export function registraErroreLinkedIn(messaggio: string) {
  return modificaStatoLinkedIn((s) => {
    s.ultimoErrore = { il: new Date().toISOString(), messaggio };
  });
}

// L'app dimentica i token (le credenziali restano, per ricollegarsi). Su LinkedIn non cambia nulla.
export function scollegaLinkedIn() {
  return modificaStatoLinkedIn((s) => {
    delete s.token;
    delete s.collegatoIl;
    delete s.ultimaVerifica;
    delete s.ultimoErrore;
  });
}

export function salvaCredenzialiLinkedIn(clientId: string, clientSecret: string) {
  return modificaStatoLinkedIn((s) => {
    const cambiate = s.credenziali?.clientId !== clientId;
    s.credenziali = { clientId, clientSecret, salvateIl: new Date().toISOString() };
    // Con un'altra app LinkedIn i token di prima non valgono più
    if (cambiate) {
      delete s.token;
      delete s.collegatoIl;
      delete s.ultimaVerifica;
    }
  });
}
