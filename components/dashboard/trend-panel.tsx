"use client";
// Andamento nel tempo: lead, opportunità, vinte o venduto, per giorno o per settimana.
// Linea piena = periodo attuale, linea tratteggiata più chiara = periodo precedente.
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatGiornoBreve, formatNumero, formatValuta } from "@/lib/format";
import { calcolaSerie, type Granularita, type LeadRow, type Metrica, type OppRow, type PuntoSerie } from "@/lib/metrics/dashboard";
import { Segmented } from "@/components/ui/segmented";
import { useRiduciMovimento } from "@/lib/use-riduci-movimento";
import { Riquadro } from "./ui";

const METRICHE: { v: Metrica; label: string; descrizione: string }[] = [
  { v: "lead", label: "Lead", descrizione: "Contatti creati in GHL" },
  { v: "opportunita", label: "Opportunità", descrizione: "Opportunità create in GHL" },
  { v: "vinte", label: "Vinte", descrizione: "Opportunità chiuse come vinte" },
  { v: "venduto", label: "Venduto", descrizione: "Valore delle opportunità vinte" },
];

const intervallo = (da: string, a: string) => (da === a ? formatGiornoBreve(da) : `${formatGiornoBreve(da)} - ${formatGiornoBreve(a)}`);

export function TrendPanel({
  lead,
  opp,
  giorni,
  giorniPrec,
  confronto,
  valuta,
  id,
}: {
  lead: LeadRow[];
  opp: OppRow[];
  giorni: string[];
  giorniPrec: string[];
  confronto: boolean;
  valuta: string;
  id?: string;
}) {
  const riduci = useRiduciMovimento();
  const [metrica, setMetrica] = useState<Metrica>("lead");
  const [granularita, setGranularita] = useState<Granularita>(giorni.length > 45 ? "settimana" : "giorno");
  const punti = calcolaSerie(metrica, granularita, lead, opp, giorni, giorniPrec);
  const fmt = (n: number) => (metrica === "venduto" ? formatValuta(n, valuta) : formatNumero(n));
  const fmtAsse = (n: number) => (metrica === "venduto" ? formatValuta(n, valuta, true) : formatNumero(n));
  const info = METRICHE.find((m) => m.v === metrica)!;
  const totale = punti.reduce((s, p) => s + p.attuale, 0);
  const totalePrec = punti.reduce((s, p) => s + p.precedente, 0);
  const picco = punti.reduce((m, p) => (p.attuale > m.attuale ? p : m), punti[0]);
  const vuoto = totale === 0 && (!confronto || totalePrec === 0);
  // Descrizione del grafico per i lettori di schermo
  const sintesi = vuoto
    ? `Nessun dato di ${info.label.toLowerCase()} nel periodo.`
    : `${info.label}: ${fmt(totale)} nel periodo${confronto ? `, contro ${fmt(totalePrec)} nel periodo precedente` : ""}. Picco ${fmt(picco.attuale)} ${intervallo(picco.da, picco.a)}.`;

  return (
    <Riquadro
      id={id}
      titolo="Andamento"
      descrizione={`${info.descrizione}, ${granularita === "giorno" ? "giorno per giorno" : "settimana per settimana"}`}
      azioni={
        <>
          <Segmented etichetta="Cosa mostrare" opzioni={METRICHE} valore={metrica} onChange={setMetrica} />
          <Segmented
            etichetta="Raggruppa"
            opzioni={[{ v: "giorno", label: "Giorni" }, { v: "settimana", label: "Settimane" }]}
            valore={granularita}
            onChange={setGranularita}
          />
        </>
      }
    >
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <svg width="20" height="8" aria-hidden><line x1="0" y1="4" x2="20" y2="4" stroke="var(--viz-attuale)" strokeWidth="2.5" /></svg>
          Periodo attuale
        </span>
        {confronto && (
          <span className="flex items-center gap-1.5">
            <svg width="20" height="8" aria-hidden><line x1="0" y1="4" x2="20" y2="4" stroke="var(--viz-precedente)" strokeWidth="2" strokeDasharray="4 3" /></svg>
            Periodo precedente
          </span>
        )}
      </div>
      <div className="relative h-72 w-full" role="img" aria-label={sintesi}>
        {vuoto && (
          <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-1 rounded-block bg-card/85 text-center">
            <p className="font-semibold text-titolo">Niente da mostrare in questo periodo</p>
            <p className="max-w-sm text-sm text-muted-foreground">Prova un periodo più lungo (tasto 3 per 90 giorni) o un&apos;altra metrica.</p>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={punti} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--viz-griglia)" />
            <XAxis
              dataKey="etichetta"
              tickFormatter={formatGiornoBreve}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              allowDecimals={false}
              width={metrica === "venduto" ? 64 : 36}
              tickFormatter={fmtAsse}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
              content={({ active, payload }) => {
                const p = (payload?.[0] as { payload?: PuntoSerie } | undefined)?.payload;
                if (!active || !p) return null;
                return (
                  <div className="hud px-3 py-2 text-xs">
                    <div className="flex justify-between gap-6">
                      <span>{intervallo(p.da, p.a)}</span>
                      <span className="font-semibold">{fmt(p.attuale)}</span>
                    </div>
                    {confronto && p.daPrec && (
                      <div className="mt-1 flex justify-between gap-6 text-inverse-muted">
                        <span>{intervallo(p.daPrec, p.aPrec)}</span>
                        <span>{fmt(p.precedente)}</span>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            {confronto && (
              <Line
                dataKey="precedente"
                type="linear"
                stroke="var(--viz-precedente)"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                isAnimationActive={!riduci}
              animationDuration={300}
              animationEasing="ease-out"
              />
            )}
            <Line
              dataKey="attuale"
              type="linear"
              stroke="var(--viz-attuale)"
              strokeWidth={2.5}
              dot={punti.length <= 14 ? { r: 3, fill: "var(--viz-attuale)", strokeWidth: 0 } : false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
              isAnimationActive={!riduci}
              animationDuration={300}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="group/apri text-sm">
        <summary className="inline-flex list-none items-center gap-1 text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform motion-base group-open/apri:rotate-90" aria-hidden />
          Vedi i numeri in tabella
        </summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-xl ring-1 ring-border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted text-left">
              <tr>
                <th className="px-3 py-1.5">Periodo</th>
                <th className="px-3 py-1.5 text-right">{info.label}</th>
                {confronto && <th className="px-3 py-1.5">Periodo precedente</th>}
                {confronto && <th className="px-3 py-1.5 text-right">{info.label}</th>}
              </tr>
            </thead>
            <tbody>
              {punti.map((p) => (
                <tr key={p.da} className="border-t">
                  <td className="px-3 py-1">{intervallo(p.da, p.a)}</td>
                  <td className="px-3 py-1 text-right">{fmt(p.attuale)}</td>
                  {confronto && <td className="px-3 py-1 text-muted-foreground">{p.daPrec && intervallo(p.daPrec, p.aPrec)}</td>}
                  {confronto && <td className="px-3 py-1 text-right text-muted-foreground">{fmt(p.precedente)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Riquadro>
  );
}
