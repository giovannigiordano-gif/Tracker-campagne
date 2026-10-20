// Dati per la pagina Impostazioni: clienti configurati e sub-account GHL disponibili.
import { readAccounts } from "../accounts";
import { archivio } from "../archivio";
import * as cache from "../cache";
import { getAgencyClient } from "../ghl/client";
import { getTokenInfo } from "../ghl/tokens";
import { riepilogoMetaMcp } from "../meta-mcp/store";
import type { GhlLocation } from "../ghl/types";

// Elenco dei sub-account dell'agency (anagrafica: cache di 6 ore, anche su disco)
export function elencoSubAccount() {
  return cache.get<GhlLocation[]>("ghl:agency:locations", cache.TTL.anagrafica, () => getAgencyClient().listLocations(), {
    persist: true,
  });
}

export async function caricaImpostazioni() {
  const clienti = await readAccounts();
  const conToken = await Promise.all(clienti.map(async (c) => ({ ...c, token: await getTokenInfo(c.locationId) })));

  let subAccount: GhlLocation[] = [];
  let erroreSubAccount: string | null = null;
  try {
    subAccount = (await elencoSubAccount()).value;
  } catch (e) {
    erroreSubAccount = `Impossibile leggere l'elenco dei sub-account da GHL: ${(e as Error).message}`;
  }

  const giaAggiunti = new Set(clienti.map((c) => c.locationId));
  return {
    meta: await riepilogoMetaMcp(), // stato del collegamento a Meta Ads, senza token
    archivioNonConfigurato: archivio.tipo === "non-configurato", // su Vercel senza spazio Blob: non si salva nulla
    clienti: conToken,
    disponibili: subAccount.filter((l) => !giaAggiunti.has(l.id)),
    erroreSubAccount,
  };
}
