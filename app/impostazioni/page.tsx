// Impostazioni: clienti monitorati (da accounts.json), token GHL cifrati, cache.
// La mappatura con gli account pubblicitari Meta arriva nella Fase 3.
import { Suspense } from "react";
import { connection } from "next/server";
import { BoxErrore, CaricamentoPagina, TitoloPagina } from "@/components/bits";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { caricaImpostazioni } from "@/lib/data/impostazioni";
import { formatDataOra } from "@/lib/format";
import type { InfoToken } from "@/lib/ghl/tokens";
import {
  AggiungiClienteForm,
  ClienteForm,
  RimuoviClienteForm,
  RimuoviTokenForm,
  SvuotaCacheForm,
  TokenForm,
} from "./forms";

export default function ImpostazioniPage() {
  return (
    <Suspense fallback={<CaricamentoPagina righe={4} />}>
      <Impostazioni />
    </Suspense>
  );
}

function StatoToken({ token }: { token: InfoToken }) {
  if (token.origine === "app") {
    return <Badge variant="secondary">Token salvato ••••{token.ultime4}</Badge>;
  }
  if (token.origine === "env") {
    return <Badge variant="outline">Token dal file .env ••••{token.ultime4}</Badge>;
  }
  return <Badge variant="destructive">Token mancante</Badge>;
}

async function Impostazioni() {
  await connection(); // dati letti a ogni richiesta, mai al momento della build
  const { clienti, disponibili, erroreSubAccount } = await caricaImpostazioni();

  return (
    <>
      <TitoloPagina
        titolo="Impostazioni"
        sottotitolo="Clienti da monitorare e relativi token GHL. Le modifiche riguardano solo questa app: su GHL non cambia nulla."
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Clienti monitorati ({clienti.length})</h2>
        {clienti.length === 0 && (
          <p className="text-sm text-muted-foreground">Nessun cliente ancora: aggiungine uno qui sotto.</p>
        )}
        {clienti.map((c) => (
          <details key={c.locationId} className="group rounded-xl ring-1 ring-foreground/10" open={c.token.origine === "nessuno"}>
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3">
              <span className="font-medium">{c.name}</span>
              <StatoToken token={c.token} />
              {!c.active && <Badge variant="outline">Non attivo</Badge>}
              <span className="ml-auto text-xs text-muted-foreground">ID {c.locationId}</span>
            </summary>
            <div className="flex flex-col gap-6 border-t px-4 py-4">
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">Token GHL del sub-account</h3>
                {c.token.origine === "app" && (
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    Salvato cifrato il {formatDataOra(c.token.salvatoIl)}, termina con ••••{c.token.ultime4}.
                    <RimuoviTokenForm locationId={c.locationId} />
                  </div>
                )}
                {c.token.origine === "env" && (
                  <p className="text-sm text-muted-foreground">
                    Ora il token viene letto dal file .env. Incollalo qui sotto per salvarlo cifrato nell&apos;app,
                    poi potrai toglierlo dal file .env.
                  </p>
                )}
                <TokenForm locationId={c.locationId} haToken={c.token.origine !== "nessuno"} />
                <p className="text-xs text-muted-foreground">
                  Si crea in GHL dentro il sub-account: Settings → Private Integrations → Create new Integration, con i permessi
                  contacts.readonly, opportunities.readonly, locations.readonly, locations/customFields.readonly,
                  calendars.readonly, calendars/events.readonly. Prima di salvarlo l&apos;app verifica che funzioni.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">Dati del cliente</h3>
                <ClienteForm cliente={c} />
              </div>
              <div className="border-t pt-4">
                <RimuoviClienteForm locationId={c.locationId} nome={c.name} />
              </div>
            </div>
          </details>
        ))}
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aggiungi un cliente</CardTitle>
            <CardDescription>Scegli il sub-account GHL da monitorare.</CardDescription>
          </CardHeader>
          <CardContent>
            {erroreSubAccount ? (
              <BoxErrore messaggio={erroreSubAccount} />
            ) : (
              <AggiungiClienteForm disponibili={disponibili} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cache</CardTitle>
            <CardDescription>
              L&apos;app conserva i dati per qualche minuto per non sovraccaricare GHL: 15 minuti per i dati di oggi,
              24 ore per i giorni passati, 6 ore per gli elenchi. Svuotala se vedi numeri che non tornano.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SvuotaCacheForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
