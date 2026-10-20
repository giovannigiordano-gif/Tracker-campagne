"use client";
// Indice delle sezioni della pagina cliente: resta in alto e segna la sezione che stai guardando.
// sottoBarra: true quando sopra c'è la barra dei filtri fissa (pagine dell'agenzia), false nella pagina condivisa.
import { useEffect, useState } from "react";
import { Pillola, usePillola } from "@/components/ui/pillola";
import { cn } from "@/lib/utils";

export function SectionNav({ sezioni, sottoBarra = true }: { sezioni: { id: string; label: string }[]; sottoBarra?: boolean }) {
  const [attiva, setAttiva] = useState(sezioni[0]?.id);
  const { binario, stile, pronta, animata } = usePillola<HTMLUListElement>(attiva);

  useEffect(() => {
    const osservatore = new IntersectionObserver(
      (voci) => {
        const visibili = voci.filter((v) => v.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visibili[0]) setAttiva(visibili[0].target.id);
      },
      { rootMargin: "-120px 0px -55% 0px" }
    );
    for (const s of sezioni) {
      const el = document.getElementById(s.id);
      if (el) osservatore.observe(el);
    }
    return () => osservatore.disconnect();
  }, [sezioni]);

  return (
    <nav
      aria-label="Sezioni della pagina"
      className={cn(
        "vetro sticky z-[calc(var(--z-sticky)-1)] -mx-4 hidden overflow-x-auto px-4 py-2 lg:-mx-8 lg:block lg:px-8",
        sottoBarra ? "top-16" : "top-0"
      )}
    >
      <ul ref={binario} className="relative flex w-max gap-0.5 rounded-control bg-muted p-1">
        <Pillola stile={stile} animata={animata} />
        {sezioni.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={attiva === s.id ? "true" : undefined}
              data-attiva={attiva === s.id}
              className={cn(
                "relative inline-flex h-8 items-center rounded-control px-3.5 text-sm font-semibold transition-colors motion-fast",
                attiva === s.id ? "text-titolo" : "text-muted-foreground hover:text-titolo",
                attiva === s.id && !pronta && "bg-raised shadow-raised"
              )}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
