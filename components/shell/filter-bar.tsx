"use client";
// Barra dei filtri globali, sempre in alto: periodo (7/30/90 giorni o date scelte)
// e confronto con il periodo precedente. Tutto sta nell'indirizzo della pagina.
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESET = [
  { v: "7", label: "7 giorni" },
  { v: "30", label: "30 giorni" },
  { v: "90", label: "90 giorni" },
];

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [inCorso, startTransition] = useTransition();
  const periodo = params.get("periodo") ?? "30";
  const confronto = params.get("confronto") !== "0";
  const [personalizzato, setPersonalizzato] = useState(periodo === "custom");
  const [da, setDa] = useState(params.get("da") ?? "");
  const [a, setA] = useState(params.get("a") ?? "");

  function aggiorna(modifiche: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(modifiche)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  }

  // In Impostazioni il periodo non serve
  if (pathname.startsWith("/impostazioni")) return <p className="py-1.5 text-sm text-muted-foreground">Configurazione dell&apos;app</p>;

  const oggi = new Date().toISOString().slice(0, 10);
  const dateValide = !!da && !!a && da <= a;

  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", inCorso && "opacity-70")} aria-busy={inCorso}>
      <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-border" role="group" aria-label="Periodo">
        {PRESET.map((p) => (
          <button
            key={p.v}
            type="button"
            aria-pressed={!personalizzato && periodo === p.v}
            onClick={() => { setPersonalizzato(false); aggiorna({ periodo: p.v, da: null, a: null }); }}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              !personalizzato && periodo === p.v ? "bg-nero text-white" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={personalizzato}
          onClick={() => setPersonalizzato(true)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
            personalizzato ? "bg-nero text-white" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Date
        </button>
      </div>

      {personalizzato && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => { e.preventDefault(); if (dateValide) aggiorna({ periodo: "custom", da, a }); }}
        >
          <Input type="date" aria-label="Dal" value={da} max={oggi} onChange={(e) => setDa(e.target.value)} className="h-9 w-40 rounded-full bg-white" />
          <span className="text-sm text-muted-foreground">al</span>
          <Input type="date" aria-label="Al" value={a} max={oggi} onChange={(e) => setA(e.target.value)} className="h-9 w-40 rounded-full bg-white" />
          <Button type="submit" size="sm" disabled={!dateValide}>Applica</Button>
        </form>
      )}

      <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm font-medium">
        <span className="relative inline-flex">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={confronto}
            onChange={(e) => aggiorna({ confronto: e.target.checked ? null : "0" })}
          />
          <span className="h-5 w-9 rounded-full bg-input transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-ring" />
          <span className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
        </span>
        Confronta con il periodo precedente
      </label>
    </div>
  );
}
