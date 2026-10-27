// Calcoli della dashboard interattiva. Funzioni "pure" (nessun accesso a file o rete):
// girano anche nel browser, così ogni filtro ricalcola subito numeri e grafici.
import type { Canale, OppStatus, Pipeline } from "../ghl/types";

// ---------------------------------------------------------------- righe di dati
export type LeadRow = {
  id: string;
  giorno: string; // giorno di creazione (YYYY-MM-DD) nel fuso del cliente
  canale: Canale;
  campagnaId: string | null;
  campagna: string | null;
  fonte: string;
  tags: string[];
  attribuito: boolean;
  // Pipeline in cui il contatto ha almeno un'opportunità (di qualsiasi data): servono al filtro per pipeline
  pipelines: string[];
  // Dati personali: presenti solo per i contatti del periodo corrente (tabella contatti)
  persona?: { data: string; nome: string; email: string; telefono: string; gruppo: string; annuncio: string };
};

export type OppRow = {
  id: string;
  pipelineId: string;
  stageId: string;
  status: OppStatus;
  valore: number;
  creata: string | null; // giorno di creazione, se dentro la finestra analizzata
  chiusa: string | null; // giorno in cui è stata vinta/persa, se dentro la finestra
  canale: Canale;
  campagnaId: string | null;
  campagna: string | null;
  fonte: string;
  tags: string[];
  nome?: string; // solo per le vinte del periodo corrente (tabella vendite)
};

export type Filtri = {
  canale: string[];
  campagna: string[]; // chiavi campagna (vedi chiaveCampagna)
  fonte: string[];
  tag: string[];
  pipeline: string | null;
};

export const FILTRI_VUOTI: Filtri = { canale: [], campagna: [], fonte: [], tag: [], pipeline: null };

export const SENZA_CAMPAGNA = "__senza__";
export const SENZA_FONTE = "(fonte non indicata)";

export function chiaveCampagna(r: { campagnaId: string | null; campagna: string | null }) {
  return r.campagnaId ?? (r.campagna ? `nome:${r.campagna}` : SENZA_CAMPAGNA);
}

// ---------------------------------------------------------------- filtri
function passa(r: LeadRow | OppRow, f: Filtri) {
  if (f.canale.length && !f.canale.includes(r.canale)) return false;
  if (f.campagna.length && !f.campagna.includes(chiaveCampagna(r))) return false;
  if (f.fonte.length && !f.fonte.includes(r.fonte)) return false;
  if (f.tag.length && !r.tags.some((t) => f.tag.includes(t))) return false;
  return true;
}

// Con una pipeline scelta contano solo i lead che hanno un'opportunità in quella pipeline
export const filtraLead = (righe: LeadRow[], f: Filtri) =>
  righe.filter((r) => passa(r, f) && (!f.pipeline || r.pipelines.includes(f.pipeline)));
export const filtraOpp = (righe: OppRow[], f: Filtri) =>
  righe.filter((r) => passa(r, f) && (!f.pipeline || r.pipelineId === f.pipeline));

export function quantiFiltri(f: Filtri) {
  return f.canale.length + f.campagna.length + f.fonte.length + f.tag.length + (f.pipeline ? 1 : 0);
}

// ---------------------------------------------------------------- numeri chiave
export type Kpi = {
  lead: number;
  leadMeta: number; // lead del CRM con canale "Meta Ads"
  leadLinkedin: number; // lead del CRM con canale "LinkedIn Ads"
  oppCreate: number;
  vinte: number;
  perse: number;
  venduto: number;
  tassoChiusura: number | null; // vinte / (vinte + perse), in %
  valoreMedio: number | null;
};

