"use client";
// Modulo di consenso del connettore: password dell'app, "Consenti" e "Annulla".
// Se la password è giusta il browser torna su Claude con il codice del collegamento.
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Eye, EyeOff } from "lucide-react";
import { autorizzaConnettore } from "@/app/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Consenti({ fatto }: { fatto: boolean }) {
  const { pending } = useFormStatus();
  const attesa = pending || fatto;
  return (
    <Button type="submit" loading={attesa} className="flex-1">
      {!attesa && <Check aria-hidden />}
      {fatto ? "Torno su Claude" : pending ? "Verifica in corso" : "Consenti"}
    </Button>
  );
}

export function ModuloConsenso({ campi, annulla }: { campi: Record<string, string>; annulla: string }) {
  const [esito, azione] = useActionState(autorizzaConnettore, null);
  const [visibile, setVisibile] = useState(false);
  const [tentativo, setTentativo] = useState(0); // cambia a ogni risposta: il messaggio d'errore si riscuote
  useEffect(() => {
    if (!esito) return;
    if (esito.ok) window.location.assign(esito.indirizzo);
    else setTentativo((t) => t + 1);
  }, [esito]);
  const errore = esito && !esito.ok ? esito.messaggio : null;

  return (
    <form action={azione} className="flex flex-col gap-4">
      {Object.entries(campi).map(([nome, valore]) => (
        <input key={nome} type="hidden" name={nome} value={valore} />
      ))}
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password dell&apos;app</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={visibile ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            required
            aria-invalid={errore ? true : undefined}
            aria-describedby={errore ? "errore-password" : undefined}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setVisibile((v) => !v)}
            aria-label={visibile ? "Nascondi la password" : "Mostra la password"}
            aria-pressed={visibile}
            className="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-control text-muted-foreground transition-colors motion-fast hover:bg-muted hover:text-titolo"
          >
            {visibile ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
        {errore && (
          <p key={tentativo} id="errore-password" role="alert" className="text-sm font-medium text-danger motion-safe:animate-scuoti">
            {errore}
          </p>
        )}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <a href={annulla} className={buttonVariants({ variant: "outline", className: "flex-1" })}>
          Annulla
        </a>
        <Consenti fatto={!!esito?.ok} />
      </div>
    </form>
  );
}
