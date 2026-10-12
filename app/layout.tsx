import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Red_Hat_Display } from "next/font/google";
import { Marchio } from "@/components/brand";
import { FilterBar } from "@/components/shell/filter-bar";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { readAccounts } from "@/lib/accounts";
import "./globals.css";

// Carattere del marchio Sales Process
const redHat = Red_Hat_Display({
  variable: "--font-red-hat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sales Process Insights",
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
    <html lang="it" className={`${redHat.variable} h-full antialiased`}>
      <body className="min-h-dvh bg-background">
        <div className="lg:grid lg:min-h-dvh lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="bg-nero text-white lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto">
            <div className="flex items-center gap-6 px-5 py-4 lg:h-full lg:flex-col lg:items-stretch lg:gap-8 lg:py-7">
              <Link href="/" aria-label="Panoramica">
                <Marchio />
              </Link>
              <Suspense fallback={<div className="flex-1" />}>
                <MenuLaterale />
              </Suspense>
              <p className="mt-auto hidden text-sm font-extrabold text-brand lg:block">Fatturare. Fatturare. Fatturare.</p>
            </div>
          </aside>
          <div className="min-w-0">
            <div className="sticky top-0 z-30 border-b bg-background/90 px-4 py-3 backdrop-blur lg:px-8">
              <Suspense fallback={<div className="h-10" />}>
                <FilterBar />
              </Suspense>
            </div>
            <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
