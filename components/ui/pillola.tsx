"use client";
// Pillola che scorre sotto la scelta attiva, come nei controlli a segmenti di iPhone e Mac:
// un solo "pollice" bianco che si sposta e si allarga, invece di accendere e spegnere i pulsanti.
// Uso: il binario ha ref={binario} e "relative"; la scelta attiva ha data-attiva="true";
// <Pillola stile={stile} /> va dentro il binario. Finché la misura non è pronta (primo disegno, server)
// la scelta attiva mostra il proprio fondo: niente salti né pillole fuori posto.
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function usePillola<T extends HTMLElement = HTMLDivElement>(chiaveAttiva: string | null | undefined) {
  const binario = useRef<T>(null);
  const [stile, setStile] = useState<React.CSSProperties | null>(null);
  const [animata, setAnimata] = useState(false);

  useEffect(() => {
    const el = binario.current;
    if (!el) return;
    const misura = () => {
      const scelta = el.querySelector<HTMLElement>('[data-attiva="true"]');
      if (!scelta) return setStile(null);
      setStile({
        width: scelta.offsetWidth,
        height: scelta.offsetHeight,
        transform: `translate(${scelta.offsetLeft}px, ${scelta.offsetTop}px)`,
      });
    };
    misura();
    // Dopo la prima misura la pillola può scorrere (al primo disegno compare già al suo posto)
    const id = requestAnimationFrame(() => setAnimata(true));
    const osservatore = new ResizeObserver(misura);
    osservatore.observe(el);
    return () => {
      cancelAnimationFrame(id);
      osservatore.disconnect();
    };
  }, [chiaveAttiva]);

  return { binario, stile, pronta: stile !== null, animata };
}

export function Pillola({ stile, animata, className }: { stile: React.CSSProperties | null; animata: boolean; className?: string }) {
  if (!stile) return null;
  return (
    <span
      aria-hidden
      style={stile}
      className={cn(
        "pointer-events-none absolute top-0 left-0 rounded-control bg-raised shadow-raised",
        animata && "transition-[transform,width,height] motion-slow",
        className
      )}
    />
  );
}
