// Scheda "Meta Ads" delle Impostazioni: collegamento al server MCP ufficiale di Meta (sola lettura).
// Mostra lo stato senza mai esporre i token: data del collegamento, scadenza, permessi, ultima verifica.
import { CircleAlert, CircleCheck, LogIn, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDataOra } from "@/lib/format";
import { STRUMENTI_LETTURA } from "@/lib/meta-mcp/config";
import type { RiepilogoMetaMcp } from "@/lib/meta-mcp/store";
import { ScollegaMetaButton, VerificaMetaButton } from "./forms";

export type EsitoRitornoMeta = "collegato" | "annullato" | "errore" | null;

// Pulsante che avvia l'accesso a Meta: un modulo POST verso l'app, che poi rimanda alla pagina di Meta
function Collega({ etichetta, secondario = false }: { etichetta: string; secondario?: boolean }) {
  return (
    <form action="/api/meta-mcp/collega" method="post">
      <Button type="submit" variant={secondario ? "ghost" : "inverse"} size={secondario ? "sm" : "default"}>
        <LogIn aria-hidden /> {etichetta}
      </Button>
    </form>
  );
}

export function SchedaMetaAds({ meta, esito, ritorno }: { meta: RiepilogoMetaMcp; esito: EsitoRitornoMeta; ritorno: string }) {
  const verifica = meta.ultimaVerifica;
  const scaduto = meta.collegato && meta.scadeIl !== null && meta.scadeIl < Date.now() && !meta.rinnovoAutomatico;

  return (
    <Card id="meta-ads" className="scroll-mt-24">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Meta Ads</CardTitle>
          {meta.collegato && !scaduto && (
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
          Collegamento al server ufficiale di Meta Ads, per leggere campagne e risultati e per le analisi AI. L&apos;app
          chiede solo permessi di lettura e non modifica mai le campagne.
        </CardDescription>
      </CardHeader>

      {esito === "collegato" && meta.collegato && (
        <Alert variant="success">
          <CircleCheck aria-hidden />
          <AlertTitle>Meta Ads collegato</AlertTitle>
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
          <AlertDescription>{meta.ultimoErrore?.messaggio ?? "Riprova tra un momento."}</AlertDescription>
        </Alert>
      )}

      {!meta.collegato && !meta.configurato ? (
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            Meta permette il collegamento solo tramite un&apos;app Meta for Developers tua. Si crea una volta sola:
          </p>
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-muted-foreground marker:font-bold marker:text-titolo">
            <li>Su developers.facebook.com/apps crea un&apos;app (o aprine una) e aggiungi il caso d&apos;uso «Create &amp; manage ads with ads MCP server».</li>
            <li>
              In «Facebook Login for Business», tra gli indirizzi di reindirizzamento OAuth validi, aggiungi:
              <code className="mt-1 block rounded-block bg-muted px-3 py-2 font-medium break-all text-titolo">{ritorno}</code>
            </li>
            <li>Copia l&apos;ID dell&apos;app (in alto nella dashboard dell&apos;app) e dallo a chi gestisce l&apos;app: va in META_APP_ID.</li>
          </ol>
        </div>
      ) : !meta.collegato ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            Si apre la pagina di Meta: entra con l&apos;account che gestisce il Business Manager dei clienti e approva. Poi
            torni qui da solo.
          </p>
          <Collega etichetta="Collega Meta Ads" />
        </div>
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            {meta.collegatoIl && (
              <>
                <dt className="text-muted-foreground">Collegato il</dt>
                <dd className="font-medium text-titolo">{formatDataOra(meta.collegatoIl)}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Accesso</dt>
            <dd className="font-medium text-titolo">
              {meta.scadeIl
                ? `valido fino al ${formatDataOra(meta.scadeIl)}${meta.rinnovoAutomatico ? ", poi si rinnova da solo" : ""}`
                : "senza scadenza comunicata da Meta"}
            </dd>
            {meta.permessi.length > 0 && (
              <>
                <dt className="text-muted-foreground">Permessi</dt>
                <dd className="font-medium text-titolo">{meta.permessi.join(", ")}</dd>
              </>
            )}
            {verifica && (
              <>
                <dt className="text-muted-foreground">Ultima verifica</dt>
                <dd className="font-medium text-titolo">
                  {formatDataOra(verifica.il)}: {verifica.ok ? "tutto a posto" : verifica.messaggio}
                </dd>
                {verifica.accountVisibili !== null && (
                  <>
                    <dt className="text-muted-foreground">Account pubblicitari</dt>
                    <dd className="font-medium text-titolo">{verifica.accountVisibili} visibili</dd>
                  </>
                )}
              </>
            )}
          </dl>

          {verifica && verifica.strumentiAbilitati.length > 0 && (
            <details>
              <summary className="w-fit font-semibold text-titolo underline-offset-4 hover:underline">
                {verifica.strumentiAbilitati.length} strumenti di lettura per l&apos;AI
                {verifica.strumentiEsclusi > 0 && `, ${verifica.strumentiEsclusi} spenti`}
              </summary>
              <ul className="mt-2 flex flex-col gap-1.5 text-muted-foreground">
                {verifica.strumentiAbilitati.map((nome) => (
                  <li key={nome}>{STRUMENTI_LETTURA[nome] ?? nome}</li>
                ))}
              </ul>
              {verifica.strumentiEsclusi > 0 && (
                <p className="mt-2 text-caption text-muted-foreground">
                  Gli strumenti spenti sono quelli che creano, modificano, attivano o cancellano campagne e pubblici, più
                  quelli non necessari alle analisi.
                </p>
              )}
            </details>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <VerificaMetaButton />
            <ScollegaMetaButton />
            <Collega etichetta="Collega di nuovo" secondario />
          </div>
        </div>
      )}
    </Card>
  );
}
