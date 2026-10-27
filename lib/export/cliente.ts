// Tabelle da scaricare per la dashboard di un cliente: le stesse cifre delle sezioni, calcolate con le stesse funzioni.
// Funzioni pure (cliente.test.ts): girano nel browser con i dati già presenti nella pagina.
// I lead si contano solo nel CRM (scelta del titolare del 2026-10-20): i lead contati da Meta o LinkedIn non si esportano.
import type { AperteFase, DatiCliente } from "../data/cliente";
import type { EsitoMeta } from "../data/meta-cliente";
import type { Pipeline } from "../ghl/types";
import { calcolaCriticita } from "../metrics/criticita";
import {
  calcolaClassifica,
  calcolaImbuto,
  calcolaKpi,
  calcolaSerie,
  SENZA_CAMPAGNA,
  type Dimensione,
  type Granularita,
  type LeadRow,
  type OppRow,
  type VoceClassifica,
} from "../metrics/dashboard";
import { kpiIncrocio, kpiMeta, righeCampagne, serieGiornaliera, SENZA_CAMPAGNA_META, type RigaCampagna } from "../metrics/meta";
import { opzioniIncrocio, PIATTAFORME, STATI_CAMPAGNA, type IdPiattaforma } from "../metrics/piattaforme";
import { STATI_ACCOUNT } from "../meta/normalize";
import { tabellaInfo, type ColonnaExport, type RigaInfo, type TabellaExport, type ValoreExport } from "./tabella";

type Periodo = DatiCliente["periodo"];

const intervallo = (da: string, a: string) => `${da.split("-").reverse().join("/")} - ${a.split("-").reverse().join("/")}`;

// ---------------------------------------------------------------- GoHighLevel
export function tabellaNumeri(lead: LeadRow[], opp: OppRow[], periodo: Periodo, valuta: string): TabellaExport {
  const riga = (giorni: string[], da: string, a: string, nome: string) => {
    const g = new Set(giorni);
    const k = calcolaKpi(lead, opp, g);
    const daCanale = (c: LeadRow["canale"]) => lead.filter((l) => l.canale === c && g.has(l.giorno)).length;
    return [nome, da, a, k.lead, daCanale("Meta Ads"), daCanale("LinkedIn Ads"), k.oppCreate, k.vinte, k.perse, k.venduto, k.tassoChiusura];
  };
  return {
    nome: "Numeri",
    colonne: [
      { titolo: "Periodo" },
      { titolo: "Dal", tipo: "data" },
      { titolo: "Al", tipo: "data" },
      { titolo: "Lead", tipo: "intero" },
      { titolo: "Lead da Meta Ads", tipo: "intero" },
      { titolo: "Lead da LinkedIn Ads", tipo: "intero" },
      { titolo: "Opportunità create", tipo: "intero" },
      { titolo: "Vinte", tipo: "intero" },
      { titolo: "Perse", tipo: "intero" },
      { titolo: `Venduto (${valuta})`, tipo: "valuta" },
      { titolo: "Tasso di chiusura", tipo: "percentuale" },
    ],
    righe: [
      riga(periodo.giorni, periodo.daGiorno, periodo.aGiorno, "Attuale"),
      riga(periodo.giorniPrec, periodo.daGiornoPrec, periodo.aGiornoPrec, "Precedente"),
    ],
  };
}

