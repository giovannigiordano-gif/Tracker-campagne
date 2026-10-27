"use client";
// Elementi di base della dashboard: pannello dei numeri (nero del marchio), riquadri,
// variazioni rispetto al periodo precedente, nota sulla fonte dei dati.
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cardVariants } from "@/components/ui/card";
import { formatAggiornato, formatPercentuale } from "@/lib/format";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------- variazione
// Verde se migliora, rosso se peggiora; la freccia e il segno dicono la direzione anche senza colori.
// "neutra" per i numeri che salendo non sono né buoni né cattivi (es. la spesa): solo grigio.
export function Delta({
  pct,
  inversa = false,
  neutra = false,
  suNero = false,
}: {
  pct: number | null;
  inversa?: boolean;
  neutra?: boolean;
  suNero?: boolean;
}) {
  if (pct === null || !Number.isFinite(pct)) {
    return <span className={suNero ? "text-inverse-muted" : "text-muted-foreground"}>n.d.</span>;
  }
  const buona = !neutra && (inversa ? pct < 0 : pct > 0);
  const cattiva = !neutra && (inversa ? pct > 0 : pct < 0);
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
  valoreBreve?: string; // versione compatta per gli schermi stretti (es. "124,5K €")
  quota?: string; // parte del totale del gruppo (es. "80% dei lead")
  delta?: number | null;
  inversa?: boolean;
  precedente?: string; // valore del periodo precedente, già formattato
  spiegazione?: string; // come si calcola (compare al passaggio del mouse)
};

// Gruppo di numeri con un titolo (es. "Lead"): ogni gruppo è una riga del pannello, con colonne allineate
export type GruppoNumeri = { titolo: string; voci: VoceNumero[] };

// "aGruppi": quattro colonne già dal tablet, quindi sotto i 1280px numeri un po' più piccoli e importi in forma breve
function NumeroPannello({ v, confronto, aGruppi = false }: { v: VoceNumero; confronto: boolean; aGruppi?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5" title={v.spiegazione}>
      <span className="text-sm font-medium text-inverse-muted">{v.etichetta}</span>
      <span
        key={v.valore}
        // Stringa semplice, non cn(): cn scambierebbe text-display per un colore e lo toglierebbe
        className={`truncate text-display text-inverse-foreground motion-safe:animate-numero ${aGruppi ? "max-xl:text-[1.875rem]" : ""}`}
        title={v.valore}
      >
        {v.valoreBreve ? (
          <>
            <span className={aGruppi ? "xl:hidden" : "sm:hidden"}>{v.valoreBreve}</span>
            <span className={aGruppi ? "hidden xl:inline" : "hidden sm:inline"}>{v.valore}</span>
          </>
        ) : (
          v.valore
        )}
      </span>
      {v.quota && <span className="text-sm font-semibold text-inverse-foreground">{v.quota}</span>}
      {confronto && v.delta !== undefined && (
        <span className="flex flex-wrap items-center gap-x-1.5 text-sm">
          <Delta pct={v.delta} inversa={v.inversa} suNero />
          {v.precedente !== undefined && <span className="text-inverse-muted">da {v.precedente}</span>}
        </span>
      )}
    </div>
  );
}

// Con "gruppi" i numeri stanno su righe con un titolo (dashboard del cliente); con "voci" in un'unica griglia (Panoramica).
// "nota" dice sopra i numeri quali filtri sono attivi.
export function PannelloNumeri({
  voci,
  gruppi,
  confronto,
  nota,
}: {
  voci?: VoceNumero[];
  gruppi?: GruppoNumeri[];
  confronto: boolean;
  nota?: React.ReactNode;
}) {
  if (!gruppi) {
    return (
      <section
        aria-label="Numeri principali"
        className={cn(
          cardVariants({ variant: "inverse" }),
          "grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 2xl:grid-cols-6 lg:px-8 lg:py-7"
        )}
      >
        {voci?.map((v) => <NumeroPannello key={v.etichetta} v={v} confronto={confronto} />)}
      </section>
    );
  }
  return (
    <section aria-label="Numeri principali" className={cn(cardVariants({ variant: "inverse" }), "gap-0 lg:px-8 lg:py-7")}>
      {nota && <div className="mb-6 flex items-start gap-2 text-sm font-semibold text-inverse-foreground">{nota}</div>}
      {gruppi.map((g, i) => (
        <div key={g.titolo} className={cn("flex flex-col gap-4", i > 0 && "mt-6 border-t border-inverse-border pt-6")}>
          <h3 className="text-section text-inverse-foreground">{g.titolo}</h3>
          {/* Quattro colonne uguali in ogni riga, così i numeri dei due gruppi restano allineati */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 xl:gap-x-6">
            {g.voci.map((v) => <NumeroPannello key={v.etichetta} v={v} confronto={confronto} aGruppi />)}
          </div>
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
    <section id={id} className={cn(cardVariants(), "scroll-mt-36", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-section">{titolo}</h2>
          {descrizione && <p className="mt-1 max-w-[65ch] text-sm text-muted-foreground">{descrizione}</p>}
        </div>
        {azioni && <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{azioni}</div>}
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
