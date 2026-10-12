// Panoramica agenzia: totali di tutti i clienti attivi, confronto tra clienti e tabella clienti.
import Link from "next/link";
import { Suspense } from "react";
import { CaricamentoPagina } from "@/components/bits";
import { AgencyDashboard } from "@/components/dashboard/agency-dashboard";
import { buttonVariants } from "@/components/ui/button";
import { caricaPanoramica } from "@/lib/data/panoramica";
import { leggiConfronto, leggiSelezione, queryPeriodo } from "@/lib/period";

export default function PanoramicaPage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<CaricamentoPagina />}>
      <Panoramica searchParams={searchParams} />
    </Suspense>
  );
}

async function Panoramica({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const params = await searchParams;
  const sel = leggiSelezione(params);
  const confronto = leggiConfronto(params);
  const righe = await caricaPanoramica(sel);
  const query = queryPeriodo(sel, confronto);

  if (righe.length === 0) {
    return (
      <div className="superficie-inversa flex max-w-xl flex-col items-start gap-4 rounded-panel bg-inverse p-8 text-inverse-foreground">
        <h1 className="text-title text-inverse-foreground">Nessun cliente da monitorare</h1>
        <p className="text-inverse-muted">
          Aggiungi i clienti dalla pagina Impostazioni scegliendoli tra i sub-account GHL, poi inserisci per ognuno il suo token.
        </p>
        <Link href={`/impostazioni?${query}`} className={buttonVariants({ size: "lg" })}>Aggiungi il primo cliente</Link>
      </div>
    );
  }

  return <AgencyDashboard righe={righe} confronto={confronto} query={query} />;
}
