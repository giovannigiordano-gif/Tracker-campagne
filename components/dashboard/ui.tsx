"use client";
// Elementi di base della dashboard: pannello dei numeri (nero, stile Sales Process),
// pulsanti a scelta singola, riquadri, variazioni, nota sulla fonte dei dati.
import { cn } from "@/lib/utils";
import { formatAggiornato, formatPercentuale } from "@/lib/format";

// ---------------------------------------------------------------- variazione
export function Delta({ pct, inversa = false, suNero = false }: { pct: number | null; inversa?: boolean; suNero?: boolean }) {
  if (pct === null || !Number.isFinite(pct)) {
    return <span className={suNero ? "text-white/50" : "text-muted-foreground"}>n.d.</span>;
  }
  const buona = inversa ? pct < 0 : pct > 0;
  const cattiva = inversa ? pct > 0 : pct < 0;
  return (
    <span
      className={cn(
        "font-semibold whitespace-nowrap",
        buona && (suNero ? "text-emerald-400" : "text-emerald-700"),
        cattiva && (suNero ? "text-red-400" : "text-red-700"),
        !buona && !cattiva && (suNero ? "text-white/60" : "text-muted-foreground"),
      )}
    >
      {pct > 0 ? "▲" : pct < 0 ? "▼" : "="} {formatPercentuale(pct, true)}
    </span>
  );
}

// ---------------------------------------------------------------- pannello dei numeri
export type VoceNumero = {
  etichetta: string;
  valore: string;
  delta?: number | null;
  inversa?: boolean;
  precedente?: string; // valore del periodo precedente, già formattato
  spiegazione?: string; // come si calcola (compare al passaggio del mouse)
};

export function PannelloNumeri({ voci, confronto }: { voci: VoceNumero[]; confronto: boolean }) {
  return (
    <section
      aria-label="Numeri principali"
      className="grid grid-cols-2 gap-x-6 gap-y-6 rounded-3xl bg-nero px-6 py-6 text-white sm:grid-cols-3 lg:px-8 xl:grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]"
    >
      {voci.map((v) => (
        <div key={v.etichetta} className="flex min-w-0 flex-col gap-1" title={v.spiegazione}>
          <span className="text-sm font-medium text-white/65">{v.etichetta}</span>
          <span className="truncate text-3xl font-black tracking-tight lg:text-4xl">{v.valore}</span>
          {confronto && v.delta !== undefined && (
            <span className="text-sm">
              <Delta pct={v.delta} inversa={v.inversa} suNero />
              {v.precedente !== undefined && <span className="ml-1.5 text-white/50">da {v.precedente}</span>}
            </span>
          )}
        </div>
      ))}
    </section>
  );
}

// ---------------------------------------------------------------- scelta singola a pillole
export function Pillole<T extends string>({
  opzioni,
  valore,
  onChange,
  etichetta,
}: {
  opzioni: { v: T; label: string }[];
  valore: T;
  onChange: (v: T) => void;
  etichetta: string;
}) {
  return (
    <div className="inline-flex rounded-full bg-muted p-0.5" role="group" aria-label={etichetta}>
      {opzioni.map((o) => (
        <button
          key={o.v}
          type="button"
          aria-pressed={o.v === valore}
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded-full px-3 py-1 text-sm font-semibold transition-colors",
            o.v === valore ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- riquadro
export function Riquadro({
  titolo,
  descrizione,
  azioni,
  children,
  className,
}: {
  titolo: string;
  descrizione?: React.ReactNode;
  azioni?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border lg:p-6", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight">{titolo}</h2>
          {descrizione && <p className="mt-0.5 text-sm text-muted-foreground">{descrizione}</p>}
        </div>
        {azioni && <div className="flex flex-wrap items-center gap-2">{azioni}</div>}
      </header>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------- fonte dei dati
export function Fonte({ children, aggiornatoIl }: { children: React.ReactNode; aggiornatoIl?: number | null }) {
  return (
    <p className="text-xs text-muted-foreground">
      {children}
      {aggiornatoIl ? ` Dati aggiornati il ${formatAggiornato(aggiornatoIl)}.` : ""}
    </p>
  );
}
