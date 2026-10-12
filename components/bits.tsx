// Piccoli componenti riusati nelle pagine: titolo, card dei numeri, variazione, nota sulla fonte, errori.
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAggiornato, formatPercentuale } from "@/lib/format";
import { formatIntervallo, type Intervallo } from "@/lib/period";
import { cn } from "@/lib/utils";

export function TitoloPagina({
  titolo,
  sottotitolo,
  azioni,
}: {
  titolo: React.ReactNode;
  sottotitolo?: React.ReactNode;
  azioni?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titolo}</h1>
        {sottotitolo && <p className="mt-1 text-sm text-muted-foreground">{sottotitolo}</p>}
      </div>
      {azioni && <div className="flex items-center gap-2">{azioni}</div>}
    </div>
  );
}

// Variazione rispetto al periodo precedente: verde se migliora, rossa se peggiora
export function Variazione({ pct, inversa = false }: { pct: number | null; inversa?: boolean }) {
  if (pct === null) return <span className="text-muted-foreground">n.d.</span>;
  const buona = inversa ? pct < 0 : pct > 0;
  const cattiva = inversa ? pct > 0 : pct < 0;
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        buona && "text-emerald-600 dark:text-emerald-400",
        cattiva && "text-red-600 dark:text-red-400",
        !buona && !cattiva && "text-muted-foreground",
      )}
    >
      {pct > 0 ? "▲ " : pct < 0 ? "▼ " : ""}
      {formatPercentuale(pct, true)}
    </span>
  );
}

export function Kpi({
  etichetta,
  valore,
  sotto,
}: {
  etichetta: string;
  valore: React.ReactNode;
  sotto?: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">{etichetta}</span>
        <span className="text-3xl font-semibold tabular-nums tracking-tight">{valore}</span>
        {sotto && <span className="text-sm text-muted-foreground">{sotto}</span>}
      </CardContent>
    </Card>
  );
}

// Ogni numero deve dichiarare da dove viene e a quale periodo si riferisce
export function NotaFonte({
  fonte,
  definizione,
  intervallo,
  fuso,
  aggiornatoIl,
}: {
  fonte: "GoHighLevel" | "Meta";
  definizione?: string;
  intervallo?: Pick<Intervallo, "daGiorno" | "aGiorno">;
  fuso?: string;
  aggiornatoIl?: number | null;
}) {
  const parti = [
    `Fonte: ${fonte}`,
    definizione,
    intervallo && `periodo ${formatIntervallo(intervallo)}${fuso ? ` (fuso ${fuso})` : ""}`,
    aggiornatoIl && `dati aggiornati il ${formatAggiornato(aggiornatoIl)}`,
  ].filter(Boolean);
  return <p className="text-xs text-muted-foreground">{parti.join(" · ")}</p>;
}

export function BoxErrore({ titolo = "Dati non disponibili", messaggio }: { titolo?: string; messaggio: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>{titolo}</AlertTitle>
      <AlertDescription>{messaggio}</AlertDescription>
    </Alert>
  );
}

export function CaricamentoPagina({ righe = 6 }: { righe?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Caricamento dati">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      {Array.from({ length: righe }, (_, i) => <Skeleton key={i} className="h-10" />)}
    </div>
  );
}
