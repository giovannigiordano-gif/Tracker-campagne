// Calcoli della sezione "Campagne Meta": numeri di Meta e incrocio con lead, opportunità e vendite di GHL.
// Funzioni pure (girano anche nel browser). Fonte dei numeri: Meta (spesa, impression, clic, lead secondo Meta)
// e GoHighLevel (lead, opportunità e vendite con canale "Meta Ads", abbinati per ID campagna).
import type { DatiMeta, InsightGiorno } from "../meta/normalize";
import type { LeadRow, OppRow } from "./dashboard";

const dividi = (a: number, b: number) => (b > 0 ? a / b : null);
const daMeta = (canale: string) => canale === "Meta Ads";

// ---------------------------------------------------------------- numeri di Meta
export type KpiMeta = {
  spesa: number;
  impression: number;
  clic: number;
  clicLink: number;
  leadMeta: number;
  cplMeta: number | null; // spesa / lead secondo Meta
  ctr: number | null; // % di clic sulle impression
  cpc: number | null; // costo per clic
  cpm: number | null; // costo per 1.000 impression
};

export function kpiMeta(righe: InsightGiorno[], giorni: Set<string>): KpiMeta {
  let spesa = 0, impression = 0, clic = 0, clicLink = 0, leadMeta = 0;
  for (const r of righe) {
    if (!giorni.has(r.giorno)) continue;
    spesa += r.spesa;
    impression += r.impression;
    clic += r.clic;
    clicLink += r.clicLink;
    leadMeta += r.leadMeta;
  }
  const ctr = dividi(clic, impression);
  const cpm = dividi(spesa, impression);
  return {
    spesa,
    impression,
    clic,
    clicLink,
    leadMeta,
    cplMeta: dividi(spesa, leadMeta),
    ctr: ctr === null ? null : ctr * 100,
    cpc: dividi(spesa, clic),
    cpm: cpm === null ? null : cpm * 1000,
  };
}

// ---------------------------------------------------------------- incrocio con GHL
export type KpiIncrocio = {
  leadGhl: number; // lead arrivati in GHL dal canale Meta Ads
  opportunita: number;
  vinte: number;
  venduto: number;
  cplReale: number | null; // spesa / lead GHL
  costoOpportunita: number | null;
  costoVendita: number | null;
  roas: number | null; // venduto / spesa
};

export function kpiIncrocio(spesa: number, lead: LeadRow[], opp: OppRow[], giorni: Set<string>): KpiIncrocio {
  const leadGhl = lead.filter((r) => daMeta(r.canale) && giorni.has(r.giorno)).length;
  const oppMeta = opp.filter((o) => daMeta(o.canale));
  const opportunita = oppMeta.filter((o) => o.creata && giorni.has(o.creata)).length;
  const vinteRighe = oppMeta.filter((o) => o.status === "won" && o.chiusa && giorni.has(o.chiusa));
  const venduto = vinteRighe.reduce((s, o) => s + o.valore, 0);
  const conSpesa = (n: number) => (spesa > 0 ? dividi(spesa, n) : null);
  return {
    leadGhl,
    opportunita,
    vinte: vinteRighe.length,
    venduto,
    cplReale: conSpesa(leadGhl),
    costoOpportunita: conSpesa(opportunita),
    costoVendita: conSpesa(vinteRighe.length),
    roas: spesa > 0 ? venduto / spesa : null,
  };
}

// ---------------------------------------------------------------- tabella per campagna
export const SENZA_CAMPAGNA_META = "senza-campagna";

export type RigaCampagna = {
  id: string;
  nome: string;
  stato: string | null;
  spesa: number;
  impression: number;
  clic: number;
  ctr: number | null;
  cpc: number | null;
  leadMeta: number;
  leadGhl: number;
  cplReale: number | null;
  opportunita: number;
  vinte: number;
  venduto: number;
  roas: number | null;
};

export function righeCampagne(dati: DatiMeta, lead: LeadRow[], opp: OppRow[], giorni: Set<string>): RigaCampagna[] {
  const mappa = new Map<string, RigaCampagna>();
  const nuova = (id: string, nome: string): RigaCampagna => ({
    id, nome, stato: null, spesa: 0, impression: 0, clic: 0, ctr: null, cpc: null, leadMeta: 0, leadGhl: 0, cplReale: null, opportunita: 0, vinte: 0, venduto: 0, roas: null,
  });
  const riga = (id: string, nome: string) => mappa.get(id) ?? mappa.set(id, nuova(id, nome)).get(id)!;

  for (const r of dati.righe) {
    if (!giorni.has(r.giorno)) continue;
    const c = riga(r.campagnaId, r.campagna);
    c.spesa += r.spesa;
    c.impression += r.impression;
    c.clic += r.clic;
    c.leadMeta += r.leadMeta;
  }
  for (const l of lead) {
    if (!daMeta(l.canale) || !giorni.has(l.giorno)) continue;
    const id = l.campagnaId ?? SENZA_CAMPAGNA_META;
    riga(id, l.campagnaId ? (l.campagna ?? l.campagnaId) : "Lead Meta senza campagna riconosciuta").leadGhl++;
  }
  for (const o of opp) {
    if (!daMeta(o.canale)) continue;
    const id = o.campagnaId ?? SENZA_CAMPAGNA_META;
    const nome = o.campagnaId ? (o.campagna ?? o.campagnaId) : "Lead Meta senza campagna riconosciuta";
    if (o.creata && giorni.has(o.creata)) riga(id, nome).opportunita++;
    if (o.status === "won" && o.chiusa && giorni.has(o.chiusa)) {
      const c = riga(id, nome);
      c.vinte++;
      c.venduto += o.valore;
    }
  }

  const campagne = new Map(dati.campagne.map((c) => [c.id, c]));
  for (const c of mappa.values()) {
    const info = campagne.get(c.id);
    if (info) {
      c.nome = info.nome;
      c.stato = info.stato;
    }
    const ctr = dividi(c.clic, c.impression);
    c.ctr = ctr === null ? null : ctr * 100;
    c.cpc = dividi(c.spesa, c.clic);
    c.cplReale = c.spesa > 0 ? dividi(c.spesa, c.leadGhl) : null;
    c.roas = c.spesa > 0 ? c.venduto / c.spesa : null;
  }
  return [...mappa.values()].sort(
    (a, b) =>
      Number(a.id === SENZA_CAMPAGNA_META) - Number(b.id === SENZA_CAMPAGNA_META) || b.spesa - a.spesa || b.leadGhl - a.leadGhl
  );
}

// ---------------------------------------------------------------- andamento giorno per giorno
export type PuntoMeta = { giorno: string; spesa: number; leadMeta: number; leadGhl: number };

export function serieGiornaliera(righe: InsightGiorno[], lead: LeadRow[], giorni: string[]): PuntoMeta[] {
  const punti = new Map(giorni.map((g) => [g, { giorno: g, spesa: 0, leadMeta: 0, leadGhl: 0 }]));
  for (const r of righe) {
    const p = punti.get(r.giorno);
    if (p) {
      p.spesa += r.spesa;
      p.leadMeta += r.leadMeta;
    }
  }
  for (const l of lead) {
    const p = punti.get(l.giorno);
    if (p && daMeta(l.canale)) p.leadGhl++;
  }
  return [...punti.values()];
}
