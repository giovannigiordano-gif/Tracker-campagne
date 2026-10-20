// Stato del collegamento al server MCP di Meta Ads: registrazione dell'app presso Meta, token di accesso,
// accesso in corso, ultima verifica. Si salva in "secrets/meta-mcp.json" nell'archivio
// (data/ in locale, Vercel Blob online) e il contenuto è cifrato con ENCRYPTION_KEY.
// Contiene token: non va mai mandato al browser. Al browser arriva solo riepilogoMetaMcp().
import type { OAuthDiscoveryState } from "@modelcontextprotocol/sdk/client/auth.js";
import type { OAuthClientInformationMixed, OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import { archivio } from "../archivio";
import { idAccountMeta, type AccountMeta } from "./account";
import { metaAppId } from "./config";
import { decrypt, encrypt } from "../crypto";

const NOME = "secrets/meta-mcp.json";

export type VerificaMetaMcp = {
  il: string;
  ok: boolean;
  messaggio: string;
  strumentiAbilitati: string[]; // strumenti di sola lettura che l'AI potrà usare
  strumentiEsclusi: number; // strumenti offerti da Meta ma spenti (scrittura o non necessari)
  accountVisibili: number | null; // account pubblicitari letti con ads_get_ad_accounts
  account?: AccountMeta[]; // elenco degli account (id, nome, azienda): serve per associarli ai clienti
};

export type StatoMetaMcp = {
  client?: OAuthClientInformationMixed; // registrazione automatica presso Meta (client pubblico, senza segreto)
  redirectUrl?: string; // indirizzo di ritorno con cui il client è registrato
  discovery?: OAuthDiscoveryState; // metadati OAuth già letti
  tokens?: OAuthTokens;
  scadeIl?: number; // scadenza del token di accesso (ms), se Meta la comunica
  collegatoIl?: string;
  flusso?: { state: string; codeVerifier: string; creatoIl: number }; // accesso a Meta in corso
  ultimaVerifica?: VerificaMetaMcp;
  ultimoErrore?: { il: string; messaggio: string };
};

type Cifrato = { cifrato?: string };

export async function leggiStatoMetaMcp(): Promise<StatoMetaMcp> {
  const { cifrato } = await archivio.leggi<Cifrato>(NOME, {});
  return cifrato ? (JSON.parse(decrypt(cifrato)) as StatoMetaMcp) : {};
}

// Legge, modifica e risalva lo stato, una modifica alla volta (online: senza sovrascrivere salvataggi altrui)
export async function modificaStatoMetaMcp(fn: (stato: StatoMetaMcp) => void | Promise<void>): Promise<StatoMetaMcp> {
  let risultato: StatoMetaMcp = {};
  await archivio.modifica<Cifrato>(NOME, {}, async ({ cifrato }) => {
    const stato: StatoMetaMcp = cifrato ? JSON.parse(decrypt(cifrato)) : {};
    await fn(stato);
    risultato = stato;
    return { cifrato: encrypt(JSON.stringify(stato)) };
  });
  return risultato;
}

export function cancellaStatoMetaMcp() {
  return archivio.cancella(NOME);
}

// ---------------------------------------------------------------- riepilogo senza segreti (Impostazioni)
export type RiepilogoMetaMcp = {
  configurato: boolean; // c'è l'ID dell'app Meta (META_APP_ID)
  collegato: boolean;
  collegatoIl: string | null;
  scadeIl: number | null;
  rinnovoAutomatico: boolean;
  permessi: string[];
  ultimaVerifica: VerificaMetaMcp | null;
  ultimoErrore: { il: string; messaggio: string } | null;
};

export async function riepilogoMetaMcp(): Promise<RiepilogoMetaMcp> {
  let s: StatoMetaMcp;
  try {
    s = await leggiStatoMetaMcp();
  } catch {
    // Succede se ENCRYPTION_KEY è cambiata dopo il collegamento
    return {
      configurato: Boolean(metaAppId()),
      collegato: false,
      collegatoIl: null,
      scadeIl: null,
      rinnovoAutomatico: false,
      permessi: [],
      ultimaVerifica: null,
      ultimoErrore: {
        il: new Date().toISOString(),
        messaggio: "Non riesco a leggere il collegamento salvato (la chiave di cifratura è cambiata?): collega di nuovo Meta.",
      },
    };
  }
  return {
    configurato: Boolean(metaAppId()),
    collegato: Boolean(s.tokens?.access_token),
    collegatoIl: s.collegatoIl ?? null,
    scadeIl: s.scadeIl ?? null,
    rinnovoAutomatico: Boolean(s.tokens?.refresh_token),
    permessi: s.tokens?.scope?.split(/[\s,]+/).filter(Boolean) ?? [],
    // Elenchi salvati prima del 2026-10-20 hanno gli id senza "act_": si uniformano qui
    ultimaVerifica: s.ultimaVerifica
      ? { ...s.ultimaVerifica, account: s.ultimaVerifica.account?.map((a) => ({ ...a, id: idAccountMeta(a.id) })) }
      : null,
    ultimoErrore: s.ultimoErrore ?? null,
  };
}
