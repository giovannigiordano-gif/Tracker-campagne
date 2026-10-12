"use client";
// Classifica cliccabile (canale, campagna, fonte, tag): un clic su una voce
// la aggiunge ai filtri e tutta la dashboard si aggiorna; un secondo clic la toglie.
import { useState } from "react";
import { Check } from "lucide-react";
import { formatNumero, formatValuta } from "@/lib/format";
import type { VoceClassifica } from "@/lib/metrics/dashboard";
import { cn } from "@/lib/utils";
import { Pillole, Riquadro } from "./ui";

const VISIBILI = 8;

export function RankingPanel({
  titolo,
  descrizione,
  voci,
  selezionate,
  onToggle,
  valuta,
  vuoto = "Nessun dato nel periodo",
}: {
  titolo: string;
  descrizione: string;
  voci: VoceClassifica[];
  selezionate: string[];
  onToggle: (chiave: string) => void;
  valuta: string;
  vuoto?: string;
}) {
  const [ordine, setOrdine] = useState<"lead" | "venduto">("lead");
  const [tutte, setTutte] = useState(false);
  const ordinate = [...voci].sort((a, b) =>
    ordine === "lead" ? b.lead - a.lead || b.venduto - a.venduto : b.venduto - a.venduto || b.lead - a.lead,
  );
  const massimo = Math.max(...ordinate.map((v) => (ordine === "lead" ? v.lead : v.venduto)), 0);
  const mostrate = tutte ? ordinate : ordinate.slice(0, VISIBILI);

  return (
    <Riquadro
      titolo={titolo}
      descrizione={descrizione}
      azioni={
        <Pillole
          etichetta="Ordina per"
          opzioni={[{ v: "lead", label: "Lead" }, { v: "venduto", label: "Venduto" }]}
          valore={ordine}
          onChange={setOrdine}
        />
      }
    >
      {voci.length === 0 ? (
        <p className="text-sm text-muted-foreground">{vuoto}</p>
      ) : (
        <>
          <div className="grid grid-cols-[minmax(0,1fr)_4rem_6.5rem] gap-x-3 px-2 text-xs text-muted-foreground">
            <span>Clic su una voce per filtrare la dashboard</span>
            <span className="text-right">Lead</span>
            <span className="text-right">Venduto</span>
          </div>
          <ul className="-mt-2 flex flex-col">
            {mostrate.map((v) => {
              const attiva = selezionate.includes(v.chiave);
              const misura = ordine === "lead" ? v.lead : v.venduto;
              return (
                <li key={v.chiave}>
                  <button
                    type="button"
                    aria-pressed={attiva}
                    onClick={() => onToggle(v.chiave)}
                    title={attiva ? "Togli dai filtri" : "Filtra la dashboard su questa voce"}
                    className={cn(
                      "grid w-full grid-cols-[minmax(0,1fr)_4rem_6.5rem] items-center gap-x-3 gap-y-1 rounded-xl px-2 py-1.5 text-left transition-colors",
                      attiva ? "bg-accent ring-2 ring-brand" : "hover:bg-muted",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                      {attiva && <Check className="size-3.5 shrink-0 text-black" aria-hidden />}
                      <span className="truncate">{v.etichetta}</span>
                    </span>
                    <span className="text-right text-sm font-semibold">{formatNumero(v.lead)}</span>
                    <span className="text-right text-sm text-muted-foreground">{v.venduto ? formatValuta(v.venduto, valuta) : "—"}</span>
                    <span className="col-span-3 h-1.5 rounded-full bg-muted">
                      <span
                        className="block h-1.5 rounded-full bg-[var(--viz-barra)]"
                        style={{ width: `${massimo > 0 ? Math.max((misura / massimo) * 100, misura > 0 ? 1.5 : 0) : 0}%` }}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {ordinate.length > VISIBILI && (
            <button type="button" onClick={() => setTutte(!tutte)} className="self-start text-sm font-semibold text-muted-foreground hover:text-foreground">
              {tutte ? "Mostra meno" : `Mostra tutte (${ordinate.length})`}
            </button>
          )}
        </>
      )}
    </Riquadro>
  );
}
