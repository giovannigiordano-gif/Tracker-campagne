// Verifica del collegamento al server MCP di Meta Ads, con chiamate di SOLA LETTURA:
// elenco degli strumenti disponibili (tools/list) ed elenco degli account pubblicitari visibili.
// Il risultato (solo nomi degli strumenti e numero di account) viene salvato e mostrato in Impostazioni.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { leggiPaginaAccount, type AccountMeta } from "./account";
import { classificaStrumenti, META_MCP_URL, type StrumentoMcp } from "./config";
import { tokenValido } from "./oauth";
import { modificaStatoMetaMcp, type VerificaMetaMcp } from "./store";

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
      // Elenco completo degli account pubblicitari, pagina per pagina (al massimo 20 pagine da 50)
      let account: AccountMeta[] | undefined;
      if (abilitati.includes("ads_get_ad_accounts")) {
        account = [];
        let cursore: string | null = null;
        for (let pagina = 0; pagina < 20; pagina++) {
          const risposta = await client.callTool({
            name: "ads_get_ad_accounts",
            arguments: { limit: 50, ...(cursore ? { cursor: cursore } : {}) },
          });
          if (risposta.isError) break;
          // La risposta può avere anche il vecchio formato "toolResult": si leggono solo contenuto e contenuto strutturato
          const letto = leggiPaginaAccount(risposta as { content?: unknown; structuredContent?: unknown });
          account.push(...letto.account);
          cursore = letto.prossima;
          if (!cursore) break;
        }
      }
      const accountVisibili = account ? account.length : null;
      verifica = {
        il,
        ok: abilitati.length > 0,
        messaggio: abilitati.length
          ? `Collegamento attivo: ${abilitati.length} strumenti di sola lettura disponibili.`
          : "Collegato, ma Meta non offre nessuno degli strumenti di lettura previsti.",
        strumentiAbilitati: abilitati,
        strumentiEsclusi: esclusi,
        accountVisibili,
        account,
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
