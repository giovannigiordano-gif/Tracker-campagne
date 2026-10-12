// Campo di testo: pillola come i pulsanti, bordo con contrasto >= 3:1, 16px sui telefoni (niente zoom su iOS).
import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

export const classeCampo = cn(
  "h-10 w-full min-w-0 rounded-control border border-input bg-card px-4 text-base text-titolo md:text-sm pointer-coarse:h-11",
  "transition-[border-color,background-color] motion-fast placeholder:text-muted-foreground",
  "hover:border-titolo disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
  "aria-invalid:border-danger aria-invalid:bg-danger-soft/40"
)

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <InputPrimitive type={type} data-slot="input" className={cn(classeCampo, className)} {...props} />
}

export { Input }
