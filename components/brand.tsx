// Marchio SalesProcess: simbolo a gradini arancio (quadrati pieni) + scritta "salesprocess" in minuscolo.
// Ridisegnato in SVG perché il file ufficiale non è nel progetto: per usare quello ufficiale
// mettilo in public/ e sostituisci <Simbolo /> con un <img>.
import { cn } from "@/lib/utils";

export function Simbolo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden className={className}>
      <rect x="14" y="0" width="10" height="10" fill="var(--brand)" />
      <rect x="6" y="10" width="8" height="8" fill="var(--brand)" />
      <rect x="14" y="18" width="6" height="6" fill="var(--brand)" />
      <rect x="2" y="22" width="4" height="4" fill="var(--brand)" />
    </svg>
  );
}

export function Marchio({ conTagline = false, className }: { conTagline?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Simbolo />
      <span className="flex flex-col leading-none">
        <span className="text-[1.375rem] font-bold tracking-tight text-inverse-foreground">salesprocess</span>
        <span className="mt-1 text-caption text-inverse-muted">{conTagline ? "Fatturare. Fatturare. Fatturare." : "Insights"}</span>
      </span>
    </span>
  );
}
