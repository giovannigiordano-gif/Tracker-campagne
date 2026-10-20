// Server MCP ufficiale di Meta Ads (beta).
// Documentazione: developers.facebook.com/documentation/ads-commerce/ads-ai-connectors/ads-mcp-server/
// Verificato il 2026-10-12:
// - il server risponde 401 senza token e indica i metadati OAuth in
//   https://mcp.facebook.com/.well-known/oauth-protected-resource/ads;
// - il server di autorizzazione (https://www.facebook.com/ads) supporta la registrazione automatica
//   del client, il PKCE S256 e il rinnovo con refresh_token.

export const META_MCP_URL = "https://mcp.facebook.com/ads";

// ID dell'app Meta for Developers del titolare (caso d'uso "Create & manage ads with ads MCP server").
// Verificato il 2026-10-20: Meta rifiuta la registrazione automatica dei client ("Dynamic registration is not
// available for this client"), la consente solo ai client che conosce. Per un client proprio la documentazione
// prevede l'ID di un'app Meta come client_id, con gli indirizzi di ritorno impostati in "Facebook Login for Business".
// Non è un segreto: compare in chiaro nell'indirizzo della pagina di accesso di Meta.
export function metaAppId() {
  return process.env.META_APP_ID?.trim() || null;
}

// Permessi chiesti a Meta: SOLO lettura.
// ads_read legge account, campagne e statistiche; ads_mcp_management è il permesso che la documentazione
// Meta elenca per usare il server MCP. Non chiediamo ads_management, catalog_management,
// business_management né i permessi delle Pagine: senza quelli il token non può modificare nulla.
export const META_MCP_SCOPE = "ads_mcp_management ads_read";

// Strumenti che l'AI potrà usare: solo quelli di lettura utili alle analisi.
// Tutti gli altri restano spenti, compresi quelli che creano, modificano, attivano o cancellano
// campagne, gruppi, annunci, creatività e pubblici.
// Nomi e descrizioni dalla pagina "Available tools" della documentazione Meta.
export const STRUMENTI_LETTURA: Record<string, string> = {
  ads_get_ad_accounts: "Elenco degli account pubblicitari, con stato, valuta e fuso orario",
  ads_get_ad_entities: "Campagne, gruppi di inserzioni e annunci con le loro metriche",
  ads_insights_performance_trend: "Andamento nel tempo di CPC, CPM, costo per risultato, CTR e ROAS",
  ads_insights_anomaly_signal: "Anomalie nelle performance da controllare",
  ads_insights_industry_benchmark: "Confronto dei gruppi di inserzioni con inserzionisti simili",
  ads_insights_auction_ranking_benchmarks: "Posizione nelle aste rispetto ai concorrenti",
  ads_insights_advertiser_context: "Riepilogo del business e del funnel dell'inserzionista",
  ads_get_opportunity_score: "Punteggio di ottimizzazione dell'account e suggerimenti di Meta",
  ads_get_errors: "Problemi che bloccano la consegna degli annunci",
  ads_account_get_activity_logs: "Registro delle modifiche fatte sull'account",
  ads_get_creatives: "Creatività dell'account pubblicitario",
  ads_get_help_article: "Articoli del Centro assistenza Meta Business",
};

// ---------------------------------------------------------------- quali strumenti usare
export type StrumentoMcp = { name: string; annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean } };

// Abilitati: solo quelli dell'elenco di lettura qui sopra E che Meta non segnala come modifiche.
// Tutto il resto (compresi strumenti nuovi che Meta aggiungerà) resta spento finché non lo approviamo noi.
export function classificaStrumenti(strumenti: StrumentoMcp[]) {
  const abilitati = strumenti
    .filter(
      (s) =>
        Object.hasOwn(STRUMENTI_LETTURA, s.name) &&
        s.annotations?.readOnlyHint !== false &&
        s.annotations?.destructiveHint !== true
    )
    .map((s) => s.name)
    .sort();
  return { abilitati, esclusi: strumenti.length - abilitati.length };
}
