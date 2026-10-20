// Impostazioni: clienti seguiti (da accounts.json), token GHL cifrati, cache.
// La mappatura con gli account pubblicitari Meta arriva nella Fase 3 del progetto.
import { Suspense } from "react";
import { richiediAccessoPagina } from "@/lib/accesso";
import { connection } from "next/server";
import { headers } from "next/headers";
import { ChevronDown, CircleAlert, CircleCheck, FileKey, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BoxErrore, ScheletroImpostazioni, TitoloPagina } from "@/components/bits";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { caricaImpostazioni } from "@/lib/data/impostazioni";
import { formatDataOra } from "@/lib/format";
import type { InfoToken } from "@/lib/ghl/tokens";
import {
  AggiungiClienteForm,
  ClienteForm,
  RimuoviClienteButton,
  RimuoviTokenButton,
  SvuotaCacheButton,
  TokenForm,
} from "./forms";
import { SchedaMetaAds, type EsitoRitornoMeta } from "./meta-ads";

export const metadata = { title: "Impostazioni" };

export default function ImpostazioniPage({ searchParams }: PageProps<"/impostazioni">) {
  return (
    <Suspense fallback={<ScheletroImpostazioni />}>
      <Impostazioni searchParams={searchParams} />
    </Suspense>
  );
}