export function tabellaAndamento(
  lead: LeadRow[],
  opp: OppRow[],
  giorni: string[],
  giorniPrec: string[],
  valuta: string,
  granularita: Granularita
): TabellaExport {
  const serie = (m: "lead" | "opportunita" | "vinte" | "venduto") => calcolaSerie(m, granularita, lead, opp, giorni, giorniPrec);
  const [l, o, v, s] = [serie("lead"), serie("opportunita"), serie("vinte"), serie("venduto")];
  const settimana = granularita === "settimana";
  return {
    nome: settimana ? "Andamento settimanale" : "Andamento giornaliero",
    colonne: [
      { titolo: settimana ? "Dal" : "Giorno", tipo: "data" },
      ...(settimana ? [{ titolo: "Al", tipo: "data" as const }] : []),
      { titolo: "Lead", tipo: "intero" },
      { titolo: "Opportunità create", tipo: "intero" },
      { titolo: "Vinte", tipo: "intero" },
      { titolo: `Venduto (${valuta})`, tipo: "valuta" },
      { titolo: settimana ? "Dal (periodo precedente)" : "Giorno (periodo precedente)", tipo: "data" },
      { titolo: "Lead (periodo precedente)", tipo: "intero" },
      { titolo: "Opportunità (periodo precedente)", tipo: "intero" },
      { titolo: "Vinte (periodo precedente)", tipo: "intero" },
      { titolo: `Venduto (${valuta}, periodo precedente)`, tipo: "valuta" },
    ],
    righe: l.map((p, i) => [
      p.da,
      ...(settimana ? [p.a] : []),
      p.attuale,
      o[i].attuale,
      v[i].attuale,
      s[i].attuale,
      p.daPrec,
      p.precedente,
      o[i].precedente,
      v[i].precedente,
      s[i].precedente,
    ]),
  };
}

const NOMI_DIMENSIONE: Record<Dimensione, string> = { canale: "Canali", campagna: "Campagne", fonte: "Fonti", tag: "Tag" };

export function tabellaClassifica(d: Dimensione, voci: VoceClassifica[], valuta: string): TabellaExport {
  const campagna = d === "campagna";
  const ordinate = [...voci].sort((a, b) => b.lead - a.lead || b.venduto - a.venduto || a.etichetta.localeCompare(b.etichetta, "it"));
  return {
    nome: NOMI_DIMENSIONE[d],
    colonne: [
      { titolo: campagna ? "Campagna" : d === "canale" ? "Canale" : d === "fonte" ? "Fonte" : "Tag" },
      ...(campagna ? [{ titolo: "ID campagna" }] : []),
      { titolo: "Lead", tipo: "intero" },
      { titolo: "Vinte", tipo: "intero" },
      { titolo: `Venduto (${valuta})`, tipo: "valuta" },
    ],
    righe: ordinate.map((v) => [
      v.etichetta,
      ...(campagna ? [v.chiave === SENZA_CAMPAGNA || v.chiave.startsWith("nome:") ? "" : v.chiave] : []),
      v.lead,
      v.vinte,
      v.venduto,
    ]),
  };
}

export function tabelleProvenienza(lead: LeadRow[], opp: OppRow[], giorni: Set<string>, valuta: string): TabellaExport[] {
  return (["canale", "campagna", "fonte", "tag"] as const).map((d) => tabellaClassifica(d, calcolaClassifica(d, lead, opp, giorni), valuta));
}

export function tabellaPipeline(
  pipelines: Pipeline[],
  opp: OppRow[],
  giorni: Set<string>,
  aperte: Record<string, Record<string, AperteFase>>,
  valuta: string
): TabellaExport {
  return {
    nome: "Pipeline",
    colonne: [
      { titolo: "Pipeline" },
      { titolo: "Fase" },
      { titolo: "Create nel periodo, oggi in questa fase", tipo: "intero" },
      { titolo: "Arrivate almeno qui (stima)", tipo: "intero" },
      { titolo: "Passaggio dalla fase prima (stima)", tipo: "percentuale" },
      { titolo: "Aperte oggi in questa fase (tutte)", tipo: "intero" },
      { titolo: `Valore delle aperte (${valuta})`, tipo: "valuta" },
      { titolo: "Giorni medi in questa fase", tipo: "decimale" },
    ],
    righe: pipelines.flatMap((p) =>
      calcolaImbuto(p, opp, giorni).map((f) => {
        const oggi = aperte[p.id]?.[f.id];
        return [p.name, f.nome, f.attuali, f.raggiunte, f.conversione, oggi?.n ?? 0, oggi?.valore ?? 0, oggi?.giorniMedi ?? null];
      })
    ),
  };
}

