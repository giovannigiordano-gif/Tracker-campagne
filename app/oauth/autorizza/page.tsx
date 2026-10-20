// Pagina di consenso del connettore: Claude la apre quando il titolare preme "Connetti".
// Con la password dell'app il titolare autorizza Claude a leggere i dati aggregati e a salvare le analisi.
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { BookOpenCheck, ShieldCheck, TriangleAlert } from "lucide-react";
import { TesseraLogo } from "@/components/brand";
import { configAccesso } from "@/lib/accesso";
import { CAMPI_AUTORIZZAZIONE, indirizzoRisposta, leggiRichiesta } from "@/lib/connettore/autorizza";
import { ErroreClient, verificaClient } from "@/lib/connettore/client";
import { indirizzoBase } from "@/lib/connettore/indirizzi";
import { ModuloConsenso } from "./form";

export const metadata: Metadata = {
  title: "Collega Claude",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function PaginaAutorizza(props: PageProps<"/oauth/autorizza">) {
  return (
    <main id="contenuto" tabIndex={-1} className="grid min-h-dvh place-items-center px-4 py-10 outline-none">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <TesseraLogo className="w-auto" />
        <div className="flex w-full flex-col gap-5 rounded-panel bg-card p-panel shadow-card sm:p-8">
          <Suspense fallback={<div className="h-72" />}>
            <Contenuto {...props} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

function Errore({ testo }: { testo: string }) {
  return (
    <>
      <h1 className="text-section">Collegamento non possibile</h1>
      <p role="alert" className="text-sm text-muted-foreground">
        {testo}
      </p>
    </>
  );
}

async function Contenuto({ searchParams }: PageProps<"/oauth/autorizza">) {
  const parametri = await searchParams;
  const valore = (nome: string) => {
    const v = parametri[nome];
    return typeof v === "string" && v !== "" ? v : null;
  };
  const config = configAccesso();
  if (config.stato !== "pronto") return <Errore testo="Il connettore funziona solo con l'app online e la password impostata." />;

  const lettura = leggiRichiesta(valore, indirizzoBase(await headers()));
  if (!lettura.ok) return <Errore testo={lettura.errore} />;
  const { richiesta } = lettura;
  let client;
  try {
    client = await verificaClient(richiesta.clientId, richiesta.ritorno);
  } catch (e) {
    return <Errore testo={e instanceof ErroreClient ? e.message : "Non riesco a verificare la richiesta. Riprova tra un momento."} />;
  }

  const campi = Object.fromEntries(CAMPI_AUTORIZZAZIONE.map((n) => [n, valore(n) ?? ""]));
  const annulla = indirizzoRisposta(richiesta.ritorno, { error: "access_denied", state: richiesta.stato });

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-section">Collega Claude</h1>
        <p className="text-sm text-muted-foreground">
          <strong className="font-semibold text-titolo">{client.nome}</strong> ({client.host}) chiede di usare i dati di SalesProcess Insights
          per scrivere le analisi dei tuoi clienti.
        </p>
      </div>
      <ul className="flex flex-col gap-3 text-sm">
        <li className="flex gap-2.5">
          <BookOpenCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>Potrà leggere i numeri di GoHighLevel e Meta solo come totali, senza nomi, email o telefoni dei contatti, e salvare le analisi nella dashboard dei clienti.</span>
        </li>
        <li className="flex gap-2.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>Non potrà modificare nulla su GoHighLevel né su Meta: l&apos;app è in sola lettura.</span>
        </li>
        <li className="flex gap-2.5">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <span>Se non hai appena premuto &laquo;Connetti&raquo; in Claude, chiudi questa pagina.</span>
        </li>
      </ul>
      <ModuloConsenso campi={campi} annulla={annulla} />
    </>
  );
}
