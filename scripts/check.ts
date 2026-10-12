// "npm run check": verifica i collegamenti a GoHighLevel, Meta e Anthropic e stampa un esito leggibile.
// Fa solo letture. Non stampa mai token né dati personali dei contatti: solo esiti e conteggi.
import { existsSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { readAccounts } from "../lib/accounts";
import { getLocationToken } from "../lib/ghl/tokens";

if (existsSync(".env")) process.loadEnvFile(".env");

const env = (name: string) => process.env[name]?.trim() ?? "";

// Esito complessivo: diventa false se un collegamento configurato non funziona
let tuttoOk = true;
const ok = (msg: string) => console.log(`  ✅ ${msg}`);
const ko = (msg: string) => { tuttoOk = false; console.log(`  ❌ ${msg}`); };
const attesa = (msg: string) => console.log(`  ⏳ ${msg}`);

// Chiamata HTTP che restituisce stato e JSON senza mai lanciare eccezioni
async function richiesta(url: string, init: RequestInit = {}) {
  try {
    const res = await fetch(url, init);
    let json: any = null;
    try { json = await res.json(); } catch {}
    return { status: res.status, json };
  } catch (e) {
    return { status: 0, json: { message: (e as Error).message } };
  }
}

// Traduce gli errori HTTP più comuni in un messaggio comprensibile
function spiegaErrore(status: number, json: any, servizio: string) {
  const dettaglio = json?.error?.message ?? json?.message ?? json?.error ?? "";
  const testo = typeof dettaglio === "string" ? dettaglio : JSON.stringify(dettaglio);
  if (status === 0) return `${servizio} non raggiungibile (connessione assente?): ${testo}`;
  if (status === 401) return `token ${servizio} non valido, scaduto o senza il permesso necessario (${testo})`;
  if (status === 403) return `accesso negato da ${servizio} (${testo})`;
  if (status === 429) return `troppe richieste a ${servizio}: riprova tra poco`;
  return `${servizio} ha risposto con errore ${status}: ${testo}`;
}

// ---------------------------------------------------------------- GoHighLevel
async function checkGhl() {
  console.log("\nGoHighLevel");
  const base = "https://services.leadconnectorhq.com";
  const version = env("GHL_API_VERSION") || "v3";
  const headers = (token: string) => ({
    Authorization: `Bearer ${token}`,
    Version: version,
    Accept: "application/json",
  });

  // 1) Token agency: elenco dei sub-account
  const agencyToken = env("GHL_AGENCY_TOKEN");
  const companyId = env("GHL_COMPANY_ID");
  if (!agencyToken || !companyId) {
    ko("GHL_AGENCY_TOKEN o GHL_COMPANY_ID mancanti nel file .env");
  } else {
    let totale = 0;
    for (let skip = 0; ; skip += 100) {
      const r = await richiesta(
        `${base}/locations/search?companyId=${companyId}&limit=100&skip=${skip}`,
        { headers: headers(agencyToken) },
      );
      if (r.status !== 200) { ko(`Token agency: ${spiegaErrore(r.status, r.json, "GHL")}`); totale = -1; break; }
      const pagina = r.json?.locations?.length ?? 0;
      totale += pagina;
      if (pagina < 100) break;
    }
    if (totale >= 0) ok(`Token agency: ${totale} sub-account visibili`);
  }

  // 2) Token dei singoli sub-account: clienti configurati nell'app (token cifrati in data/secrets/)
  //    più eventuali GHL_TOKEN_<LOCATIONID> nel file .env
  const ids = new Set([
    ...(await readAccounts()).map((a) => a.locationId),
    ...Object.keys(process.env).filter((k) => k.startsWith("GHL_TOKEN_") && env(k)).map((k) => k.slice("GHL_TOKEN_".length)),
  ]);
  const tokenLocation: { locationId: string; token: string }[] = [];
  for (const locationId of ids) {
    const token = await getLocationToken(locationId);
    if (token) tokenLocation.push({ locationId, token });
    else ko(`Sub-account ${locationId}: manca il token (inseriscilo in Impostazioni)`);
  }

  if (tokenLocation.length === 0) {
    attesa("Nessun token di sub-account configurato");
    return;
  }

  for (const { locationId, token } of tokenLocation) {
    const h = headers(token);
    const loc = await richiesta(`${base}/locations/${locationId}`, { headers: h });
    if (loc.status !== 200) { ko(`Sub-account ${locationId}: ${spiegaErrore(loc.status, loc.json, "GHL")}`); continue; }
    const nome = loc.json?.location?.name ?? locationId;

    const contatti = await richiesta(`${base}/contacts/search`, {
      method: "POST", // ricerca in sola lettura: GHL usa POST per i filtri
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ locationId, page: 1, pageLimit: 1 }),
    });
    const pipeline = await richiesta(`${base}/opportunities/pipelines?locationId=${locationId}`, { headers: h });
    const opportunita = await richiesta(`${base}/opportunities/search?locationId=${locationId}&limit=1`, { headers: h });

    const errori = [
      contatti.status !== 200 && `contatti: ${spiegaErrore(contatti.status, contatti.json, "GHL")}`,
      pipeline.status !== 200 && `pipeline: ${spiegaErrore(pipeline.status, pipeline.json, "GHL")}`,
      opportunita.status !== 200 && `opportunità: ${spiegaErrore(opportunita.status, opportunita.json, "GHL")}`,
    ].filter(Boolean);

    if (errori.length) ko(`${nome}: ${errori.join("; ")}`);
    else ok(
      `${nome}: ${contatti.json?.total ?? "?"} contatti, ` +
      `${pipeline.json?.pipelines?.length ?? "?"} pipeline, ` +
      `${opportunita.json?.meta?.total ?? "?"} opportunità`,
    );
  }
}

