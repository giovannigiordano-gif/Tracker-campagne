// Dati per la dashboard di un cliente: contatti (lead), opportunità e pipeline.
// Contatti e opportunità grezzi restano SOLO in memoria (cache senza persist);
// al browser arrivano righe già ridotte, con dati personali solo dove servono alle tabelle.
import type { Account } from "../accounts";
import * as cache from "../cache";
import { getLocationClient } from "../ghl/client";
import type { Contact, Opportunity, Pipeline } from "../ghl/types";
import { SENZA_FONTE, type LeadRow, type OppRow } from "../metrics/dashboard";
import { giornoInFuso, risolviPeriodo, type Selezione } from "../period";
import { caricaMetaCliente, type EsitoMeta } from "./meta-cliente";

export type AperteFase = { n: number; valore: number; giorniMedi: number | null };

export type DatiCliente = {
  cliente: { locationId: string; nome: string; valuta: string; fuso: string };
  periodo: {
    giorni: string[];
    giorniPrec: string[];
    daGiorno: string;
    aGiorno: string;
    daGiornoPrec: string;
    aGiornoPrec: string;
  };
  pipelines: Pipeline[];
  lead: LeadRow[];
  opp: OppRow[];
  // Situazione attuale delle opportunità aperte, per pipeline e fase (non dipende dal periodo)
  aperte: Record<string, Record<string, AperteFase>>;
  aggiornatoIl: number;
  meta: EsitoMeta; // campagne Meta degli account associati al cliente (sola lettura)
  obiettivoCpl: number | null; // costo per lead obiettivo impostato in Impostazioni
};

const GIORNO_MS = 86_400_000;

// Lettura (con cache) dei dati grezzi di un cliente: usata anche dalla Panoramica
export async function datiGrezziCliente(account: Account, sel: Selezione) {
  const periodo = risolviPeriodo(sel, account.timezone);
  const { corrente, precedente } = periodo;
  const id = account.locationId;
  const client = await getLocationClient(id);
  const [contatti, opportunita, pipelines] = await Promise.all([
    cache.get<Contact[]>(`ghl:${id}:contatti:${precedente.daGiorno}:${corrente.aGiorno}`, cache.ttlPerIntervallo(corrente.fine), () =>
      client.searchContacts(precedente.inizio, corrente.fine),
    ),
    cache.get<Opportunity[]>(`ghl:${id}:opportunita`, cache.TTL.oggi, () => client.searchOpportunities()),
    cache.get<Pipeline[]>(`ghl:${id}:pipeline`, cache.TTL.anagrafica, () => client.getPipelines(), { persist: true }),
  ]);
  return {
    periodo,
    contatti: contatti.value,
    opportunita: opportunita.value,
    pipelines: pipelines.value,
    aggiornatoIl: Math.min(contatti.updatedAt, opportunita.updatedAt),
  };
}

export function costruisciRighe(
  dati: Awaited<ReturnType<typeof datiGrezziCliente>>,
  { conDatiPersonali }: { conDatiPersonali: boolean },
) {
  const { periodo, contatti, opportunita } = dati;
  const { corrente, precedente, fuso } = periodo;
  const nellaFinestra = (g: string) => g >= precedente.daGiorno && g <= corrente.aGiorno;
  const nelCorrente = (g: string) => g >= corrente.daGiorno && g <= corrente.aGiorno;

  const lead: LeadRow[] = [];
  for (const c of contatti) {
    const giorno = giornoInFuso(c.dateAdded, fuso);
    if (!nellaFinestra(giorno)) continue;
    const meta = c.attribution.canale === "Meta Ads";
    lead.push({
      id: c.id,
      giorno,
      canale: c.attribution.canale,
      campagnaId: c.attribution.campaignId,
      campagna: c.attribution.utmCampaign,
      fonte: c.source ?? SENZA_FONTE,
      tags: c.tags,
      attribuito: c.attributed,
      ...(conDatiPersonali && nelCorrente(giorno)
        ? {
            persona: {
              data: c.dateAdded,
              nome: c.name,
              email: c.email ?? "",
              telefono: c.phone ?? "",
              gruppo: meta ? c.attribution.utmMedium ?? "" : "",
              annuncio: meta ? c.attribution.utmContent ?? "" : "",
            },
          }
        : {}),
    });
  }

  const opp: OppRow[] = [];
  const aperte: DatiCliente["aperte"] = {};
  const adesso = Date.now();
  for (const o of opportunita) {
    if (o.status === "open") {
      const perPipeline = (aperte[o.pipelineId] ??= {});
      const fase = (perPipeline[o.stageId] ??= { n: 0, valore: 0, giorniMedi: null });
      const da = new Date(o.lastStageChangeAt ?? o.createdAt).getTime();
      const giorniInFase = Math.max(0, (adesso - da) / GIORNO_MS);
      fase.giorniMedi = ((fase.giorniMedi ?? 0) * fase.n + giorniInFase) / (fase.n + 1);
      fase.n++;
      fase.valore += o.value;
    }
    const creata = giornoInFuso(o.createdAt, fuso);
    const chiusaGiorno =
      (o.status === "won" || o.status === "lost") && o.lastStatusChangeAt ? giornoInFuso(o.lastStatusChangeAt, fuso) : null;
    const creataDentro = nellaFinestra(creata);
    const chiusaDentro = chiusaGiorno !== null && nellaFinestra(chiusaGiorno);
    if (!creataDentro && !chiusaDentro) continue;
    opp.push({
      id: o.id,
      pipelineId: o.pipelineId,
      stageId: o.stageId,
      status: o.status,
      valore: o.value,
      creata: creataDentro ? creata : null,
      chiusa: chiusaDentro ? chiusaGiorno : null,
      canale: o.attribution.canale,
      campagnaId: o.attribution.campaignId,
      campagna: o.attribution.utmCampaign,
      fonte: o.source ?? SENZA_FONTE,
      tags: o.tags,
      ...(conDatiPersonali && o.status === "won" && chiusaGiorno && nelCorrente(chiusaGiorno) ? { nome: o.name } : {}),
    });
  }

  return { lead, opp, aperte };
}

export async function caricaDashboardCliente(account: Account, sel: Selezione): Promise<DatiCliente> {
  // GHL e Meta in parallelo; un problema con Meta non deve bloccare i dati di GHL
  const [grezzi, meta] = await Promise.all([
    datiGrezziCliente(account, sel),
    caricaMetaCliente(account, sel).catch(
      (e): EsitoMeta => ({ stato: "errore", tipo: "altro", messaggio: `Non riesco a leggere i dati da Meta (${(e as Error).message}).` })
    ),
  ]);
  const { lead, opp, aperte } = costruisciRighe(grezzi, { conDatiPersonali: true });
  const { corrente, precedente, fuso } = grezzi.periodo;
  return {
    cliente: { locationId: account.locationId, nome: account.name, valuta: account.currency, fuso },
    periodo: {
      giorni: corrente.giorni,
      giorniPrec: precedente.giorni,
      daGiorno: corrente.daGiorno,
      aGiorno: corrente.aGiorno,
      daGiornoPrec: precedente.daGiorno,
      aGiornoPrec: precedente.aGiorno,
    },
    pipelines: grezzi.pipelines,
    lead,
    opp,
    aperte,
    aggiornatoIl: grezzi.aggiornatoIl,
    meta,
    obiettivoCpl: account.thresholds.maxCpl ?? null,
  };
}
