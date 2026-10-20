"use client";
// Barra degli strumenti in alto, come nelle app Apple:
// - in cima alla pagina è trasparente; appena il contenuto ci scorre sotto diventa vetro con un filo sotto;
// - il titolo grande della pagina, quando esce dalla vista, ricompare piccolo nella barra, nello spazio
//   tra i controlli (i "large title" di iOS e macOS). Su telefono compare al centro della barra del marchio.
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const ALTEZZA_BARRA = 64; // px, da 1024px in su (l'indice delle sezioni si aggancia subito sotto)

// La pagina è scorsa? (per il vetro e il filo della barra)
function useScorrimento() {
  const [scorsa, setScorsa] = useState(false);
  useEffect(() => {
    const aggiorna = () => setScorsa(window.scrollY > 2);
    aggiorna();
    window.addEventListener("scroll", aggiorna, { passive: true });
    return () => window.removeEventListener("scroll", aggiorna);
  }, []);
  return scorsa;
}

// Titolo grande visibile della pagina (Next tiene in memoria, nascosta, la pagina precedente)
function titoloVisibile() {
  return [...document.querySelectorAll<HTMLElement>("#contenuto h1")].find((h) => h.offsetParent !== null) ?? null;
}

// Testo del titolo grande e se è già scorso sotto la barra alta `margineAlto` px
// Non legge l'indirizzo della pagina (bloccherebbe la preparazione in anticipo della barra): quando si cambia
// pagina cambia il contenuto, e l'osservatore delle modifiche riaggancia il nuovo titolo.
function useTitoloScorso(margineAlto: number) {
  const [stato, setStato] = useState({ testo: "", nascosto: false });

  useEffect(() => {
    let osservato: HTMLElement | null = null;
    const intersezioni = new IntersectionObserver(
      ([voce]) => {
        const sopra = !voce.isIntersecting && voce.boundingClientRect.top < margineAlto;
        setStato({ testo: osservato?.textContent?.trim() ?? "", nascosto: sopra });
      },
      { rootMargin: `-${margineAlto}px 0px 0px 0px` }
    );
    const aggancia = () => {
      const h1 = titoloVisibile();
      if (h1 === osservato) return;
      if (osservato) intersezioni.unobserve(osservato);
      osservato = h1;
      if (h1) intersezioni.observe(h1);
      else setStato({ testo: "", nascosto: false });
    };
    aggancia();
    // Il contenuto arriva a pezzi (caricamenti in corso): si riaggancia quando cambia
    const mutazioni = new MutationObserver(aggancia);
    const contenuto = document.getElementById("contenuto");
    if (contenuto) mutazioni.observe(contenuto, { childList: true, subtree: true });
    return () => {
      intersezioni.disconnect();
      mutazioni.disconnect();
    };
  }, [margineAlto]);

  return stato;
}

// Titolo piccolo che entra quando quello grande è scorso via. Nascosto ai lettori di schermo: ripete l'h1.
export function TitoloCompatto({ margineAlto, className }: { margineAlto: number; className?: string }) {
  const { testo, nascosto } = useTitoloScorso(margineAlto);
  return (
    <span
      aria-hidden
      data-titolo-compatto
      data-visibile={nascosto && testo ? "" : undefined}
      className={cn(
        "pointer-events-none truncate text-[0.9375rem] font-semibold text-titolo transition-[opacity,translate] motion-base",
        nascosto && testo ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        className
      )}
    >
      {testo}
    </span>
  );
}

export function BarraStrumenti({ children }: { children: React.ReactNode }) {
  const scorsa = useScorrimento();
  return (
    <div
      className={cn(
        "z-[var(--z-sticky)] px-4 py-3 transition-[background-color,box-shadow] motion-base lg:sticky lg:top-0 lg:h-16 lg:px-8",
        scorsa && "lg:vetro lg:shadow-[inset_0_-1px_0_var(--border)]"
      )}
    >
      {/* Il titolo compatto sta dentro la barra dei filtri, nello spazio libero tra i controlli */}
      <div className="mx-auto w-full max-w-[96rem]">{children}</div>
    </div>
  );
}
