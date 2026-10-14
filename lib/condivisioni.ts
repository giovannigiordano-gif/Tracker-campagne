// Link di condivisione: permettono a un cliente di vedere la SUA dashboard senza entrare nell'app.
// Ogni cliente ha al massimo un link attivo, valido finché il titolare non lo disattiva o lo sostituisce.
//
// Il codice del link è casuale (32 byte, 256 bit: impossibile da indovinare) e su disco non c'è mai in chiaro:
// - "impronta" (SHA-256) serve a riconoscerlo quando qualcuno apre il link;
// - "cifrato" (AES-GCM con ENCRYPTION_KEY) serve a rimostrare il link al titolare nella finestra Condividi.
// Si salvano in "secrets/condivisioni.json" nell'archivio (data/ in locale, Vercel Blob online; mai su git).
import { createHash, randomBytes } from "node:crypto";
import { archivio as archivioApp, type Archivio } from "./archivio";
import { decrypt, encrypt } from "./crypto";

type Voce = { impronta: string; cifrato: string; creatoIl: string };
type Link = Record<string, Voce>; // chiave: locationId

// 32 byte in base64url = 43 caratteri tra lettere, cifre, "-" e "_"
const FORMATO_CODICE = /^[A-Za-z0-9_-]{43}$/;

const impronta = (codice: string) => createHash("sha256").update(codice).digest("hex");

export function creaArchivioCondivisioni(archivio: Archivio, nome = "secrets/condivisioni.json") {
  const leggiArchivio = () => archivio.leggi<Link>(nome, {});

  return {
    // Crea il link del cliente; se ne esisteva uno, il vecchio smette di funzionare
    async crea(locationId: string) {
      const codice = randomBytes(32).toString("base64url");
      await archivio.modifica<Link>(nome, {}, (link) => {
        link[locationId] = { impronta: impronta(codice), cifrato: encrypt(codice), creatoIl: new Date().toISOString() };
        return link;
      });
      return codice;
    },

    // Link attivo del cliente, per mostrarlo al titolare
    async leggi(locationId: string): Promise<{ codice: string; creatoIl: string } | null> {
      const voce = (await leggiArchivio())[locationId];
      return voce ? { codice: decrypt(voce.cifrato), creatoIl: voce.creatoIl } : null;
    },

    async disattiva(locationId: string) {
      if (!((await leggiArchivio())[locationId])) return; // niente da togliere: nessuna scrittura
      await archivio.modifica<Link>(nome, {}, (link) => {
        delete link[locationId];
        return link;
      });
    },

    // Di quale cliente è questo codice? null se il codice è sbagliato, sostituito o disattivato
    async clienteDaCodice(codice: string): Promise<string | null> {
      if (!FORMATO_CODICE.test(codice)) return null;
      const cercata = impronta(codice);
      for (const [locationId, voce] of Object.entries(await leggiArchivio())) {
        if (voce.impronta === cercata) return locationId;
      }
      return null;
    },
  };
}

// Archivio usato dall'app
export const condivisioni = creaArchivioCondivisioni(archivioApp);
