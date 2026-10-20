// Client dell'API Marketing di Meta (Graph API), SOLO LETTURA: si usano esclusivamente richieste GET.
// Token: quello del collegamento "Meta Ads" in Impostazioni (lib/meta-mcp/oauth.ts), che vale anche per
// l'API Marketing (verificato il 2026-10-20). Versione: META_GRAPH_VERSION (predefinita v26.0).
// Limiti: sui codici di "troppe richieste" (4, 17, 32, 613, 80000-80014) si riprova con attese crescenti.
import { tokenValido } from "../meta-mcp/oauth";

export type TipoErroreMeta = "non-collegato" | "scaduto" | "permessi" | "limite" | "altro";

export class MetaError extends Error {
  constructor(
    public tipo: TipoErroreMeta,
    message: string
  ) {
    super(message);
    this.name = "MetaError";
  }
}

const versione = () => process.env.META_GRAPH_VERSION?.trim() || "v26.0";
const CODICI_LIMITE = new Set([4, 17, 32, 613]);
const attesa = (ms: number) => new Promise((r) => setTimeout(r, ms));

type RispostaGraph<T> = { data?: T[]; paging?: { next?: string }; error?: { code?: number; message?: string } } & Record<string, unknown>;

async function token(): Promise<string> {
  const t = await tokenValido();
  if (t.esito === "ok") return t.token;
  throw t.esito === "non-collegato"
    ? new MetaError("non-collegato", "Meta Ads non è collegato: collegalo in Impostazioni.")
    : new MetaError("scaduto", "L'accesso a Meta è scaduto: collegalo di nuovo in Impostazioni.");
}

async function richiesta<T>(url: URL, chiave: string): Promise<RispostaGraph<T>> {
  for (let tentativo = 0; ; tentativo++) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${chiave}` }, cache: "no-store" });
    const j = (await r.json().catch(() => ({}))) as RispostaGraph<T>;
    const codice = j.error?.code;
    if (!j.error && r.ok) return j;

    const limite = codice !== undefined && (CODICI_LIMITE.has(codice) || (codice >= 80000 && codice <= 80014));
    if (limite && tentativo < 3) {
      await attesa(2000 * 2 ** tentativo); // 2, 4, 8 secondi
      continue;
    }
    const messaggio = j.error?.message ?? `risposta ${r.status}`;
    if (codice === 190) throw new MetaError("scaduto", "L'accesso a Meta è scaduto o revocato: collegalo di nuovo in Impostazioni.");
    if (codice === 10 || codice === 200 || (codice !== undefined && codice >= 200 && codice < 300)) {
      throw new MetaError("permessi", `Meta non concede l'accesso a questi dati (${messaggio}).`);
    }
    if (limite) throw new MetaError("limite", "Meta sta limitando le richieste: riprova tra qualche minuto.");
    throw new MetaError("altro", `Meta: ${messaggio}`);
  }
}

// Lettura di un oggetto (es. l'account pubblicitario)
export async function graphOggetto<T>(percorso: string, parametri: Record<string, string>): Promise<T> {
  const url = new URL(`https://graph.facebook.com/${versione()}/${percorso}`);
  for (const [k, v] of Object.entries(parametri)) url.searchParams.set(k, v);
  return (await richiesta<T>(url, await token())) as T;
}

// Lettura di un elenco, seguendo le pagine successive (al massimo maxPagine)
export async function graphElenco<T>(percorso: string, parametri: Record<string, string>, maxPagine = 20): Promise<T[]> {
  const chiave = await token();
  let url: URL | null = new URL(`https://graph.facebook.com/${versione()}/${percorso}`);
  for (const [k, v] of Object.entries(parametri)) url.searchParams.set(k, v);
  const tutti: T[] = [];
  for (let pagina = 0; url && pagina < maxPagine; pagina++) {
    const j: RispostaGraph<T> = await richiesta<T>(url, chiave);
    tutti.push(...(j.data ?? []));
    url = j.paging?.next ? new URL(j.paging.next) : null;
  }
  return tutti;
}
