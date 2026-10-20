// Verifica del collegamento al server MCP di Meta Ads, con chiamate di SOLA LETTURA:
// elenco degli strumenti disponibili (tools/list) ed elenco degli account pubblicitari visibili.
// Il risultato (solo nomi degli strumenti e numero di account) viene salvato e mostrato in Impostazioni.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { classificaStrumenti, META_MCP_URL, type StrumentoMcp } from "./config";
import { tokenValido } from "./oauth";
import { modificaStatoMetaMcp, type VerificaMetaMcp } from "./store";

// Conta gli account nella risposta di ads_get_ad_accounts (testo JSON o contenuto strutturato)
function contaAccount(risposta: { content?: unknown; structuredContent?: unknown }): number | null {
  const primoElenco = (v: unknown): unknown[] | null => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      for (const x of Object.values(v)) {
        const trovato = primoElenco(x);
        if (trovato) return trovato;
      }
    }
    return null;
  };
  if (risposta.structuredContent) return primoElenco(risposta.structuredContent)?.length ?? null;
  for (const parte of Array.isArray(risposta.content) ? risposta.content : []) {
    if (parte && typeof parte === "object" && "text" in parte && typeof parte.text === "string") {
      try {
        const elenco = primoElenco(JSON.parse(parte.text));
        if (elenco) return elenco.length;
      } catch {
        // testo non JSON: si ignora
      }
    }
  }
  return null;
}

export async function verificaCollegamento(): Promise<VerificaMetaMcp> {
  const il = new Date().toISOString();
  let verifica: VerificaMetaMcp;
  const t = await tokenValido();

  if (t.esito !== "ok") {
    verifica = {
      il,
      ok: false,
      messaggio: t.esito === "non-collegato" ? "Meta non è collegato." : "Il collegamento a Meta è scaduto: collegalo di nuovo.",
      strumentiAbilitati: [],
      strumentiEsclusi: 0,
      accountVisibili: null,
    };
  } else {
    const client = new Client({ name: "salesprocess-insights", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(META_MCP_URL), {
      requestInit: { headers: { Authorization: `Bearer ${t.token}` } },
    });
    try {
      await client.connect(transport);
      const strumenti: StrumentoMcp[] = [];
      let cursore: string | undefined;
      do {
        const pagina = await client.listTools(cursore ? { cursor: cursore } : {});
        strumenti.push(...pagina.tools);
        cursore = pagina.nextCursor;
      } while (cursore);

      const { abilitati, esclusi } = classificaStrumenti(strumenti);
      let accountVisibili: number | null = null;
      if (abilitati.includes("ads_get_ad_accounts")) {
        const risposta = await client.callTool({ name: "ads_get_ad_accounts", arguments: {} });
        // La risposta può avere anche il vecchio formato "toolResult": si leggono solo contenuto e contenuto strutturato
        if (!risposta.isError) accountVisibili = contaAccount(risposta as { content?: unknown; structuredContent?: unknown });
      }
      verifica = {
        il,
        ok: abilitati.length > 0,
        messaggio: abilitati.length
          ? `Collegamento attivo: ${abilitati.length} strumenti di sola lettura disponibili.`
          : "Collegato, ma Meta non offre nessuno degli strumenti di lettura previsti.",
        strumentiAbilitati: abilitati,
        strumentiEsclusi: esclusi,
        accountVisibili,
      };
    } catch (e) {
      const testo = (e as Error).message ?? "";
      verifica = {
        il,
        ok: false,
        messaggio: /401|403|unauthori[sz]ed|forbidden/i.test(testo)
          ? "Meta non accetta più il collegamento: collegalo di nuovo."
          : `Meta non risponde in questo momento (${testo.slice(0, 120)}).`,
        strumentiAbilitati: [],
        strumentiEsclusi: 0,
        accountVisibili: null,
      };
    } finally {
      await client.close().catch(() => {});
    }
  }

  await modificaStatoMetaMcp((s) => {
    s.ultimaVerifica = verifica;
  });
  return verifica;
}
