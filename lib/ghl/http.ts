// Chiamate HTTP verso GoHighLevel con:
// - coda per token: al massimo 90 richieste ogni 10 secondi (il limite di GHL è 100);
// - pausa automatica quando gli header di GHL dicono che le richieste rimaste sono poche;
// - ritentativi con attesa crescente (backoff esponenziale) sugli errori 429 e 5xx;
// - errori tradotti in messaggi comprensibili.
import { createHash } from "node:crypto";

const BASE_URL = "https://services.leadconnectorhq.com";
const MAX_RICHIESTE = 90;
const FINESTRA_MS = 10_000;
const MAX_TENTATIVI = 5;

export type TipoErroreGhl = "token_mancante" | "auth" | "rate_limit" | "rete" | "server" | "richiesta";

export class GhlError extends Error {
  constructor(
    public tipo: TipoErroreGhl,
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "GhlError";
  }
}

// ---------------------------------------------------------------- coda per token
type Coda = { timestamps: number[]; pausaFino: number; catena: Promise<void> };

const g = globalThis as unknown as { __ghlCode?: Map<string, Coda>; __ghlUltimo429?: Map<string, number> };
const code: Map<string, Coda> = (g.__ghlCode ??= new Map());
// Ultimo 429 ricevuto per token (serve agli avvisi "rate limit" in Panoramica)
const ultimo429: Map<string, number> = (g.__ghlUltimo429 ??= new Map());

// Il token non viene usato come chiave in chiaro: se ne usa un'impronta
function chiaveToken(token: string) {
  return createHash("sha256").update(token).digest("hex").slice(0, 16);
}

const attendi = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Aspetta il proprio turno nella coda del token
function prenotaSlot(chiave: string): Promise<void> {
  let coda = code.get(chiave);
  if (!coda) {
    coda = { timestamps: [], pausaFino: 0, catena: Promise.resolve() };
    code.set(chiave, coda);
  }
  const c = coda;
  const turno = c.catena.then(async () => {
    for (;;) {
      const adesso = Date.now();
      if (c.pausaFino > adesso) { await attendi(c.pausaFino - adesso); continue; }
      c.timestamps = c.timestamps.filter((t) => adesso - t < FINESTRA_MS);
      if (c.timestamps.length < MAX_RICHIESTE) { c.timestamps.push(adesso); return; }
      await attendi(FINESTRA_MS - (adesso - c.timestamps[0]) + 10);
    }
  });
  c.catena = turno.catch(() => {});
  return turno;
}

function rispettaHeaderLimite(chiave: string, headers: Headers) {
  const rimaste = Number(headers.get("x-ratelimit-remaining"));
  const intervallo = Number(headers.get("x-ratelimit-interval-milliseconds")) || FINESTRA_MS;
  const coda = code.get(chiave);
  if (coda && Number.isFinite(rimaste) && rimaste <= 3) {
    coda.pausaFino = Math.max(coda.pausaFino, Date.now() + intervallo);
  }
}

export function ultimoRateLimit(token: string): number | null {
  return ultimo429.get(chiaveToken(token)) ?? null;
}

// ---------------------------------------------------------------- richiesta
type Opzioni = {
  method?: "GET" | "POST"; // POST solo per le ricerche (sola lettura)
  query?: Record<string, string | number | undefined>;
  body?: unknown;
};

export async function ghlRequest<T>(token: string, path: string, opzioni: Opzioni = {}): Promise<T> {
  const chiave = chiaveToken(token);
  const url = new URL(BASE_URL + path);
  for (const [k, v] of Object.entries(opzioni.query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));

  for (let tentativo = 1; ; tentativo++) {
    await prenotaSlot(chiave);

    let res: Response;
    try {
      res = await fetch(url, {
        method: opzioni.method ?? "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Version: process.env.GHL_API_VERSION?.trim() || "v3",
          Accept: "application/json",
          ...(opzioni.body ? { "Content-Type": "application/json" } : {}),
        },
        body: opzioni.body ? JSON.stringify(opzioni.body) : undefined,
        signal: AbortSignal.timeout(30_000),
        cache: "no-store",
      });
    } catch (e) {
      if (tentativo < 3) { await attendi(1000 * tentativo); continue; }
      throw new GhlError("rete", `GoHighLevel non raggiungibile: ${(e as Error).message}`);
    }

    rispettaHeaderLimite(chiave, res.headers);

    if (res.ok) return (await res.json()) as T;

    const dettaglio = await leggiMessaggio(res);

    if (res.status === 429) {
      ultimo429.set(chiave, Date.now());
      if (tentativo >= MAX_TENTATIVI) {
        throw new GhlError("rate_limit", "Troppe richieste a GoHighLevel (limite raggiunto): riprova tra qualche minuto", 429);
      }
      const retryAfter = Number(res.headers.get("retry-after"));
      const attesa = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : 1000 * 2 ** (tentativo - 1) + Math.random() * 500;
      await attendi(attesa);
      continue;
    }

    if (res.status >= 500) {
      if (tentativo < 3) { await attendi(1000 * 2 ** (tentativo - 1)); continue; }
      throw new GhlError("server", `GoHighLevel ha un problema temporaneo (errore ${res.status})`, res.status);
    }

    if (res.status === 401 || res.status === 403) {
      throw new GhlError("auth", `Token GHL non valido, scaduto o senza i permessi necessari (${dettaglio})`, res.status);
    }

    throw new GhlError("richiesta", `Richiesta rifiutata da GoHighLevel (errore ${res.status}): ${dettaglio}`, res.status);
  }
}

async function leggiMessaggio(res: Response) {
  try {
    const json = await res.json();
    const m = json?.message ?? json?.error ?? "";
    return Array.isArray(m) ? m.join("; ") : String(m);
  } catch {
    return res.statusText;
  }
}
