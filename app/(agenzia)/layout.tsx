// Impaginazione delle pagine dell'agenzia, come un'app per Mac: barra laterale chiara con la tessera nera
// del logo, barra degli strumenti in vetro con i filtri, contenuto.
// Le pagine in questa cartella (Panoramica, clienti, Impostazioni) sono solo per il titolare.
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { TesseraLogo } from "@/components/brand";
import { BarraStrumenti } from "@/components/shell/barra-strumenti";
import { FilterBar } from "@/components/shell/filter-bar";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { configAccesso, haAccesso } from "@/lib/accesso";
import { readAccounts } from "@/lib/accounts";

// Elenco clienti nel menu: si legge a ogni richiesta (connection), non al momento della build
async function MenuLaterale() {
  await connection();
  if (!(await haAccesso())) return <div className="flex-1" />; // senza accesso nessun nome di cliente
  const clienti = (await readAccounts()).filter((a) => a.active).map((a) => ({ id: a.locationId, nome: a.name }));
  return <SidebarNav clienti={clienti} conAccesso={configAccesso().stato === "pronto"} />;
}

export default function LayoutAgenzia({ children }: LayoutProps<"/">) {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      {/* Su telefono e tablet: barra in vetro in alto. Da 1024px: colonna laterale chiara e fissa */}
      <aside className="sticky top-0 z-[var(--z-menu)] border-b border-border max-lg:vetro lg:h-dvh lg:border-r lg:border-b-0 lg:border-sidebar-border lg:bg-sidebar">
        <div className="barra-telefono relative flex items-center gap-3 px-4 py-2.5 lg:h-full lg:flex-col lg:items-stretch lg:gap-6 lg:px-3 lg:py-4">
          <Link href="/" aria-label="SalesProcess Insights, vai alla panoramica" className="tessera-telefono shrink-0 rounded-block lg:block">
            <TesseraLogo compatta className="lg:hidden" />
            <TesseraLogo className="hidden lg:inline-flex" />
          </Link>
          <Suspense fallback={<div className="flex-1" />}>
            <MenuLaterale />
          </Suspense>
        </div>
      </aside>
      <div className="min-w-0">
        {/* Su telefono resta fissa solo la barra del marchio: i filtri scorrono con la pagina */}
        <BarraStrumenti>
          <Suspense fallback={<div className="h-10" />}>
            <FilterBar />
          </Suspense>
        </BarraStrumenti>
        <main id="contenuto" tabIndex={-1} className="px-4 pt-4 pb-10 outline-none lg:px-8 lg:pt-6 lg:pb-14">
          <div className="mx-auto w-full max-w-[96rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}
