"use client"
// Finestra modale: si apre con dissolvenza e leggero ingrandimento, si chiude con Esc o con la X.
// Usata anche come pannello laterale (menu su telefono) con la variante "lato".
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"
import { cn } from "cn"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close
const DialogPortal = DialogPrimitive.Portal

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-[var(--z-modal)] min-h-dvh bg-black/50 transition-opacity motion-base",
        "data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-[var(--dur-fast)]",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  lato = false,
  ...props
}: DialogPrimitive.Popup.Props & { lato?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed z-[var(--z-modal)] flex flex-col gap-stack bg-card text-foreground shadow-overlay outline-none",
          lato
            ? "inset-y-0 left-0 w-[min(20rem,85vw)] p-panel transition-transform motion-slow data-starting-style:-translate-x-full data-ending-style:-translate-x-full data-ending-style:duration-[var(--dur-base)]"
            : [
                "top-1/2 left-1/2 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-panel p-panel",
                "transition-[opacity,scale] motion-base data-starting-style:scale-[0.96] data-starting-style:opacity-0",
                "data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-ending-style:duration-[var(--dur-fast)]",
              ],
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-control text-muted-foreground transition-colors motion-fast hover:bg-muted hover:text-titolo pointer-coarse:size-11"
          aria-label="Chiudi"
        >
          <XIcon className="size-4" aria-hidden />
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn("pr-8 text-section", className)} {...props} />
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogTitle, DialogDescription }
