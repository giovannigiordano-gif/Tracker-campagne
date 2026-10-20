"use client"
// Controllo a segmenti come su iPhone e Mac (es. "Lead / Venduto", "Giorni / Settimane"):
// binario grigio e una pillola bianca che scorre sotto la scelta attiva.
// È un gruppo di pulsanti con aria-pressed: ogni scelta dice se è attiva.
// Su schermi molto stretti le pillole scorrono di lato invece di uscire dalla pagina.
import { cn } from "cn"
import { Pillola, usePillola } from "./pillola"

export function Segmented<T extends string>({
  opzioni,
  valore,
  onChange,
  etichetta,
  className,
}: {
  opzioni: { v: T; label: string }[]
  valore: T
  onChange: (v: T) => void
  etichetta: string
  className?: string
}) {
  const { binario, stile, pronta, animata } = usePillola(valore)
  return (
    <div
      ref={binario}
      className={cn("relative inline-flex max-w-full overflow-x-auto rounded-control bg-muted p-1 [scrollbar-width:none]", className)}
      role="group"
      aria-label={etichetta}
    >
      <Pillola stile={stile} animata={animata} />
      {opzioni.map((o) => {
        const attiva = o.v === valore
        return (
          <button
            key={o.v}
            type="button"
            aria-pressed={attiva}
            data-attiva={attiva}
            onClick={() => onChange(o.v)}
            className={cn(
              "relative h-8 shrink-0 whitespace-nowrap rounded-control px-3 text-sm font-semibold transition-[color,transform] motion-fast active:scale-[0.96] pointer-coarse:h-10",
              attiva ? "text-titolo" : "text-muted-foreground hover:text-titolo",
              // Prima che la pillola sia misurata, la scelta attiva ha il suo fondo
              attiva && !pronta && "bg-raised shadow-raised"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
