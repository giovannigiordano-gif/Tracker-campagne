// Panoramica agenzia: totali di tutti i clienti attivi, confronto tra clienti e tabella clienti.
import Link from "next/link";
import { Suspense } from "react";
import { richiediAccessoPagina } from "@/lib/accesso";
import { ScheletroPanoramica } from "@/components/bits";
import { AgencyDashboard } from "@/components/dashboard/agency-dashboard";
import { buttonVariants } from "@/components/ui/button";
import { caricaPanoramica } from "@/lib/data/panoramica";
import { leggiConfronto, leggiSelezione, queryPeriodo } from "@/lib/period";

export default function PanoramicaPage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<ScheletroPanoramica />}>
      <Panoramica searchParams={searchParams} />
    </Suspense>
  );
}

const PRIMI_PASSI = [
  "Apri Impostazioni e cerca il cliente tra i sub-account della tua agenzia.",
  "Incolla il suo token GHL: l'app lo verifica e lo salva cifrato.",
  "Torna qui: trovi lead, opportunità e venduto di ogni cliente.",
];

async function Panoramica({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  await richiediAccessoPagina(); // secondo controllo, oltre al proxy
  const params = await searchParams;
  const sel = leggiSelezione(params);
  const confronto = leggiConfronto(params);
  const righe = await caricaPanoramica(sel);
  const query = queryPeriodo(sel, confronto);

  if (righe.length === 0) {
    return (
      <div className="superficie-inversa flex max-w-2xl flex-col items-start gap-5 rounded-panel bg-inverse p-8 text-inverse-foreground lg:p-10">
        <h1 className="text-title text-inverse-foreground">Più clienti, più dati. Inizia dal primo.</h1>
        <p className="text-body text-inverse-muted">Per vedere i numeri dell&apos;agenzia aggiungi i clienti che segui. Bastano tre passi:</p>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-inverse-foreground marker:font-black marker:text-brand">
          {PRIMI_PASSI.map((p) => <li key={p}>{p}</li>)}
        </ol>
        <Link href={`/impostazioni?${query}`} className={buttonVariants({ size: "lg" })}>Aggiungi il primo cliente</Link>
      </div>
    );
  }

  return <AgencyDashboard righe={righe} confronto={confronto} query={query} />;
}
