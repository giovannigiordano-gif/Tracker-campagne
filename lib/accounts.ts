// Elenco dei clienti monitorati: "accounts.json" nell'archivio (data/ in locale, Vercel Blob online).
// Contiene solo configurazione e contesto per l'AI, MAI token (quelli stanno cifrati in secrets/).
import { archivio } from "./archivio";

export type Account = {
  locationId: string; // ID del sub-account GHL
  name: string;
  metaAdAccountIds: string[]; // formato act_...
  linkedinAdAccountIds: string[]; // ID numerici degli account pubblicitari LinkedIn
  currency: string; // es. EUR
  timezone: string; // es. Europe/Rome: i giorni si contano in questo fuso
  notes: string; // settore, offerta, obiettivo, target di CPL: contesto per l'AI
  active: boolean;
  thresholds: {
    leadDropPct?: number; // avviso se i lead calano più di questa % rispetto al periodo precedente
    maxCpl?: number; // avviso se il CPL reale supera questo valore (dalla Fase 3)
  };
};

const NOME = "accounts.json";

export const SOGLIA_CALO_LEAD_PREDEFINITA = 30;

export async function readAccounts(): Promise<Account[]> {
  // Completa i campi mancanti così il resto del codice può contarci
  return completa(await archivio.leggi<Partial<Account>[]>(NOME, []));
}

function completa(lista: Partial<Account>[]): Account[] {
  return lista
    .filter((a): a is Partial<Account> & { locationId: string } => !!a.locationId)
    .map((a) => ({
      locationId: a.locationId,
      name: a.name ?? a.locationId,
      metaAdAccountIds: a.metaAdAccountIds ?? [],
      linkedinAdAccountIds: a.linkedinAdAccountIds ?? [],
      currency: a.currency ?? "EUR",
      timezone: a.timezone ?? "Europe/Rome",
      notes: a.notes ?? "",
      active: a.active ?? true,
      thresholds: a.thresholds ?? {},
    }));
}

export async function getAccount(locationId: string) {
  return (await readAccounts()).find((a) => a.locationId === locationId) ?? null;
}

// Modifica l'elenco in modo sicuro (una scrittura alla volta; online, senza sovrascrivere salvataggi altrui)
export function updateAccounts(modifica: (lista: Account[]) => Account[]) {
  return archivio.modifica<Partial<Account>[]>(NOME, [], (lista) => modifica(completa(lista)));
}

// Un account pubblicitario LinkedIn appartiene a un solo cliente (scelta del titolare del 2026-10-26):
// restituisce gli account del cliente che sono già associati a un altro cliente, con il nome di quel cliente
export type ConflittoAccount = { id: string; cliente: string };
export function conflittiLinkedIn(lista: Account[], account: Pick<Account, "locationId" | "linkedinAdAccountIds">): ConflittoAccount[] {
  const altrove = new Map<string, string>();
  for (const a of lista) {
    if (a.locationId === account.locationId) continue;
    for (const id of a.linkedinAdAccountIds) altrove.set(id, a.name);
  }
  return account.linkedinAdAccountIds.flatMap((id) => (altrove.has(id) ? [{ id, cliente: altrove.get(id)! }] : []));
}

export class ErroreAccountGiaAssociato extends Error {
  constructor(readonly conflitti: ConflittoAccount[]) {
    super(`Account LinkedIn già associati ad altri clienti: ${conflitti.map((c) => c.id).join(", ")}`);
  }
}

export function upsertAccount(account: Account) {
  return updateAccounts((lista) => {
    // Controllo dentro la scrittura: vale anche se due salvataggi arrivano insieme
    const conflitti = conflittiLinkedIn(lista, account);
    if (conflitti.length) throw new ErroreAccountGiaAssociato(conflitti);
    const i = lista.findIndex((a) => a.locationId === account.locationId);
    if (i === -1) return [...lista, account];
    const copia = [...lista];
    copia[i] = account;
    return copia;
  });
}

export function removeAccount(locationId: string) {
  return updateAccounts((lista) => lista.filter((a) => a.locationId !== locationId));
}
