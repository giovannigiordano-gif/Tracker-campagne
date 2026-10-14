"use client";
// Modulo della password: campo con "mostra/nascondi", errore sotto il campo, pulsante con stato di attesa.
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { accedi } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Entra() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      {!pending && <LogIn aria-hidden />}
      {pending ? "Verifica in corso" : "Entra"}
    </Button>
  );
}

export function ModuloAccesso({ da }: { da: string }) {
  const [esito, azione] = useActionState(accedi, null);
  const [visibile, setVisibile] = useState(false);
  const [tentativo, setTentativo] = useState(0); // cambia a ogni risposta: il messaggio d'errore si riscuote
  useEffect(() => {
    if (esito) setTentativo((t) => t + 1);
  }, [esito]);
  const errore = esito && !esito.ok ? esito.messaggio : null;

  return (
    <form action={azione} className="flex flex-col gap-4">
      <input type="hidden" name="da" value={da} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
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
      <Entra />
    </form>
  );
}
