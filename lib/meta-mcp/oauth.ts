// Accesso dell'app al server MCP di Meta Ads (OAuth 2.1 come da specifica MCP), con il SDK ufficiale MCP.
// 1. avviaCollegamento: l'app si registra presso Meta (registrazione automatica, la prima volta) e prepara
//    l'indirizzo della pagina di accesso di Meta, con PKCE e un "state" casuale.
// 2. Il titolare entra con il suo account Meta e approva i permessi di SOLA LETTURA.
// 3. completaCollegamento: Meta rimanda all'app con un codice, che si scambia con i token (salvati cifrati).
// 4. tokenValido: restituisce il token per usare il server; poco prima della scadenza lo rinnova da solo.
import { randomBytes } from "node:crypto";
import { auth, type OAuthClientProvider, type OAuthDiscoveryState } from "@modelcontextprotocol/sdk/client/auth.js";
import type { OAuthClientInformationMixed, OAuthClientMetadata, OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import { META_MCP_SCOPE, META_MCP_URL, metaAppId } from "./config";
import { cancellaStatoMetaMcp, leggiStatoMetaMcp, modificaStatoMetaMcp, type StatoMetaMcp } from "./store";

const DURATA_ACCESSO_MS = 10 * 60 * 1000; // tempo per completare l'accesso su Meta
const MARGINE_RINNOVO_MS = 5 * 60 * 1000; // il token si rinnova 5 minuti prima della scadenza

// Collega il SDK MCP al nostro stato salvato. In modo "sfondo" (rinnovo automatico) non avvia mai un nuovo
// accesso interattivo: se il rinnovo non riesce, il titolare dovrà ricollegare Meta dalle Impostazioni.
class ProviderMeta implements OAuthClientProvider {
  urlAccesso?: URL;
  verificatore?: string;

  constructor(
    private stato: StatoMetaMcp,
    private ritorno: string,
    private statoOAuth?: string
  ) {}

  get redirectUrl() {
    return this.ritorno;
  }
  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: "SalesProcess Insights",
      redirect_uris: [this.ritorno],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none", // client pubblico: niente segreto, protetto da PKCE
      scope: META_MCP_SCOPE,
    };
  }
  state() {
    return this.statoOAuth ?? randomBytes(24).toString("base64url");
  }
  // L'app Meta del titolare (META_APP_ID) fa da client già registrato: niente registrazione automatica
  clientInformation() {
    const id = metaAppId();
    if (!id) return this.stato.client;
    return this.stato.client?.client_id === id ? this.stato.client : { client_id: id };
  }
  saveClientInformation(info: OAuthClientInformationMixed) {
    this.stato.client = info;
    this.stato.redirectUrl = this.ritorno;
  }
  tokens() {
    return this.stato.tokens;
  }
  saveTokens(tokens: OAuthTokens) {
    this.stato.tokens = tokens;
    this.stato.scadeIl = tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined;
  }
  redirectToAuthorization(url: URL) {
    this.urlAccesso = url;
  }
  saveCodeVerifier(verificatore: string) {
    this.verificatore = verificatore;
  }
  codeVerifier() {
    if (!this.stato.flusso) throw new Error("Nessun accesso a Meta in corso");
    return this.stato.flusso.codeVerifier;
  }
  discoveryState() {
    return this.stato.discovery;
  }
  saveDiscoveryState(discovery: OAuthDiscoveryState) {
    this.stato.discovery = discovery;
  }
  invalidateCredentials(cosa: "all" | "client" | "tokens" | "verifier" | "discovery") {
    if (cosa === "all" || cosa === "client") delete this.stato.client;
    if (cosa === "all" || cosa === "tokens") {
      delete this.stato.tokens;
      delete this.stato.scadeIl;
    }
    if (cosa === "all" || cosa === "discovery") delete this.stato.discovery;
  }
}

