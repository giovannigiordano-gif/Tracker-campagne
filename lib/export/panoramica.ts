// Tabella da scaricare della Panoramica: una riga per cliente con gli stessi numeri delle strisce.
// Funzione pura (panoramica.test.ts). Ogni cliente ha la sua valuta: gli importi sono nella valuta della colonna "Valuta".
import type { RigaPanoramica } from "../data/panoramica";
import type { TabellaExport } from "./tabella";

export function tabellaPanoramica(righe: RigaPanoramica[]): TabellaExport {
  return {
    nome: "Clienti",
    colonne: [
      { titolo: "Cliente" },
      { titolo: "Dal", tipo: "data" },
      { titolo: "Al", tipo: "data" },
      { titolo: "Valuta" },
      { titolo: "Lead", tipo: "intero" },
      { titolo: "Lead periodo precedente", tipo: "intero" },
      { titolo: "Opportunità create", tipo: "intero" },
      { titolo: "Vinte", tipo: "intero" },
      { titolo: "Perse", tipo: "intero" },
      { titolo: "Venduto", tipo: "valuta" },
      { titolo: "Venduto periodo precedente", tipo: "valuta" },
      { titolo: "Tasso di chiusura", tipo: "percentuale" },
      { titolo: "Spesa Meta", tipo: "valuta" },
      { titolo: "Costo per lead Meta", tipo: "valuta" },
      { titolo: "Spesa LinkedIn", tipo: "valuta" },
      { titolo: "Costo per lead LinkedIn", tipo: "valuta" },
      { titolo: "Avvisi" },
    ],
    righe: righe.map((r) => [
      r.nome,
      r.daGiorno,
      r.aGiorno,
      r.valuta,
      r.kpi?.lead ?? null,
      r.kpiPrec?.lead ?? null,
      r.kpi?.oppCreate ?? null,
      r.kpi?.vinte ?? null,
      r.kpi?.perse ?? null,
      r.kpi?.venduto ?? null,
      r.kpiPrec?.venduto ?? null,
      r.kpi?.tassoChiusura ?? null,
      r.meta?.spesa ?? null,
      r.meta?.cplReale ?? null,
      r.linkedin?.spesa ?? null,
      r.linkedin?.cplReale ?? null,
      r.avvisi.map((a) => a.testo).join(" | "),
    ]),
  };
}
