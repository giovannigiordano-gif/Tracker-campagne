// Riepilogo dei dati di un cliente per Claude: SOLO numeri aggregati (conteggi, somme, medie), mai righe
// di singoli contatti o opportunità. Funzione pura (testata in riepilogo.test.ts).
// Ogni blocco dice da dove vengono i numeri (GoHighLevel, Meta o LinkedIn) e il periodo, come chiede PROGETTO.md.
import type { Account } from "../accounts";
import type { DatiCliente } from "../data/cliente";
import type { EsitoMeta } from "../data/meta-cliente";
import { calcolaCriticita } from "../metrics/criticita";
import { opzioniIncrocio, PIATTAFORME, type IdPiattaforma, type Piattaforma } from "../metrics/piattaforme";
import {
  calcolaClassifica,
  calcolaImbuto,
  calcolaKpi,
  calcolaSerie,
  leadPerCanale,
  variazionePct,
  type Kpi,
} from "../metrics/dashboard";
import { kpiIncrocio, kpiMeta, righeCampagne, serieGiornaliera, SENZA_CAMPAGNA_META, type KpiIncrocio, type KpiMeta } from "../metrics/meta";
import { STATI_ACCOUNT } from "../meta/normalize";

// Arrotonda i numeri a 2 decimali, per un riepilogo più corto e leggibile
const arrotonda = (n: number | null) => (n === null || !Number.isFinite(n) ? null : Math.round(n * 100) / 100);
function arrotondaTutto<T extends Record<string, unknown>>(o: T): T {
  const copia: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) copia[k] = typeof v === "number" ? arrotonda(v) : v;
  return copia as T;
}

const MASSIMO_VOCI = 25;

const FONTI: Record<IdPiattaforma, string> = {
  meta: "Meta Marketing API (insights per campagna e giorno) incrociata con GoHighLevel",
  linkedin: "LinkedIn Marketing API (statistiche per campagna e giorno) incrociata con GoHighLevel",
};

export const DEFINIZIONI = {
  lead: "Contatti creati in GoHighLevel nel periodo.",
  opportunita: "Opportunità create in GoHighLevel nel periodo.",
  vinte_perse_venduto: "Opportunità vinte o perse nel periodo (data dell'ultimo cambio di stato); venduto = valore delle vinte.",
  tassoChiusura: "Vinte / (vinte + perse), in %.",
  canale_meta_ads: "Lead e opportunità con attribuzione 'Paid Social' o con ID di campagna/annuncio Meta.",
  canale_linkedin_ads:
    "Lead e opportunità con fonte LinkedIn e un segno di traffico a pagamento (sessione 'Paid', utm_medium a pagamento, ID di campagna); senza quel segno sono 'Social organico'.",
  costoPerLead: "Spesa della piattaforma / lead arrivati in GHL dal suo canale (Meta Ads o LinkedIn Ads): i lead si contano solo nel CRM.",
  roasCrm: "Venduto in GHL dal canale della piattaforma / spesa della piattaforma.",
  pipeline:
    "GHL non conserva lo storico dei cambi di fase: 'oggiInQuestaFase' è reale, 'raggiunteStima' e 'conversioneStimaPct' sono stime (fasi percorse in ordine) e possono essere inaffidabili con fasi di uscita intermedie.",
  campagne_ghl:
    "Abbinamento lead → campagna dai campi di attribuzione di GHL: una parte dei lead può non avere campagna (vedi percentualeAttribuiti).",
};

// Lead e costo per lead solo dal CRM (scelta del titolare del 2026-10-20): i lead conteggiati da Meta non si
// mandano a Claude, così il confronto tra le due cifre non entra nelle analisi.
function numeriMeta({ leadMeta: _leadMeta, cplMeta: _cplMeta, ...resto }: KpiMeta) {
  return arrotondaTutto(resto);
}
function incrocio({ leadGhl, cplReale, ...resto }: KpiIncrocio) {
  return { lead: leadGhl, costoPerLead: arrotonda(cplReale), ...arrotondaTutto(resto) };
}

