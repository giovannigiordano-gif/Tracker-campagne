// Panoramica agency: una riga per ogni cliente attivo.
// In questa fase: lead GHL e confronto col periodo precedente.
// Spesa, CPL, opportunità, vinte e ROAS si aggiungono nelle fasi 2-4.
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, CircleAlert } from "lucide-react";
import { CaricamentoPagina, NotaFonte, TitoloPagina, Variazione } from "@/components/bits";
import { RefreshButton } from "@/components/refresh-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { caricaPanoramica } from "@/lib/data/panoramica";
import { formatDecimale, formatNumero } from "@/lib/format";
import { etichettaSelezione, formatIntervallo, leggiSelezione, queryPeriodo } from "@/lib/period";

export default function PanoramicaPage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<CaricamentoPagina />}>
      <Panoramica searchParams={searchParams} />
    </Suspense>
  );
}

async function Panoramica({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const sel = leggiSelezione(await searchParams);
  const righe = await caricaPanoramica(sel);
  const query = queryPeriodo(sel);

  const titolo = (
    <TitoloPagina
      titolo="Panoramica agency"
      sottotitolo={`${etichettaSelezione(sel)} · confronto con il periodo precedente di pari durata`}
      azioni={<RefreshButton etichetta="Aggiorna tutti i dati" />}
    />
  );

  if (righe.length === 0) {
    return (
      <>
        {titolo}
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-6">
            <p className="font-medium">Nessun cliente da monitorare</p>
            <p className="text-sm text-muted-foreground">
              Aggiungi i clienti dalla pagina Impostazioni scegliendoli tra i sub-account GHL, poi inserisci per ognuno il suo token.
            </p>
            <Link href={`/impostazioni?${query}`} className={buttonVariants()}>Vai a Impostazioni</Link>
          </CardContent>
        </Card>
      </>
    );
  }

  const totaleLead = righe.reduce((s, r) => s + (r.leadCorrente ?? 0), 0);
  const totalePrec = righe.reduce((s, r) => s + (r.leadPrecedente ?? 0), 0);

  return (
    <>
      {titolo}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Lead GHL</TableHead>
              <TableHead className="text-right">Periodo precedente</TableHead>
              <TableHead className="text-right">Variazione</TableHead>
              <TableHead className="text-right">Media al giorno</TableHead>
              <TableHead>Avvisi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {righe.map((r) => (
              <TableRow key={r.locationId}>
                <TableCell className="font-medium">
                  <Link href={`/clienti/${r.locationId}/contatti?${query}`} className="hover:underline">
                    {r.nome}
                  </Link>
                  <div className="text-xs font-normal text-muted-foreground">{formatIntervallo(r.intervallo)}</div>
                </TableCell>
                <TableCell className="text-right text-base font-semibold tabular-nums">
                  {r.leadCorrente === null ? "—" : formatNumero(r.leadCorrente)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {r.leadPrecedente === null ? "—" : formatNumero(r.leadPrecedente)}
                </TableCell>
                <TableCell className="text-right">
                  {r.leadCorrente === null ? "—" : <Variazione pct={r.variazionePct} />}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.mediaGiorno === null ? "—" : formatDecimale(r.mediaGiorno)}
                </TableCell>
                <TableCell className="max-w-md">
                  {r.avvisi.length === 0 ? (
                    <span className="text-sm text-muted-foreground">Nessuno</span>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {r.avvisi.map((a) => (
                        <li key={a.testo} className="flex items-start gap-1.5 text-sm">
                          {a.livello === "errore" ? (
                            <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" aria-label="Errore" />
                          ) : (
                            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-label="Attenzione" />
                          )}
                          <span className="whitespace-normal">{a.testo}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {righe.length > 1 && (
              <TableRow className="bg-muted/40 font-medium">
                <TableCell>Totale agency</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumero(totaleLead)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{formatNumero(totalePrec)}</TableCell>
                <TableCell className="text-right">
                  <Variazione pct={totalePrec ? ((totaleLead - totalePrec) / totalePrec) * 100 : null} />
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-3">
        <NotaFonte
          fonte="GoHighLevel"
          definizione="Lead = contatti creati nel periodo (data di creazione in GHL), giorni contati nel fuso orario di ogni cliente"
        />
      </div>
    </>
  );
}
