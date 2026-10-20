// Campo di testo: capsula come i pulsanti, bordo con contrasto >= 3:1, 16px sui telefoni (niente zoom su iOS).
// Focus come su macOS: bordo arancio profondo e alone arancio morbido attorno al campo.
import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

export const classeCampo = cn(
  "h-10 w-full min-w-0 rounded-control border border-input bg-card px-4 text-base text-titolo md:text-sm pointer-coarse:h-11",
  "transition-[border-color,background-color,box-shadow] motion-fast placeholder:text-muted-foreground",
  "focus-visible:border-ring focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--brand)_28%,transparent)] focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
  "aria-invalid:border-danger aria-invalid:bg-danger-soft/40"
)

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <InputPrimitive type={type} data-slot="input" className={cn(classeCampo, className)} {...props} />
}

export { Input }
