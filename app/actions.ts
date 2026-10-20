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
import { verificaCollegamento } from "@/lib/meta-mcp/client";
import { scollegaMeta } from "@/lib/meta-mcp/oauth";
import { elencoSubAccount } from "@/lib/data/impostazioni";
import { verificaTokenLocation } from "@/lib/ghl/client";
import { deleteLocationToken, saveLocationToken } from "@/lib/ghl/tokens";
import { fusoValido } from "@/lib/period";

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
  // Con un cliente: svuota solo la sua cache. Senza: tutta la cache GHL.
  await cache.invalidate(typeof id === "string" && ID_RE.test(id) ? `ghl:${id}:` : "ghl:");
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

  if (!nome) return { ok: false, messaggio: "Il nome non può essere vuoto" };
  if (fusoValido(fuso) !== fuso) return { ok: false, messaggio: `Fuso orario "${fuso}" non valido (es. Europe/Rome)` };
  if (!/^[A-Z]{3}$/.test(valuta)) return { ok: false, messaggio: "Valuta non valida: usa il codice a 3 lettere (es. EUR)" };
  const sogliaNum = soglia === "" ? undefined : Number(soglia);
  if (sogliaNum !== undefined && !(sogliaNum > 0 && sogliaNum <= 100)) {
    return { ok: false, messaggio: "La soglia di calo lead deve essere un numero tra 1 e 100" };
  }

  const aggiornato: Account = {
    ...attuale,
    name: nome,
    timezone: fuso,
    currency: valuta,
    notes: String(formData.get("notes") ?? "").trim(),
    active: formData.get("active") === "on",
    thresholds: { ...attuale.thresholds, leadDropPct: sogliaNum },
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
