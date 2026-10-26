// Client dell'API Marketing di LinkedIn (https://api.linkedin.com/rest), SOLO LETTURA: solo richieste GET.
// Intestazioni obbligatorie (documentazione verificata il 2026-10-26): Authorization Bearer,
// Linkedin-Version AAAAMM (LINKEDIN_API_VERSION, predefinita 202610: le versioni durano circa un anno)
// e X-Restli-Protocol-Version 2.0.0.
// Limiti: 429 (troppi dati in 5 minuti), 500 e 503 si riprovano con attese crescenti.
import { normalizzaAccountVisibile, type AccountLinkedIn } from "./normalize";
import { tokenLinkedIn } from "./oauth";
import { queryAccount } from "./restli";
import { modificaStatoLinkedIn } from "./store";

export type TipoErroreLinkedIn = "non-collegato" | "scaduto" | "permessi" | "limite" | "altro";

export class LinkedInError extends Error {
  constructor(
    public tipo: TipoErroreLinkedIn,
    message: string
  ) {
    super(message);
    this.name = "LinkedInError";
  }
}

const BASE = "https://api.linkedin.com/rest";
export const versioneLinkedIn = () => process.env.LINKEDIN_API_VERSION?.trim() || "202610";
const attesa = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function token(): Promise<string> {
  const t = await tokenLinkedIn();
  if (t.esito === "ok") return t.token;
  throw t.esito === "non-collegato"
    ? new LinkedInError("non-collegato", "LinkedIn Ads non è collegato: collegalo in Impostazioni.")
    : new LinkedInError("scaduto", "L'accesso a LinkedIn è scaduto: collegalo di nuovo in Impostazioni.");
}

// GET di un percorso con una query già nel formato Rest.li (vedi restli.ts)
export async function linkedinGet<T>(percorso: string, query = ""): Promise<T> {
  const chiave = await token();
  const url = `${BASE}/${percorso}${query ? `?${query}` : ""}`;
  for (let tentativo = 0; ; tentativo++) {
    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${chiave}`,
        "Linkedin-Version": versioneLinkedIn(),
        "X-Restli-Protocol-Version": "2.0.0",
      },
      cache: "no-store",
    });
    if (r.ok) return (await r.json()) as T;
    const j = (await r.json().catch(() => ({}))) as { message?: string; code?: string };
    if ((r.status === 429 || r.status === 500 || r.status === 503) && tentativo < 3) {
      await attesa(2000 * 2 ** tentativo); // 2, 4, 8 secondi
      continue;
    }
    const messaggio = j.message ?? `risposta ${r.status}`;
    if (r.status === 401) throw new LinkedInError("scaduto", "L'accesso a LinkedIn è scaduto o revocato: collegalo di nuovo in Impostazioni.");
    if (r.status === 403) throw new LinkedInError("permessi", `LinkedIn non concede l'accesso a questi dati (${messaggio}).`);
    if (r.status === 429) throw new LinkedInError("limite", "LinkedIn sta limitando le richieste: riprova tra qualche minuto.");
    if (r.status === 426) throw new LinkedInError("altro", `La versione ${versioneLinkedIn()} dell'API LinkedIn non è più supportata: va aggiornata (LINKEDIN_API_VERSION).`);
    throw new LinkedInError("altro", `LinkedIn: ${messaggio}`);
  }
}

// Elenco con paginazione a cursore: "metadata.nextPageToken" va ripassato come pageToken (al massimo 20 pagine)
export async function linkedinElenco<T>(percorso: string, query: (pageToken?: string) => string): Promise<T[]> {
  const tutti: T[] = [];
  let pagina: string | undefined;
  for (let i = 0; i < 20; i++) {
    const j = await linkedinGet<{ elements?: T[]; metadata?: { nextPageToken?: string | null } }>(percorso, query(pagina));
    tutti.push(...(j.elements ?? []));
    pagina = j.metadata?.nextPageToken ?? undefined;
    if (!pagina) break;
  }
  return tutti;
}

// Verifica del collegamento: elenca gli account pubblicitari visibili e li salva (servono per associarli ai clienti)
export async function verificaLinkedIn(): Promise<{ ok: boolean; messaggio: string }> {
  let esito: { ok: boolean; messaggio: string; account: AccountLinkedIn[] };
  try {
    const grezzi = await linkedinElenco<Record<string, unknown>>("adAccounts", queryAccount);
    const account = grezzi.map(normalizzaAccountVisibile).sort((a, b) => a.nome.localeCompare(b.nome, "it"));
    esito = {
      ok: true,
      messaggio: account.length === 1 ? "1 account pubblicitario visibile" : `${account.length} account pubblicitari visibili`,
      account,
    };
  } catch (e) {
    esito = { ok: false, messaggio: (e as Error).message, account: [] };
  }
  await modificaStatoLinkedIn((s) => {
    s.ultimaVerifica = { il: new Date().toISOString(), ok: esito.ok, messaggio: esito.messaggio, account: esito.ok ? esito.account : (s.ultimaVerifica?.account ?? []) };
    if (!esito.ok) s.ultimoErrore = { il: new Date().toISOString(), messaggio: esito.messaggio };
  });
  return { ok: esito.ok, messaggio: esito.messaggio };
}
