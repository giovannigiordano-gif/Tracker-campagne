"use client";
// Barra dei filtri globali, sempre in alto: periodo (7/30/90 giorni o date scelte)
// e confronto con il periodo precedente. Tutto sta nell'indirizzo della pagina.
// Nella pagina condivisa con un cliente (condivisa=true) mancano le scorciatoie da tastiera e il titolo compatto.
// Da 1024px, tra i controlli compare il titolo della pagina quando quello grande è scorso via (firma Apple).
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pillola, usePillola } from "@/components/ui/pillola";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ALTEZZA_BARRA, TitoloCompatto } from "./barra-strumenti";
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
  const scelta = personalizzato ? "date" : periodo;
  const { binario, stile, pronta, animata } = usePillola(scelta);

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
      <div className="flex h-10 items-center justify-end gap-4">
        <TitoloCompatto margineAlto={ALTEZZA_BARRA} className="hidden min-w-0 flex-1 text-center lg:block" />
        <Scorciatoie />
      </div>
    );
  }

  const oggi = new Date().toISOString().slice(0, 10);
  const dateValide = !!da && !!a && da <= a;
  // Controllo a segmenti come su iPhone e Mac: binario grigio, pillola bianca che scorre sotto la scelta
  const pillola = (attiva: boolean) =>
    cn(
      "relative h-8 rounded-control px-3.5 text-sm font-semibold transition-[color,transform] motion-fast active:scale-[0.96] pointer-coarse:h-10",
      attiva ? "text-titolo" : "text-muted-foreground hover:text-titolo",
      attiva && !pronta && "bg-raised shadow-raised"
    );

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-busy={inCorso}>
      <div ref={binario} className="relative inline-flex rounded-control bg-muted p-1" role="group" aria-label="Periodo">
        <Pillola stile={stile} animata={animata} />
        {PRESET.map((p) => (
          <button
            key={p.v}
            type="button"
            aria-pressed={!personalizzato && periodo === p.v}
            data-attiva={!personalizzato && periodo === p.v}
            onClick={() => { setPersonalizzato(false); aggiorna({ periodo: p.v, da: null, a: null }); }}
            className={pillola(!personalizzato && periodo === p.v)}
          >
            {p.label}
          </button>
        ))}
        <button type="button" aria-pressed={personalizzato} data-attiva={personalizzato} onClick={() => setPersonalizzato(true)} className={pillola(personalizzato)}>
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

      {!condivisa && <TitoloCompatto margineAlto={ALTEZZA_BARRA} className="hidden min-w-0 flex-1 text-center lg:block" />}

      <label className="flex items-center gap-2.5 text-sm font-medium text-titolo sm:ml-auto">
        <Switch checked={confronto} onCheckedChange={(v) => aggiorna({ confronto: v ? null : "0" })} />
        {/* Tra 1024 e 1279px la barra è stretta: etichetta breve a schermo, frase intera per i lettori di schermo */}
        <span aria-hidden className="hidden lg:inline xl:hidden">Confronta</span>
        <span className="lg:sr-only xl:not-sr-only">Confronta con il periodo precedente</span>
      </label>

      {!condivisa && <Scorciatoie />}
      {inCorso && <span className="sr-only" role="status">Aggiornamento dei dati in corso</span>}
    </div>
  );
}