// Numeri GHL: "leadMeta" diventa "leadDaMetaAds" e "leadLinkedin" "leadDaLinkedInAds"
// (sono contatti del CRM arrivati da quei canali, non lead contati dalle piattaforme)
function numeriGhl({ leadMeta, leadLinkedin, ...resto }: Kpi) {
  return { leadDaMetaAds: leadMeta, leadDaLinkedInAds: leadLinkedin, ...arrotondaTutto(resto) };
}

function variazioni(a: Kpi, p: Kpi) {
  return {
    lead: arrotonda(variazionePct(a.lead, p.lead)),
    leadDaMetaAds: arrotonda(variazionePct(a.leadMeta, p.leadMeta)),
    leadDaLinkedInAds: arrotonda(variazionePct(a.leadLinkedin, p.leadLinkedin)),
    opportunita: arrotonda(variazionePct(a.oppCreate, p.oppCreate)),
    vinte: arrotonda(variazionePct(a.vinte, p.vinte)),
    venduto: arrotonda(variazionePct(a.venduto, p.venduto)),
  };
}

export function riepilogoCliente(dati: DatiCliente, account: Pick<Account, "notes" | "thresholds">) {
  const { periodo, lead, opp, pipelines, aperte, meta, linkedin } = dati;
  const giorni = new Set(periodo.giorni);
  const giorniPrec = new Set(periodo.giorniPrec);
  const kpi = calcolaKpi(lead, opp, giorni);
  const kpiPrec = calcolaKpi(lead, opp, giorniPrec);
  const leadPeriodo = lead.filter((l) => giorni.has(l.giorno));
  const attribuiti = leadPeriodo.filter((l) => l.attribuito).length;

  const canaliPrec = new Map(leadPerCanale(lead, giorniPrec).map((c) => [c.canale, c.lead]));
  const classifica = (d: "campagna" | "fonte" | "tag") =>
    calcolaClassifica(d, lead, opp, giorni)
      .slice(0, MASSIMO_VOCI)
      .map((v) => ({ nome: v.etichetta, ...(d === "campagna" && !v.chiave.startsWith("nome:") && v.chiave !== "__senza__" ? { campagnaId: v.chiave } : {}), lead: v.lead, vinte: v.vinte, venduto: arrotonda(v.venduto) }));

  // Oltre 45 giorni l'andamento è per settimana, per tenere il riepilogo compatto
  const granularita = periodo.giorni.length > 45 ? "settimana" : "giorno";
  const serie = (m: "lead" | "opportunita" | "vinte" | "venduto") => calcolaSerie(m, granularita, lead, opp, periodo.giorni, periodo.giorniPrec);
  const [sLead, sOpp, sVinte, sVenduto] = [serie("lead"), serie("opportunita"), serie("vinte"), serie("venduto")];

  const ghl = {
    fonte: "GoHighLevel (sub-account del cliente)",
    numeri: {
      attuale: numeriGhl(kpi),
      precedente: numeriGhl(kpiPrec),
      variazioniPct: variazioni(kpi, kpiPrec),
    },
    percentualeAttribuiti: leadPeriodo.length ? arrotonda((attribuiti / leadPeriodo.length) * 100) : null,
    leadPerCanale: leadPerCanale(lead, giorni).map((c) => ({ canale: c.canale, lead: c.lead, leadPeriodoPrecedente: canaliPrec.get(c.canale) ?? 0 })),
    campagne: classifica("campagna"),
    fonti: classifica("fonte"),
    tag: classifica("tag"),
    andamento: {
      granularita,
      punti: sLead.map((p, i) => ({
        da: p.da,
        a: p.a,
        lead: p.attuale,
        leadPrecedente: p.precedente,
        opportunita: sOpp[i].attuale,
        vinte: sVinte[i].attuale,
        venduto: arrotonda(sVenduto[i].attuale),
      })),
    },
    pipeline: pipelines.map((p) => ({
      nome: p.name,
      fasi: calcolaImbuto(p, opp, giorni).map((f) => {
        const oggi = aperte[p.id]?.[f.id];
        return {
          nome: f.nome,
          oggiInQuestaFase: f.attuali,
          raggiunteStima: f.raggiunte,
          conversioneStimaPct: arrotonda(f.conversione),
          aperteOggiTotali: oggi ? { numero: oggi.n, valore: arrotonda(oggi.valore), giorniMediInFase: arrotonda(oggi.giorniMedi) } : null,
        };
      }),
    })),
  };

  // Sezione di una piattaforma pubblicitaria (Meta o LinkedIn): stessi campi, stessa regola sui lead (solo dal CRM)
  function sezioneAds(p: Piattaforma, esito: EsitoMeta): Record<string, unknown> {
    if (esito.stato === "non-associato") {
      return { stato: "non-associato", nota: `Nessun account pubblicitario ${p.nome} associato a questo cliente (Impostazioni dell'app).` };
    }
    if (esito.stato === "errore") return { stato: "errore", messaggio: esito.messaggio };
    const d = esito.dati;
    const opz = opzioniIncrocio(p, d);
    const km = kpiMeta(d.righe, giorni);
    const kmPrec = kpiMeta(d.righe, giorniPrec);
    const obiettivi = new Map(d.campagne.map((c) => [c.id, c.obiettivo]));
    const punti = serieGiornaliera(d.righe, lead, periodo.giorni, opz.canale);
    // Stessa granularità dell'andamento GHL
    const andamento =
      granularita === "giorno"
        ? punti.map((p) => ({ da: p.giorno, a: p.giorno, spesa: arrotonda(p.spesa), lead: p.leadGhl }))
        : Array.from({ length: Math.ceil(punti.length / 7) }, (_, i) => {
            const blocco = punti.slice(i * 7, i * 7 + 7);
            return {
              da: blocco[0].giorno,
              a: blocco.at(-1)!.giorno,
              spesa: arrotonda(blocco.reduce((s, p) => s + p.spesa, 0)),
              lead: blocco.reduce((s, p) => s + p.leadGhl, 0),
            };
          });
    return {
      stato: "ok",
      fonte: FONTI[p.id],
      ...(p.giorniUtc ? { notaGiorni: "LinkedIn conta spesa e risultati per giorno in UTC: a cavallo della mezzanotte un giorno può differire di qualche ora da GHL." } : {}),
      account: d.account.map((a) => ({ id: a.id, nome: a.nome, valuta: a.valuta, stato: a.statoTesto ?? STATI_ACCOUNT[a.stato] ?? `codice ${a.stato}` })),
      numeri: { attuale: numeriMeta(km), precedente: numeriMeta(kmPrec) },
      incrocio: {
        attuale: incrocio(kpiIncrocio(km.spesa, lead, opp, giorni, opz.canale)),
        precedente: incrocio(kpiIncrocio(kmPrec.spesa, lead, opp, giorniPrec, opz.canale)),
      },
      campagne: righeCampagne(d, lead, opp, giorni, opz).map(({ leadMeta: _leadMeta, leadGhl, cplReale, ...c }) => ({
        ...arrotondaTutto(c),
        lead: leadGhl,
        costoPerLead: arrotonda(cplReale),
        id: c.id === SENZA_CAMPAGNA_META ? null : c.id,
        obiettivo: obiettivi.get(c.id) ?? null,
      })),
      andamento: { granularita, punti: andamento },
      frequenzaUltimi7Giorni: d.frequenza7g,
      criticita: calcolaCriticita({
        meta: d,
        lead,
        giorni: periodo.giorni,
        giorniPrec: periodo.giorniPrec,
        obiettivoCpl: account.thresholds.maxCpl,
        valuta: dati.cliente.valuta,
        ...opz,
      }).map(({ livello, tipo, testo }) => ({ livello, tipo, testo })),
      accountNonLetti: d.errori,
    };
  }

  return {
    cliente: {
      id: dati.cliente.locationId,
      nome: dati.cliente.nome,
      valuta: dati.cliente.valuta,
      fusoOrario: dati.cliente.fuso,
      noteDiContesto: account.notes || null,
      obiettivoCostoPerLead: account.thresholds.maxCpl ?? null,
    },
    periodo: {
      da: periodo.daGiorno,
      a: periodo.aGiorno,
      giorni: periodo.giorni.length,
      precedente: { da: periodo.daGiornoPrec, a: periodo.aGiornoPrec },
    },
    datiAggiornatiIl: new Date(dati.aggiornatoIl).toISOString(),
    definizioni: DEFINIZIONI,
    ghl,
    meta: sezioneAds(PIATTAFORME.meta, meta),
    linkedin: sezioneAds(PIATTAFORME.linkedin, linkedin),
  };
}
