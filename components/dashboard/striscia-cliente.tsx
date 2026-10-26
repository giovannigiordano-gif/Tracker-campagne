// Panoramica: una striscia per cliente con i numeri importanti sulla stessa riga, come le liste del Mac.
// Da 1280px i numeri stanno in colonna sotto un'intestazione unica; sotto, ogni striscia va a capo e ogni
// numero ha la sua etichetta. Tutta la striscia apre la dashboard del cliente. Fonte: GoHighLevel (lead,
// opportunità, venduto) e Meta / LinkedIn (spesa), periodo scelto in alto.
import Link from "next/link";
import { AlertTriangle, ChevronRight, CircleAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { NumeriAds, RigaPanoramica } from "@/lib/data/panoramica";
import { formatNumero, formatPercentuale, formatValuta } from "@/lib/format";
import { variazionePct } from "@/lib/metrics/dashboard";
import { cn } from "@/lib/utils";
import { Delta } from "./ui";

// Stesse colonne per intestazione e strisce: cliente, 7 numeri, (da 1536px) andamento, freccia
const COLONNE =
  "xl:grid-cols-[minmax(10.5rem,2fr)_repeat(7,minmax(5rem,1fr))_1rem] 2xl:grid-cols-[minmax(15rem,3fr)_repeat(7,minmax(5.25rem,1fr))_8rem_1rem]";
const MASSIMO_AVVISI = 2; // gli altri si vedono nella dashboard del cliente

const ETICHETTE = ["Lead", "Opportunità", "Vinte", "Venduto", "Chiusura", "Spesa ads", "Costo per lead"];

export function IntestazioneStrisce() {
  return (
    <div
      className={cn("hidden min-h-10 items-end gap-x-3 px-5 py-2 text-label leading-tight text-muted-foreground shadow-[inset_0_-1px_0_var(--border)] xl:grid", COLONNE)}
      aria-hidden
    >
      <span>Cliente</span>
      {ETICHETTE.map((e) => (
        <span key={e} className="text-right text-balance">
          {e}
        </span>
      ))}
      <span className="hidden text-right 2xl:block">Andamento lead</span>
      <span />
    </div>
  );
}

// Andamento dei lead giorno per giorno, largo quanto la colonna
function Andamento({ valori }: { valori: number[] }) {
  if (valori.length < 2) return null;
  const max = Math.max(...valori, 1);
  const min = Math.min(...valori);
  const punti = valori.map((v, i) => `${(i / (valori.length - 1)) * 100},${38 - (v / max) * 34}`).join(" ");
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-9 w-full" role="img" aria-label={`Lead giorno per giorno: minimo ${min}, massimo ${max}`}>
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

// Un numero della striscia: etichetta visibile solo quando la striscia va a capo (da 1280px c'è l'intestazione)
function Cella({ etichetta, children, sotto }: { etichetta: string; children: React.ReactNode; sotto?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 xl:items-end xl:text-right">
      <span className="text-caption text-muted-foreground xl:sr-only">{etichetta}</span>
      <span className="truncate text-numero-riga text-titolo">{children}</span>
      {sotto && <span className="truncate text-caption text-muted-foreground">{sotto}</span>}
    </div>
  );
}

const PIATTAFORME = [
  { nome: "Meta", canale: "Meta Ads", chiave: "meta" },
  { nome: "LinkedIn", canale: "LinkedIn Ads", chiave: "linkedin" },
] as const;

export function StrisciaCliente({ riga, confronto, query, indice }: { riga: RigaPanoramica; confronto: boolean; query: string; indice: number }) {
  const href = `/clienti/${riga.locationId}${query ? `?${query}` : ""}`;
  const { kpi, kpiPrec, valuta } = riga;
  const d = (att: number | null, prec: number | null | undefined) =>
    confronto && att !== null && prec !== null && prec !== undefined ? variazionePct(att, prec) : undefined;
  const delta = (pct: number | null | undefined, opz: { inversa?: boolean; neutra?: boolean } = {}) =>
    pct === undefined ? undefined : <Delta pct={pct} {...opz} />;
  const soldi = (n: number) => formatValuta(n, valuta, n >= 10_000);

  // Piattaforme pubblicitarie con account associati, con i lead arrivati nel CRM dal loro canale
  const ads = PIATTAFORME.flatMap((p) => {
    const n: NumeriAds | null = riga[p.chiave];
    return n ? [{ ...p, n, lead: riga.canali.find((c) => c.canale === p.canale)?.lead ?? 0 }] : [];
  });
  const spesa = ads.reduce((s, a) => s + a.n.spesa, 0);
  const spesaPrec = ads.reduce((s, a) => s + a.n.spesaPrec, 0);

  // Prima i problemi, poi gli avvisi
  const avvisi = [...riga.avvisi].sort((a, b) => Number(a.livello === "attenzione") - Number(b.livello === "attenzione"));
  const errori = avvisi.filter((a) => a.livello === "errore").length;

  return (
    <li
      className={cn(
        "entra-a-scaletta relative grid gap-x-4 gap-y-3 px-5 xl:gap-x-3 py-4 transition-colors motion-fast even:bg-background/70 hover:bg-accent/70 has-[a.striscia:focus-visible]:ring-2 has-[a.striscia:focus-visible]:ring-ring has-[a.striscia:focus-visible]:ring-inset xl:items-center xl:py-3.5",
        COLONNE
      )}
      style={{ "--i": indice } as React.CSSProperties}
    >
      {/* Cliente: il nome è il link e copre tutta la striscia */}
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[0.5rem] bg-muted font-heading text-sm font-bold text-muted-foreground" aria-hidden>
          {riga.nome.trim().charAt(0).toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-col items-start gap-0.5">
          <Link
            href={href}
            title={riga.nome}
            className="striscia line-clamp-2 text-[0.9375rem] leading-snug font-semibold [overflow-wrap:anywhere] text-titolo outline-none after:absolute after:inset-0 after:content-['']"
          >
            {riga.nome}
          </Link>
          {/* Quanti avvisi ha il cliente: il testo è subito sotto la riga */}
          {avvisi.length > 0 && (
            <span className={cn("inline-flex items-center gap-1 text-caption font-semibold", errori ? "text-danger" : "text-warning")}>
              {errori ? <CircleAlert className="size-3.5" aria-hidden /> : <AlertTriangle className="size-3.5" aria-hidden />}
              {avvisi.length === 1 ? "1 avviso" : `${avvisi.length} avvisi`}
            </span>
          )}
        </div>
        <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground xl:hidden" aria-hidden />
      </div>

      {kpi ? (
        <>
          <div className="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-4 lg:grid-cols-7 xl:contents">
            <Cella etichetta="Lead" sotto={delta(d(kpi.lead, kpiPrec?.lead))}>
              {formatNumero(kpi.lead)}
            </Cella>
            <Cella etichetta="Opportunità" sotto={delta(d(kpi.oppCreate, kpiPrec?.oppCreate))}>
              {formatNumero(kpi.oppCreate)}
            </Cella>
            <Cella etichetta="Vinte" sotto={delta(d(kpi.vinte, kpiPrec?.vinte))}>
              {formatNumero(kpi.vinte)}
            </Cella>
            <Cella etichetta="Venduto" sotto={delta(d(kpi.venduto, kpiPrec?.venduto))}>
              {soldi(kpi.venduto)}
            </Cella>
            <Cella etichetta="Chiusura" sotto={delta(d(kpi.tassoChiusura, kpiPrec?.tassoChiusura))}>
              {formatPercentuale(kpi.tassoChiusura)}
            </Cella>
            <Cella
              etichetta="Spesa ads"
              sotto={ads.length === 0 ? "nessun account" : (delta(d(spesa, spesaPrec), { neutra: true }) ?? ads.map((a) => a.nome).join(" + "))}
            >
              {ads.length === 0 ? <span className="text-muted-foreground">-</span> : soldi(spesa)}
            </Cella>
            {/* Costo per lead: spesa della piattaforma / lead arrivati nel CRM dal suo canale */}
            {ads.length === 2 ? (
              <div className="flex min-w-0 flex-col gap-0.5 xl:items-end xl:text-right">
                <span className="text-caption text-muted-foreground xl:sr-only">Costo per lead</span>
                {ads.map((a) => (
                  <span key={a.nome} className="truncate text-label text-titolo tabular-nums">
                    <span className="font-medium text-muted-foreground">{a.nome}</span> {a.n.cplReale === null ? "n.d." : soldi(a.n.cplReale)}
                  </span>
                ))}
              </div>
            ) : (
              <Cella
                etichetta="Costo per lead"
                sotto={
                  ads[0]
                    ? (delta(d(ads[0].n.cplReale, ads[0].n.cplRealePrec), { inversa: true }) ??
                      `${ads[0].nome}, ${ads[0].lead === 1 ? "1 lead" : `${formatNumero(ads[0].lead)} lead`}`)
                    : undefined
                }
              >
                {!ads[0] ? <span className="text-muted-foreground">-</span> : ads[0].n.cplReale === null ? "n.d." : soldi(ads[0].n.cplReale)}
              </Cella>
            )}
          </div>
          <div className="hidden 2xl:block">
            <Andamento valori={riga.leadGiornalieri} />
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm xl:col-[2/-2]">
          <p className="flex min-w-0 items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
            {avvisi.find((a) => a.livello === "errore")?.testo ?? "Dati non disponibili per questo cliente."}
          </p>
          {riga.problemaToken && (
            <Link href="/impostazioni" className={cn(buttonVariants({ size: "sm" }), "relative z-10")}>
              Apri Impostazioni
            </Link>
          )}
        </div>
      )}
      <ChevronRight className="hidden size-4 text-muted-foreground xl:block" aria-hidden />

      {/* Avvisi sotto la riga del cliente, su tutta la larghezza */}
      {kpi && avvisi.length > 0 && (
        <ul className="col-span-full flex flex-col gap-1 xl:pl-[2.625rem]">
          {avvisi.slice(0, MASSIMO_AVVISI).map((a) => (
            <li key={a.testo} className="flex items-start gap-1.5 text-caption text-foreground">
              {a.livello === "errore" ? (
                <CircleAlert className="mt-px size-3.5 shrink-0 text-danger" aria-label="Problema" />
              ) : (
                <AlertTriangle className="mt-px size-3.5 shrink-0 text-warning" aria-label="Attenzione" />
              )}
              {a.testo}
            </li>
          ))}
          {avvisi.length > MASSIMO_AVVISI && (
            <li className="pl-5 text-caption text-muted-foreground">
              {avvisi.length - MASSIMO_AVVISI === 1 ? "Un altro avviso" : `Altri ${avvisi.length - MASSIMO_AVVISI} avvisi`} nella dashboard del cliente
            </li>
          )}
        </ul>
      )}
    </li>
  );
}
