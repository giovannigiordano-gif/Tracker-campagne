"use client";
// Panoramica dell'agenzia: totali, confronto tra clienti (cliccabile) e tabella clienti.
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CircleAlert } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { RefreshButton } from "@/components/refresh-button";
import type { RigaPanoramica } from "@/lib/data/panoramica";
import { formatNumero, formatPercentuale, formatValuta } from "@/lib/format";
import { variazionePct } from "@/lib/metrics/dashboard";
import { formatGiorno } from "@/lib/period";
import { cn } from "@/lib/utils";
import { DataTable, funzioniTabella, type Colonna } from "./data-table";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { Delta, Fonte, PannelloNumeri, Riquadro, type VoceNumero } from "./ui";

function Sparkline({ valori }: { valori: number[] }) {
  if (valori.length < 2) return null;
  const max = Math.max(...valori, 1);
  const w = 96;
  const h = 26;
  const punti = valori.map((v, i) => `${(i / (valori.length - 1)) * w},${h - 2 - (v / max) * (h - 4)}`).join(" ");
  return (
    <svg width={w} height={h} role="img" aria-label={`Lead giorno per giorno, massimo ${max}`}>
      <polyline points={punti} fill="none" stroke="var(--viz-attuale)" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

type Metrica = "lead" | "vinte" | "venduto";

export function AgencyDashboard({ righe, confronto, query }: { righe: RigaPanoramica[]; confronto: boolean; query: string }) {
  const router = useRouter();
  const [metrica, setMetrica] = useState<Metrica>("venduto");
  const [soloAvvisi, setSoloAvvisi] = useState(false);

  const conDati = righe.filter((r) => r.kpi);
  const valute = new Set(conDati.map((r) => r.valuta));
  const valutaUnica = valute.size <= 1 ? [...valute][0] ?? "EUR" : null;
  const somma = (f: (r: RigaPanoramica) => number) => conDati.reduce((s, r) => s + f(r), 0);
  const t = {
    lead: somma((r) => r.kpi!.lead),
    leadPrec: somma((r) => r.kpiPrec!.lead),
    opp: somma((r) => r.kpi!.oppCreate),
    oppPrec: somma((r) => r.kpiPrec!.oppCreate),
    vinte: somma((r) => r.kpi!.vinte),
    vintePrec: somma((r) => r.kpiPrec!.vinte),
    perse: somma((r) => r.kpi!.perse),
    persePrec: somma((r) => r.kpiPrec!.perse),
    venduto: somma((r) => r.kpi!.venduto),
    vendutoPrec: somma((r) => r.kpiPrec!.venduto),
  };
  const tasso = (v: number, p: number) => (v + p ? (v / (v + p)) * 100 : null);
  const tassoAtt = tasso(t.vinte, t.perse);
  const tassoPrec = tasso(t.vintePrec, t.persePrec);
  const conAvvisi = righe.filter((r) => r.avvisi.length > 0).length;

  const numeri: VoceNumero[] = [
    { etichetta: "Lead", valore: formatNumero(t.lead), delta: variazionePct(t.lead, t.leadPrec), precedente: formatNumero(t.leadPrec) },
    { etichetta: "Opportunità", valore: formatNumero(t.opp), delta: variazionePct(t.opp, t.oppPrec), precedente: formatNumero(t.oppPrec) },
    { etichetta: "Vinte", valore: formatNumero(t.vinte), delta: variazionePct(t.vinte, t.vintePrec), precedente: formatNumero(t.vintePrec) },
    {
      etichetta: "Venduto",
      valore: valutaUnica ? formatValuta(t.venduto, valutaUnica, t.venduto >= 100_000) : "Valute diverse",
      valoreBreve: valutaUnica ? formatValuta(t.venduto, valutaUnica, t.venduto >= 10_000) : undefined,
      delta: valutaUnica ? variazionePct(t.venduto, t.vendutoPrec) : null,
      precedente: valutaUnica ? formatValuta(t.vendutoPrec, valutaUnica, true) : undefined,
    },
    {
      etichetta: "Tasso di chiusura",
      valore: formatPercentuale(tassoAtt),
      delta: tassoAtt !== null && tassoPrec !== null ? variazionePct(tassoAtt, tassoPrec) : null,
      precedente: formatPercentuale(tassoPrec),
    },
    { etichetta: "Da controllare", valore: `${conAvvisi} su ${righe.length}`, spiegazione: "Clienti con token mancanti o scaduti, limiti GHL o lead in calo oltre la soglia" },
  ];

  // ------------------------------------------------ confronto tra clienti (barre cliccabili)
  const valoreDi = (r: RigaPanoramica) => (r.kpi ? (metrica === "lead" ? r.kpi.lead : metrica === "vinte" ? r.kpi.vinte : r.kpi.venduto) : 0);
  const classifica = [...conDati].sort((a, b) => valoreDi(b) - valoreDi(a)).slice(0, 12);
  const massimo = Math.max(...classifica.map(valoreDi), 0);
  const fmt = (r: RigaPanoramica, n: number) => (metrica === "venduto" ? formatValuta(n, r.valuta) : formatNumero(n));

  // ------------------------------------------------ tabella clienti
  const colonne = useMemo(() => {
    const h = createColumnHelper<typeof funzioniTabella, RigaPanoramica>();
    const num = (f: (r: RigaPanoramica) => number | null) => (r: RigaPanoramica) => f(r) ?? -1;
    return h.columns([
      h.accessor("nome", {
        header: "Cliente",
        sortFn: "alphanumeric",
        cell: (i) => (
          <Link href={`/clienti/${i.row.original.locationId}?${query}`} className="font-semibold text-titolo hover:underline">
            {i.getValue()}
          </Link>
        ),
      }),
      h.accessor(num((r) => r.kpi?.lead ?? null), {
        id: "lead",
        header: "Lead",
        sortFn: "basic",
        meta: { numerica: true },
        cell: (i) => {
          const r = i.row.original;
          if (!r.kpi) return "n.d.";
          return (
            <span className="flex flex-col items-end">
              <span className="font-semibold">{formatNumero(r.kpi.lead)}</span>
              {confronto && <span className="text-xs"><Delta pct={variazionePct(r.kpi.lead, r.kpiPrec!.lead)} /></span>}
            </span>
          );
        },
      }),
      h.display({ id: "andamento", header: "Andamento lead", cell: (i) => <Sparkline valori={i.row.original.leadGiornalieri} /> }),
      h.accessor(num((r) => r.kpi?.oppCreate ?? null), { id: "opp", header: "Opportunità", sortFn: "basic", meta: { numerica: true }, cell: (i) => (i.row.original.kpi ? formatNumero(i.row.original.kpi.oppCreate) : "n.d.") }),
      h.accessor(num((r) => r.kpi?.vinte ?? null), { id: "vinte", header: "Vinte", sortFn: "basic", meta: { numerica: true }, cell: (i) => (i.row.original.kpi ? formatNumero(i.row.original.kpi.vinte) : "n.d.") }),
      h.accessor(num((r) => r.kpi?.venduto ?? null), {
        id: "venduto",
        header: "Venduto",
        sortFn: "basic",
        meta: { numerica: true },
        cell: (i) => {
          const r = i.row.original;
          if (!r.kpi) return "n.d.";
          return (
            <span className="flex flex-col items-end">
              <span className="font-semibold">{formatValuta(r.kpi.venduto, r.valuta)}</span>
              {confronto && <span className="text-xs"><Delta pct={variazionePct(r.kpi.venduto, r.kpiPrec!.venduto)} /></span>}
            </span>
          );
        },
      }),
      h.accessor(num((r) => r.kpi?.tassoChiusura ?? null), { id: "tasso", header: "Chiusura", sortFn: "basic", meta: { numerica: true }, cell: (i) => formatPercentuale(i.row.original.kpi?.tassoChiusura ?? null) }),
      h.display({
        id: "avvisi",
        header: "Avvisi",
        cell: (i) => {
          const avvisi = i.row.original.avvisi;
          if (!avvisi.length) return <span className="text-muted-foreground">Nessuno</span>;
          return (
            <ul className="flex flex-col gap-1 whitespace-normal">
              {avvisi.map((a) => (
                <li key={a.testo} className="flex items-start gap-1.5 text-xs">
                  {a.livello === "errore" ? (
                    <CircleAlert className="mt-px size-3.5 shrink-0 text-danger" aria-label="Errore" />
                  ) : (
                    <AlertTriangle className="mt-px size-3.5 shrink-0 text-warning" aria-label="Attenzione" />
                  )}
                  {a.testo}
                </li>
              ))}
            </ul>
          );
        },
      }),
    ]) as Colonna<RigaPanoramica>[];
  }, [query, confronto]);

  const datiTabella = useMemo(() => (soloAvvisi ? righe.filter((r) => r.avvisi.length) : righe), [righe, soloAvvisi]);
  const intervallo = righe[0] ? `dal ${formatGiorno(righe[0].daGiorno)} al ${formatGiorno(righe[0].aGiorno)}` : "";
  const aggiornato = Math.min(...righe.map((r) => r.aggiornatoIl ?? Infinity));

  return (
    <div className="flex animate-entra flex-col gap-section">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-title">Panoramica agenzia</h1>
          <p className="mt-1.5 text-body text-muted-foreground">
            {righe.length === 1 ? "1 cliente seguito" : `${righe.length} clienti seguiti`}, periodo {intervallo}.
          </p>
        </div>
        <RefreshButton etichetta="Aggiorna tutti i dati" />
      </header>

      <div className="flex flex-col gap-2">
        <PannelloNumeri voci={numeri} confronto={confronto} />
        <Fonte aggiornatoIl={Number.isFinite(aggiornato) ? aggiornato : null}>
          Fonte GoHighLevel. Somme di tutti i clienti attivi; ogni cliente conta i giorni nel proprio fuso orario.
        </Fonte>
      </div>

      <Riquadro
        titolo="Clienti a confronto"
        descrizione="I primi 12 per la metrica scelta. Clicca un cliente per aprire la sua dashboard."
        azioni={
          <Segmented
            etichetta="Metrica"
            opzioni={[{ v: "venduto", label: "Venduto" }, { v: "vinte", label: "Vinte" }, { v: "lead", label: "Lead" }]}
            valore={metrica}
            onChange={setMetrica}
          />
        }
      >
        {classifica.length === 0 ? (
          <p className="rounded-block bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
            Nessun dato disponibile: controlla gli avvisi nella tabella qui sotto.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {classifica.map((r, i) => {
              const v = valoreDi(r);
              return (
                <li key={r.locationId} className="entra-a-scaletta" style={{ "--i": i } as React.CSSProperties}>
                  <button
                    type="button"
                    onClick={() => router.push(`/clienti/${r.locationId}?${query}`)}
                    className="group grid w-full grid-cols-[minmax(7rem,14rem)_minmax(0,1fr)_7.5rem] items-center gap-3 rounded-block px-3 py-2 text-left transition-colors motion-fast hover:bg-muted"
                  >
                    <span className="truncate text-sm font-semibold text-titolo">{r.nome}</span>
                    <span className="h-6">
                      <span
                        className="block h-6 rounded-md bg-[var(--viz-barra)] transition-[width,opacity] motion-slow group-hover:opacity-85"
                        style={{ width: `${massimo ? Math.max((v / massimo) * 100, v ? 1.5 : 0) : 0}%` }}
                      />
                    </span>
                    <span className="text-right text-sm font-bold text-titolo">{fmt(r, v)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Riquadro>

      <Riquadro titolo="Tutti i clienti" descrizione="Clicca un'intestazione per ordinare, il nome per aprire la dashboard.">
        <DataTable
          key={soloAvvisi ? "avvisi" : "tutti"}
          dati={datiTabella}
          colonne={colonne}
          ordinamento={[{ id: "venduto", desc: true }]}
          cercabili={["nome"]}
          segnapostoRicerca="Cerca un cliente…"
          vuoto={soloAvvisi ? "Nessun cliente da controllare." : "Nessun cliente con questo nome."}
          strumenti={
            <label className={cn("flex items-center gap-2.5 text-sm font-medium text-titolo", !conAvvisi && "opacity-50")}>
              <Switch checked={soloAvvisi} disabled={!conAvvisi} onCheckedChange={setSoloAvvisi} />
              Solo da controllare ({conAvvisi})
            </label>
          }
        />
      </Riquadro>
    </div>
  );
}
