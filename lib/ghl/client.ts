// Client GoHighLevel. Tutto il codice dell'app passa da qui:
// - getAgencyClient(): elenco dei sub-account (token agency);
// - getLocationClient(locationId): dati di un cliente (token del sub-account).
// Solo letture: nessun metodo crea, modifica o cancella dati su GHL.
import { GhlError, ghlRequest, ultimoRateLimit } from "./http";
import { normalizeContact, normalizeOpportunity, normalizePipeline, type RawContact, type RawOpportunity } from "./normalize";
import { getLocationToken } from "./tokens";
import type { Contact, GhlLocation, Opportunity, Pipeline } from "./types";

type RawLocation = { id: string; name?: string; timezone?: string | null };

function toLocation(l: RawLocation): GhlLocation {
  return { id: l.id, name: l.name?.trim() || l.id, timezone: l.timezone ?? null };
}

// ---------------------------------------------------------------- agency
export function getAgencyClient() {
  const token = process.env.GHL_AGENCY_TOKEN?.trim();
  const companyId = process.env.GHL_COMPANY_ID?.trim();
  if (!token || !companyId) {
    throw new GhlError("token_mancante", "GHL_AGENCY_TOKEN o GHL_COMPANY_ID mancanti nel file .env");
  }

  return {
    // GET /locations/search: tutti i sub-account dell'agency, 100 alla volta
    async listLocations(): Promise<GhlLocation[]> {
      const tutte: GhlLocation[] = [];
      for (let skip = 0; ; skip += 100) {
        const r = await ghlRequest<{ locations?: RawLocation[] }>(token, "/locations/search", {
          query: { companyId, limit: 100, skip },
        });
        const pagina = r.locations ?? [];
        tutte.push(...pagina.map(toLocation));
        if (pagina.length < 100) break;
      }
      return tutte.sort((a, b) => a.name.localeCompare(b.name, "it"));
    },
  };
}

// ---------------------------------------------------------------- verifica di un token nuovo
// Controlla, prima di salvarlo, che il token appartenga al sub-account giusto e abbia i permessi.
// Restituisce l'elenco dei problemi trovati (vuoto = tutto a posto).
export async function verificaTokenLocation(locationId: string, token: string): Promise<string[]> {
  const problemi: string[] = [];
  try {
    const r = await ghlRequest<{ location: RawLocation }>(token, `/locations/${locationId}`);
    if (r.location?.id !== locationId) problemi.push("il token appartiene a un altro sub-account");
  } catch (e) {
    return [e instanceof GhlError && e.tipo === "auth"
      ? "token non valido, oppure manca il permesso locations.readonly, oppure è di un altro sub-account"
      : (e as Error).message];
  }
  const prove: [string, string, Parameters<typeof ghlRequest>[2]][] = [
    ["contacts.readonly", "/contacts/search", { method: "POST", body: { locationId, pageLimit: 1 } }],
    ["opportunities.readonly", "/opportunities/pipelines", { query: { locationId } }],
  ];
  for (const [permesso, path, opzioni] of prove) {
    try {
      await ghlRequest(token, path, opzioni);
    } catch (e) {
      problemi.push(e instanceof GhlError && e.tipo === "auth" ? `manca il permesso ${permesso}` : (e as Error).message);
    }
  }
  return problemi;
}

// ---------------------------------------------------------------- sub-account
export type LocationClient = Awaited<ReturnType<typeof getLocationClient>>;

const PAGINA_CONTATTI = 500; // massimo consentito da GHL per richiesta
const MAX_PAGINE = 200; // protezione: 100.000 contatti per singola ricerca
const MAX_PAGINE_OPPORTUNITA = 500; // protezione: 50.000 opportunità

function filtroData(da: Date, a: Date) {
  return [{ field: "dateAdded", operator: "range", value: { gte: da.toISOString(), lte: a.toISOString() } }];
}

