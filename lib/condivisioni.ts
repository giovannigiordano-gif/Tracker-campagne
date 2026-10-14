// Link di condivisione: permettono a un cliente di vedere la SUA dashboard senza entrare nell'app.
// Ogni cliente ha al massimo un link attivo, valido finché il titolare non lo disattiva o lo sostituisce.
//
// Il codice del link è casuale (32 byte, 256 bit: impossibile da indovinare) e su disco non c'è mai in chiaro:
// - "impronta" (SHA-256) serve a riconoscerlo quando qualcuno apre il link;
// - "cifrato" (AES-GCM con ENCRYPTION_KEY) serve a rimostrare il link al titolare nella finestra Condividi.
// Archivio: data/secrets/condivisioni.json (fuori da git).
import { createHash, randomBytes } from "node:crypto";
import { decrypt, encrypt } from "./crypto";
import { dataPath, readJson, withFileLock, writeJsonAtomic } from "./files";

type Voce = { impronta: string; cifrato: string; creatoIl: string };
type Archivio = Record<string, Voce>; // chiave: locationId

// 32 byte in base64url = 43 caratteri tra lettere, cifre, "-" e "_"
const FORMATO_CODICE = /^[A-Za-z0-9_-]{43}$/;

const impronta = (codice: string) => createHash("sha256").update(codice).digest("hex");

export function creaArchivioCondivisioni(file: string) {
  const leggiArchivio = () => readJson<Archivio>(file, {});

  return {
    // Crea il link del cliente; se ne esisteva uno, il vecchio smette di funzionare
    crea(locationId: string) {
      return withFileLock(file, async () => {
        const codice = randomBytes(32).toString("base64url");
        const archivio = await leggiArchivio();
        archivio[locationId] = { impronta: impronta(codice), cifrato: encrypt(codice), creatoIl: new Date().toISOString() };
        await writeJsonAtomic(file, archivio);
        return codice;
      });
    },

    // Link attivo del cliente, per mostrarlo al titolare
    async leggi(locationId: string): Promise<{ codice: string; creatoIl: string } | null> {
      const voce = (await leggiArchivio())[locationId];
      return voce ? { codice: decrypt(voce.cifrato), creatoIl: voce.creatoIl } : null;
    },

    disattiva(locationId: string) {
      return withFileLock(file, async () => {
        const archivio = await leggiArchivio();
        if (!(locationId in archivio)) return;
        delete archivio[locationId];
        await writeJsonAtomic(file, archivio);
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
export const condivisioni = creaArchivioCondivisioni(dataPath("secrets", "condivisioni.json"));
