// Marchio Sales Process: simbolo a gradini arancio + scritta "salesprocess".
// Disegnato in SVG per non dipendere da file esterni; se vuoi il logo ufficiale,
// metti il file in public/ e sostituisci <Simbolo /> con un <img>.
export function Simbolo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
      <rect x="14" y="0" width="10" height="10" fill="var(--brand)" />
      <rect x="6" y="10" width="8" height="8" fill="var(--brand)" />
      <rect x="14" y="18" width="6" height="6" fill="var(--brand)" />
      <rect x="2" y="22" width="4" height="4" fill="var(--brand)" />
    </svg>
  );
}

export function Marchio() {
  return (
    <span className="flex items-center gap-2.5">
      <Simbolo />
      <span className="flex flex-col leading-none">
        <span className="text-[1.35rem] font-bold tracking-tight text-white">salesprocess</span>
        <span className="mt-1 text-xs font-medium text-white/55">Insights per l&apos;agenzia</span>
      </span>
    </span>
  );
}
