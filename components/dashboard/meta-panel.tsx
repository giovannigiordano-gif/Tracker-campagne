"use client";
// Sezione "Campagne Meta" della dashboard cliente: criticità, numeri chiave, andamento e tabella per campagna.
// Fonti: Meta (spesa, impression, clic, lead secondo Meta) e GoHighLevel (lead, opportunità e vendite arrivati
// dal canale Meta Ads, abbinati alle campagne per ID). Non dipende dai filtri della pagina.
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
import { useRiduciMovimento } from "@/lib/use-riduci-movimento";
import { cn } from "@/lib/utils";
import { DataTable, funzioniTabella, type Colonna } from "./data-table";
import { Delta, Fonte, Riquadro } from "./ui";

const STATI_CAMPAGNA: Record<string, string> = {
  ACTIVE: "Attiva",
  PAUSED: "In pausa",
  CAMPAIGN_PAUSED: "In pausa",
  ARCHIVED: "Archiviata",
  DELETED: "Eliminata",
  IN_PROCESS: "In elaborazione",
  WITH_ISSUES: "Con problemi",
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
  fonte: "Meta" | "GHL" | "Meta + GHL";
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-block bg-muted px-4 py-3">
      <dt className="flex items-baseline justify-between gap-2 text-caption text-muted-foreground">
        <span>{etichetta}</span>
        <span className="text-[0.6875rem]">{fonte}</span>
      </dt>
      <dd className="truncate text-xl leading-tight font-black tracking-tight text-titolo">{valore}</dd>
      {delta !== undefined && (
        <dd className="text-xs">
          <Delta pct={delta} inversa={inversa} neutra={neutra} />
        </dd>
      )}
    </div>
  );
}

const asse = { tickLine: false, axisLine: false, tick: { fill: "var(--muted-foreground)", fontSize: 12 } } as const;

