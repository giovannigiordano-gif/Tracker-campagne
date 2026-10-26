// Traduzione dei dati grezzi di GHL nei tipi interni.
// La mappatura dell'attribuzione nasce dall'analisi di 20 contatti reali (vedi CLAUDE.md).
import type { Attribution, Canale, Contact, Opportunity, OppStatus, Pipeline } from "./types";

// Campi di attribuzione come arrivano da POST /contacts/search (solo quelli che usiamo:
// ip, userAgent, fbc, fbp, url ecc. vengono ignorati di proposito)
type RawAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  campaign?: string;
  utmTerm?: string;
  utmKeyword?: string;
  utmContent?: string;
  campaignId?: string;
  adGroupId?: string;
  adId?: string;
  sessionSource?: string;
  medium?: string;
  adSource?: string;
  gclid?: string;
};

export type RawContact = {
  id: string;
  locationId: string;
  dateAdded: string;
  firstName?: string | null;
  lastName?: string | null;
  contactName?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  tags?: string[];
  attributionSource?: RawAttribution | null;
  lastAttributionSource?: RawAttribution | null;
  searchAfter?: unknown[];
};

const pulito = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const minuscolo = (v: unknown) => (pulito(v) ?? "").toLowerCase();

const SORGENTI_META = new Set(["facebook", "fb", "instagram", "ig", "meta"]);
const SORGENTI_LINKEDIN = new Set(["linkedin", "linkedin.com", "lnkd", "lnkd.in", "li"]);
// Medium che indicano un annuncio a pagamento (utm_medium scelto da chi imposta il tracciamento su LinkedIn)
const MEDIUM_PAGATO = /paid|cpc|ppc|cpm|sponsor|\bads?\b/;

// Regole verificate sui dati reali:
// - "Paid Social" + facebook/instagram (o ID campagna/annuncio presenti) = annuncio Meta;
// - "Social media" + facebook/instagram = messaggi o commenti organici, NON annunci:
//   non devono entrare nei lead Meta, altrimenti il CPL reale risulterebbe falsato.
// LinkedIn (2026-10-26, nessun lead LinkedIn ancora nei dati reali: da confermare sui primi):
// - sorgente linkedin + un segnale di annuncio (sessione "Paid", utm_medium a pagamento, ID campagna/annuncio
//   o utm_campaign numerico, cioè l'ID campagna messo da LinkedIn con i parametri UTM dinamici) = LinkedIn Ads;
// - sorgente linkedin senza segnali di annuncio = social organico.
function ricavaCanale(a: RawAttribution): Canale {
  const utmSource = minuscolo(a.utmSource);
  const medium = minuscolo(a.medium);
  const adSource = minuscolo(a.adSource);
  const sessione = minuscolo(a.sessionSource);
  const segnaleMeta = SORGENTI_META.has(adSource) || SORGENTI_META.has(medium) || SORGENTI_META.has(utmSource);
  const segnaleLinkedin = [adSource, medium, utmSource].some((v) => SORGENTI_LINKEDIN.has(v) || v.includes("linkedin"));

  if (segnaleMeta && (sessione.includes("paid") || SORGENTI_META.has(adSource) || pulito(a.campaignId) || pulito(a.adId))) {
    return "Meta Ads";
  }
  if (
    segnaleLinkedin &&
    (sessione.includes("paid") || MEDIUM_PAGATO.test(minuscolo(a.utmMedium)) || pulito(a.campaignId) || pulito(a.adId) || /^\d{5,}$/.test(pulito(a.utmCampaign) ?? ""))
  ) {
    return "LinkedIn Ads";
  }
  if (adSource.startsWith("google") || pulito(a.gclid) || (utmSource === "google" && sessione.includes("paid"))) {
    return "Google Ads";
  }
  if (sessione === "crm ui" || medium === "manual") return "Inserito a mano";
  if (sessione.includes("social") || segnaleMeta || segnaleLinkedin) return "Social organico";
  if (sessione.includes("organic search")) return "Ricerca organica";
  if (sessione.includes("direct")) return "Diretto";
  if (sessione.includes("referral")) return "Referral";
  if (!sessione && !medium && !adSource && !utmSource) return "Sconosciuto";
  return "Altro";
}

// Si usa la prima attribuzione (primo contatto); se è vuota, l'ultima
function scegliAttribuzione(c: RawContact): RawAttribution {
  const primo = c.attributionSource ?? {};
  if (Object.keys(primo).length > 0) return primo;
  return c.lastAttributionSource ?? {};
}

