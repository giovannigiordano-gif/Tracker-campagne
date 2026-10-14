"use client";
// Errore imprevisto fuori dalle pagine dell'agenzia (per esempio nella pagina condivisa con un cliente).
// Testo neutro, senza riferimenti a token o Impostazioni. Le pagine dell'agenzia hanno il loro
// messaggio in app/(agenzia)/error.tsx.
import { RotateCcw } from "lucide-react";
import { Simbolo } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function ErroreGenerico({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main id="contenuto" tabIndex={-1} className="mx-auto flex max-w-xl flex-col items-start gap-5 px-4 py-10 outline-none">
      <Simbolo size={36} />
      <h1 className="text-title">Dati momentaneamente non disponibili</h1>
      <p className="text-body text-muted-foreground">Riprova tra qualche minuto.</p>
      <Button onClick={() => retry()}>
        <RotateCcw aria-hidden /> Riprova
      </Button>
    </main>
  );
}
