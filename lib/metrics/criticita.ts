// Criticità delle campagne di un cliente su Meta e su LinkedIn (scelte dal titolare il 2026-10-20):
// costo per lead troppo alto, spesa senza risultati, segnali della piattaforma (account non attivo, annunci con
// problemi, campagne attive ma ferme, frequenza alta). Funzioni pure: le usano la dashboard del cliente e la Panoramica.
import { formatValuta } from "../format";
import { STATI_ACCOUNT, type DatiMeta } from "../meta/normalize";
import type { LeadRow } from "./dashboard";
import { kpiIncrocio, kpiMeta, perIdCampagna, type OpzioniIncrocio } from "./meta";

export type Criticita = {
  livello: "errore" | "attenzione";
  tipo: "cpl-alto" | "spesa-senza-risultati" | "account-non-attivo" | "annunci-con-problemi" | "campagna-ferma" | "frequenza-alta";
  testo: string;
  campagnaId?: string;
};

// Soglie (documentate anche in CLAUDE.md)
export const SOGLIA_SPESA_SENZA_RISULTATI = 30; // € negli ultimi 3 giorni, se il cliente non ha un obiettivo di costo per lead
export const GIORNI_SENZA_RISULTATI = 3;
export const PEGGIORAMENTO_CPL = 0.5; // +50% rispetto al periodo precedente
export const MINIMO_LEAD_CONFRONTO = 5; // sotto questo numero di lead le variazioni sono rumore
export const FREQUENZA_MASSIMA = 3; // negli ultimi 7 giorni
// Obiettivi Meta delle campagne che cercano lead: le altre (notorietà, traffico...) non portano lead per definizione
export const OBIETTIVI_LEAD = new Set(["OUTCOME_LEADS", "LEAD_GENERATION"]);

// Come si chiamano le righe nei testi: "campagna" su Meta, "gruppo di annunci" su LinkedIn (in Campaign Manager
// la "campaign" dell'API si chiama così dalla fine del 2025)
export type Unita = { la: string; nella: string; attivaFerma: string };
export const UNITA_CAMPAGNA: Unita = { la: "La campagna", nella: "nella campagna", attivaFerma: "è attiva ma non viene pubblicata" };
export const UNITA_GRUPPO_ANNUNCI: Unita = { la: "Il gruppo di annunci", nella: "nel gruppo di annunci", attivaFerma: "è attivo ma non viene pubblicato" };

