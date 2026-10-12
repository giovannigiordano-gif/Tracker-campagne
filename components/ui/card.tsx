// Pannello: il contenitore delle sezioni. Piatto come il sito (niente ombre), angoli da 22px.
// Varianti: default (superficie bianca/antracite) e inverse (nero del marchio).
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const cardVariants = cva("flex min-w-0 flex-col gap-stack rounded-panel p-panel", {
  variants: {
    variant: {
      default: "bg-card text-foreground ring-1 ring-border",
      inverse: "superficie-inversa bg-inverse text-inverse-foreground",
      muted: "bg-muted text-foreground",
    },
  },
  defaultVariants: { variant: "default" },
})

function Card({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return <div data-slot="card" className={cn(cardVariants({ variant }), className)} {...props} />
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1", className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 data-slot="card-title" className={cn("text-section", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("min-w-0", className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, cardVariants }
