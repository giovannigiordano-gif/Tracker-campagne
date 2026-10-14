// Pagina "non trovato": per esempio un cliente tolto dall'app o un indirizzo sbagliato.
import Link from "next/link";
import { Simbolo } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";

export default function NonTrovato() {
  return (
    <div className="flex max-w-xl flex-col items-start gap-5 py-10">
      <Simbolo size={36} />
      <h1 className="text-title">Qui non c&apos;è niente</h1>
      <p className="text-body text-muted-foreground">
        La pagina che cerchi non esiste, oppure il cliente non è più tra quelli che segui. Torna alla panoramica o
        controlla l&apos;elenco dei clienti in Impostazioni.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/" className={buttonVariants()}>Vai alla panoramica</Link>
        <Link href="/impostazioni" className={buttonVariants({ variant: "outline" })}>Apri Impostazioni</Link>
      </div>
    </div>
  );
}
