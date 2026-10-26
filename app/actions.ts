"use server";
// Azioni eseguite sul server quando si preme un pulsante nell'app.
// Modificano SOLO i dati dell'app (clienti, token cifrati, link, cache): mai GHL o Meta.
// Ogni azione del titolare ricontrolla l'accesso (richiediAccesso): le azioni si possono chiamare da qualsiasi
// indirizzo, quindi il blocco delle pagine nel proxy non basta.
import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { configAccesso, richiediAccesso } from "@/lib/accesso";
import { creaSessione, DURATA_SESSIONE_MS, NOME_COOKIE, passwordCorretta, percorsoSicuro } from "@/lib/sessione";
import { getAccount, removeAccount, upsertAccount, type Account } from "@/lib/accounts";
import * as cache from "@/lib/cache";
import { condivisioni } from "@/lib/condivisioni";
import { idAccountMeta } from "@/lib/meta-mcp/account";
import { verificaCollegamento } from "@/lib/meta-mcp/client";
import { scollegaMeta } from "@/lib/meta-mcp/oauth";
import { elencoSubAccount } from "@/lib/data/impostazioni";
import { verificaTokenLocation } from "@/lib/ghl/client";
import { deleteLocationToken, saveLocationToken } from "@/lib/ghl/tokens";
import { fusoValido } from "@/lib/period";
import { eliminaAnalisi } from "@/lib/analisi";
import { verificaLinkedIn } from "@/lib/linkedin/api";
import { salvaCredenzialiLinkedIn, scollegaLinkedIn } from "@/lib/linkedin/oauth";
import { indirizzoRisposta, leggiRichiesta } from "@/lib/connettore/autorizza";
import { ErroreClient, verificaClient } from "@/lib/connettore/client";
import { indirizzoBase } from "@/lib/connettore/indirizzi";
import { chiaviConnettore, registraCollegamento, scollegaClaude } from "@/lib/connettore/stato";
import { creaToken, DURATA_CODICE_MS, SCOPE } from "@/lib/connettore/token";

export type EsitoAzione = { ok: boolean; messaggio: string } | null;

// Gli ID dei sub-account GHL sono alfanumerici: si rifiuta tutto il resto
const ID_RE = /^[A-Za-z0-9]{8,40}$/;

function verificaId(id: unknown) {
  if (typeof id !== "string" || !ID_RE.test(id)) throw new Error("ID del sub-account non valido");
  return id;
}

function leggiId(formData: FormData) {
  return verificaId(formData.get("locationId"));
}

// ---------------------------------------------------------------- aggiornamento dati
export async function aggiornaDati(formData: FormData) {
  await richiediAccesso();
  const id = formData.get("locationId");
  // Con un cliente: svuota solo la sua cache (GHL e account Meta e LinkedIn associati). Senza: tutta la cache.
  if (typeof id === "string" && ID_RE.test(id)) {
    await cache.invalidate(`ghl:${id}:`);
    const cliente = await getAccount(id);
    for (const act of cliente?.metaAdAccountIds ?? []) await cache.invalidate(`meta:${act}:`);
    for (const li of cliente?.linkedinAdAccountIds ?? []) await cache.invalidate(`linkedin:${li}:`);
  } else {
    await cache.invalidate("ghl:");
    await cache.invalidate("meta:");
    await cache.invalidate("linkedin:");
  }
  refresh();
}

export async function svuotaCache() {
  await richiediAccesso();
  await cache.invalidate("");
  refresh();
}

// ---------------------------------------------------------------- clienti
export async function aggiungiCliente(_prev: EsitoAzione, formData: FormData): Promise<EsitoAzione> {
  await richiediAccesso();
  const id = leggiId(formData);
  const sub = (await elencoSubAccount()).value.find((l) => l.id === id);
  if (!sub) return { ok: false, messaggio: "Sub-account non trovato nell'elenco di GHL" };
  if (await getAccount(id)) return { ok: false, messaggio: `${sub.name} è già nell'elenco` };

  await upsertAccount({
    locationId: id,
    name: sub.name,
    metaAdAccountIds: [],
    linkedinAdAccountIds: [],
    currency: "EUR",
    timezone: fusoValido(sub.timezone),
    notes: "",
    active: true,
    thresholds: {},
  });
  refresh();
  return { ok: true, messaggio: `${sub.name} aggiunto. Ora inserisci il suo token GHL.` };
}

