// Classifica compatta (per fonte, canale, campagna, tag) con barre orizzontali.
// I primi elementi sono sempre visibili, gli altri si aprono con "Mostra tutti".
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumero, formatPercentuale } from "@/lib/format";
import type { Voce } from "@/lib/metrics/contacts";

const VISIBILI = 8;

function Riga({ voce, massimo, totale }: { voce: Voce; massimo: number; totale: number }) {
  const larghezza = massimo > 0 ? Math.max((voce.n / massimo) * 100, 1.5) : 0;
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 rounded-md px-1 py-1 hover:bg-muted/60">
      <span className="truncate text-sm" title={voce.dettaglio ? `${voce.nome} (${voce.dettaglio})` : voce.nome}>
        {voce.nome}
      </span>
      <span className="text-sm tabular-nums">
        {formatNumero(voce.n)}
        <span className="ml-1.5 text-xs text-muted-foreground">{formatPercentuale(totale ? (voce.n / totale) * 100 : 0)}</span>
      </span>
      <div className="col-span-2 h-1.5 rounded-full bg-muted">
        <div className="h-1.5 rounded-full bg-[var(--viz-barra)]" style={{ width: `${larghezza}%` }} />
      </div>
    </li>
  );
}

export function BreakdownCard({
  titolo,
  descrizione,
  voci,
  totale,
  vuoto = "Nessun dato nel periodo",
}: {
  titolo: string;
  descrizione?: string;
  voci: Voce[];
  totale: number;
  vuoto?: string;
}) {
  const massimo = voci[0]?.n ?? 0;
  const primi = voci.slice(0, VISIBILI);
  const altri = voci.slice(VISIBILI);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titolo}</CardTitle>
        {descrizione && <CardDescription>{descrizione}</CardDescription>}
      </CardHeader>
      <CardContent>
        {voci.length === 0 ? (
          <p className="text-sm text-muted-foreground">{vuoto}</p>
        ) : (
          <>
            <ul className="flex flex-col gap-1">
              {primi.map((v) => <Riga key={v.nome + (v.dettaglio ?? "")} voce={v} massimo={massimo} totale={totale} />)}
            </ul>
            {altri.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Mostra tutti ({voci.length})
                </summary>
                <ul className="mt-1 flex flex-col gap-1">
                  {altri.map((v) => <Riga key={v.nome + (v.dettaglio ?? "")} voce={v} massimo={massimo} totale={totale} />)}
                </ul>
              </details>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
