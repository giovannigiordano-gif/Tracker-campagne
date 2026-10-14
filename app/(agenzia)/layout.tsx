// Impaginazione delle pagine dell'agenzia: menu laterale nero, barra dei filtri, contenuto.
// Le pagine in questa cartella (Panoramica, clienti, Impostazioni) sono solo per il titolare.
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Marchio } from "@/components/brand";
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
      <aside className="superficie-inversa sticky top-0 z-[var(--z-menu)] bg-inverse text-inverse-foreground lg:h-dvh">
        <div className="flex items-center gap-4 px-4 py-3 lg:h-full lg:flex-col lg:items-stretch lg:gap-8 lg:px-4 lg:py-6">
          <Link href="/" aria-label="SalesProcess Insights, vai alla panoramica" className="rounded-block px-1.5">
            <Marchio />
          </Link>
          <Suspense fallback={<div className="flex-1" />}>
            <MenuLaterale />
          </Suspense>
        </div>
      </aside>
      <div className="min-w-0">
        {/* Su telefono resta fissa solo la barra del marchio: i filtri scorrono con la pagina */}
        <div className="z-[var(--z-sticky)] border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md lg:sticky lg:top-0 lg:px-8">
          <div className="mx-auto w-full max-w-[96rem]">
            <Suspense fallback={<div className="h-10" />}>
              <FilterBar />
            </Suspense>
          </div>
        </div>
        <main id="contenuto" tabIndex={-1} className="px-4 py-6 outline-none lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[96rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}
