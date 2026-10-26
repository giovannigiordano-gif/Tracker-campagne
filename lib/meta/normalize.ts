// Dati dell'API Marketing di Meta (Graph API) tradotti nei tipi interni dell'app. Funzioni pure.
// Campi verificati sulla documentazione e sulle risposte reali del 2026-10-20:
// - insights (level=campaign, time_increment=1): date_start, campaign_id, campaign_name, spend, impressions, reach,
//   frequency, clicks, inline_link_clicks, actions[] (action_type, value). I numeri arrivano come testo.
// - lead secondo Meta = action_type "lead" ("All offsite leads plus all On-Facebook leads").
// - campagne: id, name, effective_status, objective. Annunci con problemi: effective_status, campaign_id, issues_info[].
// - account: account_status (1 = ACTIVE), name, currency, timezone_name.

export type InsightGiorno = {
  act: string; // account pubblicitario (act_...)
  giorno: string; // YYYY-MM-DD, nel fuso dell'account pubblicitario
  campagnaId: string;
  campagna: string;
  spesa: number;
  impression: number;
  reach: number;
  frequenza: number;
  clic: number;
  clicLink: number;
  leadMeta: number;
};

export type CampagnaMeta = { act: string; id: string; nome: string; stato: string; obiettivo: string | null };

export type AnnuncioProblema = { act: string; annuncioId: string; campagnaId: string; stato: string; problema: string | null };

// stato: codice Meta (1 = attivo). Per LinkedIn: 1 se l'account pubblica, 0 altrimenti, con il motivo in statoTesto.
export type AccountMetaInfo = { id: string; nome: string; valuta: string; stato: number; fuso: string | null; statoTesto?: string };

// Campagna attiva che però non è in pubblicazione (segnale di LinkedIn: budget esaurito, account bloccato...)
export type CampagnaFerma = { act: string; campagnaId: string; motivo: string };

// Stessa forma per Meta e LinkedIn (lib/data/linkedin-cliente.ts): così calcoli e grafici sono gli stessi
export type DatiMeta = {
  account: AccountMetaInfo[];
  righe: InsightGiorno[];
  campagne: CampagnaMeta[];
  problemi: AnnuncioProblema[];
  campagneFerme?: CampagnaFerma[];
  frequenza7g: Record<string, number | null>; // frequenza media degli ultimi 7 giorni, per account
  errori: string[]; // account che non si sono potuti leggere
  aggiornatoIl: number;
};

type Grezzo = Record<string, unknown>;

const numero = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const testo = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

export const TIPO_LEAD = "lead";

export function leadDaAzioni(azioni: unknown): number {
  if (!Array.isArray(azioni)) return 0;
  const lead = (azioni as Grezzo[]).find((a) => a.action_type === TIPO_LEAD);
  return lead ? numero(lead.value) : 0;
}

export function normalizzaInsight(r: Grezzo, act: string): InsightGiorno {
  return {
    act,
    giorno: testo(r.date_start),
    campagnaId: testo(r.campaign_id),
    campagna: testo(r.campaign_name) || testo(r.campaign_id),
    spesa: numero(r.spend),
    impression: numero(r.impressions),
    reach: numero(r.reach),
    frequenza: numero(r.frequency),
    clic: numero(r.clicks),
    clicLink: numero(r.inline_link_clicks),
    leadMeta: leadDaAzioni(r.actions),
  };
}

export function normalizzaCampagna(r: Grezzo, act: string): CampagnaMeta {
  return {
    act,
    id: testo(r.id),
    nome: testo(r.name) || testo(r.id),
    stato: testo(r.effective_status) || testo(r.status),
    obiettivo: testo(r.objective) || null,
  };
}

export function normalizzaAnnuncioProblema(r: Grezzo, act: string): AnnuncioProblema {
  const problemi = Array.isArray(r.issues_info) ? (r.issues_info as Grezzo[]) : [];
  const primo = problemi[0];
  return {
    act,
    annuncioId: testo(r.id),
    campagnaId: testo(r.campaign_id),
    stato: testo(r.effective_status),
    problema: primo ? testo(primo.error_summary) || testo(primo.error_message) || null : null,
  };
}

export function normalizzaAccount(r: Grezzo, act: string): AccountMetaInfo {
  return {
    id: act,
    nome: testo(r.name) || act,
    valuta: testo(r.currency) || "EUR",
    stato: numero(r.account_status) || 0,
    fuso: testo(r.timezone_name) || null,
  };
}

// Stato dell'account pubblicitario in parole (codici dalla documentazione Meta)
export const STATI_ACCOUNT: Record<number, string> = {
  1: "attivo",
  2: "disattivato",
  3: "con pagamenti in sospeso",
  7: "in revisione da Meta",
  8: "in attesa di saldo",
  9: "in periodo di tolleranza",
  100: "in chiusura",
  101: "chiuso",
};
