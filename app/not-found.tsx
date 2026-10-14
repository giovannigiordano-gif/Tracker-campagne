// Indirizzo inesistente (per esempio un link copiato male).
// Testo neutro, senza collegamenti all'app: può vederlo anche un cliente.
import { Simbolo } from "@/components/brand";

export default function IndirizzoInesistente() {
  return (
    <main id="contenuto" tabIndex={-1} className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-5 px-4 py-10 outline-none">
      <Simbolo size={36} />
      <h1 className="text-title">Pagina non trovata</h1>
      <p className="text-body text-muted-foreground">
        L&apos;indirizzo non corrisponde a nessuna pagina. Se qualcuno ti ha mandato questo link, chiedigliene uno nuovo.
      </p>
    </main>
  );
}