export function calcolaCriticita({
  meta,
  lead,
  giorni,
  giorniPrec,
  obiettivoCpl,
  valuta,
  canale = "Meta Ads",
  campagnaDi = perIdCampagna,
  unita = UNITA_CAMPAGNA,
}: {
  meta: DatiMeta;
  lead: LeadRow[];
  giorni: string[];
  giorniPrec: string[];
  obiettivoCpl?: number;
  valuta: string;
  unita?: Unita;
} & OpzioniIncrocio): Criticita[] {
  const fmt = (n: number) => formatValuta(n, valuta);
  const elenco: Criticita[] = [];

  // Account pubblicitario non attivo: le inserzioni non escono
  for (const a of meta.account) {
    if (a.stato !== 1) {
      elenco.push({
        livello: "errore",
        tipo: "account-non-attivo",
        testo: `L'account pubblicitario ${a.nome} è ${a.statoTesto ?? STATI_ACCOUNT[a.stato] ?? `in stato ${a.stato}`}: le inserzioni non vengono pubblicate.`,
      });
    }
  }

  // Costo per lead (spesa / lead arrivati in GHL dal canale della piattaforma)
  const periodo = new Set(giorni);
  const precedente = new Set(giorniPrec);
  const ora = kpiIncrocio(kpiMeta(meta.righe, periodo).spesa, lead, [], periodo, canale);
  if (obiettivoCpl && ora.cplReale !== null && ora.cplReale > obiettivoCpl) {
    elenco.push({
      livello: "attenzione",
      tipo: "cpl-alto",
      testo: `Costo per lead ${fmt(ora.cplReale)}: sopra l'obiettivo di ${fmt(obiettivoCpl)}.`,
    });
  } else if (!obiettivoCpl) {
    const prima = kpiIncrocio(kpiMeta(meta.righe, precedente).spesa, lead, [], precedente, canale);
    if (
      ora.cplReale !== null &&
      prima.cplReale !== null &&
      ora.leadGhl >= MINIMO_LEAD_CONFRONTO &&
      prima.leadGhl >= MINIMO_LEAD_CONFRONTO &&
      ora.cplReale > prima.cplReale * (1 + PEGGIORAMENTO_CPL)
    ) {
      const pct = Math.round((ora.cplReale / prima.cplReale - 1) * 100);
      elenco.push({
        livello: "attenzione",
        tipo: "cpl-alto",
        testo: `Costo per lead ${fmt(ora.cplReale)}: peggiorato del ${pct}% rispetto al periodo precedente (${fmt(prima.cplReale)}).`,
      });
    }
  }

  // Spesa senza risultati: campagne attive con obiettivo "lead" che negli ultimi giorni spendono senza nessun lead
  const ultimi = new Set(giorni.slice(-GIORNI_SENZA_RISULTATI));
  const soglia = obiettivoCpl ?? SOGLIA_SPESA_SENZA_RISULTATI;
  for (const c of meta.campagne.filter((x) => x.stato === "ACTIVE" && x.obiettivo && OBIETTIVI_LEAD.has(x.obiettivo))) {
    let spesa = 0, leadMeta = 0;
    for (const r of meta.righe) {
      if (r.campagnaId === c.id && ultimi.has(r.giorno)) {
        spesa += r.spesa;
        leadMeta += r.leadMeta;
      }
    }
    const leadGhl = lead.filter((l) => l.canale === canale && campagnaDi(l) === c.id && ultimi.has(l.giorno)).length;
    if (spesa >= soglia && leadMeta === 0 && leadGhl === 0) {
      elenco.push({
        livello: "errore",
        tipo: "spesa-senza-risultati",
        testo: `${unita.la} ${c.nome} ha speso ${fmt(spesa)} negli ultimi ${GIORNI_SENZA_RISULTATI} giorni senza nessun lead.`,
        campagnaId: c.id,
      });
    }
  }

  // Annunci rifiutati o con problemi, solo nelle campagne attive (in quelle in pausa sarebbero solo rumore)
  const attive = new Map(meta.campagne.filter((x) => x.stato === "ACTIVE").map((c) => [c.id, c.nome]));
  const perCampagna = new Map<string, typeof meta.problemi>();
  for (const p of meta.problemi) {
    if (!attive.has(p.campagnaId)) continue;
    perCampagna.set(p.campagnaId, [...(perCampagna.get(p.campagnaId) ?? []), p]);
  }
  for (const [campagnaId, annunci] of perCampagna) {
    const esempio = annunci.find((a) => a.problema)?.problema;
    elenco.push({
      livello: annunci.some((a) => a.stato === "DISAPPROVED") ? "errore" : "attenzione",
      tipo: "annunci-con-problemi",
      testo: `${annunci.length === 1 ? "1 annuncio" : `${annunci.length} annunci`} con problemi ${unita.nella} ${attive.get(campagnaId)}${esempio ? ` (per esempio: «${esempio}»)` : ""}.`,
      campagnaId,
    });
  }

  // Campagne attive che la piattaforma non sta pubblicando (LinkedIn: budget esaurito, date, account bloccato...)
  for (const f of meta.campagneFerme ?? []) {
    const nome = attive.get(f.campagnaId);
    if (!nome) continue;
    elenco.push({
      livello: "attenzione",
      tipo: "campagna-ferma",
      testo: `${unita.la} ${nome} ${unita.attivaFerma}: ${f.motivo}.`,
      campagnaId: f.campagnaId,
    });
  }

  // Frequenza alta: lo stesso pubblico vede gli annunci troppe volte
  for (const a of meta.account) {
    const f = meta.frequenza7g[a.id];
    if (f != null && f > FREQUENZA_MASSIMA) {
      elenco.push({
        livello: "attenzione",
        tipo: "frequenza-alta",
        testo: `Frequenza ${f.toFixed(1).replace(".", ",")} negli ultimi 7 giorni sull'account ${a.nome}: il pubblico vede gli stessi annunci troppe volte.`,
      });
    }
  }

  // Prima gli errori
  return elenco.sort((a, b) => Number(a.livello === "attenzione") - Number(b.livello === "attenzione"));
}
