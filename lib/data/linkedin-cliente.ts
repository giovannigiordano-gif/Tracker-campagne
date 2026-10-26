// Dati LinkedIn Ads di un cliente: statistiche giornaliere per campagna, campagne (con quelle attive ma ferme),
// stato e frequenza degli account pubblicitari associati al cliente (linkedinAdAccountIds). SOLA LETTURA.
// Stessa forma dei dati Meta (DatiMeta): la sezione "Campagne LinkedIn" riusa calcoli, grafici e criticità.
// Sono solo dati aggregati (nessun dato personale): in locale la cache li salva anche su disco.
import type { Account } from "../accounts";
import * as cache from "../cache";
import { linkedinElenco, linkedinGet, LinkedInError } from "../linkedin/api";
import {
  campagnaFerma,
  frequenzaDaCopertura,
  normalizzaAccountLinkedIn,
  normalizzaCampagnaLinkedIn,
  normalizzaStatisticaLinkedIn,
} from "../linkedin/normalize";
import { queryCampagne, queryCopertura, queryStatisticheCampagne } from "../linkedin/restli";
import type { AccountMetaInfo, CampagnaFerma, CampagnaMeta, DatiMeta, InsightGiorno } from "../meta/normalize";
import { aggiungiGiorni, giornoInFuso, risolviPeriodo, type Selezione } from "../period";
import type { EsitoMeta } from "./meta-cliente";

type Grezzo = Record<string, unknown>;

async function datiAccount(id: string, daGiorno: string, aGiorno: string, ttlStatistiche: number) {
  const chiave = (parte: string) => `linkedin:${id}:${parte}`;
  const [info, campagneGrezze] = await Promise.all([
    cache.get<AccountMetaInfo>(chiave("account"), cache.TTL.oggi, async () => normalizzaAccountLinkedIn(await linkedinGet<Grezzo>(`adAccounts/${id}`), id)),
    cache.get<Grezzo[]>(chiave("campagne"), cache.TTL.oggi, () => linkedinElenco<Grezzo>(`adAccounts/${id}/adCampaigns`, queryCampagne)),
  ]);
  const campagne: CampagnaMeta[] = campagneGrezze.value.map((c) => normalizzaCampagnaLinkedIn(c, id));
  const ferme = campagneGrezze.value.map((c) => campagnaFerma(c, id)).filter((c): c is CampagnaFerma => c !== null);
  const nomi = new Map(campagne.map((c) => [c.id, c.nome]));

  // Le statistiche sono in UTC; la frequenza è sugli ultimi 7 giorni (LinkedIn dà la copertura fino a 92 giorni)
  const oggi = giornoInFuso(new Date(), "UTC");
  const [righe, frequenza] = await Promise.all([
    cache.get<InsightGiorno[]>(
      chiave(`statistiche:${daGiorno}:${aGiorno}`),
      ttlStatistiche,
      async () => {
        const j = await linkedinGet<{ elements?: Grezzo[] }>("adAnalytics", queryStatisticheCampagne(id, daGiorno, aGiorno));
        return (j.elements ?? []).map((r) => normalizzaStatisticaLinkedIn(r, id, nomi));
      },
      { persist: true }
    ),
    cache.get<number | null>(chiave("frequenza7g"), cache.TTL.oggi, async () => {
      const j = await linkedinGet<{ elements?: Grezzo[] }>("adAnalytics", queryCopertura(id, aggiungiGiorni(oggi, -6), oggi));
      return frequenzaDaCopertura(j.elements?.[0]);
    }),
  ]);
  // Il nome della campagna può cambiare dopo che le statistiche sono in cache: si riallinea qui
  const righeConNome = righe.value.map((r) => ({ ...r, campagna: nomi.get(r.campagnaId) ?? r.campagna }));
  return { info: info.value, righe: righeConNome, campagne, ferme, frequenza: frequenza.value, aggiornatoIl: righe.updatedAt };
}

export async function caricaLinkedInCliente(account: Account, sel: Selezione): Promise<EsitoMeta> {
  if (!account.linkedinAdAccountIds.length) return { stato: "non-associato" };
  // Periodo corrente e precedente in una sola lettura (stessa finestra dei dati GHL)
  const { corrente, precedente } = risolviPeriodo(sel, account.timezone);
  const ttl = cache.ttlPerIntervallo(corrente.fine);

  const dati: DatiMeta = { account: [], righe: [], campagne: [], problemi: [], campagneFerme: [], frequenza7g: {}, errori: [], aggiornatoIl: Date.now() };
  const esiti = await Promise.allSettled(account.linkedinAdAccountIds.map((id) => datiAccount(id, precedente.daGiorno, corrente.aGiorno, ttl)));

  for (const [i, esito] of esiti.entries()) {
    const id = account.linkedinAdAccountIds[i];
    if (esito.status === "rejected") {
      const e = esito.reason;
      // Collegamento assente o scaduto: vale per tutti gli account, inutile proseguire
      if (e instanceof LinkedInError && (e.tipo === "non-collegato" || e.tipo === "scaduto")) {
        return { stato: "errore", tipo: e.tipo, messaggio: e.message };
      }
      dati.errori.push(`${id}: ${(e as Error).message}`);
      continue;
    }
    const a = esito.value;
    dati.account.push(a.info);
    dati.righe.push(...a.righe);
    dati.campagne.push(...a.campagne);
    dati.campagneFerme!.push(...a.ferme);
    dati.frequenza7g[a.info.id] = a.frequenza;
    dati.aggiornatoIl = Math.min(dati.aggiornatoIl, a.aggiornatoIl);
  }
  if (!dati.account.length && dati.errori.length) {
    return { stato: "errore", tipo: "altro", messaggio: `Non riesco a leggere i dati da LinkedIn (${dati.errori[0]}).` };
  }
  return { stato: "ok", dati };
}
