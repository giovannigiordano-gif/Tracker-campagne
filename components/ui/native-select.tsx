// Menu a tendina: <select> nativo (accessibile e affidabile su telefono) con l'aspetto dei campi.
import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "cn"
import { classeCampo } from "./input"

function NativeSelect({ className, wrapperClassName, ...props }: React.ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <span className={cn("relative inline-flex", wrapperClassName)}>
      <select data-slot="native-select" className={cn(classeCampo, "cursor-pointer appearance-none pr-10 font-semibold", className)} {...props} />
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </span>
  )
}

export { NativeSelect }
