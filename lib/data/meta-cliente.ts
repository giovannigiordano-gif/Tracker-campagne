// Dati Meta di un cliente: statistiche giornaliere per campagna, campagne, annunci con problemi, stato e
// frequenza degli account pubblicitari associati al cliente (metaAdAccountIds). SOLA LETTURA.
// Sono solo dati aggregati (nessun dato personale): in locale la cache li salva anche su disco.
import type { Account } from "../accounts";
import * as cache from "../cache";
import { graphElenco, graphOggetto, MetaError } from "../meta/graph";
import {
  normalizzaAccount,
  normalizzaAnnuncioProblema,
  normalizzaCampagna,
  normalizzaInsight,
  type AccountMetaInfo,
  type AnnuncioProblema,
  type CampagnaMeta,
  type DatiMeta,
  type InsightGiorno,
} from "../meta/normalize";
import { risolviPeriodo, type Selezione } from "../period";

type Grezzo = Record<string, unknown>;

const CAMPI_INSIGHT =
  "campaign_id,campaign_name,spend,impressions,reach,frequency,clicks,inline_link_clicks,ctr,cpc,cpm,actions,cost_per_action_type,account_currency";

export type EsitoMeta =
  | { stato: "non-associato" } // il cliente non ha account pubblicitari associati
  | { stato: "errore"; tipo: MetaError["tipo"]; messaggio: string }
  | { stato: "ok"; dati: DatiMeta };

async function datiAccount(act: string, daGiorno: string, aGiorno: string, ttlStatistiche: number) {
  const chiave = (parte: string) => `meta:${act}:${parte}`;
  const [info, righe, campagne, problemi, frequenza] = await Promise.all([
    cache.get<AccountMetaInfo>(chiave("account"), cache.TTL.oggi, async () =>
      normalizzaAccount(await graphOggetto<Grezzo>(act, { fields: "name,currency,account_status,timezone_name" }), act)
    ),
    cache.get<InsightGiorno[]>(
      chiave(`insights:${daGiorno}:${aGiorno}`),
      ttlStatistiche,
      async () =>
        (
          await graphElenco<Grezzo>(`${act}/insights`, {
            level: "campaign",
            time_increment: "1",
            time_range: JSON.stringify({ since: daGiorno, until: aGiorno }),
            fields: CAMPI_INSIGHT,
            limit: "500",
          })
        ).map((r) => normalizzaInsight(r, act)),
      { persist: true }
    ),
    cache.get<CampagnaMeta[]>(chiave("campagne"), cache.TTL.oggi, async () =>
      (await graphElenco<Grezzo>(`${act}/campaigns`, { fields: "id,name,status,effective_status,objective", limit: "200" })).map((r) =>
        normalizzaCampagna(r, act)
      )
    ),
    cache.get<AnnuncioProblema[]>(chiave("problemi"), cache.TTL.oggi, async () =>
      (
        await graphElenco<Grezzo>(`${act}/ads`, {
          fields: "id,effective_status,campaign_id,issues_info",
          effective_status: JSON.stringify(["DISAPPROVED", "WITH_ISSUES"]),
          limit: "200",
        })
      ).map((r) => normalizzaAnnuncioProblema(r, act))
    ),
    cache.get<number | null>(chiave("frequenza7g"), cache.TTL.oggi, async () => {
      const [r] = await graphElenco<Grezzo>(`${act}/insights`, { level: "account", date_preset: "last_7d", fields: "frequency" }, 1);
      return r?.frequency != null ? Number(r.frequency) : null;
    }),
  ]);
  return { info: info.value, righe: righe.value, campagne: campagne.value, problemi: problemi.value, frequenza: frequenza.value, aggiornatoIl: righe.updatedAt };
}

export async function caricaMetaCliente(account: Account, sel: Selezione): Promise<EsitoMeta> {
  if (!account.metaAdAccountIds.length) return { stato: "non-associato" };
  // Periodo corrente e precedente in una sola lettura (stessa finestra dei dati GHL)
  const { corrente, precedente } = risolviPeriodo(sel, account.timezone);
  const ttl = cache.ttlPerIntervallo(corrente.fine);

  const dati: DatiMeta = { account: [], righe: [], campagne: [], problemi: [], frequenza7g: {}, errori: [], aggiornatoIl: Date.now() };
  const esiti = await Promise.allSettled(account.metaAdAccountIds.map((act) => datiAccount(act, precedente.daGiorno, corrente.aGiorno, ttl)));

  for (const [i, esito] of esiti.entries()) {
    const act = account.metaAdAccountIds[i];
    if (esito.status === "rejected") {
      const e = esito.reason;
      // Collegamento assente o scaduto: vale per tutti gli account, inutile proseguire
      if (e instanceof MetaError && (e.tipo === "non-collegato" || e.tipo === "scaduto")) {
        return { stato: "errore", tipo: e.tipo, messaggio: e.message };
      }
      dati.errori.push(`${act}: ${(e as Error).message}`);
      continue;
    }
    const a = esito.value;
    dati.account.push(a.info);
    dati.righe.push(...a.righe);
    dati.campagne.push(...a.campagne);
    dati.problemi.push(...a.problemi);
    dati.frequenza7g[act] = a.frequenza;
    dati.aggiornatoIl = Math.min(dati.aggiornatoIl, a.aggiornatoIl);
  }
  if (!dati.account.length && dati.errori.length) {
    return { stato: "errore", tipo: "altro", messaggio: `Non riesco a leggere i dati da Meta (${dati.errori[0]}).` };
  }
  return { stato: "ok", dati };
}
