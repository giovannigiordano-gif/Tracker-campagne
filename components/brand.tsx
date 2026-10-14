// Marchio SalesProcess.
// - Marchio: il logo ufficiale (public/brand/salesprocess-logo.png: scritta bianca, simbolo e motto arancio).
//   È pensato per fondi scuri: si usa solo sulle barre nere (menu e pagina condivisa).
// - Simbolo: i cinque quadrati a zig-zag del logo, ridisegnati in vettoriale con le misure del file ufficiale,
//   per l'icona del browser e le pagine di errore (funziona su fondo chiaro e scuro).
import Image from "next/image";
import { cn } from "@/lib/utils";

// Quadrati del simbolo (unità = pixel del logo ufficiale alto 68 px)
const QUADRATI = [
  { x: 17.5, y: 0, lato: 20.5 },
  { x: 0, y: 20, lato: 17.5 },
  { x: 17, y: 37.5, lato: 13 },
  { x: 30.8, y: 50.6, lato: 10.5 },
  { x: 22.7, y: 61.6, lato: 7.8 },
];
const LARGHEZZA = 41.5;
const ALTEZZA = 69.4;

export function Simbolo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      height={size}
      width={(size * LARGHEZZA) / ALTEZZA}
      viewBox={`0 0 ${LARGHEZZA} ${ALTEZZA}`}
      aria-hidden
      className={className}
    >
      {QUADRATI.map((q) => (
        <rect key={q.y} x={q.x} y={q.y} width={q.lato} height={q.lato} rx="0.8" fill="var(--brand)" />
      ))}
    </svg>
  );
}

// Logo ufficiale mostrato a metà della sua larghezza (293 px): nitido anche sugli schermi ad alta densità
export function Marchio({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/salesprocess-logo.png"
      alt="SalesProcess"
      width={147}
      height={34}
      priority
      unoptimized
      className={cn("h-[34px] w-auto", className)}
    />
  );
}