// Opportunità vinte nel periodo (le stesse colonne della tabella "Vendite" della pagina)
export const colonneVendite = (valuta: string): ColonnaExport[] => [
  { titolo: "Vinta il", tipo: "data" },
  { titolo: "Opportunità" },
  { titolo: `Valore (${valuta})`, tipo: "valuta" },
  { titolo: "Pipeline" },
  { titolo: "Canale" },
  { titolo: "Campagna" },
  { titolo: "Fonte" },
];
export const rigaVendita = (r: OppRow, pipeline: string): ValoreExport[] => [r.chiusa, r.nome ?? "", r.valore, pipeline, r.canale, r.campagna ?? "", r.fonte];

export function tabellaVendite(opp: OppRow[], giorni: Set<string>, pipelines: Pipeline[], valuta: string): TabellaExport {
  const nomi = new Map(pipelines.map((p) => [p.id, p.name]));
  const vinte = opp
    .filter((r) => r.status === "won" && r.chiusa && giorni.has(r.chiusa))
    .sort((a, b) => (b.chiusa ?? "").localeCompare(a.chiusa ?? ""));
  return { nome: "Vendite", colonne: colonneVendite(valuta), righe: vinte.map((r) => rigaVendita(r, nomi.get(r.pipelineId) ?? "")) };
}

// Contatti del periodo con i dati personali: esistono solo nel browser del titolare (o del cliente) e finiscono
// solo nel file scaricato sul suo computer, come il CSV della tabella "Contatti"
export const COLONNE_CONTATTI: ColonnaExport[] = [
  { titolo: "Creato il", tipo: "dataora" },
  { titolo: "Nome" },
  { titolo: "Email" },
  { titolo: "Telefono" },
  { titolo: "Fonte" },
  { titolo: "Canale" },
  { titolo: "Campagna" },
  { titolo: "Gruppo di inserzioni" },
  { titolo: "Annuncio" },
  { titolo: "Tag" },
];
export function rigaContatto(r: LeadRow): ValoreExport[] {
  const p = r.persona;
  return [p?.data, p?.nome, p?.email, p?.telefono, r.fonte, r.canale, r.campagna ?? "", p?.gruppo, p?.annuncio, r.tags.join(", ")];
}

export function tabellaContatti(lead: LeadRow[]): TabellaExport {
  const conPersona = lead.filter((r) => r.persona).sort((a, b) => (b.persona!.data ?? "").localeCompare(a.persona!.data ?? ""));
  return { nome: "Contatti", colonne: COLONNE_CONTATTI, righe: conPersona.map(rigaContatto) };
}

// ---------------------------------------------------------------- Meta e LinkedIn
// Tabella per campagna (su LinkedIn: per gruppo di annunci), uguale a quella della pagina
export const nomeTabellaCampagne = (id: IdPiattaforma) => `${PIATTAFORME[id].nome} - ${id === "linkedin" ? "gruppi di annunci" : "campagne"}`;
export function colonneCampagne(id: IdPiattaforma, valuta: string): ColonnaExport[] {
  const { colonna } = PIATTAFORME[id].tabella;
  return [
    { titolo: colonna },
    { titolo: `ID ${colonna.toLowerCase()}` },
    { titolo: "Stato" },
    { titolo: `Spesa (${valuta})`, tipo: "valuta" },
    { titolo: "Impression", tipo: "intero" },
    { titolo: "Clic", tipo: "intero" },
    { titolo: "CTR", tipo: "percentuale" },
    { titolo: `Costo per clic (${valuta})`, tipo: "valuta" },
    { titolo: "Lead nel CRM", tipo: "intero" },
    { titolo: `Costo per lead (${valuta})`, tipo: "valuta" },
    { titolo: "Opportunità", tipo: "intero" },
    { titolo: "Vendite", tipo: "intero" },
    { titolo: `Venduto (${valuta})`, tipo: "valuta" },
    { titolo: "ROAS dal CRM", tipo: "decimale" },
  ];
}
export const rigaCampagna = (r: RigaCampagna): ValoreExport[] => [
  r.nome,
  r.id === SENZA_CAMPAGNA_META ? "" : r.id,
  r.stato ? (STATI_CAMPAGNA[r.stato] ?? r.stato) : "",
  r.spesa,
  r.impression,
  r.clic,
  r.ctr,
  r.cpc,
  r.leadGhl,
  r.cplReale,
  r.opportunita,
  r.vinte,
  r.venduto,
  r.roas,
];

