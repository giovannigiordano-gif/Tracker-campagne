"use client";
// Pagina mostrata quando qualcosa va storto in modo imprevisto: spiega cosa fare invece
// di mostrare la pagina tecnica di Next.js.
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Simbolo } from "@/components/brand";
import { Button, buttonVariants } from "@/components/ui/button";

export default function Errore({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="flex max-w-xl flex-col items-start gap-5 py-10">
      <Simbolo size={36} />
      <h1 className="text-title">Questa pagina non si è caricata</h1>
      <p className="text-body text-muted-foreground">
        Qualcosa è andato storto mentre leggevamo i dati. Di solito basta riprovare: se il problema resta, controlla in
        Impostazioni che i token dei clienti siano ancora validi.
      </p>
      {error.digest && <p className="text-caption text-muted-foreground">Codice per l&apos;assistenza: {error.digest}</p>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => retry()}>
          <RotateCcw aria-hidden /> Riprova
        </Button>
        <Link href="/impostazioni" className={buttonVariants({ variant: "outline" })}>Apri Impostazioni</Link>
      </div>
    </div>
  );
}
