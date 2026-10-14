// Accesso del titolare: cookie firmato e controllo della password (APP_PASSWORD nel file .env / su Vercel).
// Funzioni "pure" (nessun accesso a cookie o richieste): le usano il proxy, la pagina di accesso e le azioni.
//
// Cookie: "v1.<scadenza in ms>.<firma>". La firma (HMAC-SHA256 con SESSION_SECRET) copre la scadenza e
// un'impronta della password: chi modifica il cookie lo rende non valido, e cambiare la password
// chiude tutte le sessioni aperte.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const NOME_COOKIE = "sp_accesso";
export const DURATA_SESSIONE_MS = 30 * 24 * 60 * 60 * 1000; // 30 giorni

const impronta = (testo: string) => createHash("sha256").update(testo).digest();

function firma(segreto: string, password: string, scadenza: number) {
  return createHmac("sha256", segreto)
    .update(`v1.${scadenza}.${impronta(password).toString("hex")}`)
    .digest("base64url");
}

export function creaSessione(segreto: string, password: string, ora = Date.now()) {
  const scadenza = ora + DURATA_SESSIONE_MS;
  return `v1.${scadenza}.${firma(segreto, password, scadenza)}`;
}

export function sessioneValida(valore: string | undefined, segreto: string, password: string, ora = Date.now()) {
  const parti = valore?.split(".");
  if (!parti || parti.length !== 3 || parti[0] !== "v1") return false;
  const scadenza = Number(parti[1]);
  if (!Number.isSafeInteger(scadenza) || scadenza <= ora) return false;
  const attesa = Buffer.from(firma(segreto, password, scadenza));
  const ricevuta = Buffer.from(parti[2]);
  return attesa.length === ricevuta.length && timingSafeEqual(attesa, ricevuta);
}

// Confronto a tempo costante: non si capisce dalla velocità della risposta quanto la password è "vicina"
export function passwordCorretta(inserita: string, attesa: string) {
  return inserita.length > 0 && timingSafeEqual(impronta(inserita), impronta(attesa));
}

// Dove tornare dopo l'accesso: solo percorsi interni all'app (niente siti esterni, niente pagina di accesso)
export function percorsoSicuro(da: string | null | undefined) {
  if (!da || !da.startsWith("/") || da.startsWith("//") || da.startsWith("/\\") || da.startsWith("/accesso")) return "/";
  return da;
}
