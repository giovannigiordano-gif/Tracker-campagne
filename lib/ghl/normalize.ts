// Traduzione dei dati grezzi di GHL nei tipi interni.
// La mappatura dell'attribuzione nasce dall'analisi di 20 contatti reali (vedi CLAUDE.md).
import type { Attribution, Canale, Contact } from "./types";

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

// Regole verificate sui dati reali:
// - "Paid Social" + facebook/instagram (o ID campagna/annuncio presenti) = annuncio Meta;
// - "Social media" + facebook/instagram = messaggi o commenti organici, NON annunci:
//   non devono entrare nei lead Meta, altrimenti il CPL reale risulterebbe falsato.
function ricavaCanale(a: RawAttribution): Canale {
  const utmSource = minuscolo(a.utmSource);
  const medium = minuscolo(a.medium);
  const adSource = minuscolo(a.adSource);
  const sessione = minuscolo(a.sessionSource);
  const segnaleMeta = SORGENTI_META.has(adSource) || SORGENTI_META.has(medium) || SORGENTI_META.has(utmSource);

  if (segnaleMeta && (sessione.includes("paid") || SORGENTI_META.has(adSource) || pulito(a.campaignId) || pulito(a.adId))) {
    return "Meta Ads";
  }
  if (adSource.startsWith("google") || pulito(a.gclid) || (utmSource === "google" && sessione.includes("paid"))) {
    return "Google Ads";
  }
  if (sessione === "crm ui" || medium === "manual") return "Inserito a mano";
  if (sessione.includes("social") || segnaleMeta) return "Social organico";
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