export function calcolaKpi(lead: LeadRow[], opp: OppRow[], giorni: Set<string>): Kpi {
  const leadPeriodo = lead.filter((r) => giorni.has(r.giorno));
  const vinte = opp.filter((r) => r.status === "won" && r.chiusa && giorni.has(r.chiusa));
  const perse = opp.filter((r) => r.status === "lost" && r.chiusa && giorni.has(r.chiusa));
  const venduto = vinte.reduce((s, r) => s + r.valore, 0);
  return {
    lead: leadPeriodo.length,
    leadMeta: leadPeriodo.filter((r) => r.canale === "Meta Ads").length,
    leadLinkedin: leadPeriodo.filter((r) => r.canale === "LinkedIn Ads").length,
    oppCreate: opp.filter((r) => r.creata && giorni.has(r.creata)).length,
    vinte: vinte.length,
    perse: perse.length,
    venduto,
    tassoChiusura: vinte.length + perse.length ? (vinte.length / (vinte.length + perse.length)) * 100 : null,
    valoreMedio: vinte.length ? venduto / vinte.length : null,
  };
}

// ---------------------------------------------------------------- lead per canale (schede Panoramica)
export type LeadCanale = { canale: Canale; lead: number };

// Lead del periodo per canale, dal canale con più lead (a parità, in ordine alfabetico)
export function leadPerCanale(lead: LeadRow[], giorni: Set<string>): LeadCanale[] {
  const conteggi = new Map<Canale, number>();
  for (const r of lead) if (giorni.has(r.giorno)) conteggi.set(r.canale, (conteggi.get(r.canale) ?? 0) + 1);
  return [...conteggi]
    .map(([canale, n]) => ({ canale, lead: n }))
    .sort((a, b) => b.lead - a.lead || a.canale.localeCompare(b.canale, "it"));
}

// Tiene i primi `massimo` canali e somma tutti gli altri (compreso il canale "Altro") in un'unica voce "Altro" in fondo
export function raggruppaCanali(canali: LeadCanale[], massimo: number): LeadCanale[] {
  const principali = canali.filter((c) => c.canale !== "Altro").slice(0, massimo);
  const resto = canali.filter((c) => !principali.includes(c)).reduce((s, c) => s + c.lead, 0);
  return resto > 0 ? [...principali, { canale: "Altro", lead: resto }] : principali;
}

// ---------------------------------------------------------------- andamento nel tempo
export type Metrica = "lead" | "opportunita" | "vinte" | "venduto";
export type Granularita = "giorno" | "settimana";

export type PuntoSerie = { etichetta: string; da: string; a: string; daPrec: string; aPrec: string; attuale: number; precedente: number };

function valoreGiorno(metrica: Metrica, lead: LeadRow[], opp: OppRow[]) {
  const mappa = new Map<string, number>();
  const somma = (g: string | null, v: number) => g && mappa.set(g, (mappa.get(g) ?? 0) + v);
  if (metrica === "lead") for (const r of lead) somma(r.giorno, 1);
  if (metrica === "opportunita") for (const r of opp) somma(r.creata, 1);
  if (metrica === "vinte") for (const r of opp) if (r.status === "won") somma(r.chiusa, 1);
  if (metrica === "venduto") for (const r of opp) if (r.status === "won") somma(r.chiusa, r.valore);
  return mappa;
}

// I giorni del periodo precedente sono allineati per posizione: 1° giorno con 1° giorno, ecc.
export function calcolaSerie(
  metrica: Metrica,
  granularita: Granularita,
  lead: LeadRow[],
  opp: OppRow[],
  giorni: string[],
  giorniPrec: string[],
): PuntoSerie[] {
  const valori = valoreGiorno(metrica, lead, opp);
  const passo = granularita === "settimana" ? 7 : 1;
  const punti: PuntoSerie[] = [];
  for (let i = 0; i < giorni.length; i += passo) {
    const blocco = giorni.slice(i, i + passo);
    const bloccoPrec = giorniPrec.slice(i, i + passo);
    punti.push({
      etichetta: blocco[0],
      da: blocco[0],
      a: blocco.at(-1)!,
      daPrec: bloccoPrec[0] ?? "",
      aPrec: bloccoPrec.at(-1) ?? "",
      attuale: blocco.reduce((s, g) => s + (valori.get(g) ?? 0), 0),
      precedente: bloccoPrec.reduce((s, g) => s + (valori.get(g) ?? 0), 0),
    });
  }
  return punti;
}

