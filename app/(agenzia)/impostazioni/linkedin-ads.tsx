// Scheda "LinkedIn Ads" delle Impostazioni: collegamento all'API Marketing di LinkedIn, in sola lettura.
// Mostra lo stato senza mai esporre segreti: credenziali presenti (ultime 4 cifre del Client ID), scadenze,
// permessi, account visibili. Per collegarsi serve un'app su LinkedIn Developers con l'Advertising API.
import { ChevronRight, CircleAlert, CircleCheck, LogIn, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDataOra } from "@/lib/format";
import type { RiepilogoLinkedIn } from "@/lib/linkedin/store";
import { CopiaIndirizzo, CredenzialiLinkedInForm, ScollegaLinkedInButton, VerificaLinkedInButton } from "./forms";

export type EsitoRitornoLinkedIn = "collegato" | "annullato" | "errore" | null;

// Pulsante che avvia l'accesso: un modulo POST verso l'app, che poi rimanda alla pagina di consenso di LinkedIn
function Collega({ etichetta, secondario = false }: { etichetta: string; secondario?: boolean }) {
  return (
    <form action="/api/linkedin/collega" method="post">
      <Button type="submit" variant={secondario ? "ghost" : "default"} size={secondario ? "sm" : "default"}>
        <LogIn aria-hidden /> {etichetta}
      </Button>
    </form>
  );
}

function CambiaCredenziali() {
  return (
    <details className="group/apri text-sm">
      <summary className="inline-flex w-fit list-none items-center gap-1 font-semibold text-titolo underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform motion-base group-open/apri:rotate-90" aria-hidden />
        Cambia credenziali dell&apos;app LinkedIn
      </summary>
      <div className="mt-3">
        <CredenzialiLinkedInForm sostituisci />
      </div>
    </details>
  );
}