// Riepilogo, andamento giornaliero, campagne, account e (solo per l'agenzia) criticità di una piattaforma
export function tabelleAds(
  id: IdPiattaforma,
  esito: EsitoMeta,
  dati: Pick<DatiCliente, "lead" | "opp" | "periodo" | "obiettivoCpl">,
  valuta: string,
  conCriticita: boolean
): TabellaExport[] {
  if (esito.stato !== "ok") return [];
  const p = PIATTAFORME[id];
  const { lead, opp, periodo } = dati;
  const opz = opzioniIncrocio(p, esito.dati);
  const g = new Set(periodo.giorni);
  const gp = new Set(periodo.giorniPrec);
  const prefisso = `${p.nome} - `;

  const riepilogo = (giorni: Set<string>, nome: string, da: string, a: string) => {
    const k = kpiMeta(esito.dati.righe, giorni);
    const inc = kpiIncrocio(k.spesa, lead, opp, giorni, opz.canale);
    return [nome, da, a, k.spesa, k.impression, k.clic, k.ctr, k.cpc, k.cpm, inc.leadGhl, inc.cplReale, inc.opportunita, inc.costoOpportunita, inc.vinte, inc.venduto, inc.costoVendita, inc.roas];
  };

  const tabelle: TabellaExport[] = [
    {
      nome: `${prefisso}riepilogo`,
      colonne: [
        { titolo: "Periodo" },
        { titolo: "Dal", tipo: "data" },
        { titolo: "Al", tipo: "data" },
        { titolo: `Spesa (${valuta})`, tipo: "valuta" },
        { titolo: "Impression", tipo: "intero" },
        { titolo: "Clic", tipo: "intero" },
        { titolo: "CTR", tipo: "percentuale" },
        { titolo: `Costo per clic (${valuta})`, tipo: "valuta" },
        { titolo: `Costo per 1.000 impression (${valuta})`, tipo: "valuta" },
        { titolo: `Lead da ${p.canale} nel CRM`, tipo: "intero" },
        { titolo: `Costo per lead (${valuta})`, tipo: "valuta" },
        { titolo: "Opportunità", tipo: "intero" },
        { titolo: `Costo per opportunità (${valuta})`, tipo: "valuta" },
        { titolo: "Vendite", tipo: "intero" },
        { titolo: `Venduto (${valuta})`, tipo: "valuta" },
        { titolo: `Costo per vendita (${valuta})`, tipo: "valuta" },
        { titolo: "ROAS dal CRM", tipo: "decimale" },
      ],
      righe: [
        riepilogo(g, "Attuale", periodo.daGiorno, periodo.aGiorno),
        riepilogo(gp, "Precedente", periodo.daGiornoPrec, periodo.aGiornoPrec),
      ],
    },
    {
      nome: `${prefisso}andamento`,
      colonne: [
        { titolo: p.giorniUtc ? "Giorno (UTC)" : "Giorno", tipo: "data" },
        { titolo: `Spesa (${valuta})`, tipo: "valuta" },
        { titolo: `Lead da ${p.canale} nel CRM`, tipo: "intero" },
      ],
      righe: serieGiornaliera(esito.dati.righe, lead, periodo.giorni, opz.canale).map((s) => [s.giorno, s.spesa, s.leadGhl]),
    },
    { nome: nomeTabellaCampagne(id), colonne: colonneCampagne(id, valuta), righe: righeCampagne(esito.dati, lead, opp, g, opz).map(rigaCampagna) },
    {
      nome: `${prefisso}account`,
      colonne: [{ titolo: "ID account" }, { titolo: "Nome" }, { titolo: "Valuta" }, { titolo: "Stato" }, { titolo: "Frequenza ultimi 7 giorni", tipo: "decimale" }],
      righe: esito.dati.account.map((a) => [
        a.id,
        a.nome,
        a.valuta,
        a.statoTesto ?? STATI_ACCOUNT[a.stato] ?? `codice ${a.stato}`,
        esito.dati.frequenza7g[a.id] ?? null,
      ]),
    },
  ];

  if (conCriticita) {
    const criticita = calcolaCriticita({
      meta: esito.dati,
      lead,
      giorni: periodo.giorni,
      giorniPrec: periodo.giorniPrec,
      obiettivoCpl: dati.obiettivoCpl ?? undefined,
      valuta,
      ...opz,
    });
    tabelle.push({
      nome: `${prefisso}criticità`,
      colonne: [{ titolo: "Livello" }, { titolo: "Criticità" }],
      righe: criticita.map((c) => [c.livello === "errore" ? "Problema" : "Attenzione", c.testo]),
    });
  }
  return tabelle;
}

