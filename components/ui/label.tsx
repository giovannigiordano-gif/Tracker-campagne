"use client"
// Etichetta dei campi: sempre sopra il campo, mai al posto del segnaposto.
import * as React from "react"
import { cn } from "cn"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("text-label text-titolo peer-disabled:cursor-not-allowed peer-disabled:opacity-60", className)}
      {...props}
    />
  )
}

export { Label }
