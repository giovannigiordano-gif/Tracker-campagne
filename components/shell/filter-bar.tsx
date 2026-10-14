"use client";
// Barra dei filtri globali, sempre in alto: periodo (7/30/90 giorni o date scelte)
// e confronto con il periodo precedente. Tutto sta nell'indirizzo della pagina.
// Nella pagina condivisa con un cliente (condivisa=true) mancano le scorciatoie da tastiera.
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Scorciatoie } from "./scorciatoie";

const PRESET = [
  { v: "7", label: "7 giorni" },
  { v: "30", label: "30 giorni" },
  { v: "90", label: "90 giorni" },
];

export function FilterBar({ condivisa = false }: { condivisa?: boolean }) {
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
  if (pathname.startsWith("/impostazioni")) {
    return (
      <div className="flex h-10 items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Configura clienti, token e cache dell&apos;app</p>
        <Scorciatoie />
      </div>
    );
  }

  const oggi = new Date().toISOString().slice(0, 10);
  const dateValide = !!da && !!a && da <= a;
  const pillola = (attiva: boolean) =>
    cn(
      "h-8 rounded-control px-3.5 text-sm font-semibold transition-[background-color,color,transform] motion-fast active:scale-[0.96] pointer-coarse:h-10",
      attiva ? "bg-titolo text-background" : "text-muted-foreground hover:text-titolo"
    );

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-busy={inCorso}>
      <div className="inline-flex rounded-control bg-card p-1 ring-1 ring-border" role="group" aria-label="Periodo">
        {PRESET.map((p) => (
          <button
            key={p.v}
            type="button"
            aria-pressed={!personalizzato && periodo === p.v}
            onClick={() => { setPersonalizzato(false); aggiorna({ periodo: p.v, da: null, a: null }); }}
            className={pillola(!personalizzato && periodo === p.v)}
          >
            {p.label}
          </button>
        ))}
        <button type="button" aria-pressed={personalizzato} onClick={() => setPersonalizzato(true)} className={pillola(personalizzato)}>
          Date
        </button>
      </div>

      {personalizzato && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => { e.preventDefault(); if (dateValide) aggiorna({ periodo: "custom", da, a }); }}
        >
          <Input type="date" aria-label="Dal" value={da} max={oggi} onChange={(e) => setDa(e.target.value)} className="w-40" />
          <span className="text-sm text-muted-foreground">al</span>
          <Input type="date" aria-label="Al" value={a} max={oggi} onChange={(e) => setA(e.target.value)} className="w-40" />
          <Button type="submit" size="sm" disabled={!dateValide}>Applica</Button>
        </form>
      )}

      <label className="ml-auto flex items-center gap-2.5 text-sm font-medium text-titolo">
        <Switch checked={confronto} onCheckedChange={(v) => aggiorna({ confronto: v ? null : "0" })} />
        Confronta con il periodo precedente
      </label>

      {!condivisa && <Scorciatoie />}
      {inCorso && <span className="sr-only" role="status">Aggiornamento dei dati in corso</span>}
    </div>
  );
}
