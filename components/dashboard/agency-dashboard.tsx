"use client";
// Panoramica dell'agenzia: totali di tutti i clienti e una scheda per cliente con lo spaccato rapido
// dei suoi dati (numeri chiave, andamento, canali, avvisi) e il pulsante per aprire la sua dashboard.
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { RefreshButton } from "@/components/refresh-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import type { RigaPanoramica } from "@/lib/data/panoramica";
import { formatNumero, formatPercentuale, formatValuta } from "@/lib/format";
import { variazionePct } from "@/lib/metrics/dashboard";
import { formatGiorno } from "@/lib/period";
import { cn } from "@/lib/utils";
import { SchedaCliente } from "./scheda-cliente";
import { Fonte, PannelloNumeri, type VoceNumero } from "./ui";

type Ordine = "venduto" | "lead" | "vinte" | "nome";
const SOGLIA_RICERCA = 8; // con molti clienti compare il campo di ricerca

export function AgencyDashboard({ righe, confronto, query }: { righe: RigaPanoramica[]; confronto: boolean; query: string }) {
  const [ordine, setOrdine] = useState<Ordine>("venduto");
  const [soloAvvisi, setSoloAvvisi] = useState(false);
  const [cerca, setCerca] = useState("");

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

  // ------------------------------------------------ schede dei clienti
  const schede = useMemo(() => {
    const testo = cerca.trim().toLowerCase();
    const valore = (r: RigaPanoramica) =>
      !r.kpi ? -1 : ordine === "lead" ? r.kpi.lead : ordine === "vinte" ? r.kpi.vinte : r.kpi.venduto;
    return righe
      .filter((r) => (!soloAvvisi || r.avvisi.length > 0) && (!testo || r.nome.toLowerCase().includes(testo)))
      .sort((a, b) => (ordine === "nome" ? a.nome.localeCompare(b.nome, "it") : valore(b) - valore(a) || a.nome.localeCompare(b.nome, "it")));
  }, [righe, ordine, soloAvvisi, cerca]);

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

      <section className="flex flex-col gap-4" aria-labelledby="titolo-clienti">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titolo-clienti" className="text-section">I tuoi clienti</h2>
          <div className="flex flex-wrap items-center gap-3">
            {righe.length > SOGLIA_RICERCA && (
              <label className="relative">
                <span className="sr-only">Cerca un cliente</span>
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={cerca}
                  onChange={(e) => setCerca(e.target.value)}
                  placeholder="Cerca un cliente…"
                  className="h-9 w-56 pl-10"
                  data-scorciatoia="cerca"
                />
              </label>
            )}
            <label className={cn("flex items-center gap-2.5 text-sm font-medium text-titolo", !conAvvisi && "opacity-50")}>
              <Switch checked={soloAvvisi} disabled={!conAvvisi} onCheckedChange={setSoloAvvisi} />
              Solo da controllare ({conAvvisi})
            </label>
            <Segmented
              etichetta="Ordina i clienti per"
              opzioni={[
                { v: "venduto", label: "Venduto" },
                { v: "lead", label: "Lead" },
                { v: "vinte", label: "Vinte" },
                { v: "nome", label: "Nome" },
              ]}
              valore={ordine}
              onChange={setOrdine}
            />
          </div>
        </div>

        {schede.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-panel bg-muted p-panel">
            <p className="font-bold text-titolo">{soloAvvisi ? "Nessun cliente da controllare." : "Nessun cliente con questo nome."}</p>
            <Button variant="outline" size="sm" onClick={() => { setSoloAvvisi(false); setCerca(""); }}>
              Mostra tutti i clienti
            </Button>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {schede.map((r, i) => (
              <li key={r.locationId} className="entra-a-scaletta flex" style={{ "--i": i } as React.CSSProperties}>
                <SchedaCliente riga={r} confronto={confronto} query={query} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
