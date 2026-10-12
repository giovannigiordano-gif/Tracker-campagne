"use client"
// Scelta singola a pillole (es. "Lead / Venduto", "Giorni / Settimane").
// È un gruppo di pulsanti con aria-pressed: ogni scelta dice se è attiva.
import { cn } from "cn"

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
  return (
    <div className={cn("inline-flex rounded-control bg-muted p-1", className)} role="group" aria-label={etichetta}>
      {opzioni.map((o) => (
        <button
          key={o.v}
          type="button"
          aria-pressed={o.v === valore}
          onClick={() => onChange(o.v)}
          className={cn(
            "h-8 rounded-control px-3 text-sm font-semibold transition-[background-color,color,box-shadow,transform] motion-fast active:scale-[0.96] pointer-coarse:h-10",
            o.v === valore
              ? "bg-raised text-titolo shadow-[0_1px_2px_rgb(0_0_0/0.08)]"
              : "text-muted-foreground hover:text-titolo"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
