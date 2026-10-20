// Lettura dell'elenco degli account pubblicitari dalla risposta di ads_get_ad_accounts (sola lettura).
// Campi verificati sulla risposta reale del 2026-10-20: structuredContent.ad_accounts[] con ad_account_id,
// ad_account_name, business_name, is_queryable, not_queryable_reason; next_cursor se ci sono altre pagine.
// Formato usato dall'app e dall'API Marketing: "act_<numero>" (il server MCP restituisce solo il numero)
export const idAccountMeta = (id: string) => (id.startsWith("act_") ? id : `act_${id}`);

export type AccountMeta = { id: string; nome: string; azienda: string | null; interrogabile: boolean; motivo: string | null };

type RispostaStrumento = { content?: unknown; structuredContent?: unknown };

function datiDellaRisposta(r: RispostaStrumento): Record<string, unknown> | null {
  if (r.structuredContent && typeof r.structuredContent === "object") return r.structuredContent as Record<string, unknown>;
  for (const parte of Array.isArray(r.content) ? r.content : []) {
    if (parte && typeof parte === "object" && "text" in parte && typeof parte.text === "string") {
      try {
        const json = JSON.parse(parte.text);
        if (json && typeof json === "object") return json as Record<string, unknown>;
      } catch {
        // testo non JSON
      }
    }
  }
  return null;
}

export function leggiPaginaAccount(r: RispostaStrumento): { account: AccountMeta[]; prossima: string | null } {
  const dati = datiDellaRisposta(r);
  const elenco = Array.isArray(dati?.ad_accounts) ? (dati.ad_accounts as Record<string, unknown>[]) : [];
  const testo = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return {
    account: elenco
      .filter((a) => testo(a.ad_account_id))
      .map((a) => ({
        id: idAccountMeta(testo(a.ad_account_id)!),
        nome: testo(a.ad_account_name) ?? idAccountMeta(testo(a.ad_account_id)!),
        azienda: testo(a.business_name),
        interrogabile: a.is_queryable !== false,
        motivo: testo(a.not_queryable_reason) ?? testo(a.is_ads_mcp_disabled_reason),
      })),
    prossima: testo(dati?.next_cursor),
  };
}
