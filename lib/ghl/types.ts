// Tipi interni dell'app: i dati di GHL vengono "tradotti" in questi tipi (vedi normalize.ts),
// così il resto del codice non dipende dal formato delle API.

// Canale di provenienza, ricavato dai campi di attribuzione
export type Canale =
  | "Meta Ads"
  | "Google Ads"
  | "Ricerca organica"
  | "Social organico"
  | "Diretto"
  | "Referral"
  | "Inserito a mano"
  | "Altro"
  | "Sconosciuto"; // nessuna informazione di provenienza

export type Attribution = {
  utmSource: string | null;
  utmMedium: string | null; // nei lead Meta contiene il nome del gruppo di inserzioni
  utmCampaign: string | null; // nome della campagna
  utmTerm: string | null;
  utmContent: string | null; // nei lead Meta contiene il nome dell'annuncio
  campaignId: string | null; // ID campagna Meta/Google
  adsetId: string | null; // ID gruppo di inserzioni (assente nei lead Meta: si ricava dall'annuncio in Fase 4)
  adId: string | null; // ID annuncio
  origine: string | null; // classificazione di GHL della sessione (es. "Paid Social", "Organic Search")
  canale: Canale;
};

export type Contact = {
  id: string;
  locationId: string;
  dateAdded: string; // data di creazione in GHL (ISO)
  // Dati personali: restano SOLO in memoria e nel browser, mai su disco né all'AI
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null; // campo "Fonte" di GHL
  tags: string[];
  attribution: Attribution;
  attributed: boolean; // true se il contatto è riconducibile a una campagna
};

export type GhlLocation = {
  id: string;
  name: string;
  timezone: string | null;
};
