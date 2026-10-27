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
        <div key={i} className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-3.5 w-20 max-w-full bg-inverse-raised" />
          <Skeleton className="h-9 w-28 max-w-full bg-inverse-raised" />
          <Skeleton className="h-3.5 w-24 max-w-full bg-inverse-raised" />
        </div>
      ))}
    </div>
  );
}

// Pannello dei numeri del cliente: due righe con titolo (Lead; Opportunità e vendite), quattro numeri ciascuna
function ScheletroNumeriGruppi() {
  return (
    <div className="flex flex-col rounded-panel bg-inverse p-panel lg:px-8 lg:py-7">
      {[0, 1].map((g) => (
        <div key={g} className={g > 0 ? "mt-6 border-t border-inverse-border pt-6" : undefined}>
          <Skeleton className="h-5 w-24 bg-inverse-raised" />
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 xl:gap-x-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex min-w-0 flex-col gap-2">
                <Skeleton className="h-3.5 w-20 max-w-full bg-inverse-raised" />
                <Skeleton className="h-9 w-28 max-w-full bg-inverse-raised" />
                <Skeleton className="h-3.5 w-24 max-w-full bg-inverse-raised" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScheletroPannello({ className, righe = 4 }: { className?: string; righe?: number }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-4 rounded-panel bg-card p-panel shadow-card", className)}>
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
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <div className="overflow-hidden rounded-panel bg-card shadow-card">
          <div className="hidden h-10 shadow-[inset_0_-1px_0_var(--border)] xl:block" />
          {Array.from({ length: 3 }, (_, i) => <ScheletroStriscia key={i} />)}
        </div>
      </div>
    </div>
  );
}

// Segnaposto di una striscia cliente della Panoramica, con la sua forma reale
function ScheletroStriscia() {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 even:bg-background/70 xl:flex-row xl:items-center xl:gap-4">
      <div className="flex items-center gap-2.5 xl:w-56 xl:shrink-0">
        <Skeleton className="size-8 rounded-[0.5rem]" />
        <Skeleton className="h-4 w-40 max-w-full" />
      </div>
      <div className="grid flex-1 grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex min-w-0 flex-col gap-1.5 xl:items-end">
            <Skeleton className="h-3 w-12 max-w-full xl:hidden" />
            <Skeleton className="h-5 w-14 max-w-full" />
          </div>
        ))}
      </div>
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
      <ScheletroNumeriGruppi />
      <div className="flex flex-col gap-4 rounded-panel bg-card p-panel shadow-card">
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
