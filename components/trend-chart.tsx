"use client";
// Andamento giornaliero dei lead: periodo attuale (linea piena) e periodo precedente
// (linea tratteggiata, più chiara), allineati giorno per giorno.
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type PuntoAndamento = {
  giorno: string; // dd/mm/yyyy del periodo attuale
  giornoPrecedente: string; // dd/mm/yyyy del giorno corrispondente nel periodo precedente
  attuale: number;
  precedente: number;
};

const breve = (g: string) => g.slice(0, 5); // dd/mm

function Legenda() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <svg width="20" height="8" aria-hidden><line x1="0" y1="4" x2="20" y2="4" stroke="var(--viz-attuale)" strokeWidth="2" /></svg>
        Periodo attuale
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="20" height="8" aria-hidden><line x1="0" y1="4" x2="20" y2="4" stroke="var(--viz-precedente)" strokeWidth="2" strokeDasharray="4 3" /></svg>
        Periodo precedente
      </span>
    </div>
  );
}

function Suggerimento({ active, payload }: { active?: boolean; payload?: { payload: PuntoAndamento }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 bg-[var(--viz-attuale)]" />
          {p.giorno}
        </span>
        <span className="font-semibold tabular-nums">{p.attuale} lead</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-4 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 border-t-2 border-dashed border-[var(--viz-precedente)]" />
          {p.giornoPrecedente}
        </span>
        <span className="tabular-nums">{p.precedente} lead</span>
      </div>
    </div>
  );
}

export function TrendChart({ dati }: { dati: PuntoAndamento[] }) {
  return (
    <div className="flex flex-col gap-3">
      <Legenda />
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dati} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="giorno"
              tickFormatter={breve}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              allowDecimals={false}
              width={36}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip content={<Suggerimento />} cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }} />
            <Line
              dataKey="precedente"
              name="Periodo precedente"
              type="linear"
              stroke="var(--viz-precedente)"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              isAnimationActive={false}
            />
            <Line
              dataKey="attuale"
              name="Periodo attuale"
              type="linear"
              stroke="var(--viz-attuale)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Vedi i numeri giorno per giorno</summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-md border">
          <table className="w-full text-xs tabular-nums">
            <thead className="sticky top-0 bg-muted text-left">
              <tr><th className="px-3 py-1.5">Giorno</th><th className="px-3 py-1.5 text-right">Lead</th><th className="px-3 py-1.5">Giorno precedente</th><th className="px-3 py-1.5 text-right">Lead</th></tr>
            </thead>
            <tbody>
              {dati.map((d) => (
                <tr key={d.giorno} className="border-t">
                  <td className="px-3 py-1">{d.giorno}</td><td className="px-3 py-1 text-right">{d.attuale}</td>
                  <td className="px-3 py-1 text-muted-foreground">{d.giornoPrecedente}</td><td className="px-3 py-1 text-right text-muted-foreground">{d.precedente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
