"use client";
// Dashboard interattiva di un cliente. I filtri (canale, campagna, fonte, tag, pipeline)
// valgono per tutta la pagina: numeri, grafici, classifiche e tabelle si ricalcolano subito.
// modo "agenzia": la vede il titolare (con Aggiorna e Condividi).
// modo "condivisa": la vede il cliente dal link condiviso, identica ma senza Aggiorna e Condividi.
import { useMemo, useState } from "react";
import { SearchX, X } from "lucide-react";
import { RefreshButton } from "@/components/refresh-button";
import { Condividi } from "./condividi";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/ui/native-select";
import type { DatiCliente } from "@/lib/data/cliente";
import { formatDataOra, formatNumero, formatPercentuale, formatValuta } from "@/lib/format";
import {
  calcolaClassifica,
  calcolaKpi,
  chiaveCampagna,
  filtraLead,
  filtraOpp,
  FILTRI_VUOTI,
  quantiFiltri,
  SENZA_CAMPAGNA,
  variazionePct,
  type Dimensione,
  type Filtri,
  type LeadRow,
  type OppRow,
} from "@/lib/metrics/dashboard";
import { formatGiorno } from "@/lib/period";
import { DataTable, funzioniTabella, type Colonna } from "./data-table";
import { FunnelPanel } from "./funnel-panel";
import { PannelloAds } from "./pannello-ads";
import { AnalisiPanel } from "./analisi-panel";
import type { Analisi } from "@/lib/analisi";
import { ProvenienzaPanel, type SchedaProvenienza } from "./ranking-panel";
import { SectionNav } from "./section-nav";
import { TrendPanel } from "./trend-panel";
import { Fonte, PannelloNumeri, Riquadro, type VoceNumero } from "./ui";
import { createColumnHelper } from "@tanstack/react-table";

// ---------------------------------------------------------------- colonne delle tabelle
type RigaContatto = LeadRow & { persona: NonNullable<LeadRow["persona"]> };
const hc = createColumnHelper<typeof funzioniTabella, RigaContatto>();
const colonneContatti: Colonna<RigaContatto>[] = hc.columns([
  hc.accessor((r) => r.persona.data, { id: "data", header: "Creato il", cell: (i) => formatDataOra(i.getValue()), sortFn: "alphanumeric" }),
  hc.accessor((r) => r.persona.nome, { id: "nome", header: "Nome", sortFn: "alphanumeric" }),
  hc.accessor((r) => r.persona.email, { id: "email", header: "Email", enableSorting: false }),
  hc.accessor((r) => r.persona.telefono, { id: "telefono", header: "Telefono", enableSorting: false }),
  hc.accessor("fonte", { header: "Fonte", sortFn: "alphanumeric" }),
  hc.accessor("canale", { header: "Canale", sortFn: "alphanumeric" }),
  hc.accessor((r) => r.campagna ?? "", { id: "campagna", header: "Campagna", sortFn: "alphanumeric", cell: (i) => i.getValue() || <span className="text-muted-foreground">senza</span> }),
  hc.accessor((r) => r.persona.annuncio, { id: "annuncio", header: "Annuncio", sortFn: "alphanumeric" }),
  hc.accessor((r) => r.tags.join(", "), { id: "tag", header: "Tag", enableSorting: false }),
]);

type RigaVendita = OppRow & { pipeline: string };
const hv = createColumnHelper<typeof funzioniTabella, RigaVendita>();
const creaColonneVendite = (valuta: string): Colonna<RigaVendita>[] => hv.columns([
  hv.accessor((r) => r.chiusa ?? "", { id: "chiusa", header: "Vinta il", cell: (i) => formatGiorno(i.getValue()), sortFn: "alphanumeric" }),
  hv.accessor((r) => r.nome ?? "", { id: "nome", header: "Opportunità", sortFn: "alphanumeric" }),
  hv.accessor("valore", { header: "Valore", sortFn: "basic", meta: { numerica: true }, cell: (i) => <span className="font-semibold">{formatValuta(i.getValue(), valuta)}</span> }),
  hv.accessor("pipeline", { header: "Pipeline", sortFn: "alphanumeric" }),
  hv.accessor("canale", { header: "Canale", sortFn: "alphanumeric" }),
  hv.accessor((r) => r.campagna ?? "", { id: "campagna", header: "Campagna", sortFn: "alphanumeric", cell: (i) => i.getValue() || <span className="text-muted-foreground">senza</span> }),
  hv.accessor("fonte", { header: "Fonte", sortFn: "alphanumeric" }),
]);

const SEZIONI = [
  { id: "numeri", label: "Numeri" },
  { id: "meta", label: "Campagne Meta" },
  { id: "linkedin", label: "Campagne LinkedIn" },
  { id: "analisi", label: "Analisi" },
  { id: "andamento", label: "Andamento" },
  { id: "provenienza", label: "Provenienza" },
  { id: "pipeline", label: "Pipeline" },
  { id: "vendite", label: "Vendite" },
  { id: "contatti", label: "Contatti" },
];

// ---------------------------------------------------------------- componente
export function ClientDashboard({
  dati,
  confronto,
  modo = "agenzia",
  analisi = [],
}: {
  dati: DatiCliente;
  confronto: boolean;
  modo?: "agenzia" | "condivisa";
  analisi?: Analisi[]; // analisi scritte da Claude: solo nella vista del titolare
}) {
  const { cliente, periodo, pipelines } = dati;
  const valuta = cliente.valuta;
  const [filtri, setFiltri] = useState<Filtri>(FILTRI_VUOTI);
  const [soloSenza, setSoloSenza] = useState(false);
  const colonneVendite = useMemo(() => creaColonneVendite(valuta), [valuta]);

  const giorni = useMemo(() => new Set(periodo.giorni), [periodo.giorni]);
  const giorniPrec = useMemo(() => new Set(periodo.giorniPrec), [periodo.giorniPrec]);
  const lead = useMemo(() => filtraLead(dati.lead, filtri), [dati.lead, filtri]);
  const opp = useMemo(() => filtraOpp(dati.opp, filtri), [dati.opp, filtri]);

  const kpi = calcolaKpi(lead, opp, giorni);
  const kpiPrec = calcolaKpi(lead, opp, giorniPrec);

  // Le classifiche ignorano il filtro della propria dimensione, così si possono scegliere più voci
  const classifica = (d: Dimensione) => {
    const senza = { ...filtri, [d]: [] };
    return calcolaClassifica(d, filtraLead(dati.lead, senza), filtraOpp(dati.opp, senza), giorni);
  };

  const nomiPipeline = useMemo(() => new Map(pipelines.map((p) => [p.id, p.name])), [pipelines]);
  // Pipeline dell'imbuto: quella filtrata, altrimenti quella con più opportunità create nel periodo
  const pipelineImbuto = useMemo(() => {
    if (filtri.pipeline) return filtri.pipeline;
    const conteggio = new Map<string, number>();
    for (const r of dati.opp) if (r.creata && giorni.has(r.creata)) conteggio.set(r.pipelineId, (conteggio.get(r.pipelineId) ?? 0) + 1);
    return [...conteggio.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? pipelines[0]?.id ?? "";
  }, [filtri.pipeline, dati.opp, giorni, pipelines]);

  const toggle = (d: Exclude<keyof Filtri, "pipeline">) => (chiave: string) =>
    setFiltri((f) => ({ ...f, [d]: f[d].includes(chiave) ? f[d].filter((x) => x !== chiave) : [...f[d], chiave] }));

  const contatti = useMemo(
    () => lead.filter((r): r is RigaContatto => !!r.persona && (!soloSenza || !r.attribuito)),
    [lead, soloSenza],
  );
  const vendite = useMemo(
    () =>
      opp
        .filter((r) => r.status === "won" && r.chiusa && giorni.has(r.chiusa))
        .map((r) => ({ ...r, pipeline: nomiPipeline.get(r.pipelineId) ?? "" })),
    [opp, giorni, nomiPipeline],
  );

  const prec = (n: number) => formatNumero(n);
  const numeri: VoceNumero[] = [
    { etichetta: "Lead", valore: formatNumero(kpi.lead), delta: variazionePct(kpi.lead, kpiPrec.lead), precedente: prec(kpiPrec.lead), spiegazione: "Contatti creati in GHL nel periodo" },
    { etichetta: "Da annunci Meta", valore: formatNumero(kpi.leadMeta), delta: variazionePct(kpi.leadMeta, kpiPrec.leadMeta), precedente: prec(kpiPrec.leadMeta), spiegazione: "Lead arrivati da annunci Facebook/Instagram (Paid Social)" },
    { etichetta: "Opportunità", valore: formatNumero(kpi.oppCreate), delta: variazionePct(kpi.oppCreate, kpiPrec.oppCreate), precedente: prec(kpiPrec.oppCreate), spiegazione: "Opportunità create in GHL nel periodo" },
    { etichetta: "Vinte", valore: formatNumero(kpi.vinte), delta: variazionePct(kpi.vinte, kpiPrec.vinte), precedente: prec(kpiPrec.vinte), spiegazione: "Opportunità chiuse come vinte nel periodo" },
    { etichetta: "Venduto", valore: formatValuta(kpi.venduto, valuta, kpi.venduto >= 100_000), valoreBreve: formatValuta(kpi.venduto, valuta, kpi.venduto >= 10_000), delta: variazionePct(kpi.venduto, kpiPrec.venduto), precedente: formatValuta(kpiPrec.venduto, valuta, true), spiegazione: "Valore delle opportunità vinte nel periodo" },
    { etichetta: "Tasso di chiusura", valore: formatPercentuale(kpi.tassoChiusura), delta: kpi.tassoChiusura !== null && kpiPrec.tassoChiusura !== null ? variazionePct(kpi.tassoChiusura, kpiPrec.tassoChiusura) : null, precedente: formatPercentuale(kpiPrec.tassoChiusura), spiegazione: "Vinte diviso (vinte + perse) nel periodo" },
  ];

  // Etichette leggibili per i filtri attivi
  const etichettaCampagna = (k: string) => {
    if (k === SENZA_CAMPAGNA) return "(senza campagna)";
    const r = [...dati.lead, ...dati.opp].find((x) => chiaveCampagna(x) === k);
    return r?.campagna ?? k;
  };
  const chips: { gruppo: string; etichetta: string; togli: () => void }[] = [
    ...filtri.canale.map((v) => ({ gruppo: "Canale", etichetta: v, togli: () => toggle("canale")(v) })),
    ...filtri.campagna.map((v) => ({ gruppo: "Campagna", etichetta: etichettaCampagna(v), togli: () => toggle("campagna")(v) })),
    ...filtri.fonte.map((v) => ({ gruppo: "Fonte", etichetta: v, togli: () => toggle("fonte")(v) })),
    ...filtri.tag.map((v) => ({ gruppo: "Tag", etichetta: v, togli: () => toggle("tag")(v) })),
    ...(filtri.pipeline
      ? [{ gruppo: "Pipeline", etichetta: nomiPipeline.get(filtri.pipeline) ?? "", togli: () => setFiltri((f) => ({ ...f, pipeline: null })) }]
      : []),
  ];

  const periodoTesto = `dal ${formatGiorno(periodo.daGiorno)} al ${formatGiorno(periodo.aGiorno)}`;
  const nomeFile = (tipo: string) =>
    `${tipo}-${cliente.nome.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}-${periodo.daGiorno}-${periodo.aGiorno}.csv`;

  const nessunDato = kpi.lead === 0 && kpi.oppCreate === 0 && kpi.vinte === 0 && kpi.perse === 0;
  const azzera = () => setFiltri(FILTRI_VUOTI);
  const schede: SchedaProvenienza[] = [
    { dimensione: "canale", etichetta: "Canali", aiuto: "Canale ricavato dall'attribuzione GHL", voci: classifica("canale"), selezionate: filtri.canale, vuoto: "Nessun canale nel periodo." },
    { dimensione: "campagna", etichetta: "Campagne", aiuto: "Campagna registrata su contatto e opportunità", voci: classifica("campagna"), selezionate: filtri.campagna, vuoto: "Nessuna campagna nel periodo." },
    { dimensione: "fonte", etichetta: "Fonti", aiuto: "Campo «Fonte» del contatto in GHL", voci: classifica("fonte"), selezionate: filtri.fonte, vuoto: "Nessuna fonte nel periodo." },
    { dimensione: "tag", etichetta: "Tag", aiuto: "Un contatto con più tag conta in ognuno", voci: classifica("tag"), selezionate: filtri.tag, vuoto: "Nessun tag sui contatti del periodo." },
  ];

  return (
    <div className="flex animate-entra flex-col gap-section">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-title">{cliente.nome}</h1>
          <p className="mt-1.5 max-w-[75ch] text-body text-muted-foreground">
            Periodo {periodoTesto}
            {confronto && `, confrontato con il periodo dal ${formatGiorno(periodo.daGiornoPrec)} al ${formatGiorno(periodo.aGiornoPrec)}`}. Giorni contati nel fuso {cliente.fuso}.
          </p>
        </div>
        {modo === "agenzia" && (
          <div className="flex flex-wrap gap-2">
            <Condividi locationId={cliente.locationId} nome={cliente.nome} />
            <RefreshButton locationId={cliente.locationId} />
          </div>
        )}
      </header>

      <SectionNav
        // Nella pagina condivisa niente analisi e niente Meta o LinkedIn senza account associati
        sezioni={SEZIONI.filter((s) => {
          if (modo !== "condivisa") return true;
          return s.id !== "analisi" && !((s.id === "meta" || s.id === "linkedin") && dati[s.id].stato === "non-associato");
        })}
        sottoBarra={modo === "agenzia"}
      />

      {/* Filtri della pagina */}
      <div className="-mt-4 flex flex-wrap items-center gap-2 rounded-panel bg-card px-4 py-3 shadow-card">
        <span className="text-label text-titolo">Filtra per</span>
        <NativeSelect
          value={filtri.pipeline ?? ""}
          onChange={(e) => setFiltri((f) => ({ ...f, pipeline: e.target.value || null }))}
          aria-label="Pipeline"
          className="h-9 max-w-64"
        >
          <option value="">Tutte le pipeline</option>
          {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </NativeSelect>
        {chips.length === 0 ? (
          <span className="text-sm text-muted-foreground">oppure clicca una voce in «Da dove arrivano lead e vendite».</span>
        ) : (
          <ul className="flex flex-wrap gap-2" aria-label="Filtri attivi">
            {chips.map((c, i) => (
              <li key={c.gruppo + c.etichetta} className="entra-a-scaletta" style={{ "--i": i } as React.CSSProperties}>
                <button
                  type="button"
                  onClick={c.togli}
                  className="inline-flex h-8 max-w-72 items-center gap-1.5 rounded-control bg-brand pl-3 pr-2 text-sm font-semibold text-brand-ink transition-colors motion-fast hover:bg-brand-hover pointer-coarse:h-10"
                  aria-label={`Togli il filtro ${c.gruppo}: ${c.etichetta}`}
                >
                  <span className="truncate">{c.gruppo}: {c.etichetta}</span>
                  <X className="size-4 shrink-0" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        {quantiFiltri(filtri) > 0 && (
          <Button variant="ghost" size="sm" className="ml-auto" onClick={azzera} data-scorciatoia="azzera" aria-keyshortcuts="X">
            Azzera filtri
          </Button>
        )}
      </div>

      {nessunDato && quantiFiltri(filtri) > 0 && (
        <Alert variant="warning">
          <SearchX aria-hidden />
          <AlertTitle>Nessun dato con questi filtri</AlertTitle>
          <AlertDescription>Nel periodo non ci sono lead né opportunità che corrispondono a tutti i filtri scelti.</AlertDescription>
          <AlertAction>
            <Button size="sm" onClick={azzera}>Azzera filtri</Button>
          </AlertAction>
        </Alert>
      )}

      <div id="numeri" className="flex scroll-mt-32 flex-col gap-2">
        <PannelloNumeri voci={numeri} confronto={confronto} />
        <Fonte aggiornatoIl={dati.aggiornatoIl}>
          Fonte GoHighLevel, periodo {periodoTesto}. Lead e opportunità si contano alla data di creazione; vinte, venduto e tasso
          di chiusura alla data in cui l&apos;opportunità è stata chiusa.
        </Fonte>
      </div>

      <PannelloAds dati={dati} confronto={confronto} modo={modo} piattaforma="meta" />

      <PannelloAds dati={dati} confronto={confronto} modo={modo} piattaforma="linkedin" />

      {modo === "agenzia" && <AnalisiPanel analisi={analisi} locationId={cliente.locationId} nomeCliente={cliente.nome} />}

      <TrendPanel id="andamento" lead={lead} opp={opp} giorni={periodo.giorni} giorniPrec={periodo.giorniPrec} confronto={confronto} valuta={valuta} />

      <ProvenienzaPanel id="provenienza" schede={schede} onToggle={(d, k) => toggle(d)(k)} valuta={valuta} />

      <FunnelPanel
        id="pipeline"
        pipelines={pipelines}
        pipelineId={pipelineImbuto}
        onPipeline={(id) => setFiltri((f) => ({ ...f, pipeline: id }))}
        opp={opp}
        giorni={giorni}
        aperte={dati.aperte[pipelineImbuto] ?? {}}
        valuta={valuta}
      />

      <Riquadro id="vendite" titolo="Vendite del periodo" descrizione={`Opportunità vinte ${periodoTesto}, con i filtri attivi.`}>
        <DataTable
          dati={vendite}
          colonne={colonneVendite}
          ordinamento={[{ id: "chiusa", desc: true }]}
          cercabili={["nome", "pipeline", "canale", "campagna", "fonte"]}
          segnapostoRicerca="Cerca opportunità, campagna, fonte…"
          vuoto={quantiFiltri(filtri) > 0 ? "Nessuna vendita con questi filtri. Prova ad azzerarli." : "Nessuna opportunità vinta in questo periodo. Prova un periodo più lungo."}
          perPagina={10}
          csv={{
            nomeFile: nomeFile("vendite"),
            intestazione: ["Vinta il", "Opportunità", "Valore", "Pipeline", "Canale", "Campagna", "Fonte"],
            riga: (r) => [formatGiorno(r.chiusa ?? ""), r.nome ?? "", r.valore, r.pipeline, r.canale, r.campagna ?? "", r.fonte],
          }}
        />
      </Riquadro>

      <Riquadro
        id="contatti"
        titolo="Contatti del periodo"
        descrizione="Nomi, email e telefoni compaiono solo qui e l'app non li salva. Il CSV si scarica sul tuo computer."
      >
        <DataTable
          key={soloSenza ? "senza" : "tutti"}
          dati={contatti}
          colonne={colonneContatti}
          ordinamento={[{ id: "data", desc: true }]}
          cercabili={["nome", "email", "telefono", "fonte", "canale", "campagna", "annuncio", "tag"]}
          segnapostoRicerca="Cerca nome, email, telefono, campagna…"
          vuoto={soloSenza ? "Tutti i contatti del periodo hanno una campagna." : "Nessun contatto con questi filtri."}
          strumenti={
            <label className="flex items-center gap-2.5 text-sm font-medium text-titolo">
              <Switch checked={soloSenza} onCheckedChange={setSoloSenza} />
              Solo senza campagna
            </label>
          }
          csv={{
            nomeFile: nomeFile("contatti"),
            intestazione: ["Creato il", "Nome", "Email", "Telefono", "Fonte", "Canale", "Campagna", "Gruppo di inserzioni", "Annuncio", "Tag"],
            riga: (r) => [formatDataOra(r.persona.data), r.persona.nome, r.persona.email, r.persona.telefono, r.fonte, r.canale, r.campagna ?? "", r.persona.gruppo, r.persona.annuncio, r.tags.join(", ")],
          }}
        />
      </Riquadro>
    </div>
  );
}
