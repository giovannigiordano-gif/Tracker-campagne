// Dati per la Panoramica agency: una riga per cliente attivo.
// Su disco si salvano solo i totali della riga (nessun dato personale).
import { readAccounts, SOGLIA_CALO_LEAD_PREDEFINITA, type Account } from "../accounts";
import * as cache from "../cache";
import { formatAggiornato, formatPercentuale } from "../format";
import { getLocationClient } from "../ghl/client";
import { GhlError } from "../ghl/http";
import { calcolaKpi, leadPerCanale, variazionePct, type Kpi, type LeadCanale } from "../metrics/dashboard";
import { risolviPeriodo, type Selezione } from "../period";
import { costruisciRighe, datiGrezziCliente } from "./cliente";
import { caricaLinkedInCliente } from "./linkedin-cliente";
import { caricaMetaCliente, type EsitoMeta } from "./meta-cliente";
import { calcolaCriticita } from "../metrics/criticita";
import { kpiIncrocio, kpiMeta } from "../metrics/meta";
import { opzioniIncrocio, PIATTAFORME, type Piattaforma } from "../metrics/piattaforme";
import type { LeadRow } from "../metrics/dashboard";
import type { Canale } from "../ghl/types";

export type Avviso = { livello: "errore" | "attenzione"; testo: string };

// Spesa e costo per lead (spesa / lead arrivati in GHL dal canale della piattaforma), periodo e precedente
export type NumeriAds = { spesa: number; spesaPrec: number; cplReale: number | null; cplRealePrec: number | null };

export type RigaPanoramica = {
  locationId: string;
  nome: string;
  valuta: string;
  daGiorno: string;
  aGiorno: string;
  fuso: string;
  kpi: Kpi | null;
  kpiPrec: Kpi | null;
  leadGiornalieri: number[]; // per il mini-grafico
  canali: LeadCanale[]; // lead del periodo per canale (solo conteggi)
  avvisi: Avviso[];
  meta: NumeriAds | null; // null: nessun account Meta
  linkedin: NumeriAds | null; // null: nessun account LinkedIn
  problemaToken: boolean; // i dati mancano perché il token GHL manca o è scaduto
  aggiornatoIl: number | null;
};

const QUINDICI_MINUTI = 15 * 60 * 1000;
const MINIMO_LEAD_PER_AVVISO_CALO = 5; // sotto questa soglia le variazioni % sono solo rumore

export function messaggioErrore(e: unknown, nomeCliente: string): string {
  if (e instanceof GhlError) {
    if (e.tipo === "token_mancante") return `Manca il token GHL per ${nomeCliente}: inseriscilo in Impostazioni`;
    if (e.tipo === "auth") return `Token GHL scaduto o non valido per ${nomeCliente}: sostituiscilo in Impostazioni`;
    if (e.tipo === "rate_limit") return `GHL sta limitando le richieste per ${nomeCliente}: riprova tra qualche minuto`;
    return `${nomeCliente}: ${e.message}`;
  }
  return `${nomeCliente}: errore imprevisto (${(e as Error).message})`;
}

// leadAds: lead dei canali Meta Ads e LinkedIn Ads (giorno e campagna, nessun dato personale) per incrociarli con la spesa
type LeadAds = { giorno: string; canale: Canale; campagnaId: string | null; campagna: string | null };
type Totali = {
  kpi: Kpi;
  kpiPrec: Kpi;
  leadGiornalieri: number[];
  canali: LeadCanale[];
  leadAds: LeadAds[];
  aggiornatoIl: number;
};

async function totaliCliente(account: Account, sel: Selezione): Promise<Totali> {
  const { corrente, precedente } = risolviPeriodo(sel, account.timezone);
  const { value } = await cache.get<Totali>(
    `ghl:${account.locationId}:panoramica:v5:${precedente.daGiorno}:${corrente.aGiorno}`,
    cache.ttlPerIntervallo(corrente.fine),
    async () => {
      const grezzi = await datiGrezziCliente(account, sel);
      const { lead, opp } = costruisciRighe(grezzi, { conDatiPersonali: false });
      const perGiorno = new Map<string, number>();
      for (const r of lead) perGiorno.set(r.giorno, (perGiorno.get(r.giorno) ?? 0) + 1);
      return {
        kpi: calcolaKpi(lead, opp, new Set(corrente.giorni)),
        kpiPrec: calcolaKpi(lead, opp, new Set(precedente.giorni)),
        leadGiornalieri: corrente.giorni.map((g) => perGiorno.get(g) ?? 0),
        canali: leadPerCanale(lead, new Set(corrente.giorni)),
        leadAds: lead
          .filter((r) => r.canale === "Meta Ads" || r.canale === "LinkedIn Ads")
          .map((r) => ({ giorno: r.giorno, canale: r.canale, campagnaId: r.campagnaId, campagna: r.campagna })),
        aggiornatoIl: grezzi.aggiornatoIl,
      };
    },
    { persist: true },
  );
  return value;
}

