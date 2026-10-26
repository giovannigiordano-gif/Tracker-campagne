// Dati dell'API Marketing di LinkedIn tradotti negli stessi tipi interni usati per Meta (lib/meta/normalize.ts):
// così la sezione "Campagne LinkedIn" riusa calcoli, grafici e criticità. Funzioni pure, testate.
// Campi verificati sulla documentazione ufficiale (2026-10-26):
// - adAnalytics (pivot CAMPAIGN, DAILY): dateRange.start, pivotValues[urn:li:sponsoredCampaign:ID],
//   costInLocalCurrency (testo, valuta dell'account), impressions, clicks, landingPageClicks,
//   oneClickLeads (lead dei moduli LinkedIn). I giorni sono in UTC.
// - adCampaigns: id, name, status, objectiveType, servingStatuses (RUNNABLE se in pubblicazione).
// - adAccounts: id, name, currency, status, servingStatuses.
import type { AccountMetaInfo, CampagnaFerma, CampagnaMeta, InsightGiorno } from "../meta/normalize";
import { giornoDaData, idDaUrn } from "./restli";

type Grezzo = Record<string, unknown>;

const numero = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const testo = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const elenco = (v: unknown) => (Array.isArray(v) ? v.map(testo) : []);

// Motivi per cui LinkedIn non pubblica un account o una campagna (servingStatuses), in italiano.
// Nomi di Campaign Manager dalla fine del 2025: la "campaign" dell'API si chiama "gruppo di annunci" (Ad set)
// e il "campaign group" dell'API si chiama "campagna". L'API non ha cambiato nomi.
export const MOTIVI_FERMO: Record<string, string> = {
  STOPPED: "pubblicazione interrotta",
  BILLING_HOLD: "l'account è bloccato per un problema di pagamento",
  ACCOUNT_TOTAL_BUDGET_HOLD: "il budget totale dell'account è esaurito",
  ACCOUNT_END_DATE_HOLD: "l'account ha superato la data di fine",
  RESTRICTED_HOLD: "l'account ha delle limitazioni",
  INTERNAL_HOLD: "l'account è bloccato da LinkedIn",
  ACCOUNT_SERVING_HOLD: "l'account non è in pubblicazione",
  CAMPAIGN_END_DATE_HOLD: "ha superato la data di fine",
  CAMPAIGN_TOTAL_BUDGET_HOLD: "il budget totale del gruppo di annunci è esaurito",
  CAMPAIGN_AUDIENCE_COUNT_HOLD: "il pubblico è troppo piccolo",
  CAMPAIGN_GROUP_END_DATE_HOLD: "la campagna che lo contiene ha superato la data di fine",
  CAMPAIGN_GROUP_TOTAL_BUDGET_HOLD: "il budget della campagna che lo contiene è esaurito",
  CAMPAIGN_GROUP_STATUS_HOLD: "la campagna che lo contiene è in pausa",
};
// Non sono problemi: il gruppo di annunci partirà più avanti
const MOTIVI_IGNORATI = new Set(["RUNNABLE", "CAMPAIGN_START_DATE_HOLD", "CAMPAIGN_GROUP_START_DATE_HOLD"]);

const STATI_ACCOUNT_LINKEDIN: Record<string, string> = {
  CANCELED: "chiuso",
  DRAFT: "in bozza",
  PENDING_DELETION: "in eliminazione",
  REMOVED: "eliminato",
};

export function normalizzaStatisticaLinkedIn(r: Grezzo, account: string, nomi: Map<string, string>): InsightGiorno {
  const campagnaId = idDaUrn(elenco(r.pivotValues)[0]);
  const intervallo = r.dateRange as { start?: { year?: number; month?: number; day?: number } } | undefined;
  return {
    act: account,
    giorno: giornoDaData(intervallo?.start),
    campagnaId,
    campagna: nomi.get(campagnaId) ?? `Campagna ${campagnaId}`,
    spesa: numero(r.costInLocalCurrency),
    impression: numero(r.impressions),
    reach: 0,
    frequenza: 0,
    clic: numero(r.clicks),
    clicLink: numero(r.landingPageClicks),
    leadMeta: numero(r.oneClickLeads), // lead dei moduli LinkedIn: usati solo per la criticità "spesa senza risultati"
  };
}

export function normalizzaCampagnaLinkedIn(c: Grezzo, account: string): CampagnaMeta {
  return {
    act: account,
    id: testo(c.id),
    nome: testo(c.name) || `Campagna ${testo(c.id)}`,
    stato: testo(c.status),
    obiettivo: testo(c.objectiveType) || null,
  };
}

// Campagna attiva che LinkedIn non sta pubblicando, con il primo motivo che conta
export function campagnaFerma(c: Grezzo, account: string): CampagnaFerma | null {
  if (testo(c.status) !== "ACTIVE") return null;
  const stati = elenco(c.servingStatuses);
  if (!stati.length || stati.includes("RUNNABLE")) return null;
  const motivo = stati.find((s) => !MOTIVI_IGNORATI.has(s));
  if (!motivo) return null;
  return { act: account, campagnaId: testo(c.id), motivo: MOTIVI_FERMO[motivo] ?? `stato ${motivo}` };
}

export function normalizzaAccountLinkedIn(a: Grezzo, id: string): AccountMetaInfo {
  const stato = testo(a.status) || "ACTIVE";
  const servizio = elenco(a.servingStatuses);
  const inPubblicazione = stato === "ACTIVE" && (servizio.length === 0 || servizio.includes("RUNNABLE"));
  const motivo = servizio.find((s) => s !== "RUNNABLE");
  return {
    id: testo(a.id) || id,
    nome: testo(a.name) || `Account ${id}`,
    valuta: testo(a.currency) || "EUR",
    stato: inPubblicazione ? 1 : 0,
    fuso: "UTC",
    ...(inPubblicazione
      ? {}
      : {
          statoTesto:
            stato !== "ACTIVE"
              ? (STATI_ACCOUNT_LINKEDIN[stato] ?? `in stato ${stato}`)
              : `fermo (${motivo ? (MOTIVI_FERMO[motivo] ?? motivo) : "motivo non indicato"})`,
        }),
  };
}

// Account visibili nel collegamento (Impostazioni): id, nome, valuta e se pubblica
export type AccountLinkedIn = { id: string; nome: string; valuta: string; attivo: boolean };

export function normalizzaAccountVisibile(a: Grezzo): AccountLinkedIn {
  const info = normalizzaAccountLinkedIn(a, testo(a.id));
  return { id: info.id, nome: info.nome, valuta: info.valuta, attivo: testo(a.status || "ACTIVE") === "ACTIVE" };
}

// Frequenza = impression / persone raggiunte (LinkedIn dà la copertura solo su intervalli fino a 92 giorni)
export function frequenzaDaCopertura(r: Grezzo | undefined): number | null {
  const impression = numero(r?.impressions);
  const persone = numero(r?.approximateMemberReach);
  return persone > 0 ? impression / persone : null;
}
