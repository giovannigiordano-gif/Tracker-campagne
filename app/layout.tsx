import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { NavLinks } from "@/components/nav-links";
import { PeriodPicker } from "@/components/period-picker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agency Insights",
  description: "Dashboard interna: GoHighLevel + Meta Ads",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="text-base font-semibold tracking-tight">
              Agency Insights
            </Link>
            {/* Menu e periodo leggono l'indirizzo della pagina: vanno in Suspense */}
            <Suspense fallback={<div className="h-8 w-48" />}>
              <NavLinks />
            </Suspense>
            <div className="ml-auto">
              <Suspense fallback={<div className="h-8 w-80" />}>
                <PeriodPicker />
              </Suspense>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
