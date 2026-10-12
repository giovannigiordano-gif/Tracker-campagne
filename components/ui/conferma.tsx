"use client"
// Pulsante con conferma per le azioni distruttive: apre una finestra che spiega cosa succede,
// poi esegue l'azione e mostra l'esito come notifica.
import { useState, useTransition } from "react"
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useNotifica } from "@/components/ui/toast"

export function ConfermaAzione({
  etichetta,
  titolo,
  descrizione,
  conferma,
  esegui,
  successo,
  variantePulsante = "outline",
  icona,
}: {
  etichetta: string // testo del pulsante che apre la conferma
  titolo: string // domanda chiara, con l'oggetto dell'azione
  descrizione: React.ReactNode // conseguenze
  conferma: string // verbo dell'azione sul pulsante rosso
  esegui: () => Promise<void>
  successo: string // testo della notifica a lavoro fatto
  variantePulsante?: "outline" | "ghost" | "destructive"
  icona?: React.ReactNode
}) {
  const [aperta, setAperta] = useState(false)
  const [inCorso, startTransition] = useTransition()
  const notifica = useNotifica()

  function procedi() {
    startTransition(async () => {
      try {
        await esegui()
        setAperta(false)
        notifica("successo", successo)
      } catch (e) {
        notifica("errore", "Operazione non riuscita", (e as Error).message)
      }
    })
  }

  return (
    <AlertDialog open={aperta} onOpenChange={setAperta}>
      <Button type="button" variant={variantePulsante} size="sm" onClick={() => setAperta(true)}>
        {icona}
        {etichetta}
      </Button>
      <AlertDialogContent>
        <AlertDialogTitle>{titolo}</AlertDialogTitle>
        <AlertDialogDescription>{descrizione}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" disabled={inCorso} />}>Annulla</AlertDialogClose>
          <Button
            variant="destructive"
            className="bg-danger text-white hover:bg-danger/90 dark:text-black"
            loading={inCorso}
            onClick={procedi}
          >
            {conferma}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
