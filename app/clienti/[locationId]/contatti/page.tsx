// Cliente · Contatti e lead: andamento giornaliero, per fonte, canale, campagna e tag,
// tabella filtrabile con export CSV e contatti senza attribuzione.
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BoxErrore, CaricamentoPagina, Kpi, NotaFonte, TitoloPagina, Variazione } from "@/components/bits";
import { BreakdownCard } from "@/components/breakdown-card";
import { ContactsTable } from "@/components/contacts-table";
import { RefreshButton } from "@/components/refresh-button";
import { TrendChart, type PuntoAndamento } from "@/components/trend-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccount } from "@/lib/accounts";
import { caricaDatiContatti } from "@/lib/data/contatti";
import { messaggioErrore } from "@/lib/data/panoramica";
import { formatDecimale, formatNumero, formatPercentuale } from "@/lib/format";
import { variazione } from "@/lib/metrics/contacts";
import { etichettaSelezione, formatGiorno, leggiSelezione, queryPeriodo } from "@/lib/period";

type Props = PageProps<"/clienti/[locationId]/contatti">;

export default function ContattiPage(props: Props) {
  return (
    <Suspense fallback={<CaricamentoPagina />}>
      <Contatti {...props} />
    </Suspense>
  );
}

async function Contatti({ params, searchParams }: Props) {
  const { locationId } = await params;
  const sel = leggiSelezione(await searchParams);
  const account = await getAccount(locationId);
  if (!account) notFound();

  const intestazione = (
    <TitoloPagina
      titolo={account.name}
      sottotitolo={
        <>
          <Link href={`/?${queryPeriodo(sel)}`} className="hover:underline">Panoramica</Link>
          {" › Contatti e lead · "}
          {etichettaSelezione(sel)}
        </>
      }
      azioni={<RefreshButton locationId={locationId} />}
    />
  );

  let dati;
  try {
    dati = await caricaDatiContatti(account, sel);
  } catch (e) {
    return (
      <>
        {intestazione}
        <BoxErrore messaggio={messaggioErrore(e, account.name)} />
      </>
    );
  }

  const { corrente, precedente, periodo, righe, aggiornatoIl } = dati;
  const senzaAttribuzione = corrente.totale - corrente.attribuiti;
  const pct = (n: number) => (corrente.totale ? (n / corrente.totale) * 100 : 0);

  const andamento: PuntoAndamento[] = periodo.corrente.giorni.map((g, i) => {
    const gp = periodo.precedente.giorni[i];
    return {
      giorno: formatGiorno(g),
      giornoPrecedente: formatGiorno(gp),
      attuale: corrente.perGiorno[g] ?? 0,
      precedente: precedente.perGiorno[gp] ?? 0,
    };
  });

  const nota = (definizione: string) => (
    <NotaFonte
      fonte="GoHighLevel"
      definizione={definizione}
      intervallo={periodo.corrente}
      fuso={periodo.fuso}
      aggiornatoIl={aggiornatoIl}
    />
  );

  return (
    <>
      {intestazione}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          etichetta="Lead nel periodo"
          valore={formatNumero(corrente.totale)}
          sotto={<><Variazione pct={variazione(corrente.totale, precedente.totale)} /> vs {formatNumero(precedente.totale)} del periodo precedente</>}
        />
        <Kpi etichetta="Media al giorno" valore={formatDecimale(corrente.totale / periodo.giorni)} sotto={`${periodo.giorni} giorni`} />
        <Kpi
          etichetta="Da annunci Meta"
          valore={formatNumero(corrente.daMeta)}
          sotto={`${formatPercentuale(pct(corrente.daMeta))} dei lead`}
        />
        <Kpi
          etichetta="Senza attribuzione"
          valore={formatNumero(senzaAttribuzione)}
          sotto={`${formatPercentuale(pct(senzaAttribuzione))} non riconducibili a una campagna`}
        />
      </div>
      <div className="mt-2">{nota("Lead = contatti creati nel periodo")}</div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Andamento giornaliero</CardTitle>
          <CardDescription>Lead creati ogni giorno, confrontati con lo stesso giorno del periodo precedente</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart dati={andamento} />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <BreakdownCard
          titolo="Per canale"
          descrizione="Ricavato dai dati di attribuzione di GHL"
          voci={corrente.perCanale}
          totale={corrente.totale}
        />
        <BreakdownCard titolo="Per fonte" descrizione="Campo «Fonte» del contatto in GHL" voci={corrente.perFonte} totale={corrente.totale} />
        <BreakdownCard
          titolo="Per campagna"
          descrizione="Campagna di provenienza registrata da GHL"
          voci={corrente.perCampagna}
          totale={corrente.totale}
        />
        <BreakdownCard
          titolo="Per tag"
          descrizione="Un contatto con più tag è contato in ognuno"
          voci={corrente.perTag}
          totale={corrente.totale}
          vuoto="Nessun tag sui contatti del periodo"
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Contatti del periodo</CardTitle>
          <CardDescription>
            I dati personali sono mostrati solo qui e non vengono salvati dall&apos;app. Il CSV si scarica sul tuo computer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactsTable
            righe={righe}
            nomeFile={`contatti-${account.name.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}-${periodo.corrente.daGiorno}-${periodo.corrente.aGiorno}.csv`}
          />
        </CardContent>
      </Card>
      <div className="mt-2">{nota("Tabella: contatti creati nel periodo, più recenti in alto")}</div>
    </>
  );
}