export function MetaPanel({ dati, confronto, modo }: { dati: DatiCliente; confronto: boolean; modo: "agenzia" | "condivisa" }) {
  const riduci = useRiduciMovimento();
  const { meta, periodo, lead, opp, obiettivoCpl } = dati;
  const valuta = dati.cliente.valuta;
  const fmt = (n: number | null) => (n === null ? "n.d." : formatValuta(n, valuta));

  const calcoli = useMemo(() => {
    if (meta.stato !== "ok") return null;
    const g = new Set(periodo.giorni);
    const gp = new Set(periodo.giorniPrec);
    const km = kpiMeta(meta.dati.righe, g);
    const kmPrec = kpiMeta(meta.dati.righe, gp);
    return {
      km,
      kmPrec,
      inc: kpiIncrocio(km.spesa, lead, opp, g),
      incPrec: kpiIncrocio(kmPrec.spesa, lead, opp, gp),
      campagne: righeCampagne(meta.dati, lead, opp, g),
      serie: serieGiornaliera(meta.dati.righe, lead, periodo.giorni),
      criticita: calcolaCriticita({
        meta: meta.dati,
        lead,
        giorni: periodo.giorni,
        giorniPrec: periodo.giorniPrec,
        obiettivoCpl: obiettivoCpl ?? undefined,
        valuta,
      }),
    };
  }, [meta, periodo, lead, opp, obiettivoCpl, valuta]);

  const colonne = useMemo(() => {
    const h = createColumnHelper<typeof funzioniTabella, RigaCampagna>();
    const num = (f: (r: RigaCampagna) => number | null) => (r: RigaCampagna) => f(r) ?? -1;
    const soldi = (v: number | null) => (v === null || v < 0 ? "n.d." : formatValuta(v, valuta));
    return h.columns([
      h.accessor("nome", {
        header: "Campagna",
        sortFn: "alphanumeric",
        cell: (i) => (
          <span className="flex min-w-48 flex-col whitespace-normal">
            <span className={cn("font-semibold text-titolo", i.row.original.id === SENZA_CAMPAGNA_META && "font-medium italic")}>{i.getValue()}</span>
            {i.row.original.stato && <span className="text-caption text-muted-foreground">{STATI_CAMPAGNA[i.row.original.stato] ?? i.row.original.stato}</span>}
          </span>
        ),
      }),
      h.accessor("spesa", { header: "Spesa", sortFn: "basic", meta: { numerica: true }, cell: (i) => <span className="font-semibold">{soldi(i.getValue())}</span> }),
      h.accessor("leadMeta", { header: "Lead Meta", sortFn: "basic", meta: { numerica: true }, cell: (i) => formatNumero(i.getValue()) }),
      h.accessor("leadGhl", { header: "Lead GHL", sortFn: "basic", meta: { numerica: true }, cell: (i) => <span className="font-semibold">{formatNumero(i.getValue())}</span> }),
      h.accessor(num((r) => r.cplReale), { id: "cpl", header: "Costo per lead reale", sortFn: "basic", meta: { numerica: true }, cell: (i) => soldi(i.row.original.cplReale) }),
      h.accessor("opportunita", { header: "Opportunità", sortFn: "basic", meta: { numerica: true }, cell: (i) => formatNumero(i.getValue()) }),
      h.accessor("vinte", { header: "Vendite", sortFn: "basic", meta: { numerica: true }, cell: (i) => formatNumero(i.getValue()) }),
      h.accessor(num((r) => r.roas), { id: "roas", header: "ROAS CRM", sortFn: "basic", meta: { numerica: true }, cell: (i) => (i.row.original.roas === null ? "n.d." : `${i.row.original.roas.toFixed(1).replace(".", ",")}x`) }),
      h.accessor(num((r) => r.ctr), { id: "ctr", header: "CTR", sortFn: "basic", meta: { numerica: true }, cell: (i) => formatPercentuale(i.row.original.ctr) }),
      h.accessor(num((r) => r.cpc), { id: "cpc", header: "Costo per clic", sortFn: "basic", meta: { numerica: true }, cell: (i) => soldi(i.row.original.cpc) }),
    ]) as Colonna<RigaCampagna>[];
  }, [valuta]);

  const descrizione = "Spesa e risultati da Meta, incrociati con i lead, le opportunità e le vendite arrivati in GHL dal canale Meta Ads. Non dipende dai filtri della pagina.";

  // ---------------------------------------------------------------- stati senza dati
  if (meta.stato === "non-associato") {
    if (modo === "condivisa") return null;
    return (
      <Riquadro id="meta" titolo="Campagne Meta" descrizione={descrizione}>
        <div className="flex flex-col items-start gap-3 rounded-block bg-muted p-4 text-sm">
          <p>Nessun account pubblicitario Meta associato a questo cliente.</p>
          <Link href="/impostazioni" className={buttonVariants({ variant: "outline", size: "sm" })}>Associa un account in Impostazioni</Link>
        </div>
      </Riquadro>
    );
  }
  if (meta.stato === "errore" || !calcoli) {
    return (
      <Riquadro id="meta" titolo="Campagne Meta" descrizione={descrizione}>
        <div className="flex flex-col items-start gap-3 rounded-block bg-warning-soft p-4 text-sm" role="status">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            {modo === "condivisa" ? "Dati delle campagne non disponibili in questo momento." : meta.stato === "errore" ? meta.messaggio : "Dati non disponibili."}
          </p>
          {modo === "agenzia" && meta.stato === "errore" && (meta.tipo === "scaduto" || meta.tipo === "non-collegato") && (
            <Link href="/impostazioni#meta-ads" className={buttonVariants({ size: "sm" })}>Apri Impostazioni</Link>
          )}
        </div>
      </Riquadro>
    );
  }

  const { km, kmPrec, inc, incPrec, campagne, serie, criticita } = calcoli;
  const d = (a: number | null, b: number | null) => (confronto && a !== null && b !== null ? variazionePct(a, b) : undefined);
  const errori = meta.stato === "ok" ? meta.dati.errori : [];

  return (
    <Riquadro id="meta" titolo="Campagne Meta" descrizione={descrizione}>
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

      <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Numero etichetta="Spesa" fonte="Meta" valore={fmt(km.spesa)} delta={d(km.spesa, kmPrec.spesa)} neutra />
        <Numero etichetta="Lead secondo Meta" fonte="Meta" valore={formatNumero(km.leadMeta)} delta={d(km.leadMeta, kmPrec.leadMeta)} />
        <Numero etichetta="Lead arrivati in GHL" fonte="GHL" valore={formatNumero(inc.leadGhl)} delta={d(inc.leadGhl, incPrec.leadGhl)} />
        <Numero etichetta="Costo per lead reale" fonte="Meta + GHL" valore={fmt(inc.cplReale)} delta={d(inc.cplReale, incPrec.cplReale)} inversa />
        <Numero etichetta="Costo per lead di Meta" fonte="Meta" valore={fmt(km.cplMeta)} delta={d(km.cplMeta, kmPrec.cplMeta)} inversa />
        <Numero etichetta="Opportunità da Meta" fonte="GHL" valore={formatNumero(inc.opportunita)} delta={d(inc.opportunita, incPrec.opportunita)} />
        <Numero etichetta="Costo per vendita" fonte="Meta + GHL" valore={fmt(inc.costoVendita)} delta={d(inc.costoVendita, incPrec.costoVendita)} inversa />
        <Numero
          etichetta="ROAS dal CRM"
          fonte="Meta + GHL"
          valore={inc.roas === null ? "n.d." : `${inc.roas.toFixed(1).replace(".", ",")}x`}
          delta={d(inc.roas, incPrec.roas)}
        />
      </dl>

      {/* Due grafici affiancati invece di uno a due scale: spesa e lead non si confondono */}
      <div className="grid gap-4 md:grid-cols-2">
        <figure className="flex flex-col gap-2">
          <figcaption className="text-label text-titolo">Spesa al giorno</figcaption>
          <div className="h-48" role="img" aria-label={`Spesa giornaliera su Meta: totale ${fmt(km.spesa)} nel periodo`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap={2}>
                <CartesianGrid vertical={false} stroke="var(--viz-griglia)" />
                <XAxis dataKey="giorno" tickFormatter={formatGiornoBreve} minTickGap={28} {...asse} />
                <YAxis width={56} tickFormatter={(v: number) => formatValuta(v, valuta, true)} {...asse} />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload as (typeof serie)[number] | undefined;
                    if (!active || !p) return null;
                    return (
                      <div className="superficie-inversa rounded-block bg-inverse px-3 py-2 text-xs text-inverse-foreground shadow-overlay">
                        {formatGiornoBreve(p.giorno)}: <span className="font-bold">{fmt(p.spesa)}</span>
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
          <figcaption className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-label text-titolo">Lead al giorno</span>
            <span className="flex items-center gap-3 text-caption text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[var(--viz-attuale)]" aria-hidden />arrivati in GHL</span>
              <span className="flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed border-[var(--viz-resto)]" aria-hidden />secondo Meta</span>
            </span>
          </figcaption>
          <div className="h-48" role="img" aria-label={`Lead al giorno: ${inc.leadGhl} arrivati in GHL e ${km.leadMeta} secondo Meta nel periodo`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--viz-griglia)" />
                <XAxis dataKey="giorno" tickFormatter={formatGiornoBreve} minTickGap={28} {...asse} />
                <YAxis width={32} allowDecimals={false} {...asse} />
                <Tooltip
                  cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload as (typeof serie)[number] | undefined;
                    if (!active || !p) return null;
                    return (
                      <div className="superficie-inversa rounded-block bg-inverse px-3 py-2 text-xs text-inverse-foreground shadow-overlay">
                        <div className="font-bold">{formatGiornoBreve(p.giorno)}</div>
                        <div>arrivati in GHL: {p.leadGhl}</div>
                        <div className="text-inverse-muted">secondo Meta: {p.leadMeta}</div>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="leadMeta" stroke="var(--viz-resto)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={!riduci} animationDuration={300} />
                <Line type="monotone" dataKey="leadGhl" stroke="var(--viz-attuale)" strokeWidth={2} dot={false} isAnimationActive={!riduci} animationDuration={300} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>
      </div>

      <section aria-label="Campagne" className="flex flex-col gap-2">
        <h3 className="text-label text-titolo">Campagne del periodo ({campagne.length})</h3>
        <DataTable
          dati={campagne}
          colonne={colonne}
          ordinamento={[{ id: "spesa", desc: true }]}
          cercabili={["nome"]}
          segnapostoRicerca="Cerca una campagna…"
          vuoto="Nessuna campagna con spesa o lead nel periodo."
          csv={{
            nomeFile: `campagne-meta-${dati.cliente.nome}`,
            intestazione: ["Campagna", "Stato", "Spesa", "Lead Meta", "Lead GHL", "Costo per lead reale", "Opportunità", "Vendite", "Venduto", "ROAS CRM", "CTR %", "Costo per clic"],
            riga: (r) => [r.nome, r.stato ?? "", r.spesa.toFixed(2), r.leadMeta, r.leadGhl, r.cplReale?.toFixed(2) ?? "", r.opportunita, r.vinte, r.venduto.toFixed(2), r.roas?.toFixed(2) ?? "", r.ctr?.toFixed(2) ?? "", r.cpc?.toFixed(2) ?? ""],
          }}
        />
      </section>

      <Fonte aggiornatoIl={meta.stato === "ok" ? meta.dati.aggiornatoIl : null}>
        Fonte Meta (spesa, impression, clic, lead secondo Meta; giorni nel fuso dell&apos;account pubblicitario) e GoHighLevel (lead,
        opportunità e vendite con canale Meta Ads, abbinati alle campagne per ID). Periodo {formatGiornoBreve(periodo.daGiorno)} -{" "}
        {formatGiornoBreve(periodo.aGiorno)}.
        {errori.length > 0 && modo === "agenzia" && ` Account non letti: ${errori.join("; ")}.`}
      </Fonte>
    </Riquadro>
  );
}
