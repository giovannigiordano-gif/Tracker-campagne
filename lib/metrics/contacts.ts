// Calcolo degli aggregati sui contatti (lead = contatti creati nel periodo).
// Gli aggregati non contengono dati personali: solo conteggi per giorno, fonte, canale, campagna, tag.
import type { Contact } from "../ghl/types";
import { giornoInFuso, type Intervallo } from "../period";

export type Voce = { nome: string; n: number; dettaglio?: string };

export type AggregatiContatti = {
  totale: number;
  daMeta: number; // canale "Meta Ads"
  attribuiti: number; // riconducibili a una campagna
  perGiorno: Record<string, number>;
  perFonte: Voce[]; // campo "Fonte" di GHL
  perCanale: Voce[];
  perCampagna: Voce[];
  perTag: Voce[];
};

function classifica(conteggi: Map<string, { n: number; dettaglio?: string }>): Voce[] {
  return [...conteggi.entries()]
    .map(([nome, v]) => ({ nome, n: v.n, dettaglio: v.dettaglio }))
    .sort((a, b) => b.n - a.n || a.nome.localeCompare(b.nome, "it"));
}

function incrementa(m: Map<string, { n: number; dettaglio?: string }>, chiave: string, dettaglio?: string) {
  const v = m.get(chiave);
  if (v) v.n++;
  else m.set(chiave, { n: 1, dettaglio });
}

export function aggregaContatti(contatti: Contact[], intervallo: Intervallo, tz: string): AggregatiContatti {
  const perGiorno: Record<string, number> = Object.fromEntries(intervallo.giorni.map((g) => [g, 0]));
  const fonti = new Map<string, { n: number }>();
  const canali = new Map<string, { n: number }>();
  const campagne = new Map<string, { n: number; dettaglio?: string }>();
  const tag = new Map<string, { n: number }>();
  let daMeta = 0;
  let attribuiti = 0;
  let totale = 0;

  for (const c of contatti) {
    const giorno = giornoInFuso(c.dateAdded, tz);
    if (!(giorno in perGiorno)) continue; // fuori dall'intervallo
    totale++;
    perGiorno[giorno]++;
    incrementa(fonti, c.source ?? "(fonte non indicata)");
    incrementa(canali, c.attribution.canale);
    if (c.attribution.canale === "Meta Ads") daMeta++;
    if (c.attributed) {
      attribuiti++;
      const nome = c.attribution.utmCampaign ?? `Campagna ${c.attribution.campaignId}`;
      // Stessa campagna = stesso ID; il nome è quello visto per primo
      const chiave = c.attribution.campaignId ?? nome;
      const v = campagne.get(chiave);
      if (v) v.n++;
      else campagne.set(chiave, { n: 1, dettaglio: nome });
    } else {
      incrementa(campagne, "\u0000senza", "(senza campagna)");
    }
    for (const t of c.tags) incrementa(tag, t);
  }

  return {
    totale,
    daMeta,
    attribuiti,
    perGiorno,
    perFonte: classifica(fonti),
    perCanale: classifica(canali),
    perCampagna: vociCampagne(classifica(campagne)),
    perTag: classifica(tag),
  };
}

// Per le campagne la chiave è l'ID e il nome da mostrare è nel dettaglio.
// Se due campagne diverse hanno lo stesso nome, si aggiunge la parte finale dell'ID per distinguerle.
function vociCampagne(voci: Voce[]): Voce[] {
  const nomi = voci.map((v) => v.dettaglio ?? v.nome);
  return voci.map((v, i) => {
    const conId = !v.nome.startsWith("\u0000") && v.nome !== v.dettaglio;
    const doppione = nomi.indexOf(nomi[i]) !== nomi.lastIndexOf(nomi[i]);
    return {
      nome: doppione ? `${nomi[i]} · ${conId ? `ID …${v.nome.slice(-6)}` : "senza ID"}` : nomi[i],
      n: v.n,
      dettaglio: conId ? `ID ${v.nome}` : undefined,
    };
  });
}

// Variazione percentuale rispetto al periodo precedente (null se non calcolabile)
export function variazione(attuale: number, precedente: number): number | null {
  if (precedente === 0) return attuale === 0 ? 0 : null;
  return ((attuale - precedente) / precedente) * 100;
}
