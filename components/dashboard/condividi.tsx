"use client";
// Pulsante "Condividi" della dashboard cliente (solo per il titolare).
// Apre una finestra per creare il link da mandare al cliente, copiarlo, sostituirlo o disattivarlo.
// Il link si apre sul periodo che il titolare sta guardando; il cliente poi può cambiarlo.
import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Link2Off, RefreshCw, Share2, TriangleAlert } from "lucide-react";
import { creaLinkCondiviso, disattivaLinkCondiviso, leggiLinkCondiviso, type LinkCondiviso } from "@/app/actions";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { classeCampo } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifica } from "@/components/ui/toast";
import { formatDataOra } from "@/lib/format";
import { PARAMETRI_GLOBALI } from "@/lib/period";

type Conferma = "nuovo" | "disattiva" | null;

const INDIRIZZI_LOCALI = ["localhost", "127.0.0.1", "[::1]"];

export function Condividi({ locationId, nome }: { locationId: string; nome: string }) {
  const params = useSearchParams();
  const notifica = useNotifica();
  const [aperta, setAperta] = useState(false);
  const [link, setLink] = useState<LinkCondiviso | undefined>(undefined); // undefined = in lettura
  const [errore, setErrore] = useState<string | null>(null);
  const [conferma, setConferma] = useState<Conferma>(null);
  const [inCorso, startTransition] = useTransition();
  const [origine, setOrigine] = useState("");
  const [inLocale, setInLocale] = useState(false);

  // Indirizzo del sito, letto nel browser
  useEffect(() => {
    setOrigine(window.location.origin);
    setInLocale(INDIRIZZI_LOCALI.includes(window.location.hostname));
  }, []);

  // Solo i parametri del periodo: i filtri della pagina restano del titolare
  const periodo = new URLSearchParams();
  for (const k of PARAMETRI_GLOBALI) {
    const v = params.get(k);
    if (v) periodo.set(k, v);
  }
  const indirizzo = link ? `${origine}/condivisa/${link.codice}${periodo.size ? `?${periodo}` : ""}` : "";

  function esegui(azione: () => Promise<LinkCondiviso | void>, successo?: [string, string?]) {
    setErrore(null);
    startTransition(async () => {
      try {
        const risultato = await azione();
        setLink(risultato ?? null);
        setConferma(null);
        if (successo) notifica("successo", ...successo);
      } catch {
        setErrore("Operazione non riuscita. Riprova tra un momento.");
      }
    });
  }

  function cambiaApertura(v: boolean) {
    setAperta(v);
    if (!v) return;
    setLink(undefined);
    setConferma(null);
    esegui(() => leggiLinkCondiviso(locationId));
  }

  async function copia() {
    try {
      await navigator.clipboard.writeText(indirizzo);
      notifica("successo", "Link copiato", "Incollalo nel messaggio per il cliente.");
    } catch {
      // Senza accesso agli appunti si seleziona il testo, da copiare a mano
      const campo = document.getElementById("link-condiviso") as HTMLInputElement | null;
      campo?.select();
      notifica("info", "Copia il link a mano", "È già selezionato: premi Ctrl+C.");
    }
  }

  return (
    <Dialog open={aperta} onOpenChange={cambiaApertura}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Share2 aria-hidden /> Condividi
      </DialogTrigger>
      <DialogContent className="w-[min(32rem,calc(100vw-2rem))]">
        <DialogTitle>Condividi la dashboard di {nome}</DialogTitle>
        <DialogDescription>
          Chi ha il link vede questa dashboard, compresi gli elenchi dei contatti con nomi, email e telefoni. Non vede gli
          altri clienti né le Impostazioni.
        </DialogDescription>

        {inLocale && (
          <Alert variant="warning">
            <TriangleAlert aria-hidden />
            <AlertDescription>
              Ora l&apos;app gira solo sul tuo computer: il cliente potrà aprire il link quando l&apos;app sarà online.
            </AlertDescription>
          </Alert>
        )}

        {errore && (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden />
            <AlertTitle>{errore}</AlertTitle>
            <AlertAction>
              <Button size="sm" variant="outline" onClick={() => cambiaApertura(true)}>Riprova</Button>
            </AlertAction>
          </Alert>
        )}

        {link === undefined && !errore && (
          <div className="flex flex-col gap-2" aria-busy="true" aria-label="Lettura del link in corso">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10" />
          </div>
        )}

        {link === null && !errore && (
          <Button
            className="self-start"
            loading={inCorso}
            onClick={() => esegui(() => creaLinkCondiviso(locationId), ["Link creato", "Copialo e mandalo al cliente."])}
          >
            <Share2 aria-hidden /> Crea link
          </Button>
        )}

        {link && conferma === null && (
          <div className="flex flex-col gap-3">
            <label htmlFor="link-condiviso" className="text-label text-titolo">Link per il cliente</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="link-condiviso"
                readOnly
                value={indirizzo}
                onFocus={(e) => e.currentTarget.select()}
                className={`${classeCampo} min-w-0 flex-1 font-medium`}
              />
              <Button onClick={copia} disabled={!indirizzo}>
                <Copy aria-hidden /> Copia link
              </Button>
            </div>
            <p className="text-caption text-muted-foreground">
              Si apre sul periodo che stai guardando; il cliente può cambiarlo. Creato il {formatDataOra(link.creatoIl)}.
            </p>
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              <Button variant="ghost" size="sm" onClick={() => setConferma("nuovo")}>
                <RefreshCw aria-hidden /> Crea un nuovo link
              </Button>
              <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => setConferma("disattiva")}>
                <Link2Off aria-hidden /> Disattiva link
              </Button>
            </div>
          </div>
        )}

        {link && conferma && (
          <div className="flex flex-col gap-3 rounded-block bg-muted p-4" role="group" aria-labelledby="conferma-condivisione">
            <p id="conferma-condivisione" className="font-bold text-titolo">
              {conferma === "nuovo" ? "Creare un nuovo link?" : "Disattivare il link?"}
            </p>
            <p className="text-sm">
              {conferma === "nuovo"
                ? "Il link attuale smetterà di funzionare: dovrai mandare quello nuovo al cliente."
                : "Il cliente non potrà più aprire la dashboard con questo link. Potrai crearne uno nuovo quando vuoi."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={inCorso} onClick={() => setConferma(null)}>
                Annulla
              </Button>
              {conferma === "nuovo" ? (
                <Button
                  size="sm"
                  loading={inCorso}
                  onClick={() => esegui(() => creaLinkCondiviso(locationId), ["Nuovo link creato", "Il vecchio non funziona più: manda al cliente quello nuovo."])}
                >
                  Crea nuovo link
                </Button>
              ) : (
                <Button
                  size="sm"
                  loading={inCorso}
                  className="bg-danger text-white hover:bg-danger/90 dark:text-black"
                  onClick={() => esegui(() => disattivaLinkCondiviso(locationId), ["Link disattivato"])}
                >
                  Disattiva link
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