// ---------------------------------------------------------------- classifiche per dimensione
export type Dimensione = "canale" | "campagna" | "fonte" | "tag";

export type VoceClassifica = { chiave: string; etichetta: string; lead: number; vinte: number; venduto: number };

function chiaviDi(r: LeadRow | OppRow, d: Dimensione): string[] {
  if (d === "canale") return [r.canale];
  if (d === "campagna") return [chiaveCampagna(r)];
  if (d === "fonte") return [r.fonte];
  return r.tags;
}

export function calcolaClassifica(d: Dimensione, lead: LeadRow[], opp: OppRow[], giorni: Set<string>): VoceClassifica[] {
  const voci = new Map<string, VoceClassifica>();
  const voce = (chiave: string, etichetta: string) => {
    let v = voci.get(chiave);
    if (!v) voci.set(chiave, (v = { chiave, etichetta, lead: 0, vinte: 0, venduto: 0 }));
    return v;
  };
  const etichetta = (r: LeadRow | OppRow, k: string) =>
    d === "campagna" ? (k === SENZA_CAMPAGNA ? "(senza campagna)" : r.campagna ?? `Campagna ${r.campagnaId}`) : k;

  for (const r of lead) if (giorni.has(r.giorno)) for (const k of chiaviDi(r, d)) voce(k, etichetta(r, k)).lead++;
  for (const r of opp) {
    if (r.status !== "won" || !r.chiusa || !giorni.has(r.chiusa)) continue;
    for (const k of chiaviDi(r, d)) {
      const v = voce(k, etichetta(r, k));
      v.vinte++;
      v.venduto += r.valore;
    }
  }
  const lista = [...voci.values()].sort((a, b) => b.lead - a.lead || b.venduto - a.venduto || a.etichetta.localeCompare(b.etichetta, "it"));
  // Campagne diverse con lo stesso nome: si aggiunge la parte finale dell'ID per distinguerle
  if (d === "campagna") {
    const conteggio = new Map<string, number>();
    for (const v of lista) conteggio.set(v.etichetta, (conteggio.get(v.etichetta) ?? 0) + 1);
    for (const v of lista) {
      if ((conteggio.get(v.etichetta) ?? 0) > 1) {
        v.etichetta += v.chiave.startsWith("nome:") ? " (senza ID)" : ` (ID …${v.chiave.slice(-6)})`;
      }
    }
  }
  return lista;
}

// ---------------------------------------------------------------- imbuto della pipeline
export type FaseImbuto = {
  id: string;
  nome: string;
  attuali: number; // opportunità del periodo che ora sono in questa fase
  raggiunte: number; // opportunità del periodo arrivate almeno fino a questa fase
  conversione: number | null; // % rispetto alla fase precedente
};

// GHL non fornisce lo storico dei passaggi di fase: si assume che le fasi si percorrano in ordine,
// quindi un'opportunità che ora è nella fase 4 è passata anche dalla 1, 2 e 3; una vinta ha raggiunto l'ultima.
export function calcolaImbuto(pipeline: Pipeline, opp: OppRow[], giorni: Set<string>): FaseImbuto[] {
  const create = opp.filter((r) => r.pipelineId === pipeline.id && r.creata && giorni.has(r.creata));
  const posizione = new Map(pipeline.stages.map((s, i) => [s.id, i]));
  const ultima = pipeline.stages.length - 1;
  const raggiunta = create.map((r) => (r.status === "won" ? ultima : posizione.get(r.stageId) ?? 0));
  return pipeline.stages.map((s, i) => {
    const raggiunte = raggiunta.filter((p) => p >= i).length;
    const primaRaggiunte = i === 0 ? null : raggiunta.filter((p) => p >= i - 1).length;
    return {
      id: s.id,
      nome: s.name,
      attuali: create.filter((r) => r.stageId === s.id).length,
      raggiunte,
      conversione: primaRaggiunte ? (raggiunte / primaRaggiunte) * 100 : null,
    };
  });
}

export function variazionePct(attuale: number, precedente: number): number | null {
  if (precedente === 0) return attuale === 0 ? 0 : null;
  return ((attuale - precedente) / precedente) * 100;
}