// Indirizzo della pagina di accesso di Meta. Il collegamento precedente (se c'è) resta valido finché il nuovo non è completo.
export async function avviaCollegamento(ritorno: string): Promise<URL> {
  if (!metaAppId()) throw new Error("manca l'ID dell'app Meta (META_APP_ID).");
  let url: URL | undefined;
  await modificaStatoMetaMcp(async (stato) => {
    if (stato.client?.client_id !== metaAppId()) delete stato.client; // app Meta cambiata
    stato.redirectUrl = ritorno; // serve anche per i rinnovi del token
    const tokenPrecedenti = { tokens: stato.tokens, scadeIl: stato.scadeIl };
    delete stato.tokens; // senza token il SDK prepara un nuovo accesso invece di rinnovare
    const statoOAuth = randomBytes(24).toString("base64url");
    const provider = new ProviderMeta(stato, ritorno, statoOAuth);
    const esito = await auth(provider, { serverUrl: META_MCP_URL, scope: META_MCP_SCOPE });
    Object.assign(stato, tokenPrecedenti);
    if (esito !== "REDIRECT" || !provider.urlAccesso || !provider.verificatore) {
      throw new Error("Meta non ha restituito la pagina di accesso");
    }
    stato.flusso = { state: statoOAuth, codeVerifier: provider.verificatore, creatoIl: Date.now() };
    url = provider.urlAccesso;
  });
  return url!;
}

// Ritorno da Meta: controllo dello "state" (protegge da richieste contraffatte) e scambio del codice con i token
export async function completaCollegamento(codice: string, statoOAuth: string, ritorno: string) {
  await modificaStatoMetaMcp(async (stato) => {
    const flusso = stato.flusso;
    if (!flusso || flusso.state !== statoOAuth || Date.now() - flusso.creatoIl > DURATA_ACCESSO_MS) {
      throw new Error("Accesso a Meta scaduto o non valido: riprova da Impostazioni.");
    }
    const provider = new ProviderMeta(stato, ritorno);
    await auth(provider, { serverUrl: META_MCP_URL, authorizationCode: codice, scope: META_MCP_SCOPE });
    delete stato.flusso;
    delete stato.ultimoErrore;
    stato.collegatoIl = new Date().toISOString();
  });
}

export type TokenMeta = { esito: "ok"; token: string } | { esito: "non-collegato" | "scaduto" };

// Token di accesso valido, rinnovato se sta per scadere
export async function tokenValido(): Promise<TokenMeta> {
  const stato = await leggiStatoMetaMcp();
  if (!stato.tokens?.access_token) return { esito: "non-collegato" };
  if (!stato.scadeIl || stato.scadeIl - Date.now() > MARGINE_RINNOVO_MS) return { esito: "ok", token: stato.tokens.access_token };
  if (!stato.tokens.refresh_token || !stato.redirectUrl) return { esito: "scaduto" };

  let token: string | undefined;
  try {
    await modificaStatoMetaMcp(async (s) => {
      // Nel frattempo potrebbe averlo già rinnovato un'altra richiesta
      if (s.tokens && s.scadeIl && s.scadeIl - Date.now() > MARGINE_RINNOVO_MS) {
        token = s.tokens.access_token;
        return;
      }
      const provider = new ProviderMeta(s, s.redirectUrl!);
      const esito = await auth(provider, { serverUrl: META_MCP_URL, scope: META_MCP_SCOPE });
      if (esito === "AUTHORIZED") token = s.tokens?.access_token;
      else s.ultimoErrore = { il: new Date().toISOString(), messaggio: "Il collegamento a Meta è scaduto: collegalo di nuovo." };
    });
  } catch {
    return { esito: "scaduto" };
  }
  return token ? { esito: "ok", token } : { esito: "scaduto" };
}

export async function registraErroreMeta(messaggio: string) {
  await modificaStatoMetaMcp((s) => {
    s.ultimoErrore = { il: new Date().toISOString(), messaggio };
    delete s.flusso;
  });
}

// Scollega: l'app dimentica registrazione e token (su Meta l'accesso si può revocare anche dalle impostazioni dell'account)
export function scollegaMeta() {
  return cancellaStatoMetaMcp();
}
