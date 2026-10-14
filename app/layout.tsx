// Impaginazione di base, comune a tutte le pagine: carattere, tema, notifiche.
// Il menu laterale dell'agenzia sta in app/(agenzia)/layout.tsx; la pagina condivisa con i clienti
// ha la sua impaginazione in app/(condivisa)/layout.tsx, senza menu.
import type { Metadata } from "next";
import { Red_Hat_Display } from "next/font/google";
import { SCRIPT_TEMA } from "@/components/shell/theme-toggle";
import { NotificheProvider } from "@/components/ui/toast";
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
          {children}
        </NotificheProvider>
      </body>
    </html>
  );
}
