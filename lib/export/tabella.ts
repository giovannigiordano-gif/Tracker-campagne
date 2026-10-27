// Descrizione di una tabella da scaricare, uguale per CSV ed Excel: titoli delle colonne, tipo dei valori, righe.
// I file si creano nel browser con i dati già presenti nella pagina: niente passa dal server e niente si salva.

// Tipi di colonna: decidono il formato in Excel e nel CSV
// - "valuta" e "decimale": numeri con due decimali (la valuta va scritta nel titolo, es. "Spesa (EUR)");
// - "percentuale": valore in punti percentuali (23,5 = 23,5%), come nell'app;
// - "data": giorno "AAAA-MM-GG"; "dataora": data e ora ISO, mostrate nel fuso del computer.
export type TipoColonna = "testo" | "intero" | "decimale" | "valuta" | "percentuale" | "data" | "dataora";

export type ColonnaExport = { titolo: string; tipo?: TipoColonna };
export type ValoreExport = string | number | null | undefined;
export type TabellaExport = { nome: string; colonne: ColonnaExport[]; righe: ValoreExport[][] };

// Nome del file: tipo, cliente e periodo, senza caratteri che i sistemi operativi non accettano
export function nomeFileExport(parti: string[], estensione: "csv" | "xlsx") {
  const pulito = parti
    .filter(Boolean)
    .map((p) =>
      p
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase()
    )
    .filter(Boolean)
    .join("-");
  return `${pulito || "dati"}.${estensione}`;
}

// Numero valido oppure null (NaN, Infinity e testi diventano celle vuote)
export function numero(v: ValoreExport): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

// Foglio "Info" dei file Excel: cliente, periodo, fonte dei numeri e filtri attivi
export type RigaInfo = [string, string];

export function tabellaInfo(righe: RigaInfo[]): TabellaExport {
  return { nome: "Info", colonne: [{ titolo: "Voce" }, { titolo: "Valore" }], righe };
}