export function SchedaLinkedInAds({ linkedin, esito, ritorno }: { linkedin: RiepilogoLinkedIn; esito: EsitoRitornoLinkedIn; ritorno: string }) {
  const verifica = linkedin.ultimaVerifica;
  const ora = Date.now();
  const scaduto = linkedin.collegato && linkedin.scadeIl !== null && linkedin.scadeIl < ora && !(linkedin.rinnovoFinoAl && linkedin.rinnovoFinoAl > ora);
  const credenzialiDaApp = linkedin.origineCredenziali === "app";

  return (
    <Card id="linkedin-ads" className="scroll-mt-24">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>LinkedIn Ads</CardTitle>
          {linkedin.collegato && !scaduto && (
            <Badge variant="success">
              <CircleCheck aria-hidden /> Collegato
            </Badge>
          )}
          {scaduto && (
            <Badge variant="warning">
              <TriangleAlert aria-hidden /> Scaduto
            </Badge>
          )}
        </div>
        <CardDescription>
          Collegamento all&apos;API ufficiale di LinkedIn per leggere campagne, spesa e risultati. L&apos;app chiede solo i
          permessi di lettura (r_ads e r_ads_reporting) e non modifica mai le campagne.
        </CardDescription>
      </CardHeader>

      {esito === "collegato" && linkedin.collegato && (
        <Alert variant="success">
          <CircleCheck aria-hidden />
          <AlertTitle>LinkedIn Ads collegato</AlertTitle>
          {verifica && <AlertDescription>{verifica.messaggio}</AlertDescription>}
        </Alert>
      )}
      {esito === "annullato" && (
        <Alert variant="warning">
          <TriangleAlert aria-hidden />
          <AlertTitle>Accesso annullato</AlertTitle>
          <AlertDescription>Non è stato salvato nessun collegamento.</AlertDescription>
        </Alert>
      )}
      {esito === "errore" && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden />
          <AlertTitle>Collegamento non riuscito</AlertTitle>
          <AlertDescription>{linkedin.ultimoErrore?.messaggio ?? "Riprova tra un momento."}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-label text-titolo">Indirizzo di ritorno da registrare su LinkedIn</p>
        <CopiaIndirizzo
          indirizzo={ritorno}
          id="indirizzo-ritorno-linkedin"
          etichetta="Indirizzo di ritorno da registrare su LinkedIn"
          dopo="Incollalo nell'app LinkedIn, scheda Auth, tra gli Authorized redirect URLs."
        />
      </div>

      {!linkedin.configurato ? (
        <div className="flex flex-col gap-4 text-sm">
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-muted-foreground marker:font-semibold marker:text-titolo">
            <li>Su linkedin.com/developers/apps crea un&apos;app collegata alla pagina aziendale della tua agenzia.</li>
            <li>Nella scheda «Products» chiedi l&apos;accesso ad «Advertising API» e compila il modulo: LinkedIn lo approva in qualche giorno.</li>
            <li>Nella scheda «Auth», tra gli «Authorized redirect URLs», aggiungi l&apos;indirizzo qui sopra.</li>
            <li>Sempre in «Auth» copia Client ID e Client Secret e incollali qui sotto.</li>
          </ol>
          <CredenzialiLinkedInForm />
        </div>
      ) : !linkedin.collegato ? (
        <div className="flex flex-col items-start gap-3 text-sm">
          <p className="text-muted-foreground">
            Credenziali dell&apos;app LinkedIn presenti (Client ID che finisce con {linkedin.clientIdFinale}). Si apre la pagina di
            LinkedIn: entra con il profilo che ha accesso agli account pubblicitari dei clienti e premi «Allow».
          </p>
          <Collega etichetta="Collega LinkedIn Ads" />
          {credenzialiDaApp && <CambiaCredenziali />}
        </div>
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            {linkedin.collegatoIl && (
              <>
                <dt className="text-muted-foreground">Collegato il</dt>
                <dd className="font-medium text-titolo">{formatDataOra(linkedin.collegatoIl)}</dd>
              </>
            )}
            {linkedin.scadeIl && (
              <>
                <dt className="text-muted-foreground">Accesso</dt>
                <dd className="font-medium text-titolo">
                  valido fino al {formatDataOra(linkedin.scadeIl)}
                  {linkedin.rinnovoFinoAl ? `, si rinnova da solo fino al ${formatDataOra(linkedin.rinnovoFinoAl)}` : ""}
                </dd>
              </>
            )}
            {linkedin.permessi.length > 0 && (
              <>
                <dt className="text-muted-foreground">Permessi</dt>
                <dd className="font-medium text-titolo">{linkedin.permessi.join(", ")}</dd>
              </>
            )}
            {verifica && (
              <>
                <dt className="text-muted-foreground">Ultima verifica</dt>
                <dd className="font-medium text-titolo">
                  {formatDataOra(verifica.il)}: {verifica.ok ? "tutto a posto" : verifica.messaggio}
                </dd>
              </>
            )}
          </dl>

          {verifica && (
            <section className="flex flex-col gap-2" aria-label="Account pubblicitari LinkedIn visibili">
              <h3 className="font-semibold text-titolo">Account pubblicitari visibili ({verifica.account.length})</h3>
              {verifica.account.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {verifica.account.map((a) => (
                    <li key={a.id} className="flex flex-col rounded-block bg-muted px-3 py-2">
                      <span className="font-semibold text-titolo">{a.nome}</span>
                      <span className="text-caption text-muted-foreground">
                        {a.id}, {a.valuta}
                        {!a.attivo && ", non attivo"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-caption text-muted-foreground">
                Vedi gli account su cui il tuo profilo LinkedIn ha un ruolo in Campaign Manager (basta «Viewer»). Poi associa
                ogni account al suo cliente nella scheda del cliente, a sinistra.
              </p>
            </section>
          )}

          {/* Senza questi parametri i lead arrivano in GHL come "Social organico" o senza gruppo di annunci */}
          <section className="flex flex-col gap-2" aria-label="Tracciamento dei lead LinkedIn">
            <h3 className="font-semibold text-titolo">Perché i lead del CRM si abbinino agli annunci</h3>
            <p className="text-muted-foreground">
              In Campaign Manager, nelle impostazioni di ogni gruppo di annunci (Ad set), aggiungi i parametri di tracciamento
              dell&apos;indirizzo:
            </p>
            <ul className="flex flex-col gap-1 text-muted-foreground">
              <li>
                <code className="font-semibold text-titolo">utm_source</code> = linkedin
              </li>
              <li>
                <code className="font-semibold text-titolo">utm_medium</code> = paid_social
              </li>
              <li>
                <code className="font-semibold text-titolo">utm_campaign</code> = valore dinamico «Ad set ID» (ID del gruppo di annunci)
              </li>
            </ul>
            <p className="text-caption text-muted-foreground">
              Dalla fine del 2025 Campaign Manager chiama «campagna» il vecchio gruppo di campagne e «gruppo di annunci» la vecchia
              campagna: le righe della sezione «Campagne LinkedIn» sono i gruppi di annunci.
            </p>
          </section>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <VerificaLinkedInButton />
            <ScollegaLinkedInButton />
            <Collega etichetta="Collega di nuovo" secondario />
          </div>
          {credenzialiDaApp && <CambiaCredenziali />}
        </div>
      )}
    </Card>
  );
}
