// Messaggio in pagina (errore, attenzione, informazione): icona + testo, mai solo colore.
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const alertVariants = cva(
  "grid w-full grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 rounded-block p-4 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground [&>svg]:text-titolo",
        destructive: "bg-danger-soft text-foreground [&>svg]:text-danger",
        warning: "bg-warning-soft text-foreground [&>svg]:text-warning",
        success: "bg-success-soft text-foreground [&>svg]:text-success",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-title" className={cn("col-start-2 font-semibold text-titolo", className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("col-start-2 text-foreground [&_p]:leading-relaxed", className)} {...props} />
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-action" className={cn("col-start-2 mt-2 flex flex-wrap gap-2", className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
