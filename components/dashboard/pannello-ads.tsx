"use client";
// Sezioni "Campagne Meta" e "Campagne LinkedIn" della dashboard cliente: criticità, numeri chiave, andamento e
// tabella per campagna. Stesso pannello per le due piattaforme (lib/metrics/piattaforme.ts).
// Fonti: la piattaforma (spesa, impression, clic) e GoHighLevel (lead, opportunità e vendite arrivati dal canale
// della piattaforma, abbinati alle campagne). Non dipende dai filtri della pagina.
import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, CircleAlert } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createColumnHelper } from "@tanstack/react-table";
import { buttonVariants } from "@/components/ui/button";
import type { DatiCliente } from "@/lib/data/cliente";
import { formatGiornoBreve, formatNumero, formatPercentuale, formatValuta } from "@/lib/format";
import { calcolaCriticita } from "@/lib/metrics/criticita";
import { variazionePct } from "@/lib/metrics/dashboard";
import { kpiIncrocio, kpiMeta, righeCampagne, serieGiornaliera, SENZA_CAMPAGNA_META, type RigaCampagna } from "@/lib/metrics/meta";
import { opzioniIncrocio, PIATTAFORME, type IdPiattaforma } from "@/lib/metrics/piattaforme";
import { useRiduciMovimento } from "@/lib/use-riduci-movimento";
import { cn } from "@/lib/utils";
import { DataTable, funzioniTabella, type Colonna } from "./data-table";
import { Delta, Fonte, Riquadro } from "./ui";

// Stati delle campagne di Meta (effective_status) e di LinkedIn (status)
const STATI_CAMPAGNA: Record<string, string> = {
  ACTIVE: "Attiva",
  PAUSED: "In pausa",
  CAMPAIGN_PAUSED: "In pausa",
  ARCHIVED: "Archiviata",
  DELETED: "Eliminata",
  IN_PROCESS: "In elaborazione",
  WITH_ISSUES: "Con problemi",
  COMPLETED: "Conclusa",
  CANCELED: "Annullata",
  DRAFT: "Bozza",
  PENDING_DELETION: "In eliminazione",
  REMOVED: "Rimossa",
};

function Numero({
  etichetta,
  valore,
  delta,
  inversa = false,
  neutra = false,
  fonte,
}: {
  etichetta: string;
  valore: string;
  delta?: number | null;
  inversa?: boolean; // per i costi: salire è un peggioramento
  neutra?: boolean; // né buono né cattivo (la spesa): variazione in grigio
  fonte: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 bg-card px-4 py-3.5">
      <dt className="flex items-baseline justify-between gap-2 text-caption text-muted-foreground">
        <span>{etichetta}</span>
        <span className="text-[0.6875rem]">{fonte}</span>
      </dt>
      <dd className="truncate text-numero text-titolo">{valore}</dd>
      {delta !== undefined && (
        <dd className="text-xs">
          <Delta pct={delta} inversa={inversa} neutra={neutra} />
        </dd>
      )}
    </div>
  );
}

const asse = { tickLine: false, axisLine: false, tick: { fill: "var(--muted-foreground)", fontSize: 12 } } as const;

export function PannelloAds({
  dati,
  confronto,
  modo,
  piattaforma: idPiattaforma,
}: {
  dati: DatiCliente;
  confronto: boolean;
  modo: "agenzia" | "condivisa";
  piattaforma: IdPiattaforma;
}) {
  const riduci = useRiduciMovimento();
  const p = PIATTAFORME[idPiattaforma];
  const esito = dati[idPiattaforma];
  const { periodo, lead, opp, obiettivoCpl } = dati;
  const valuta = dati.cliente.valuta;
  const fmt = (n: number | null) => (n === null ? "n.d." : formatValuta(n, valuta));

  const calcoli = useMemo(() => {
    if (esito.stato !== "ok") return null;
    const g = new Set(periodo.giorni);
    const gp = new Set(periodo.giorniPrec);
    const opz = opzioniIncrocio(p, esito.dati);
    const km = kpiMeta(esito.dati.righe, g);
    const kmPrec = kpiMeta(esito.dati.righe, gp);
    return {
      km,
      kmPrec,
      inc: kpiIncrocio(km.spesa, lead, opp, g, opz.canale),
      incPrec: kpiIncrocio(kmPrec.spesa, lead, opp, gp, opz.canale),
      campagne: righeCampagne(esito.dati, lead, opp, g, opz),
      serie: serieGiornaliera(esito.dati.righe, lead, periodo.giorni, opz.canale),
      criticita: calcolaCriticita({
        meta: esito.dati,
        lead,
        giorni: periodo.giorni,
        giorniPrec: periodo.giorniPrec,
        obiettivoCpl: obiettivoCpl ?? undefined,
        valuta,
        ...opz,
      }),
    };
  }, [esito, p, periodo, lead, opp, obiettivoCpl, valuta]);

  const colonne = useMemo(() => {
    const h = createColumnHelper<typeof funzioniTabella, RigaCampagna>();
    const num = (f: (r: RigaCampagna) => number | null) => (r: RigaCampagna) => f(r) ?? -1;
    const soldi = (v: number | null) => (v === null || v < 0 ? "n.d." : formatValuta(v, valuta));
    return h.columns([
      h.accessor("nome", {
        header: p.tabella.colonna,
        sortFn: "alphanumeric",
        cell: (i) => (
          <span className="flex min-w-48 flex-col whitespace-normal">
            <span className={cn("font-semibold text-titolo", i.row.original.id === SENZA_CAMPAGNA_META && "font-medium italic")}>{i.getValue()}</span>
            {i.row.original.stato && <span className="text-caption text-muted-foreground">{STATI_CAMPAGNA[i.row.original.stato] ?? i.row.original.stato}</span>}
          </span>
        ),
      }),
      h.accessor("spesa", { header: "Spesa", sortFn: "basic", meta: { numerica: true }, cell: (i) => <span className="font-semibold">{soldi(i.getValue())}</span> }),
      h.accessor("leadGhl", { header: "Lead", sortFn: "basic", meta: { numerica: true }, cell: (i) => <span className="font-semibold">{formatNumero(i.getValue())}</span> }),
      h.accessor(num((r) => r.cplReale), { id: "cpl", header: "Costo per lead", sortFn: "basic", meta: { numerica: true }, cell: (i) => soldi(i.row.original.cplReale) }),
      h.accessor("opportunita", { header: "Opportunità", sortFn: "basic", meta: { numerica: true }, cell: (i) => formatNumero(i.getValue()) }),
      h.accessor("vinte", { header: "Vendite", sortFn: "basic", meta: { numerica: true }, cell: (i) => formatNumero(i.getValue()) }),
      h.accessor(num((r) => r.roas), { id: "roas", header: "ROAS CRM", sortFn: "basic", meta: { numerica: true }, cell: (i) => (i.row.original.roas === null ? "n.d." : `${i.row.original.roas.toFixed(1).replace(".", ",")}x`) }),
      h.accessor(num((r) => r.ctr), { id: "ctr", header: "CTR", sortFn: "basic", meta: { numerica: true }, cell: (i) => formatPercentuale(i.row.original.ctr) }),
      h.accessor(num((r) => r.cpc), { id: "cpc", header: "Costo per clic", sortFn: "basic", meta: { numerica: true }, cell: (i) => soldi(i.row.original.cpc) }),
    ]) as Colonna<RigaCampagna>[];
  }, [valuta, p]);

  const descrizione = `Spesa e risultati da ${p.nome}, incrociati con i lead, le opportunità e le vendite arrivati in GHL dal canale ${p.canale}. Non dipende dai filtri della pagina.`;
  const fonteIncrocio = `${p.nome} + GHL`;

  // ---------------------------------------------------------------- stati senza dati
  if (esito.stato === "non-associato") {
    // Il cliente che guarda il link condiviso non vede sezioni vuote; il titolare sì, con il passo da fare
    if (modo === "condivisa") return null;
    return (
      <Riquadro id={p.id} titolo={p.titolo} descrizione={descrizione}>
        <div className="flex flex-col items-start gap-3 text-sm">
          <p>
            Nessun account pubblicitario {p.nome} associato a questo cliente. In Impostazioni collega {p.nome} Ads, poi scegli
            l&apos;account nella scheda del cliente.
          </p>
          <Link href={p.impostazioni} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Apri Impostazioni
          </Link>
        </div>
      </Riquadro>
    );
  }
  if (esito.stato === "errore" || !calcoli) {
    return (
      <Riquadro id={p.id} titolo={p.titolo} descrizione={descrizione}>
        <div className="flex flex-col items-start gap-3 rounded-block bg-warning-soft p-4 text-sm" role="status">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            {modo === "condivisa" ? "Dati delle campagne non disponibili in questo momento." : esito.stato === "errore" ? esito.messaggio : "Dati non disponibili."}
          </p>
          {modo === "agenzia" && esito.stato === "errore" && (esito.tipo === "scaduto" || esito.tipo === "non-collegato") && (
            <Link href={p.impostazioni} className={buttonVariants({ size: "sm" })}>Apri Impostazioni</Link>
          )}
        </div>
      </Riquadro>
    );
  }

  const { km, kmPrec, inc, incPrec, campagne, serie, criticita } = calcoli;
  const d = (a: number | null, b: number | null) => (confronto && a !== null && b !== null ? variazionePct(a, b) : undefined);
  const errori = esito.stato === "ok" ? esito.dati.errori : [];

  return (
    <Riquadro id={p.id} titolo={p.titolo} descrizione={descrizione}>
      {/* Criticità: solo per l'agenzia (sono note di lavoro, non per il cliente) */}
      {modo === "agenzia" && criticita.length > 0 && (
        <section aria-label="Criticità" className="flex flex-col gap-2">
          <h3 className="text-label text-titolo">Da controllare ({criticita.length})</h3>
          <ul className="flex flex-col gap-1.5">
            {criticita.map((c) => (
              <li
                key={c.tipo + c.testo}
                className={cn("flex items-start gap-2 rounded-block px-3 py-2 text-sm", c.livello === "errore" ? "bg-danger-soft" : "bg-warning-soft")}
              >
                {c.livello === "errore" ? (
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-label="Problema" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-label="Attenzione" />
                )}
                <span>{c.testo}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Numeri in una griglia divisa da fili sottili, come i riepiloghi delle app Apple (niente schede dentro la scheda) */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-block bg-border ring-1 ring-border md:grid-cols-3">
        <Numero etichetta="Spesa" fonte={p.nome} valore={fmt(km.spesa)} delta={d(km.spesa, kmPrec.spesa)} neutra />
        <Numero etichetta={`Lead da ${p.nome}`} fonte="GHL" valore={formatNumero(inc.leadGhl)} delta={d(inc.leadGhl, incPrec.leadGhl)} />
        <Numero etichetta="Costo per lead" fonte={fonteIncrocio} valore={fmt(inc.cplReale)} delta={d(inc.cplReale, incPrec.cplReale)} inversa />
        <Numero etichetta={`Opportunità da ${p.nome}`} fonte="GHL" valore={formatNumero(inc.opportunita)} delta={d(inc.opportunita, incPrec.opportunita)} />
        <Numero etichetta="Costo per vendita" fonte={fonteIncrocio} valore={fmt(inc.costoVendita)} delta={d(inc.costoVendita, incPrec.costoVendita)} inversa />
        <Numero
          etichetta="ROAS dal CRM"
          fonte={fonteIncrocio}
          valore={inc.roas === null ? "n.d." : `${inc.roas.toFixed(1).replace(".", ",")}x`}
          delta={d(inc.roas, incPrec.roas)}
        />
      </dl>

      {/* Due grafici affiancati invece di uno a due scale: spesa e lead non si confondono */}
      <div className="grid gap-4 md:grid-cols-2">
        <figure className="flex flex-col gap-2">
          <figcaption className="text-label text-titolo">Spesa al giorno</figcaption>
          <div className="h-48" role="img" aria-label={`Spesa giornaliera su ${p.nome}: totale ${fmt(km.spesa)} nel periodo`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap={2}>
                <CartesianGrid vertical={false} stroke="var(--viz-griglia)" />
                <XAxis dataKey="giorno" tickFormatter={formatGiornoBreve} minTickGap={28} {...asse} />
                <YAxis width={56} tickFormatter={(v: number) => formatValuta(v, valuta, true)} {...asse} />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  content={({ active, payload }) => {
                    const punto = payload?.[0]?.payload as (typeof serie)[number] | undefined;
                    if (!active || !punto) return null;
                    return (
                      <div className="hud px-3 py-2 text-xs">
                        {formatGiornoBreve(punto.giorno)}: <span className="font-semibold">{fmt(punto.spesa)}</span>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="spesa" fill="var(--viz-barra)" radius={[4, 4, 0, 0]} isAnimationActive={!riduci} animationDuration={300} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </figure>
        <figure className="flex flex-col gap-2">
          <figcaption className="text-label text-titolo">Lead al giorno da {p.nome}</figcaption>
          <div className="h-48" role="img" aria-label={`Lead al giorno arrivati in GHL dal canale ${p.canale}: ${inc.leadGhl} nel periodo`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--viz-griglia)" />
                <XAxis dataKey="giorno" tickFormatter={formatGiornoBreve} minTickGap={28} {...asse} />
                <YAxis width={32} allowDecimals={false} {...asse} />
                <Tooltip
                  cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    const punto = payload?.[0]?.payload as (typeof serie)[number] | undefined;
                    if (!active || !punto) return null;
                    return (
                      <div className="hud px-3 py-2 text-xs">
                        {formatGiornoBreve(punto.giorno)}: <span className="font-semibold">{punto.leadGhl} lead</span>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="leadGhl" stroke="var(--viz-attuale)" strokeWidth={2} dot={false} isAnimationActive={!riduci} animationDuration={300} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>
      </div>

      <section aria-label={p.tabella.titolo} className="flex flex-col gap-2">
        <h3 className="text-label text-titolo">
          {p.tabella.titolo} ({campagne.length})
        </h3>
        <DataTable
          dati={campagne}
          colonne={colonne}
          ordinamento={[{ id: "spesa", desc: true }]}
          cercabili={["nome"]}
          segnapostoRicerca={p.tabella.cerca}
          vuoto={p.tabella.vuoto}
          csv={{
            nomeFile: `campagne-${p.id}-${dati.cliente.nome}`,
            intestazione: [p.tabella.colonna, "Stato", "Spesa", "Lead", "Costo per lead", "Opportunità", "Vendite", "Venduto", "ROAS CRM", "CTR %", "Costo per clic"],
            riga: (r) => [r.nome, r.stato ?? "", r.spesa.toFixed(2), r.leadGhl, r.cplReale?.toFixed(2) ?? "", r.opportunita, r.vinte, r.venduto.toFixed(2), r.roas?.toFixed(2) ?? "", r.ctr?.toFixed(2) ?? "", r.cpc?.toFixed(2) ?? ""],
          }}
        />
      </section>

      <Fonte aggiornatoIl={esito.stato === "ok" ? esito.dati.aggiornatoIl : null}>
        Fonte {p.nome} (spesa, impression, clic; {p.giorniUtc ? "giorni in UTC" : "giorni nel fuso dell'account pubblicitario"}) e GoHighLevel
        (lead, opportunità e vendite con canale {p.canale}, abbinati {p.perNome ? "ai gruppi di annunci per ID o nome in utm_campaign" : "alle campagne per ID"}).
        {p.perNome && " In Campaign Manager le righe sono i «gruppi di annunci» (l'API di LinkedIn li chiama ancora campagne)."}
        Periodo {formatGiornoBreve(periodo.daGiorno)} - {formatGiornoBreve(periodo.aGiorno)}.
        {errori.length > 0 && modo === "agenzia" && ` Account non letti: ${errori.join("; ")}.`}
      </Fonte>
    </Riquadro>
  );
}
