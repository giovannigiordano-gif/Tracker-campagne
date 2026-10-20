// Area di testo: stesso bordo e stati dei campi, angoli da blocco interno (14px).
import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-24 w-full rounded-block border border-input bg-card px-4 py-3 text-base text-titolo md:text-sm",
        "transition-[border-color,box-shadow] motion-fast placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--brand)_28%,transparent)] focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-danger",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
