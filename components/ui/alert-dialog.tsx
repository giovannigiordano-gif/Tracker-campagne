"use client"
// Conferma per le azioni distruttive: titolo che dice cosa succede, spiegazione delle conseguenze,
// pulsante rosso con il verbo dell'azione e "Annulla" sempre disponibile (anche con Esc).
import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import { cn } from "cn"

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogClose = AlertDialogPrimitive.Close

function AlertDialogContent({ className, children, ...props }: AlertDialogPrimitive.Popup.Props) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop
        className={cn(
          "fixed inset-0 z-[var(--z-modal)] min-h-dvh bg-black/50 transition-opacity motion-base",
          "data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-[var(--dur-fast)]"
        )}
      />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-[var(--z-modal)] flex w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-stack",
          "rounded-panel bg-card p-panel text-foreground shadow-overlay outline-none",
          "transition-[opacity,scale] motion-base data-starting-style:scale-[0.96] data-starting-style:opacity-0",
          "data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-ending-style:duration-[var(--dur-fast)]",
          className
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Popup>
    </AlertDialogPrimitive.Portal>
  )
}

function AlertDialogTitle({ className, ...props }: AlertDialogPrimitive.Title.Props) {
  return <AlertDialogPrimitive.Title className={cn("text-section", className)} {...props} />
}

function AlertDialogDescription({ className, ...props }: AlertDialogPrimitive.Description.Props) {
  return <AlertDialogPrimitive.Description className={cn("text-body text-muted-foreground", className)} {...props} />
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
}

export { AlertDialog, AlertDialogTrigger, AlertDialogClose, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter }
