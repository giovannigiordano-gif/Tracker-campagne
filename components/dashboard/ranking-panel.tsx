"use client";
// "Da dove arrivano lead e vendite": canali, campagne, fonti e tag in un solo pannello a schede.
// Un clic su una voce la aggiunge ai filtri di tutta la pagina; un secondo clic la toglie.
import { useState } from "react";
import { Check } from "lucide-react";
import { Segmented } from "@/components/ui/segmented";
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumero, formatValuta } from "@/lib/format";
import type { Dimensione, VoceClassifica } from "@/lib/metrics/dashboard";
import { cn } from "@/lib/utils";
import { Riquadro } from "./ui";

const VISIBILI = 8;

export type SchedaProvenienza = {
  dimensione: Dimensione;
  etichetta: string;
  aiuto: string;
  voci: VoceClassifica[];
  selezionate: string[];
  vuoto: string;
};

function Elenco({
  scheda,
  ordine,
  onToggle,
  valuta,
}: {
  scheda: SchedaProvenienza;
  ordine: "lead" | "venduto";
  onToggle: (chiave: string) => void;
  valuta: string;
}) {
  const [tutte, setTutte] = useState(false);
  const ordinate = [...scheda.voci].sort((a, b) =>
    ordine === "lead" ? b.lead - a.lead || b.venduto - a.venduto : b.venduto - a.venduto || b.lead - a.lead
  );
  const massimo = Math.max(...ordinate.map((v) => (ordine === "lead" ? v.lead : v.venduto)), 0);
  const mostrate = tutte ? ordinate : ordinate.slice(0, VISIBILI);

  if (ordinate.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{scheda.vuoto}</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_7rem] gap-x-3 px-3 pb-1 text-caption text-muted-foreground">
        <span>{scheda.aiuto}</span>
        <span className="text-right">Lead</span>
        <span className="text-right">Venduto</span>
      </div>
      <ul className="flex flex-col gap-0.5">
        {mostrate.map((v, i) => {
          const attiva = scheda.selezionate.includes(v.chiave);
          const misura = ordine === "lead" ? v.lead : v.venduto;
          return (
            <li key={v.chiave} className="entra-a-scaletta" style={{ "--i": i } as React.CSSProperties}>
              <button
                type="button"
                aria-pressed={attiva}
                onClick={() => onToggle(v.chiave)}
                title={attiva ? "Togli dai filtri" : "Filtra la pagina su questa voce"}
                className={cn(
                  "grid w-full grid-cols-[minmax(0,1fr)_4.5rem_7rem] items-center gap-x-3 gap-y-1.5 rounded-block px-3 py-2 text-left",
                  "transition-[background-color,box-shadow] motion-fast",
                  attiva ? "bg-accent ring-2 ring-ring" : "hover:bg-muted"
                )}
              >
                <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-titolo">
                  {attiva && <Check className="size-4 shrink-0" aria-hidden />}
                  <span className="truncate" title={v.etichetta}>{v.etichetta}</span>
                </span>
                <span className="text-right text-sm font-semibold text-titolo">{formatNumero(v.lead)}</span>
                <span className="text-right text-sm text-muted-foreground">{formatValuta(v.venduto, valuta)}</span>
                <span className="col-span-3 h-1.5">
                  <span
                    className="block h-1.5 rounded-full bg-[var(--viz-barra)] transition-[width] motion-slow"
                    style={{ width: `${massimo > 0 ? Math.max((misura / massimo) * 100, misura > 0 ? 1.5 : 0) : 0}%` }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {ordinate.length > VISIBILI && (
        <button
          type="button"
          onClick={() => setTutte(!tutte)}
          className="mt-1 self-start rounded-control px-3 py-1.5 text-sm font-semibold text-titolo transition-colors motion-fast hover:bg-muted"
        >
          {tutte ? "Mostra solo le prime 8" : `Mostra tutte (${ordinate.length})`}
        </button>
      )}
    </div>
  );
}

export function ProvenienzaPanel({
  schede,
  onToggle,
  valuta,
  id,
  scarica,
}: {
  schede: SchedaProvenienza[];
  onToggle: (d: Dimensione, chiave: string) => void;
  valuta: string;
  id?: string;
  scarica?: React.ReactNode; // pulsante "Scarica" della sezione
}) {
  const [ordine, setOrdine] = useState<"lead" | "venduto">("lead");
  return (
    <Riquadro
      id={id}
      titolo="Da dove arrivano lead e vendite"
      descrizione="Clicca una voce per filtrare tutta la pagina. Puoi sceglierne più di una, anche in schede diverse."
      azioni={
        <>
          <Segmented
            etichetta="Ordina per"
            opzioni={[{ v: "lead", label: "Più lead" }, { v: "venduto", label: "Più venduto" }]}
            valore={ordine}
            onChange={setOrdine}
          />
          {scarica}
        </>
      }
    >
      <Tabs defaultValue={schede[0]?.dimensione}>
        <TabsList aria-label="Dimensione">
          {schede.map((s) => (
            <TabsTrigger key={s.dimensione} value={s.dimensione}>
              {s.etichetta}
              {s.selezionate.length > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[0.6875rem] font-bold text-brand-ink">
                  <span className="sr-only">filtri attivi: </span>
                  {s.selezionate.length}
                </span>
              )}
            </TabsTrigger>
          ))}
          <TabsIndicator />
        </TabsList>
        {schede.map((s) => (
          <TabsContent key={s.dimensione} value={s.dimensione}>
            <Elenco scheda={s} ordine={ordine} onToggle={(k) => onToggle(s.dimensione, k)} valuta={valuta} />
          </TabsContent>
        ))}
      </Tabs>
    </Riquadro>
  );
}
