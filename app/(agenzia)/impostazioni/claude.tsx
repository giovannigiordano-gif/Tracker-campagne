// Scheda "Claude" delle Impostazioni: come collegare l'app a Claude (sito, app desktop, Cowork) come connettore,
// così le analisi le scrive Claude con l'abbonamento del titolare. Nessun token mostrato: solo l'indirizzo.
import { CircleCheck, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatoConnettore } from "@/lib/connettore/stato";
import { formatDataOra } from "@/lib/format";
import { CopiaIndirizzo, ScollegaClaudeButton } from "./forms";

export function SchedaClaude({ indirizzo, stato }: { indirizzo: string; stato: StatoConnettore }) {
  const locale = /^http:\/\/(localhost|127\.0\.0\.1)/.test(indirizzo);

  return (
    <Card id="claude" className="scroll-mt-24">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Claude</CardTitle>
          {stato.ultimoCollegamento && (
            <Badge variant="success">
              <CircleCheck aria-hidden /> Collegato
            </Badge>
          )}
        </div>
        <CardDescription>
          Collega l&apos;app a Claude (sito, app desktop o Cowork): Claude legge i numeri dei clienti e scrive le analisi con il
          tuo abbonamento, senza costi in più. Riceve solo totali, mai nomi, email o telefoni dei contatti.
        </CardDescription>
      </CardHeader>

      {locale && (
        <Alert variant="warning">
          <TriangleAlert aria-hidden />
          <AlertTitle>Solo con l&apos;app online</AlertTitle>
          <AlertDescription>Claude si collega da internet: fai questi passi dall&apos;app su Vercel, non da quella sul tuo computer.</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-label text-titolo">Indirizzo del connettore</p>
        <CopiaIndirizzo indirizzo={indirizzo} />
      </div>

      <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-muted-foreground marker:font-semibold marker:text-titolo">
        <li>In Claude apri Personalizza, poi Connettori (su claude.ai: claude.ai/customize/connectors).</li>
        <li>Premi «Aggiungi connettore personalizzato», chiamalo SalesProcess Insights e incolla l&apos;indirizzo qui sopra.</li>
        <li>Premi «Connetti»: si apre una pagina di questa app. Inserisci la password dell&apos;app e premi «Consenti».</li>
        <li>
          In una chat o in Cowork attiva il connettore e chiedi, per esempio: «Analizza le campagne di [cliente] degli ultimi 30 giorni e
          salva l&apos;analisi». La trovi poi nella dashboard del cliente, sezione Analisi.
        </li>
      </ol>

      {stato.ultimoCollegamento && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">Ultimo collegamento il {formatDataOra(stato.ultimoCollegamento)}.</p>
          <ScollegaClaudeButton />
        </div>
      )}
    </Card>
  );
}