export async function modificaCliente(_prev: EsitoAzione, formData: FormData): Promise<EsitoAzione> {
  await richiediAccesso();
  const id = leggiId(formData);
  const attuale = await getAccount(id);
  if (!attuale) return { ok: false, messaggio: "Cliente non trovato" };

  const nome = String(formData.get("name") ?? "").trim();
  const fuso = String(formData.get("timezone") ?? "").trim();
  const valuta = String(formData.get("currency") ?? "").trim().toUpperCase();
  const soglia = String(formData.get("leadDropPct") ?? "").trim();
  const obiettivoCpl = String(formData.get("maxCpl") ?? "").trim().replace(",", ".");

  if (!nome) return { ok: false, messaggio: "Il nome non può essere vuoto" };
  if (fusoValido(fuso) !== fuso) return { ok: false, messaggio: `Fuso orario "${fuso}" non valido (es. Europe/Rome)` };
  if (!/^[A-Z]{3}$/.test(valuta)) return { ok: false, messaggio: "Valuta non valida: usa il codice a 3 lettere (es. EUR)" };
  const sogliaNum = soglia === "" ? undefined : Number(soglia);
  const obiettivoCplNum = obiettivoCpl === "" ? undefined : Number(obiettivoCpl);
  if (obiettivoCplNum !== undefined && !(obiettivoCplNum > 0 && obiettivoCplNum < 100000)) {
    return { ok: false, messaggio: "Il costo per lead obiettivo deve essere un importo maggiore di zero" };
  }
  // Account pubblicitari Meta scelti (formato act_<numero>); si aggiornano solo se il modulo li contiene
  const conAccountMeta = formData.get("metaAdAccountIdsPresenti") === "1";
  // Un identificativo di sole cifre (elenchi salvati prima del 2026-10-20) diventa act_<numero>
  const accountMeta = [...new Set(formData.getAll("metaAdAccountIds").map((v) => idAccountMeta(String(v).trim())))];
  if (accountMeta.some((a) => !/^act_\d{3,30}$/.test(a))) return { ok: false, messaggio: "Account pubblicitario Meta non valido" };
  // Account pubblicitari LinkedIn scelti (ID numerici); si aggiornano solo se il modulo li contiene
  const conAccountLinkedIn = formData.get("linkedinAdAccountIdsPresenti") === "1";
  const accountLinkedIn = [...new Set(formData.getAll("linkedinAdAccountIds").map((v) => String(v).trim()))];
  if (accountLinkedIn.some((a) => !/^\d{3,20}$/.test(a))) return { ok: false, messaggio: "Account pubblicitario LinkedIn non valido" };
  if (sogliaNum !== undefined && !(sogliaNum > 0 && sogliaNum <= 100)) {
    return { ok: false, messaggio: "La soglia di calo lead deve essere un numero tra 1 e 100" };
  }

  const aggiornato: Account = {
    ...attuale,
    name: nome,
    timezone: fuso,
    currency: valuta,
    notes: String(formData.get("notes") ?? "").trim(),
    metaAdAccountIds: conAccountMeta ? accountMeta : attuale.metaAdAccountIds,
    linkedinAdAccountIds: conAccountLinkedIn ? accountLinkedIn : attuale.linkedinAdAccountIds,
    active: formData.get("active") === "on",
    thresholds: { ...attuale.thresholds, leadDropPct: sogliaNum, maxCpl: obiettivoCplNum },
  };
  await upsertAccount(aggiornato);
  // Il fuso orario cambia il modo di contare i giorni: si ricalcola tutto
  await cache.invalidate(`ghl:${id}:`);
  refresh();
  return { ok: true, messaggio: "Modifiche salvate" };
}

export async function rimuoviCliente(formData: FormData) {
  await richiediAccesso();
  const id = leggiId(formData);
  await removeAccount(id);
  await deleteLocationToken(id);
  await condivisioni.disattiva(id); // il link condiviso del cliente smette di funzionare
  await cache.invalidate(`ghl:${id}:`);
  refresh();
}

