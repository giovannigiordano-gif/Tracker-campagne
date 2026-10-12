import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Red_Hat_Display } from "next/font/google";
import { Marchio } from "@/components/brand";
import { FilterBar } from "@/components/shell/filter-bar";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { SCRIPT_TEMA } from "@/components/shell/theme-toggle";
import { NotificheProvider } from "@/components/ui/toast";
import { readAccounts } from "@/lib/accounts";
import "./globals.css";

// Carattere del marchio SalesProcess
const redHat = Red_Hat_Display({
  variable: "--font-red-hat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "SalesProcess Insights", template: "%s | SalesProcess Insights" },
  description: "Dashboard interna dell'agenzia: lead, pipeline e vendite da GoHighLevel e Meta Ads",
};

// Elenco clienti nel menu: si legge a ogni richiesta (connection), non al momento della build
async function MenuLaterale() {
  await connection();
  const clienti = (await readAccounts()).filter((a) => a.active).map((a) => ({ id: a.locationId, nome: a.name }));
  return <SidebarNav clienti={clienti} />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={`${redHat.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Applica il tema scelto prima del primo disegno (niente lampo bianco in modalità scura) */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-dvh bg-background">
        <NotificheProvider>
          <a
            href="#contenuto"
            className="sr-only z-[var(--z-toast)] rounded-control bg-brand px-4 py-2 font-bold text-brand-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            Salta al contenuto
          </a>
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
                <Suspense fallback={<div className="h-10" />}>
                  <FilterBar />
                </Suspense>
              </div>
              <main id="contenuto" tabIndex={-1} className="px-4 py-6 outline-none lg:px-8 lg:py-8">
                {children}
              </main>
            </div>
          </div>
        </NotificheProvider>
      </body>
    </html>
  );
}
