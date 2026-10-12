"use client"
// Notifiche brevi (salvato, errore...). Basate su Base UI Toast: annunciate ai lettori di schermo
// senza rubare il focus, chiudibili, spariscono da sole dopo 5 secondi (gli errori dopo 8).
import { useCallback } from "react"
import { Toast } from "@base-ui/react/toast"
import { CircleAlert, CircleCheck, Info, XIcon } from "lucide-react"
import { cn } from "cn"

export type TipoNotifica = "successo" | "errore" | "info"

const ICONE = { successo: CircleCheck, errore: CircleAlert, info: Info } as const

function ElencoNotifiche() {
  const { toasts } = Toast.useToastManager()
  return toasts.map((t) => {
    const tipo = (t.type as TipoNotifica | undefined) ?? "info"
    const Icona = ICONE[tipo]
    return (
      <Toast.Root
        key={t.id}
        toast={t}
        className={cn(
          "relative flex w-full items-start gap-3 rounded-block bg-inverse p-4 pr-11 text-inverse-foreground shadow-overlay select-none superficie-inversa",
          "transition-[opacity,transform] motion-base",
          "data-starting-style:translate-y-2 data-starting-style:opacity-0",
          "data-ending-style:translate-x-4 data-ending-style:opacity-0 data-ending-style:duration-[var(--dur-fast)] data-limited:hidden"
        )}
      >
        <Icona
          className={cn(
            "mt-0.5 size-5 shrink-0",
            tipo === "successo" && "text-on-inverse-success",
            tipo === "errore" && "text-on-inverse-danger",
            tipo === "info" && "text-brand"
          )}
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Toast.Title className="text-sm font-bold" />
          <Toast.Description className="text-sm text-inverse-muted" />
        </div>
        <Toast.Close
          aria-label="Chiudi la notifica"
          className="absolute top-2.5 right-2.5 inline-flex size-8 items-center justify-center rounded-control text-inverse-muted transition-colors motion-fast hover:bg-inverse-raised hover:text-inverse-foreground"
        >
          <XIcon className="size-4" aria-hidden />
        </Toast.Close>
      </Toast.Root>
    )
  })
}

export function NotificheProvider({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider timeout={5000} limit={3}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 bottom-4 z-[var(--z-toast)] flex w-[min(24rem,calc(100vw-2rem))] flex-col-reverse gap-2 outline-none">
          <ElencoNotifiche />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}

// Uso: const notifica = useNotifica(); notifica("successo", "Token salvato", "Lo trovi cifrato nell'app")
export function useNotifica() {
  const manager = Toast.useToastManager()
  return useCallback(
    (tipo: TipoNotifica, titolo: string, descrizione?: string) =>
      manager.add({ type: tipo, title: titolo, description: descrizione, timeout: tipo === "errore" ? 8000 : 5000 }),
    [manager]
  )
}