// ---------------------------------------------------------------- token GHL del sub-account
export async function salvaToken(_prev: EsitoAzione, formData: FormData): Promise<EsitoAzione> {
  await richiediAccesso();
  const id = leggiId(formData);
  const token = String(formData.get("token") ?? "").trim();
  if (token.length < 10 || token.length > 500 || /\s/.test(token)) {
    return { ok: false, messaggio: "Il token incollato non sembra valido" };
  }

  // Prima di salvarlo si verifica che funzioni davvero, con chiamate di sola lettura
  const problemi = await verificaTokenLocation(id, token);
  if (problemi.length) return { ok: false, messaggio: `Token non salvato: ${problemi.join("; ")}` };

  await saveLocationToken(id, token);
  await cache.invalidate(`ghl:${id}:`);
  refresh();
  return { ok: true, messaggio: "Token verificato e salvato (cifrato)" };
}

export async function rimuoviToken(formData: FormData) {
  await richiediAccesso();
  const id = leggiId(formData);
  await deleteLocationToken(id);
  await cache.invalidate(`ghl:${id}:`);
  refresh();
}

// ---------------------------------------------------------------- link condiviso con il cliente
// Restituiscono solo il codice: l'indirizzo completo lo compone il browser con la sua origine.
export type LinkCondiviso = { codice: string; creatoIl: string } | null;

export async function leggiLinkCondiviso(locationId: string): Promise<LinkCondiviso> {
  await richiediAccesso();
  return condivisioni.leggi(verificaId(locationId));
}

// Crea il link, o lo sostituisce: il vecchio smette di funzionare
export async function creaLinkCondiviso(locationId: string): Promise<LinkCondiviso> {
  await richiediAccesso();
  const id = verificaId(locationId);
  if (!(await getAccount(id))) throw new Error("Cliente non trovato");
  await condivisioni.crea(id);
  return condivisioni.leggi(id);
}

export async function disattivaLinkCondiviso(locationId: string) {
  await richiediAccesso();
  await condivisioni.disattiva(verificaId(locationId));
}

// ---------------------------------------------------------------- accesso del titolare
// Tentativi sbagliati per indirizzo: ogni errore rallenta la risposta successiva (fino a 5 secondi),
// così indovinare la password provando a ripetizione diventa lentissimo
const g = globalThis as unknown as { __tentativiAccesso?: Map<string, number> };
const tentativi = (g.__tentativiAccesso ??= new Map<string, number>());

export async function accedi(_prev: EsitoAzione, formData: FormData): Promise<EsitoAzione> {
  const config = configAccesso();
  if (config.stato === "libero") redirect("/");
  if (config.stato === "da-configurare") return { ok: false, messaggio: `App non configurata: ${config.errore}` };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "locale";
  const sbagliati = tentativi.get(ip) ?? 0;
  if (sbagliati > 0) await new Promise((r) => setTimeout(r, Math.min(sbagliati, 10) * 500));

  const inserita = String(formData.get("password") ?? "");
  if (!passwordCorretta(inserita, config.password)) {
    tentativi.set(ip, sbagliati + 1);
    return { ok: false, messaggio: "Password sbagliata. Riprova." };
  }

  tentativi.delete(ip);
  (await cookies()).set(NOME_COOKIE, creaSessione(config.segreto, config.password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURATA_SESSIONE_MS / 1000,
  });
  redirect(percorsoSicuro(String(formData.get("da") ?? "")));
}

export async function esci() {
  (await cookies()).delete(NOME_COOKIE);
  redirect("/accesso");
}

// ---------------------------------------------------------------- Meta Ads (server MCP ufficiale)
// Verifica con chiamate di sola lettura: strumenti disponibili e account pubblicitari visibili
export async function verificaMetaMcp(): Promise<EsitoAzione> {
  await richiediAccesso();
  const esito = await verificaCollegamento();
  refresh();
  return { ok: esito.ok, messaggio: esito.messaggio };
}

// L'app dimentica il collegamento (su Meta non cambia nulla)
export async function scollegaMetaMcp() {
  await richiediAccesso();
  await scollegaMeta();
  refresh();
}

// ---------------------------------------------------------------- connettore per Claude
// Consenso dalla pagina /oauth/autorizza: con la password dell'app si crea il codice che Claude scambia
// con i token. Nessun accesso richiesto prima: la pagina si apre da Claude, la password fa da controllo.
export type EsitoConsenso = { ok: true; indirizzo: string } | { ok: false; messaggio: string } | null;

