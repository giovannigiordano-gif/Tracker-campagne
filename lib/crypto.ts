// Cifratura AES-256-GCM dei segreti salvati su disco (token dei sub-account, token MCP).
// La chiave è ENCRYPTION_KEY nel file .env (32 byte in base64).
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function chiave(): Buffer {
  const k = Buffer.from(process.env.ENCRYPTION_KEY?.trim() ?? "", "base64");
  if (k.length !== 32) {
    throw new Error("ENCRYPTION_KEY mancante o non valida nel file .env (servono 32 byte in base64)");
  }
  return k;
}

// Formato: "v1:<iv>:<tag>:<dati>" tutto in base64
export function encrypt(testo: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", chiave(), iv);
  const dati = Buffer.concat([cipher.update(testo, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), dati.toString("base64")].join(":");
}

export function decrypt(payload: string): string {
  const [versione, iv, tag, dati] = payload.split(":");
  if (versione !== "v1" || !iv || !tag || !dati) throw new Error("Segreto cifrato in formato non valido");
  const decipher = createDecipheriv("aes-256-gcm", chiave(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dati, "base64")), decipher.final()]).toString("utf8");
}
