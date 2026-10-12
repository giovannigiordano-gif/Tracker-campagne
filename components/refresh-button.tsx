"use client";
// Pulsante "Aggiorna dati": svuota la cache (di un cliente o globale) e ricarica i numeri da GHL
import { useFormStatus } from "react-dom";
import { RefreshCw } from "lucide-react";
import { aggiornaDati } from "@/app/actions";
import { Button } from "@/components/ui/button";

function Pulsante({ etichetta }: { etichetta: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      <RefreshCw className={pending ? "animate-spin" : ""} />
      {pending ? "Aggiornamento…" : etichetta}
    </Button>
  );
}

export function RefreshButton({ locationId, etichetta = "Aggiorna dati" }: { locationId?: string; etichetta?: string }) {
  return (
    <form action={aggiornaDati}>
      {locationId && <input type="hidden" name="locationId" value={locationId} />}
      <Pulsante etichetta={etichetta} />
    </form>
  );
}
