// Componenti di pagina condivisi: titolo, box di errore, scheletro di caricamento.
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

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
        <h1 className="text-3xl font-black tracking-tight lg:text-4xl">{titolo}</h1>
        {sottotitolo && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{sottotitolo}</p>}
      </div>
      {azioni && <div className="flex items-center gap-2">{azioni}</div>}
    </div>
  );
}

export function BoxErrore({ titolo = "Dati non disponibili", messaggio }: { titolo?: string; messaggio: string }) {
  return (
    <Alert variant="destructive" className="rounded-2xl bg-card">
      <AlertTriangle />
      <AlertTitle>{titolo}</AlertTitle>
      <AlertDescription>{messaggio}</AlertDescription>
    </Alert>
  );
}

export function CaricamentoPagina({ righe = 4 }: { righe?: number }) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Caricamento dati">
      <Skeleton className="h-10 w-72 rounded-full" />
      <Skeleton className="h-36 rounded-3xl bg-nero/90" />
      {Array.from({ length: righe }, (_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
    </div>
  );
}