function StatoToken({ token }: { token: InfoToken }) {
  if (token.origine === "app") {
    return (
      <Badge variant="success">
        <CircleCheck aria-hidden /> Token salvato
      </Badge>
    );
  }
  if (token.origine === "env") {
    return (
      <Badge variant="warning">
        <FileKey aria-hidden /> Token dal file .env
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <CircleAlert aria-hidden /> Manca il token
    </Badge>
  );
}

const PASSI_TOKEN = [
  "In GoHighLevel entra nel sub-account del cliente.",
  "Vai in Settings, poi Private Integrations, poi Create new Integration.",
  "Spunta solo i permessi di lettura: contacts, opportunities, locations, locations/customFields, calendars e calendars/events (tutti .readonly).",
  "Copia il token e incollalo qui: l'app lo verifica prima di salvarlo, cifrato.",
];

async function Impostazioni({ searchParams }: Pick<PageProps<"/impostazioni">, "searchParams">) {
  await connection(); // dati letti a ogni richiesta, mai al momento della build
  await richiediAccessoPagina(); // secondo controllo, oltre al proxy
  const { meta: esitoMeta } = await searchParams; // esito del ritorno da Meta (collegato, annullato, errore)
  const { clienti, disponibili, erroreSubAccount, archivioNonConfigurato, meta } = await caricaImpostazioni();
  const h = await headers();
  // Indirizzo a cui Meta rimanda dopo l'accesso (da inserire nell'app Meta): lo stesso calcolato da lib/meta-mcp/indirizzi.ts
  const base = process.env.APP_URL?.trim().replace(/\/$/, "") || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const ritornoMeta = `${base}/api/meta-mcp/ritorno`;
  const esitoRitorno: EsitoRitornoMeta =
    esitoMeta === "collegato" || esitoMeta === "annullato" || esitoMeta === "errore" ? esitoMeta : null;
  const senzaToken = clienti.filter((c) => c.token.origine === "nessuno").length;

  return (
    <div className="animate-entra">
      <TitoloPagina
        titolo="Impostazioni"
        sottotitolo="Scegli i clienti da seguire e collega i loro token GHL. Qui cambia solo questa app: su GoHighLevel non tocchiamo nulla."
      />

      {archivioNonConfigurato && (
        <Alert variant="warning" className="mb-section">
          <TriangleAlert aria-hidden />
          <AlertTitle>Manca lo spazio dati su Vercel</AlertTitle>
          <AlertDescription>
            Finché non colleghi uno spazio Vercel Blob privato al progetto, l&apos;app non può salvare clienti, token o link condivisi.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-section xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="flex min-w-0 flex-col gap-3" aria-labelledby="titolo-clienti">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="titolo-clienti" className="text-section">I tuoi clienti ({clienti.length})</h2>
            {senzaToken > 0 && (
              <p className="text-sm font-semibold text-danger">
                {senzaToken === 1 ? "1 cliente senza token" : `${senzaToken} clienti senza token`}
              </p>
            )}
          </div>

          {clienti.length === 0 && (
            <Card variant="muted" className="items-start">
              <p className="font-bold text-titolo">Ancora nessun cliente.</p>
              <p className="text-sm text-muted-foreground">
                Cercalo nel riquadro &quot;Aggiungi un cliente&quot; tra i sub-account della tua agenzia: dopo l&apos;aggiunta ti chiediamo il suo token.
              </p>
            </Card>
          )}

          <ul className="flex flex-col gap-2">
            {clienti.map((c, i) => (
              <li key={c.locationId} className="entra-a-scaletta" style={{ "--i": i } as React.CSSProperties}>
                <details
                  className="group rounded-panel bg-card ring-1 ring-border open:ring-titolo/20"
                  open={c.token.origine === "nessuno"}
                >
                  <summary className="flex min-h-14 list-none flex-wrap items-center gap-x-3 gap-y-1 rounded-panel px-5 py-3 transition-colors motion-fast hover:bg-muted/60 [&::-webkit-details-marker]:hidden">
                    <span className="font-bold text-titolo">{c.name}</span>
                    <StatoToken token={c.token} />
                    {!c.active && <Badge variant="outline">Nascosto</Badge>}
                    <span className="ml-auto text-caption text-muted-foreground">
                      <span className="sr-only">ID sub-account </span>
                      {c.locationId}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground transition-transform motion-base group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="flex flex-col gap-section border-t border-border px-5 py-5">
                    <section className="flex flex-col gap-3" aria-label={`Token di ${c.name}`}>
                      <h3 className="text-label">Token GHL del sub-account</h3>
                      {c.token.origine === "app" && (
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span>
                            Salvato cifrato il {formatDataOra(c.token.salvatoIl)}, termina con ••••{c.token.ultime4}.
                          </span>
                          <RimuoviTokenButton locationId={c.locationId} nome={c.name} />
                        </div>
                      )}
                      {c.token.origine === "env" && (
                        <p className="text-sm text-muted-foreground">
                          Ora il token si legge dal file .env (finisce con ••••{c.token.ultime4}). Incollalo qui per salvarlo
                          cifrato nell&apos;app, poi puoi toglierlo dal file .env.
                        </p>
                      )}
                      <TokenForm locationId={c.locationId} haToken={c.token.origine !== "nessuno"} />
                      <details className="text-sm">
                        <summary className="w-fit text-sm font-semibold text-titolo underline-offset-4 hover:underline">
                          Come si crea il token
                        </summary>
                        <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-muted-foreground marker:font-bold marker:text-titolo">
                          {PASSI_TOKEN.map((p) => <li key={p}>{p}</li>)}
                        </ol>
                      </details>
                    </section>
                    <section className="flex flex-col gap-3" aria-label={`Dati di ${c.name}`}>
                      <h3 className="text-label">Dati del cliente</h3>
                      <ClienteForm cliente={c} />
                    </section>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground">Non lo segui più? Toglilo dall&apos;app: su GHL resta tutto com&apos;è.</p>
                      <RimuoviClienteButton locationId={c.locationId} nome={c.name} />
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-4 xl:sticky xl:top-24">
          <Card>
            <CardHeader>
              <CardTitle>Aggiungi un cliente</CardTitle>
              <CardDescription>Scegli il sub-account GHL da seguire. Subito dopo ti chiediamo il suo token.</CardDescription>
            </CardHeader>
            {erroreSubAccount ? <BoxErrore messaggio={erroreSubAccount} /> : <AggiungiClienteForm disponibili={disponibili} />}
          </Card>
          <SchedaMetaAds meta={meta} esito={esitoRitorno} ritorno={ritornoMeta} />
          <Card>
            <CardHeader>
              <CardTitle>Cache</CardTitle>
              <CardDescription>
                Per non sovraccaricare GHL l&apos;app conserva i dati per un po&apos;: 15 minuti quelli di oggi, 24 ore i giorni
                passati, 6 ore gli elenchi. Svuotala se un numero non ti torna.
              </CardDescription>
            </CardHeader>
            <SvuotaCacheButton />
          </Card>
        </div>
      </div>
    </div>
  );
}
