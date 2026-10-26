// Costruzione degli indirizzi dell'API Marketing di LinkedIn (formato Rest.li 2.0). Funzioni pure, testate.
// Fonte: learn.microsoft.com/linkedin/marketing (Reporting, Ad Accounts, Campaigns), verificata il 2026-10-26.
// Nel formato Rest.li parentesi, due punti e virgole fanno parte della sintassi e NON si codificano;
// gli URN dentro List(...) invece sì (urn%3Ali%3AsponsoredAccount%3A123), come negli esempi ufficiali.

export const urnAccount = (id: string) => `urn:li:sponsoredAccount:${id}`;
export const urnCampagna = (id: string) => `urn:li:sponsoredCampaign:${id}`;

// Ultima parte di un URN: "urn:li:sponsoredCampaign:123" → "123"
export function idDaUrn(urn: unknown): string {
  const testo = typeof urn === "string" ? urn : urn == null ? "" : String(urn);
  return testo.split(":").pop() ?? "";
}

// Giorno "AAAA-MM-GG" → (year:2026,month:10,day:1)
export function dataRestli(giorno: string) {
  const [y, m, d] = giorno.split("-").map(Number);
  return `(year:${y},month:${m},day:${d})`;
}

// Oggetto data di LinkedIn {year, month, day} → "AAAA-MM-GG"
export function giornoDaData(d: { year?: number; month?: number; day?: number } | undefined): string {
  if (!d?.year || !d.month || !d.day) return "";
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

export const listaUrn = (urn: string[]) => `List(${urn.map(encodeURIComponent).join(",")})`;

// Statistiche giornaliere per campagna di un account (Analytics Finder, pivot CAMPAIGN, granularità DAILY)
export const CAMPI_STATISTICHE = ["dateRange", "pivotValues", "costInLocalCurrency", "impressions", "clicks", "landingPageClicks", "oneClickLeads"];

export function queryStatisticheCampagne(account: string, daGiorno: string, aGiorno: string) {
  return [
    "q=analytics",
    "pivot=CAMPAIGN",
    "timeGranularity=DAILY",
    `dateRange=(start:${dataRestli(daGiorno)},end:${dataRestli(aGiorno)})`,
    `accounts=${listaUrn([urnAccount(account)])}`,
    `fields=${CAMPI_STATISTICHE.join(",")}`,
  ].join("&");
}

// Impression e persone raggiunte di un account in un intervallo (per la frequenza degli ultimi 7 giorni)
export function queryCopertura(account: string, daGiorno: string, aGiorno: string) {
  return [
    "q=analytics",
    "pivot=ACCOUNT",
    "timeGranularity=ALL",
    `dateRange=(start:${dataRestli(daGiorno)},end:${dataRestli(aGiorno)})`,
    `accounts=${listaUrn([urnAccount(account)])}`,
    "fields=impressions,approximateMemberReach",
  ].join("&");
}

// Ricerca delle campagne di un account, escluse quelle di prova; paginazione a cursore (pageToken)
export function queryCampagne(pageToken?: string) {
  const parti = ["q=search", "search=(test:false)", "pageSize=1000"];
  if (pageToken) parti.push(`pageToken=${encodeURIComponent(pageToken)}`);
  return parti.join("&");
}

// Ricerca degli account pubblicitari: senza criteri restituisce tutti quelli a cui l'utente ha accesso
export function queryAccount(pageToken?: string) {
  const parti = ["q=search", "search=(test:false)", "pageSize=1000"];
  if (pageToken) parti.push(`pageToken=${encodeURIComponent(pageToken)}`);
  return parti.join("&");
}
