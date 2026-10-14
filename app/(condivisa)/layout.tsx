// Impaginazione della pagina condivisa con un cliente: barra del marchio e contenuto.
// Nessun menu: chi apre il link vede solo la dashboard del suo cliente (la barra del periodo è nella pagina,
// così non compare quando il link non è valido).
import type { Metadata } from "next";
import { Marchio } from "@/components/brand";

// Pagine da non indicizzare; il codice del link non va mandato ad altri siti
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function LayoutCondivisa({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="superficie-inversa bg-inverse text-inverse-foreground">
        <div className="mx-auto flex w-full max-w-[96rem] items-center px-4 py-3 lg:px-8">
          <Marchio />
        </div>
      </header>
      <main id="contenuto" tabIndex={-1} className="px-4 py-6 outline-none lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-[96rem]">{children}</div>
      </main>
    </div>
  );
}
