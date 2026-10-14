// Pagina di accesso del titolare: una password (APP_PASSWORD) apre l'app per 30 giorni su questo browser.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Marchio } from "@/components/brand";
import { configAccesso, haAccesso } from "@/lib/accesso";
import { percorsoSicuro } from "@/lib/sessione";
import { ModuloAccesso } from "./form";

export const metadata: Metadata = {
  title: "Accesso",
  robots: { index: false, follow: false },
};

export default function PaginaAccesso(props: PageProps<"/accesso">) {
  return (
    <main id="contenuto" tabIndex={-1} className="grid min-h-dvh place-items-center px-4 py-10 outline-none">
      <div className="w-full max-w-sm overflow-hidden rounded-panel bg-card ring-1 ring-border">
        <div className="superficie-inversa bg-inverse px-panel py-5">
          <Marchio />
        </div>
        <div className="flex flex-col gap-5 p-panel">
          <Suspense fallback={<div className="h-48" />}>
            <Contenuto {...props} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

async function Contenuto({ searchParams }: PageProps<"/accesso">) {
  const { da } = await searchParams;
  const destinazione = percorsoSicuro(typeof da === "string" ? da : null);
  const config = configAccesso();

  // Già dentro (o in locale senza password): si va direttamente all'app
  if (config.stato === "libero" || (config.stato === "pronto" && (await haAccesso()))) redirect(destinazione);

  if (config.stato === "da-configurare") {
    return (
      <>
        <h1 className="text-section">App non ancora configurata</h1>
        <p className="text-sm text-muted-foreground">{config.errore} Poi ripubblica l&apos;app.</p>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-section">Entra in SalesProcess Insights</h1>
        <p className="text-sm text-muted-foreground">Inserisci la password dell&apos;agenzia. Resterai dentro per 30 giorni su questo browser.</p>
      </div>
      <ModuloAccesso da={destinazione} />
    </>
  );
}
