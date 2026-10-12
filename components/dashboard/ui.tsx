"use client";
// Elementi di base della dashboard: pannello dei numeri (nero del marchio), riquadri,
// variazioni rispetto al periodo precedente, nota sulla fonte dei dati.
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cardVariants } from "@/components/ui/card";
import { formatAggiornato, formatPercentuale } from "@/lib/format";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------- variazione
// Verde se migliora, rosso se peggiora; la freccia e il segno dicono la direzione anche senza colori.
export function Delta({ pct, inversa = false, suNero = false }: { pct: number | null; inversa?: boolean; suNero?: boolean }) {
  if (pct === null || !Number.isFinite(pct)) {
    return <span className={suNero ? "text-inverse-muted" : "text-muted-foreground"}>n.d.</span>;
  }
  const buona = inversa ? pct < 0 : pct > 0;
  const cattiva = inversa ? pct > 0 : pct < 0;
  const Icona = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-semibold whitespace-nowrap",
        buona && (suNero ? "text-on-inverse-success" : "text-success"),
        cattiva && (suNero ? "text-on-inverse-danger" : "text-danger"),
        !buona && !cattiva && (suNero ? "text-inverse-muted" : "text-muted-foreground")
      )}
    >
      <Icona className="size-3.5" aria-hidden />
      {formatPercentuale(pct, true)}
    </span>
  );
}

// ---------------------------------------------------------------- pannello dei numeri
export type VoceNumero = {
  etichetta: string;
  valore: string;
  valoreBreve?: string; // versione compatta per gli schermi stretti (es. "68,8K €")
  delta?: number | null;
  inversa?: boolean;
  precedente?: string; // valore del periodo precedente, già formattato
  spiegazione?: string; // come si calcola (compare al passaggio del mouse)
};

export function PannelloNumeri({ voci, confronto }: { voci: VoceNumero[]; confronto: boolean }) {
  return (
    <section
      aria-label="Numeri principali"
      className={cn(
        cardVariants({ variant: "inverse" }),
        "grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 2xl:grid-cols-6 lg:px-8 lg:py-7"
      )}
    >
      {voci.map((v) => (
        <div key={v.etichetta} className="flex min-w-0 flex-col gap-1.5" title={v.spiegazione}>
          <span className="text-label text-inverse-muted">{v.etichetta}</span>
          <span key={v.valore} className="truncate text-display text-inverse-foreground motion-safe:animate-numero" title={v.valore}>
            {v.valoreBreve ? (
              <>
                <span className="sm:hidden">{v.valoreBreve}</span>
                <span className="hidden sm:inline">{v.valore}</span>
              </>
            ) : (
              v.valore
            )}
          </span>
          {confronto && v.delta !== undefined && (
            <span className="flex flex-wrap items-center gap-x-1.5 text-sm">
              <Delta pct={v.delta} inversa={v.inversa} suNero />
              {v.precedente !== undefined && <span className="text-inverse-muted">da {v.precedente}</span>}
            </span>
          )}
        </div>
      ))}
    </section>
  );
}

// ---------------------------------------------------------------- riquadro (pannello di sezione)
export function Riquadro({
  titolo,
  descrizione,
  azioni,
  children,
  className,
  id,
}: {
  titolo: string;
  descrizione?: React.ReactNode;
  azioni?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn(cardVariants(), "scroll-mt-24", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-section">{titolo}</h2>
          {descrizione && <p className="mt-1 max-w-[65ch] text-sm text-muted-foreground">{descrizione}</p>}
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
    <p className="max-w-[90ch] text-caption text-muted-foreground">
      {children}
      {aggiornatoIl ? ` Dati aggiornati il ${formatAggiornato(aggiornatoIl)}.` : ""}
    </p>
  );
}
