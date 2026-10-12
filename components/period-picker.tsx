"use client";
// Filtro globale del periodo: 7, 30, 90 giorni o intervallo personalizzato.
// Il periodo sta nell'indirizzo della pagina (?periodo=...), così resta anche cambiando pagina.
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESET = ["7", "30", "90"] as const;

export function PeriodPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const attuale = params.get("periodo") ?? "30";
  const [mostraDate, setMostraDate] = useState(attuale === "custom");
  const [da, setDa] = useState(params.get("da") ?? "");
  const [a, setA] = useState(params.get("a") ?? "");

  function vai(nuovi: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    for (const k of ["periodo", "da", "a"]) p.delete(k);
    for (const [k, v] of Object.entries(nuovi)) p.set(k, v);
    router.push(`${pathname}?${p.toString()}`);
  }

  const oggi = new Date().toISOString().slice(0, 10);
  const dateValide = da && a && da <= a;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg bg-muted p-0.5" role="group" aria-label="Periodo">
        {PRESET.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => { setMostraDate(false); vai({ periodo: p }); }}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              attuale === p && !mostraDate ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p} giorni
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMostraDate(true)}
          className={cn(
            "rounded-md px-3 py-1 text-sm font-medium transition-colors",
            mostraDate ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Personalizzato
        </button>
      </div>
      {mostraDate && (
        <form
          className="flex items-center gap-1.5"
          onSubmit={(e) => { e.preventDefault(); if (dateValide) vai({ periodo: "custom", da, a }); }}
        >
          <Input type="date" aria-label="Dal" value={da} max={oggi} onChange={(e) => setDa(e.target.value)} className="h-8 w-36" />
          <span className="text-sm text-muted-foreground">–</span>
          <Input type="date" aria-label="Al" value={a} max={oggi} onChange={(e) => setA(e.target.value)} className="h-8 w-36" />
          <Button type="submit" size="sm" disabled={!dateValide}>Applica</Button>
        </form>
      )}
    </div>
  );
}
