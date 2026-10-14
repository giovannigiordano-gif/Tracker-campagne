// Elenco dei clienti monitorati: "accounts.json" nell'archivio (data/ in locale, Vercel Blob online).
// Contiene solo configurazione e contesto per l'AI, MAI token (quelli stanno cifrati in secrets/).
import { archivio } from "./archivio";

export type Account = {
  locationId: string; // ID del sub-account GHL
  name: string;
  metaAdAccountIds: string[]; // formato act_...
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

export function upsertAccount(account: Account) {
  return updateAccounts((lista) => {
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