export async function autorizzaConnettore(_prev: EsitoConsenso, formData: FormData): Promise<EsitoConsenso> {
  const config = configAccesso();
  if (config.stato !== "pronto") return { ok: false, messaggio: "Il connettore funziona solo online, con la password dell'app impostata." };

  const intestazioni = await headers();
  const ip = intestazioni.get("x-forwarded-for")?.split(",")[0]?.trim() || "locale";
  const sbagliati = tentativi.get(ip) ?? 0;
  if (sbagliati > 0) await new Promise((r) => setTimeout(r, Math.min(sbagliati, 10) * 500));
  if (!passwordCorretta(String(formData.get("password") ?? ""), config.password)) {
    tentativi.set(ip, sbagliati + 1);
    return { ok: false, messaggio: "Password sbagliata. Riprova." };
  }
  tentativi.delete(ip);

  // Si ricontrolla tutto: i campi nascosti del modulo si possono modificare
  const base = indirizzoBase(intestazioni);
  const lettura = leggiRichiesta((nome) => {
    const v = formData.get(nome);
    return typeof v === "string" && v !== "" ? v : null;
  }, base);
  if (!lettura.ok) return { ok: false, messaggio: lettura.errore };
  const { richiesta } = lettura;
  try {
    await verificaClient(richiesta.clientId, richiesta.ritorno);
  } catch (e) {
    if (e instanceof ErroreClient) return { ok: false, messaggio: e.message };
    throw e;
  }
  const chiavi = await chiaviConnettore();
  if (!chiavi) return { ok: false, messaggio: "App non configurata." };

  const codice = creaToken<"codice">(
    { t: "codice", cid: richiesta.clientId, r: richiesta.risorsa, sc: SCOPE, ru: richiesta.ritorno, cc: richiesta.challenge },
    DURATA_CODICE_MS,
    chiavi
  );
  // Data dell'ultimo collegamento, mostrata in Impostazioni: se il salvataggio non riesce il collegamento va avanti
  await registraCollegamento().catch(() => {});
  return { ok: true, indirizzo: indirizzoRisposta(richiesta.ritorno, { code: codice, state: richiesta.stato, iss: base }) };
}

// Annulla tutti i token dati a Claude: per usarlo di nuovo bisogna ricollegare il connettore
export async function scollegaConnettore() {
  await richiediAccesso();
  await scollegaClaude();
  refresh();
}

// ---------------------------------------------------------------- analisi salvate
export async function eliminaAnalisiSalvata(locationId: string, id: string) {
  await richiediAccesso();
  verificaId(locationId);
  if (typeof id !== "string" || !/^[A-Za-z0-9-]{1,40}$/.test(id)) throw new Error("Analisi non valida");
  await eliminaAnalisi(locationId, id);
  refresh();
}

// ---------------------------------------------------------------- LinkedIn Ads
// Credenziali dell'app LinkedIn (Client ID e Client Secret), salvate cifrate nell'archivio. Mai rimandate al browser.
export async function salvaCredenzialiLinkedInAzione(_prev: EsitoAzione, formData: FormData): Promise<EsitoAzione> {
  await richiediAccesso();
  const clientId = String(formData.get("clientId") ?? "").trim();
  const clientSecret = String(formData.get("clientSecret") ?? "").trim();
  if (!/^[A-Za-z0-9]{6,40}$/.test(clientId)) return { ok: false, messaggio: "Client ID non valido: copialo dalla scheda «Auth» dell'app LinkedIn" };
  if (clientSecret.length < 8 || clientSecret.length > 200 || /\s/.test(clientSecret)) {
    return { ok: false, messaggio: "Client Secret non valido: copialo dalla scheda «Auth» dell'app LinkedIn" };
  }
  await salvaCredenzialiLinkedIn(clientId, clientSecret);
  refresh();
  return { ok: true, messaggio: "Credenziali salvate. Ora premi «Collega LinkedIn Ads»." };
}

// Verifica con sole letture: account pubblicitari visibili
export async function verificaLinkedInAzione(): Promise<EsitoAzione> {
  await richiediAccesso();
  const esito = await verificaLinkedIn();
  refresh();
  return esito;
}

// L'app dimentica il collegamento (su LinkedIn non cambia nulla); le credenziali restano
export async function scollegaLinkedInAzione() {
  await richiediAccesso();
  await scollegaLinkedIn();
  refresh();
}