// ---------------------------------------------------------------- Meta
async function checkMeta() {
  console.log("\nMeta (Marketing API)");
  const token = env("META_SYSTEM_USER_TOKEN");
  const versione = env("META_GRAPH_VERSION") || "v26.0";
  if (!token) { attesa("META_SYSTEM_USER_TOKEN non ancora configurato (serve dalla Fase 3)"); return; }

  const graph = `https://graph.facebook.com/${versione}`;
  const auth = { Authorization: `Bearer ${token}` };

  const me = await richiesta(`${graph}/me?fields=id,name`, { headers: auth });
  if (me.status !== 200) { ko(`System User: ${spiegaErrore(me.status, me.json, "Meta")}`); return; }
  ok(`System User: ${me.json.name}`);

  const conti = await richiesta(
    `${graph}/${me.json.id}/assigned_ad_accounts?fields=name,account_id,currency,account_status&limit=200`,
    { headers: auth },
  );
  if (conti.status !== 200) { ko(`Account pubblicitari: ${spiegaErrore(conti.status, conti.json, "Meta")}`); return; }
  const elenco: any[] = conti.json?.data ?? [];
  ok(`${elenco.length} account pubblicitari assegnati al System User`);
}

// ---------------------------------------------------------------- Anthropic
async function checkAnthropic() {
  console.log("\nAnthropic (analisi AI)");
  const apiKey = env("ANTHROPIC_API_KEY");
  const modello = env("ANTHROPIC_MODEL") || "claude-opus-5-5";
  if (!apiKey) { attesa("ANTHROPIC_API_KEY non ancora configurata (serve dalla Fase 5)"); return; }

  // Leggere i dati del modello non consuma token: verifica sia la chiave sia il nome del modello
  const client = new Anthropic({ apiKey });
  try {
    const m = await client.models.retrieve(modello);
    ok(`Chiave valida, modello disponibile: ${m.display_name} (${m.id})`);
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) ko("ANTHROPIC_API_KEY non valida");
    else if (e instanceof Anthropic.NotFoundError) ko(`Modello "${modello}" non trovato: controlla ANTHROPIC_MODEL`);
    else if (e instanceof Anthropic.APIConnectionError) ko("Anthropic non raggiungibile (connessione assente?)");
    else if (e instanceof Anthropic.APIError) ko(`Anthropic ha risposto con errore ${e.status}: ${e.message}`);
    else throw e;
  }
}

async function main() {
  console.log("Verifica collegamenti — Agency Insights");
  await checkGhl();
  await checkMeta();
  await checkAnthropic();
  console.log(tuttoOk
    ? "\nEsito: tutti i collegamenti configurati funzionano.\n"
    : "\nEsito: ci sono problemi, vedi le righe con ❌.\n");
  process.exit(tuttoOk ? 0 : 1);
}

main();
