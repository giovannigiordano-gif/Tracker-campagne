// Connettore per Claude: codici e token del collegamento OAuth. Funzioni pure (testate in token.test.ts).
//
// Niente archivio per i token: su Vercel ogni richiesta può arrivare a un server diverso, quindi codici e
// token portano dentro i propri dati e sono firmati (HMAC-SHA256), come il cookie di accesso.
// Formato: "sp1.<dati in base64url>.<firma>". La chiave della firma dipende da:
// - SESSION_SECRET;
// - un'impronta di APP_PASSWORD: cambiare la password scollega Claude;
// - la "generazione" salvata nell'archivio: "Scollega Claude" in Impostazioni la incrementa e annulla tutti i token.
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const DURATA_CODICE_MS = 2 * 60_000; // il codice si scambia subito con i token
export const DURATA_ACCESSO_MS = 60 * 60_000; // 1 ora, poi Claude lo rinnova da solo
export const DURATA_RINNOVO_MS = 60 * 24 * 60 * 60_000; // 60 giorni; ogni rinnovo ne crea uno nuovo
export const SCOPE = "insights";

// Unico indirizzo di ritorno delle app di Claude (web, desktop, mobile, Cowork). Fonte: claude.com/docs/connectors/building/authentication
export const RITORNO_CLAUDE = "https://claude.ai/api/mcp/auth_callback";
// Chi può collegarsi: solo client con il documento di registrazione (CIMD) pubblicato da Anthropic
export const HOST_CLIENT_PREDEFINITI = ["claude.ai", "claude.com"];

type Comuni = {
  cid: string; // client_id (indirizzo del documento CIMD di Claude)
  r: string; // risorsa: l'indirizzo /mcp di questa app
  sc: string; // permessi concessi
  e: number; // scadenza (ms)
  n: string; // valore casuale: due token non sono mai uguali
};
export type DatiCodice = Comuni & { t: "codice"; ru: string; cc: string }; // redirect_uri e code_challenge
export type DatiAccesso = Comuni & { t: "accesso" };
export type DatiRinnovo = Comuni & { t: "rinnovo" };
export type DatiToken = DatiCodice | DatiAccesso | DatiRinnovo;
type Tipo = DatiToken["t"];
type DiTipo<T extends Tipo> = Extract<DatiToken, { t: T }>;

export type Chiavi = { segreto: string; password: string; generazione: number };

const PREFISSO = "sp1";

function chiave({ segreto, password, generazione }: Chiavi) {
  const impronta = createHash("sha256").update(password).digest("hex");
  return createHmac("sha256", segreto).update(`connettore.${impronta}.${generazione}`).digest();
}

const firma = (dati: string, chiavi: Chiavi) => createHmac("sha256", chiave(chiavi)).update(`${PREFISSO}.${dati}`).digest("base64url");

export function creaToken<T extends Tipo>(dati: Omit<DiTipo<T>, "e" | "n">, durataMs: number, chiavi: Chiavi, ora = Date.now()): string {
  const completo = { ...dati, e: ora + durataMs, n: randomBytes(9).toString("base64url") };
  const codificato = Buffer.from(JSON.stringify(completo)).toString("base64url");
  return `${PREFISSO}.${codificato}.${firma(codificato, chiavi)}`;
}

// Restituisce i dati solo se firma, tipo e scadenza sono validi; altrimenti null
export function leggiToken<T extends Tipo>(valore: string | null | undefined, tipo: T, chiavi: Chiavi, ora = Date.now()): DiTipo<T> | null {
  const parti = valore?.split(".");
  if (!parti || parti.length !== 3 || parti[0] !== PREFISSO) return null;
  const attesa = Buffer.from(firma(parti[1], chiavi));
  const ricevuta = Buffer.from(parti[2]);
  if (attesa.length !== ricevuta.length || !timingSafeEqual(attesa, ricevuta)) return null;
  try {
    const dati = JSON.parse(Buffer.from(parti[1], "base64url").toString("utf8")) as DatiToken;
    if (dati.t !== tipo || typeof dati.e !== "number" || dati.e <= ora) return null;
    return dati as DiTipo<T>;
  } catch {
    return null;
  }
}

// PKCE (RFC 7636, metodo S256): il verificatore inviato al momento dello scambio deve corrispondere alla
// "challenge" ricevuta all'inizio. Così un codice intercettato non serve a nessuno.
export function pkceValido(verificatore: string | null | undefined, challenge: string) {
  if (!verificatore || !/^[A-Za-z0-9\-._~]{43,128}$/.test(verificatore)) return false;
  const calcolata = Buffer.from(createHash("sha256").update(verificatore).digest("base64url"));
  const attesa = Buffer.from(challenge);
  return calcolata.length === attesa.length && timingSafeEqual(calcolata, attesa);
}

const LOOPBACK = new Set(["127.0.0.1", "[::1]", "localhost"]);

// Indirizzo di ritorno ammesso se è uno di quelli dichiarati dal client. Per gli indirizzi locali
// (Claude Code) la porta cambia a ogni avvio e non si confronta (RFC 8252, sezione 7.3).
export function ritornoAmmesso(richiesto: string, dichiarati: string[]) {
  if (dichiarati.includes(richiesto)) return true;
  let r: URL;
  try {
    r = new URL(richiesto);
  } catch {
    return false;
  }
  if (r.protocol !== "http:" || !LOOPBACK.has(r.hostname)) return false;
  return dichiarati.some((d) => {
    try {
      const u = new URL(d);
      return u.protocol === "http:" && u.hostname === r.hostname && u.pathname === r.pathname && u.search === r.search;
    } catch {
      return false;
    }
  });
}

// client_id ammesso: indirizzo https di uno degli host autorizzati (o di un loro sottodominio)
export function clientAmmesso(clientId: string | null | undefined, host: string[]) {
  if (!clientId) return false;
  try {
    const u = new URL(clientId);
    if (u.protocol !== "https:" || u.username || u.password || u.hash || u.pathname === "/") return false;
    return host.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export function hostClientAmmessi(valore = process.env.CONNETTORE_CLIENT_HOST) {
  const elenco = valore?.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  return elenco?.length ? elenco : HOST_CLIENT_PREDEFINITI;
}
