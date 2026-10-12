// Lettura e scrittura dei file JSON in data/ (l'app non usa database).
// Le scritture sono atomiche: si scrive un file temporaneo e poi lo si rinomina,
// così un crash a metà scrittura non lascia mai un file corrotto.
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

export const DATA_DIR = path.join(process.cwd(), "data");

export function dataPath(...parti: string[]) {
  return path.join(DATA_DIR, ...parti);
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw e;
  }
}

// Una sola scrittura alla volta per file, per non perdere modifiche concorrenti
const codaScritture = new Map<string, Promise<unknown>>();

export function withFileLock<T>(file: string, fn: () => Promise<T>): Promise<T> {
  const precedente = codaScritture.get(file) ?? Promise.resolve();
  const prossima = precedente.catch(() => {}).then(fn);
  codaScritture.set(file, prossima);
  return prossima;
}

export async function writeJsonAtomic(file: string, value: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${randomBytes(6).toString("hex")}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tmp, file);
}

export async function deleteFile(file: string) {
  await fs.rm(file, { force: true });
}