export function normalizeAttribution(a: RawAttribution): Attribution {
  return {
    utmSource: pulito(a.utmSource),
    utmMedium: pulito(a.utmMedium),
    utmCampaign: pulito(a.utmCampaign) ?? pulito(a.campaign),
    utmTerm: pulito(a.utmTerm) ?? pulito(a.utmKeyword),
    utmContent: pulito(a.utmContent),
    campaignId: pulito(a.campaignId),
    adsetId: pulito(a.adGroupId),
    adId: pulito(a.adId),
    origine: pulito(a.sessionSource),
    canale: ricavaCanale(a),
  };
}

export function normalizeContact(c: RawContact): Contact {
  const attribution = normalizeAttribution(scegliAttribuzione(c));
  const nomeCompleto = [pulito(c.firstName), pulito(c.lastName)].filter(Boolean).join(" ");
  return {
    id: c.id,
    locationId: c.locationId,
    dateAdded: c.dateAdded,
    name: nomeCompleto || pulito(c.contactName) || pulito(c.companyName) || "(senza nome)",
    email: pulito(c.email),
    phone: pulito(c.phone),
    source: pulito(c.source),
    tags: (c.tags ?? []).filter((t) => typeof t === "string" && t.trim()),
    attribution,
    attributed: !!(attribution.campaignId || attribution.utmCampaign),
  };
}

// ---------------------------------------------------------------- opportunità e pipeline
// Le opportunità hanno una loro attribuzione, con nomi dei campi diversi da quelli dei contatti
// (verificato su dati reali): utmSessionSource, utmCampaignId, utmAdId, isFirst/isLast.
type RawOppAttribution = {
  isFirst?: boolean;
  isLast?: boolean;
  utmSessionSource?: string;
  medium?: string;
  adSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmCampaignId?: string;
  utmAdId?: string;
  utmContent?: string;
  utmKeyword?: string;
  utmTerm?: string;
  gclid?: string;
};

export type RawOpportunity = {
  id: string;
  locationId: string;
  name?: string | null;
  monetaryValue?: number | null;
  pipelineId: string;
  pipelineStageId: string;
  status: string;
  source?: string | null;
  createdAt: string;
  lastStatusChangeAt?: string | null;
  lastStageChangeAt?: string | null;
  contactId?: string | null;
  contact?: { tags?: string[] } | null;
  attributions?: RawOppAttribution[] | null;
};

const STATI: OppStatus[] = ["open", "won", "lost", "abandoned"];

export function normalizeOpportunity(o: RawOpportunity): Opportunity {
  const lista = o.attributions ?? [];
  const a = lista.find((x) => x.isFirst) ?? lista[0] ?? {};
  // Si riporta l'attribuzione al formato dei contatti per riusare le stesse regole
  const comeContatto: RawAttribution = {
    sessionSource: a.utmSessionSource,
    medium: a.medium,
    adSource: a.adSource,
    utmSource: a.utmSource,
    utmMedium: a.utmMedium,
    utmCampaign: a.utmCampaign,
    utmTerm: a.utmTerm,
    utmKeyword: a.utmKeyword,
    utmContent: a.utmContent,
    campaignId: a.utmCampaignId,
    adId: a.utmAdId,
    gclid: a.gclid,
  };
  return {
    id: o.id,
    locationId: o.locationId,
    name: pulito(o.name) ?? "(senza nome)",
    pipelineId: o.pipelineId,
    stageId: o.pipelineStageId,
    status: (STATI as string[]).includes(o.status) ? (o.status as OppStatus) : "open",
    value: typeof o.monetaryValue === "number" && Number.isFinite(o.monetaryValue) ? o.monetaryValue : 0,
    source: pulito(o.source),
    createdAt: o.createdAt,
    lastStatusChangeAt: pulito(o.lastStatusChangeAt),
    lastStageChangeAt: pulito(o.lastStageChangeAt),
    contactId: pulito(o.contactId),
    tags: (o.contact?.tags ?? []).filter((t) => typeof t === "string" && t.trim()),
    attribution: normalizeAttribution(comeContatto),
  };
}

type RawPipeline = { id: string; name?: string; stages?: { id: string; name?: string; position?: number }[] };

export function normalizePipeline(p: RawPipeline): Pipeline {
  return {
    id: p.id,
    name: pulito(p.name) ?? p.id,
    stages: (p.stages ?? [])
      .map((s, i) => ({ id: s.id, name: pulito(s.name) ?? s.id, position: s.position ?? i }))
      .sort((a, b) => a.position - b.position),
  };
}
