// Token Private Integration dei singoli sub-account.
// Si inseriscono dalla pagina Impostazioni e si salvano CIFRATI in "secrets/ghl-tokens.json" nell'archivio
// (data/ in locale, Vercel Blob online).
// In sviluppo vale anche GHL_TOKEN_<LOCATIONID> nel file .env (usato solo se manca quello dell'app).
import { decrypt, encrypt } from "../crypto";
import { archivio } from "../archivio";

type VoceToken = { cifrato: string; ultime4: string; salvatoIl: string };
type ArchivioToken = Record<string, VoceToken>;

const NOME = "secrets/ghl-tokens.json";

export type InfoToken =
  | { origine: "app"; ultime4: string; salvatoIl: string }
  | { origine: "env"; ultime4: string }
  | { origine: "nessuno" };

function tokenDaEnv(locationId: string) {
  return process.env[`GHL_TOKEN_${locationId}`]?.trim() || null;
}

export async function getLocationToken(locationId: string): Promise<string | null> {
  const salvati = await archivio.leggi<ArchivioToken>(NOME, {});
  const voce = salvati[locationId];
  if (voce) return decrypt(voce.cifrato);
  return tokenDaEnv(locationId);
}

// Informazioni da mostrare in Impostazioni: mai il token, solo le ultime 4 cifre
export async function getTokenInfo(locationId: string): Promise<InfoToken> {
  const salvati = await archivio.leggi<ArchivioToken>(NOME, {});
  const voce = salvati[locationId];
  if (voce) return { origine: "app", ultime4: voce.ultime4, salvatoIl: voce.salvatoIl };
  const daEnv = tokenDaEnv(locationId);
  if (daEnv) return { origine: "env", ultime4: daEnv.slice(-4) };
  return { origine: "nessuno" };
}

export function saveLocationToken(locationId: string, token: string) {
  return archivio.modifica<ArchivioToken>(NOME, {}, (salvati) => {
    salvati[locationId] = {
      cifrato: encrypt(token),
      ultime4: token.slice(-4),
      salvatoIl: new Date().toISOString(),
    };
    return salvati;
  });
}

export function deleteLocationToken(locationId: string) {
  return archivio.modifica<ArchivioToken>(NOME, {}, (salvati) => {
    delete salvati[locationId];
    return salvati;
  });
}
