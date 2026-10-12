"use client";
// "Aggiorna i dati": svuota la cache (di un cliente o di tutti) e rilegge i numeri da GHL.
// Mostra l'avanzamento sul pulsante e una notifica a lavoro finito. Scorciatoia: R.
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { aggiornaDati } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { useNotifica } from "@/components/ui/toast";

export function RefreshButton({ locationId, etichetta = "Aggiorna i dati" }: { locationId?: string; etichetta?: string }) {
  const [inCorso, startTransition] = useTransition();
  const notifica = useNotifica();

  function aggiorna() {
    const fd = new FormData();
    if (locationId) fd.set("locationId", locationId);
    startTransition(async () => {
      try {
        await aggiornaDati(fd);
        notifica("successo", "Dati aggiornati", "Numeri appena riletti da GoHighLevel.");
      } catch {
        notifica("errore", "Aggiornamento non riuscito", "Controlla la connessione e riprova tra un momento.");
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={aggiorna} loading={inCorso} data-scorciatoia="aggiorna" aria-keyshortcuts="R">
      {!inCorso && <RefreshCw aria-hidden />}
      {inCorso ? "Aggiornamento in corso" : etichetta}
    </Button>
  );
}
