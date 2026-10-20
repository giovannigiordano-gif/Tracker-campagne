// Chi chiede di collegarsi. Claude si presenta con un "Client ID Metadata Document" (CIMD): il client_id è
// l'indirizzo di un documento JSON pubblicato da Anthropic con nome e indirizzi di ritorno ammessi.
// Si accettano solo client_id sugli host di Claude (token.ts → hostClientAmmessi).
import { clientAmmesso, hostClientAmmessi, RITORNO_CLAUDE, ritornoAmmesso } from "./token";

export type ClientConnettore = { clientId: string; nome: string; host: string };

export class ErroreClient extends Error {}

type Documento = { client_id?: unknown; client_name?: unknown; redirect_uris?: unknown };

const MASSIMO_BYTE = 20_000;
const DURATA_MEMORIA_MS = 10 * 60_000;
const memoria = new Map<string, { documento: Documento; letto: number }>();

async function leggiDocumento(clientId: string): Promise<Documento> {
  const inMemoria = memoria.get(clientId);
  if (inMemoria && performance.now() - inMemoria.letto < DURATA_MEMORIA_MS) return inMemoria.documento;
  const risposta = await fetch(clientId, { redirect: "error", signal: AbortSignal.timeout(5000), headers: { accept: "application/json" } });
  if (!risposta.ok) throw new Error(`risposta ${risposta.status}`);
  const testo = await risposta.text();
  if (testo.length > MASSIMO_BYTE) throw new Error("documento troppo grande");
  const documento = JSON.parse(testo) as Documento;
  memoria.set(clientId, { documento, letto: performance.now() });
  return documento;
}

// Controlla client_id e indirizzo di ritorno; restituisce il nome da mostrare nella pagina di consenso
export async function verificaClient(clientId: string | null, ritorno: string | null): Promise<ClientConnettore> {
  if (!clientId || !clientAmmesso(clientId, hostClientAmmessi())) {
    throw new ErroreClient("Questa richiesta non arriva da Claude: per sicurezza il collegamento è bloccato.");
  }
  if (!ritorno) throw new ErroreClient("Manca l'indirizzo di ritorno (redirect_uri).");
  const host = new URL(clientId).hostname;

  let documento: Documento | null = null;
  try {
    documento = await leggiDocumento(clientId);
  } catch {
    // Documento non raggiungibile: si accetta solo il ritorno fisso delle app di Claude, che consegna
    // il codice a claude.ai e a nessun altro
    if (ritorno === RITORNO_CLAUDE) return { clientId, nome: "Claude", host };
    throw new ErroreClient("Non riesco a verificare chi chiede il collegamento. Riprova tra un momento.");
  }

  if (documento.client_id !== clientId) throw new ErroreClient("Il documento del client non corrisponde: collegamento bloccato.");
  const dichiarati = Array.isArray(documento.redirect_uris) ? documento.redirect_uris.filter((u): u is string => typeof u === "string") : [];
  if (!ritornoAmmesso(ritorno, dichiarati)) throw new ErroreClient("Indirizzo di ritorno non ammesso: collegamento bloccato.");
  // Il nome nel documento lo scrive il client stesso: si mostra insieme all'host, che è quello che conta
  const nome = typeof documento.client_name === "string" && documento.client_name.trim() ? documento.client_name.trim().slice(0, 60) : "Claude";
  return { clientId, nome, host };
}