export async function getLocationClient(locationId: string) {
  const token = await getLocationToken(locationId);
  if (!token) {
    throw new GhlError("token_mancante", "Manca il token GHL di questo sub-account: inseriscilo in Impostazioni");
  }

  return {
    locationId,

    // Momento dell'ultimo "troppe richieste" ricevuto con questo token (per gli avvisi)
    ultimoRateLimit: () => ultimoRateLimit(token),

    // GET /locations/{id}
    async getLocation(): Promise<GhlLocation> {
      const r = await ghlRequest<{ location: RawLocation }>(token, `/locations/${locationId}`);
      return toLocation(r.location);
    },

    // Numero di contatti creati nell'intervallo, senza scaricarli (pageLimit 1, si legge "total")
    async countContacts(da: Date, a: Date): Promise<number> {
      const r = await ghlRequest<{ total?: number }>(token, "/contacts/search", {
        method: "POST",
        body: { locationId, pageLimit: 1, filters: filtroData(da, a) },
      });
      return r.total ?? 0;
    },

    // Tutti i contatti creati nell'intervallo, con paginazione a cursore (searchAfter),
    // l'unica che funziona anche oltre 10.000 risultati
    async searchContacts(da: Date, a: Date): Promise<Contact[]> {
      const contatti: Contact[] = [];
      let searchAfter: unknown[] | undefined;
      for (let pagina = 0; pagina < MAX_PAGINE; pagina++) {
        const r = await ghlRequest<{ contacts?: RawContact[] }>(token, "/contacts/search", {
          method: "POST",
          body: {
            locationId,
            pageLimit: PAGINA_CONTATTI,
            filters: filtroData(da, a),
            sort: [{ field: "dateAdded", direction: "asc" }],
            ...(searchAfter ? { searchAfter } : {}),
          },
        });
        const lista = r.contacts ?? [];
        contatti.push(...lista.map(normalizeContact));
        searchAfter = lista.at(-1)?.searchAfter;
        if (lista.length < PAGINA_CONTATTI || !searchAfter) return contatti;
      }
      throw new GhlError("richiesta", "Troppi contatti nel periodo scelto: riduci l'intervallo di date");
    },

    // GET /opportunities/pipelines: pipeline e fasi, in ordine
    async getPipelines(): Promise<Pipeline[]> {
      const r = await ghlRequest<{ pipelines?: Parameters<typeof normalizePipeline>[0][] }>(token, "/opportunities/pipelines", {
        query: { locationId },
      });
      return (r.pipelines ?? []).map(normalizePipeline);
    },

    // GET /opportunities/search: tutte le opportunità, 100 alla volta (massimo consentito).
    // Fino a 10.000 si leggono le pagine numerate in parallelo (1 secondo invece di 18 su 3.000 opportunità);
    // oltre si usa il cursore startAfter + startAfterId, più lento ma senza limiti.
    async searchOpportunities(): Promise<Opportunity[]> {
      type Risposta = {
        opportunities?: RawOpportunity[];
        meta?: { total?: number; startAfter?: number | string; startAfterId?: string };
      };
      const pagina = (query: Record<string, string | number>) =>
        ghlRequest<Risposta>(token, "/opportunities/search", { query: { locationId, limit: 100, ...query } });

      const prima = await pagina({ page: 1 });
      const totale = prima.meta?.total ?? 0;
      const numeroPagine = Math.ceil(totale / 100);
      let grezze: RawOpportunity[];

      if (numeroPagine <= 100) {
        const altre = await Promise.all(Array.from({ length: Math.max(numeroPagine - 1, 0) }, (_, i) => pagina({ page: i + 2 })));
        grezze = [prima, ...altre].flatMap((r) => r.opportunities ?? []);
      } else {
        grezze = [...(prima.opportunities ?? [])];
        let meta = prima.meta;
        for (let n = 1; n < MAX_PAGINE_OPPORTUNITA && meta?.startAfterId && meta.startAfter !== undefined; n++) {
          const r = await pagina({ startAfter: meta.startAfter, startAfterId: meta.startAfterId });
          const lista = r.opportunities ?? [];
          grezze.push(...lista);
          if (lista.length < 100) break;
          meta = r.meta;
        }
      }

      // Se nel frattempo è arrivata un'opportunità nuova le pagine possono slittare: si tolgono i doppioni
      const viste = new Set<string>();
      return grezze.filter((o) => !viste.has(o.id) && viste.add(o.id)).map(normalizeOpportunity);
    },
  };
}
