// Scheda di un cliente nella Panoramica: spaccato rapido dei suoi dati e pulsante per aprire la dashboard.
// Numeri chiave, andamento dei lead, canali di provenienza e avvisi. Fonte: GoHighLevel, periodo scelto in alto.
import { Fragment } from "react";
import Link from "next/link";
import { AlertTriangle, CircleAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cardVariants } from "@/components/ui/card";
import type { RigaPanoramica } from "@/lib/data/panoramica";
import { formatNumero, formatPercentuale, formatValuta } from "@/lib/format";
import { raggruppaCanali, variazionePct } from "@/lib/metrics/dashboard";
import { cn } from "@/lib/utils";
import { Delta } from "./ui";

const CANALI_IN_EVIDENZA = 3; // gli altri finiscono in "Altro"

// Andamento dei lead giorno per giorno, largo quanto la scheda
function Andamento({ valori }: { valori: number[] }) {
  if (valori.length < 2) return null;
  const max = Math.max(...valori, 1);
  const min = Math.min(...valori);
  const punti = valori.map((v, i) => `${(i / (valori.length - 1)) * 100},${38 - (v / max) * 34}`).join(" ");
  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className="h-10 w-full"
      role="img"
      aria-label={`Lead giorno per giorno: minimo ${min}, massimo ${max}`}
    >
      <line x1="0" x2="100" y1="38" y2="38" stroke="var(--viz-griglia)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <polyline
        points={punti}
        fill="none"
        stroke="var(--viz-attuale)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Barra divisa per canale: Meta Ads in arancio, tutti gli altri in grigio; la legenda dà numeri e percentuali
function Canali({ riga }: { riga: RigaPanoramica }) {
  const voci = raggruppaCanali(riga.canali, CANALI_IN_EVIDENZA);
  const totale = voci.reduce((s, v) => s + v.lead, 0);
  if (!totale) return <p className="text-sm text-muted-foreground">Nessun lead nel periodo.</p>;
  const colore = (canale: string) => (canale === "Meta Ads" ? "bg-[var(--viz-barra)]" : "bg-[var(--viz-resto)]");
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-full" aria-hidden>
        {voci.map((v) => (
          <span key={v.canale} className={cn("h-full first:rounded-l-full last:rounded-r-full", colore(v.canale))} style={{ width: `${(v.lead / totale) * 100}%` }} />
        ))}
      </div>
      <ul className="flex flex-col gap-1 text-sm">
        {voci.map((v) => (
          <li key={v.canale} className="flex items-center gap-2">
            <span className={cn("size-2.5 shrink-0 rounded-sm", colore(v.canale))} aria-hidden />
            <span className="min-w-0 flex-1 truncate">{v.canale}</span>
            <span className="font-semibold text-titolo">{formatNumero(v.lead)}</span>
            <span className="w-12 text-right text-muted-foreground">{formatPercentuale((v.lead / totale) * 100)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Numero({
  etichetta,
  valore,
  delta,
  inversa = false,
  neutra = false,
  className,
}: {
  etichetta: string;
  valore: string;
  delta?: number | null;
  inversa?: boolean;
  neutra?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <dt className="text-caption text-muted-foreground">{etichetta}</dt>
      <dd className="truncate text-numero text-titolo">{valore}</dd>
      {delta !== undefined && (
        <dd className="text-xs">
          <Delta pct={delta} inversa={inversa} neutra={neutra} />
        </dd>
      )}
    </div>
  );
}

export function SchedaCliente({ riga, confronto, query }: { riga: RigaPanoramica; confronto: boolean; query: string }) {
  const href = `/clienti/${riga.locationId}${query ? `?${query}` : ""}`;
  const { kpi, kpiPrec } = riga;
  const d = (att: number | null, prec: number | null | undefined) =>
    confronto && att !== null && prec !== null && prec !== undefined ? variazionePct(att, prec) : undefined;
  const idTitolo = `cliente-${riga.locationId}`;

  return (
    <article className={cn(cardVariants(), "w-full gap-5")} aria-labelledby={idTitolo}>
      <header className="flex flex-col gap-2">
        <h3 id={idTitolo} className="text-section">
          <Link href={href} className="rounded-sm hover:underline">
            {riga.nome}
          </Link>
        </h3>
        {kpi && riga.avvisi.length > 0 && (
          <ul className="flex flex-col gap-1">
            {riga.avvisi.map((a) => (
              <li key={a.testo} className="flex items-start gap-1.5 text-caption">
                {a.livello === "errore" ? (
                  <CircleAlert className="mt-px size-3.5 shrink-0 text-danger" aria-label="Problema" />
                ) : (
                  <AlertTriangle className="mt-px size-3.5 shrink-0 text-warning" aria-label="Attenzione" />
                )}
                {a.testo}
              </li>
            ))}
          </ul>
        )}
      </header>

      {kpi ? (
        <>
          <dl className="grid grid-cols-3 gap-x-4 gap-y-3">
            <Numero etichetta="Lead" valore={formatNumero(kpi.lead)} delta={d(kpi.lead, kpiPrec?.lead)} />
            <Numero etichetta="Opportunità" valore={formatNumero(kpi.oppCreate)} delta={d(kpi.oppCreate, kpiPrec?.oppCreate)} />
            <Numero etichetta="Vinte" valore={formatNumero(kpi.vinte)} delta={d(kpi.vinte, kpiPrec?.vinte)} />
            <Numero
              etichetta="Venduto"
              valore={formatValuta(kpi.venduto, riga.valuta, kpi.venduto >= 100_000)}
              delta={d(kpi.venduto, kpiPrec?.venduto)}
              className="col-span-2"
            />
            <Numero etichetta="Chiusura" valore={formatPercentuale(kpi.tassoChiusura)} delta={d(kpi.tassoChiusura, kpiPrec?.tassoChiusura)} />
            {/* Spesa e costo per lead per ogni piattaforma con account associati (Meta, LinkedIn) */}
            {([
              ["Meta", riga.meta],
              ["LinkedIn", riga.linkedin],
            ] as const).map(([nome, ads]) =>
              ads ? (
                <Fragment key={nome}>
                  <Numero
                    etichetta={`Spesa ${nome}`}
                    valore={formatValuta(ads.spesa, riga.valuta, ads.spesa >= 100_000)}
                    delta={d(ads.spesa, ads.spesaPrec)}
                    neutra
                    className="col-span-2"
                  />
                  <Numero
                    etichetta={`Costo lead ${nome}`}
                    valore={ads.cplReale === null ? "n.d." : formatValuta(ads.cplReale, riga.valuta)}
                    delta={d(ads.cplReale, ads.cplRealePrec)}
                    inversa
                  />
                </Fragment>
              ) : null
            )}
          </dl>

          <section className="flex flex-col gap-1.5" aria-label="Andamento dei lead">
            <h4 className="text-label text-titolo">Andamento lead</h4>
            <Andamento valori={riga.leadGiornalieri} />
          </section>

          <section className="flex flex-col gap-2" aria-label="Provenienza dei lead">
            <h4 className="text-label text-titolo">Da dove arrivano i lead</h4>
            <Canali riga={riga} />
          </section>

          <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-auto self-start")}>
            Apri dashboard
          </Link>
        </>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-start gap-2 text-sm">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
            <p>{riga.avvisi.find((a) => a.livello === "errore")?.testo ?? "Dati non disponibili per questo cliente."}</p>
          </div>
          {riga.problemaToken ? (
            <Link href="/impostazioni" className={buttonVariants({ size: "sm" })}>Apri Impostazioni</Link>
          ) : (
            <Link href={href} className={buttonVariants({ variant: "outline", size: "sm" })}>Apri dashboard</Link>
          )}
        </div>
      )}
    </article>
  );
}
