// Copia i dati dell'app dal computer (cartella data/) allo spazio Vercel Blob privato dell'app online:
// clienti, token GHL cifrati e link condivisi. Non tocca la cache (online si ricalcola da GHL).
// I token GHL presenti solo nel .env (GHL_TOKEN_<LOCATIONID>) vengono salvati online cifrati, come se
// fossero stati inseriti dalle Impostazioni.
// Per sicurezza NON sovrascrive i dati già presenti online, salvo con --sovrascrivi.
//
// Prima, una volta: npx vercel link  e  npx vercel env pull .env.vercel.local
// Uso:             npx tsx scripts/carica-su-vercel.ts [--sovrascrivi]
// Servono: ENCRYPTION_KEY nel .env (la stessa impostata su Vercel) e BLOB_READ_WRITE_TOKEN in .env.vercel.local.
import { del, get, put } from "@vercel/blob";
import { creaArchivioBlob, creaArchivioFile } from "../lib/archivio";
import type { Account } from "../lib/accounts";
import { encrypt } from "../lib/crypto";
import { DATA_DIR } from "../lib/files";

type VoceToken = { cifrato: string; ultime4: string; salvatoIl: string };

const DATI = ["accounts.json", "secrets/ghl-tokens.json", "secrets/condivisioni.json"];

const quanti = (v: unknown) => (Array.isArray(v) ? v.length : v && typeof v === "object" ? Object.keys(v).length : 0);

async function main() {
  process.loadEnvFile(".env");
  process.loadEnvFile(".env.vercel.local");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Manca BLOB_READ_WRITE_TOKEN: esegui prima npx vercel env pull .env.vercel.local");

  const sovrascrivi = process.argv.includes("--sovrascrivi");
  const locale = creaArchivioFile(DATA_DIR);
  const online = creaArchivioBlob({ get, put, del });

  for (const nome of DATI) {
    const dati = await locale.leggi<unknown>(nome, null);
    if (!quanti(dati)) {
      console.log(`${nome}: niente da copiare sul computer`);
      continue;
    }
    const giaOnline = await online.leggi<unknown>(nome, null);
    if (quanti(giaOnline) && !sovrascrivi) {
      console.log(`${nome}: online ci sono già ${quanti(giaOnline)} voci, non lo tocco (usa --sovrascrivi per sostituirlo)`);
      continue;
    }
    await online.modifica<unknown>(nome, null, () => dati);
    console.log(`${nome}: copiate ${quanti(dati)} voci`);
  }

  // Token dal .env per i clienti che online non hanno ancora un token
  const clienti = await online.leggi<Partial<Account>[]>("accounts.json", []);
  let aggiunti = 0;
  await online.modifica<Record<string, VoceToken>>("secrets/ghl-tokens.json", {}, (salvati) => {
    for (const c of clienti) {
      const token = c.locationId ? process.env[`GHL_TOKEN_${c.locationId}`]?.trim() : undefined;
      if (!c.locationId || !token || salvati[c.locationId]) continue;
      salvati[c.locationId] = { cifrato: encrypt(token), ultime4: token.slice(-4), salvatoIl: new Date().toISOString() };
      aggiunti++;
    }
    return salvati;
  });
  const senza = clienti.filter((c) => !process.env[`GHL_TOKEN_${c.locationId}`]).length;
  console.log(`token GHL dal .env: ${aggiunti} salvati online; clienti ancora senza token: ${senza}`);
}

main().catch((e) => {
  console.error("Copia non riuscita:", (e as Error).message);
  process.exit(1);
});
