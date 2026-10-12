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

export type Stage = { id: string; name: string; position: number };
export type Pipeline = { id: string; name: string; stages: Stage[] };

export type OppStatus = "open" | "won" | "lost" | "abandoned";

export type Opportunity = {
  id: string;
  locationId: string;
  name: string; // spesso è il nome del contatto: resta solo in memoria e nel browser
  pipelineId: string;
  stageId: string;
  status: OppStatus;
  value: number; // valore economico (monetaryValue)
  source: string | null;
  createdAt: string;
  lastStatusChangeAt: string | null; // per le vinte/perse è la data di chiusura
  lastStageChangeAt: string | null;
  contactId: string | null;
  tags: string[]; // tag del contatto collegato
  attribution: Attribution;
};

export type GhlLocation = {
  id: string;
  name: string;
  timezone: string | null;
};
