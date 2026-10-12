// Componenti di pagina condivisi: titolo, box di errore, scheletri di caricamento che anticipano
// la forma reale di ogni pagina (così al caricamento nulla "salta").
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
    <header className="mb-section flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-title">{titolo}</h1>
        {sottotitolo && <p className="mt-1.5 max-w-[70ch] text-body text-muted-foreground">{sottotitolo}</p>}
      </div>
      {azioni && <div className="flex items-center gap-2">{azioni}</div>}
    </header>
  );
}

export function BoxErrore({
  titolo = "Dati non disponibili",
  messaggio,
  conImpostazioni = false,
}: {
  titolo?: string;
  messaggio: string;
  conImpostazioni?: boolean;
}) {
  return (
    <Alert variant="destructive">
      <AlertTriangle aria-hidden />
      <AlertTitle>{titolo}</AlertTitle>
      <AlertDescription>{messaggio}</AlertDescription>
      {conImpostazioni && (
        <AlertAction>
          <Link href="/impostazioni" className={buttonVariants({ size: "sm" })}>Apri Impostazioni</Link>
        </AlertAction>
      )}
    </Alert>
  );
}

// ---------------------------------------------------------------- scheletri
function ScheletroNumeri({ quanti = 6 }: { quanti?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-7 rounded-panel bg-inverse p-panel sm:grid-cols-3 2xl:grid-cols-6 lg:px-8 lg:py-7">
      {Array.from({ length: quanti }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-20 bg-inverse-raised" />
          <Skeleton className="h-9 w-28 bg-inverse-raised" />
          <Skeleton className="h-3.5 w-24 bg-inverse-raised" />
        </div>
      ))}
    </div>
  );
}

function ScheletroPannello({ className, righe = 4 }: { className?: string; righe?: number }) {
  return (
    <div className={cn("flex flex-col gap-4 rounded-panel bg-card p-panel ring-1 ring-border", className)}>
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-3.5 w-72 max-w-full" />
      <div className="mt-2 flex flex-col gap-3">
        {Array.from({ length: righe }, (_, i) => <Skeleton key={i} className="h-8" />)}
      </div>
    </div>
  );
}

export function ScheletroPanoramica() {
  return (
    <div className="flex flex-col gap-section" aria-busy="true" aria-label="Caricamento della panoramica">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <ScheletroNumeri />
      <ScheletroPannello righe={3} />
      <ScheletroPannello righe={5} />
    </div>
  );
}

export function ScheletroCliente() {
  return (
    <div className="flex flex-col gap-section" aria-busy="true" aria-label="Caricamento della dashboard del cliente">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-4 w-[28rem] max-w-full" />
      </div>
      <Skeleton className="h-14 rounded-panel" />
      <ScheletroNumeri />
      <div className="flex flex-col gap-4 rounded-panel bg-card p-panel ring-1 ring-border">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-72" />
      </div>
      <ScheletroPannello righe={6} />
    </div>
  );
}

export function ScheletroImpostazioni() {
  return (
    <div className="flex flex-col gap-section" aria-busy="true" aria-label="Caricamento delle impostazioni">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-16 rounded-panel" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ScheletroPannello righe={5} />
        <ScheletroPannello righe={1} />
      </div>
    </div>
  );
}