// ---------------------------------------------------------------- informazioni e file completo
// Foglio "Info" dei file di una sezione: cliente, periodo, filtri attivi e fonte dei numeri
export function righeInfo(dati: Pick<DatiCliente, "cliente" | "periodo">, fonte: string, filtri: string): RigaInfo[] {
  const { cliente, periodo } = dati;
  return [
    ["Cliente", cliente.nome],
    ["Periodo", intervallo(periodo.daGiorno, periodo.aGiorno)],
    ["Periodo precedente (confronto)", intervallo(periodo.daGiornoPrec, periodo.aGiornoPrec)],
    ["Fuso orario dei giorni", cliente.fuso],
    ["Filtri attivi", filtri],
    ["Fonte", fonte],
    ["Scaricato il", new Date().toLocaleString("it-IT")],
  ];
}

// Excel completo del cliente: tutti i dati del periodo, senza i filtri della pagina
export function cartellaCliente(dati: DatiCliente, opz: { modo: "agenzia" | "condivisa"; scaricatoIl: string }): TabellaExport[] {
  const { cliente, periodo, lead, opp, pipelines } = dati;
  const valuta = cliente.valuta;
  const giorni = new Set(periodo.giorni);
  const statoAds = (id: IdPiattaforma) => {
    const e = dati[id];
    if (e.stato === "ok") return `account ${e.dati.account.map((a) => a.nome).join(", ")}`;
    return e.stato === "non-associato" ? "nessun account associato" : "dati non disponibili in questo momento";
  };
  const info = tabellaInfo([
    ["Cliente", cliente.nome],
    ["Periodo", intervallo(periodo.daGiorno, periodo.aGiorno)],
    ["Periodo precedente (confronto)", intervallo(periodo.daGiornoPrec, periodo.aGiornoPrec)],
    ["Fuso orario dei giorni", cliente.fuso],
    ["Valuta", valuta],
    ["Filtri", "nessuno: dati completi del periodo"],
    ["Fonte lead, opportunità e vendite", "GoHighLevel (CRM del cliente)"],
    ["Fonte Meta", `Meta Marketing API: ${statoAds("meta")}`],
    ["Fonte LinkedIn", `LinkedIn Marketing API: ${statoAds("linkedin")} (giorni in UTC)`],
    ["Definizioni", "Lead e opportunità alla data di creazione; vinte, venduto e chiusura alla data di chiusura. Costo per lead = spesa / lead arrivati nel CRM dal canale della piattaforma."],
    ["Dati aggiornati il", new Date(dati.aggiornatoIl).toLocaleString("it-IT")],
    ["Scaricato il", opz.scaricatoIl],
  ]);
  return [
    info,
    tabellaNumeri(lead, opp, periodo, valuta),
    tabellaAndamento(lead, opp, periodo.giorni, periodo.giorniPrec, valuta, "giorno"),
    ...tabelleProvenienza(lead, opp, giorni, valuta),
    tabellaPipeline(pipelines, opp, giorni, dati.aperte, valuta),
    tabellaVendite(opp, giorni, pipelines, valuta),
    tabellaContatti(lead),
    ...tabelleAds("meta", dati.meta, dati, valuta, opz.modo === "agenzia"),
    ...tabelleAds("linkedin", dati.linkedin, dati, valuta, opz.modo === "agenzia"),
  ];
}