async function caricaRiga(account: Account, sel: Selezione): Promise<RigaPanoramica> {
  const { corrente, fuso } = risolviPeriodo(sel, account.timezone);
  const riga: RigaPanoramica = {
    locationId: account.locationId,
    nome: account.name,
    valuta: account.currency,
    daGiorno: corrente.daGiorno,
    aGiorno: corrente.aGiorno,
    fuso,
    kpi: null,
    kpiPrec: null,
    leadGiornalieri: [],
    canali: [],
    avvisi: [],
    meta: null,
    linkedin: null,
    problemaToken: false,
    aggiornatoIl: null,
  };

  try {
    const t = await totaliCliente(account, sel);
    Object.assign(riga, t);
    const soglia = account.thresholds.leadDropPct ?? SOGLIA_CALO_LEAD_PREDEFINITA;
    const calo = variazionePct(t.kpi.lead, t.kpiPrec.lead);
    if (calo !== null && t.kpiPrec.lead >= MINIMO_LEAD_PER_AVVISO_CALO && calo <= -soglia) {
      riga.avvisi.push({
        livello: "attenzione",
        testo: `Lead in calo del ${formatPercentuale(-calo)} rispetto al periodo precedente (soglia ${soglia}%)`,
      });
    }
    await Promise.all([
      aggiungiAds(riga, account, sel, t, PIATTAFORME.meta, account.metaAdAccountIds.length > 0, caricaMetaCliente),
      aggiungiAds(riga, account, sel, t, PIATTAFORME.linkedin, account.linkedinAdAccountIds.length > 0, caricaLinkedInCliente),
    ]);
  } catch (e) {
    riga.avvisi.push({ livello: "errore", testo: messaggioErrore(e, account.name) });
    riga.problemaToken = e instanceof GhlError && (e.tipo === "auth" || e.tipo === "token_mancante");
  }

  try {
    const ultimo = (await getLocationClient(account.locationId)).ultimoRateLimit();
    if (ultimo && Date.now() - ultimo < QUINDICI_MINUTI) {
      riga.avvisi.push({
        livello: "attenzione",
        testo: `GHL ha limitato le richieste (${formatAggiornato(ultimo)}): i dati possono arrivare più lentamente`,
      });
    }
  } catch {
    // token mancante: già segnalato sopra
  }
  return riga;
}

// Spesa, costo per lead e criticità delle campagne di una piattaforma (solo per i clienti con account associati).
// Le criticità vanno tra gli avvisi della scheda, con il nome della piattaforma davanti.
async function aggiungiAds(
  riga: RigaPanoramica,
  account: Account,
  sel: Selezione,
  t: Totali,
  p: Piattaforma,
  associato: boolean,
  carica: (a: Account, s: Selezione) => Promise<EsitoMeta>
) {
  if (!associato) return;
  const esito = await carica(account, sel).catch(() => null);
  if (!esito || esito.stato === "errore") {
    riga.avvisi.push({ livello: "attenzione", testo: `${p.nome}: ${esito?.messaggio ?? "dati non disponibili in questo momento"}` });
    return;
  }
  if (esito.stato !== "ok") return;
  const { corrente, precedente } = risolviPeriodo(sel, account.timezone);
  const lead: LeadRow[] = t.leadAds
    .filter((l) => l.canale === p.canale)
    .map((l) => ({ id: "", giorno: l.giorno, canale: l.canale, campagnaId: l.campagnaId, campagna: l.campagna, fonte: "", tags: [], attribuito: !!l.campagnaId, pipelines: [] }));
  const opz = opzioniIncrocio(p, esito.dati);
  const g = new Set(corrente.giorni);
  const gp = new Set(precedente.giorni);
  const spesa = kpiMeta(esito.dati.righe, g).spesa;
  const spesaPrec = kpiMeta(esito.dati.righe, gp).spesa;
  riga[p.id] = {
    spesa,
    spesaPrec,
    cplReale: kpiIncrocio(spesa, lead, [], g, opz.canale).cplReale,
    cplRealePrec: kpiIncrocio(spesaPrec, lead, [], gp, opz.canale).cplReale,
  };
  const criticita = calcolaCriticita({
    meta: esito.dati,
    lead,
    giorni: corrente.giorni,
    giorniPrec: precedente.giorni,
    obiettivoCpl: account.thresholds.maxCpl,
    valuta: account.currency,
    ...opz,
  });
  riga.avvisi.push(...criticita.map((c) => ({ livello: c.livello, testo: `${p.nome}: ${c.testo}` })));
}

export async function caricaPanoramica(sel: Selezione) {
  const clienti = (await readAccounts()).filter((a) => a.active);
  return Promise.all(clienti.map((a) => caricaRiga(a, sel)));
}
