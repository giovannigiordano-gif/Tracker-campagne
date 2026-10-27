"use client";
// Pipeline: dove si trovano oggi le opportunità create nel periodo (dato reale di GHL),
// più una stima di quante sono arrivate almeno a ogni fase. A destra la situazione di tutte le aperte.
import type { AperteFase } from "@/lib/data/cliente";
import { formatDecimale, formatNumero, formatPercentuale, formatValuta } from "@/lib/format";
import { calcolaImbuto, type OppRow } from "@/lib/metrics/dashboard";
import type { Pipeline } from "@/lib/ghl/types";
import { NativeSelect } from "@/components/ui/native-select";
import { Riquadro } from "./ui";

export function FunnelPanel({
  pipelines,
  pipelineId,
  onPipeline,
  opp,
  giorni,
  aperte,
  valuta,
  id,
  scarica,
}: {
  pipelines: Pipeline[];
  pipelineId: string;
  onPipeline: (id: string) => void;
  opp: OppRow[];
  giorni: Set<string>;
  aperte: Record<string, AperteFase>;
  valuta: string;
  id?: string;
  scarica?: React.ReactNode; // pulsante "Scarica" della sezione
}) {
  const pipeline = pipelines.find((p) => p.id === pipelineId) ?? pipelines[0];
  if (!pipeline) {
    return (
      <Riquadro id={id} titolo="Pipeline" descrizione="Nessuna pipeline in questo sub-account">
        <span />
      </Riquadro>
    );
  }
  const fasi = calcolaImbuto(pipeline, opp, giorni);
  const create = fasi.reduce((s, f) => s + f.attuali, 0);
  const massimo = Math.max(...fasi.map((f) => f.attuali), 0);
  const totaleAperte = Object.values(aperte).reduce((s, f) => s + f.n, 0);
  const valoreAperte = Object.values(aperte).reduce((s, f) => s + f.valore, 0);

  return (
    <Riquadro
      id={id}
      titolo="Pipeline"
      descrizione={`${formatNumero(create)} opportunità create nel periodo in questa pipeline: in che fase si trovano oggi`}
      azioni={
        <>
          <NativeSelect
            value={pipeline.id}
            onChange={(e) => onPipeline(e.target.value)}
            aria-label="Pipeline"
            className="max-w-72"
          >
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </NativeSelect>
          {scarica}
        </>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="text-left align-bottom text-caption font-semibold text-muted-foreground">
            <tr>
              <th className="pb-2 pr-4 font-medium">Fase</th>
              <th className="w-[30%] pb-2 pr-4 font-medium">Oggi in questa fase</th>
              <th className="pb-2 pr-4 text-right font-medium">Arrivate qui (stima)</th>
              <th className="pb-2 pr-6 text-right font-medium">Passaggio (stima)</th>
              <th className="border-l pb-2 pl-6 pr-4 text-right font-medium">Aperte oggi</th>
              <th className="pb-2 pr-4 text-right font-medium">Valore</th>
              <th className="pb-2 text-right font-medium">Giorni in fase</th>
            </tr>
          </thead>
          <tbody>
            {fasi.map((f) => {
              const oggi = aperte[f.id];
              return (
                <tr key={f.id} className="border-t">
                  <td className="max-w-52 truncate py-2 pr-4 font-medium" title={f.nome}>{f.nome}</td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-5 shrink-0 rounded-md bg-[var(--viz-barra)]"
                        style={{ width: `${massimo ? Math.max((f.attuali / massimo) * 80, f.attuali ? 2 : 0) : 0}%` }}
                      />
                      <span className="font-semibold">{formatNumero(f.attuali)}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-right text-muted-foreground">{formatNumero(f.raggiunte)}</td>
                  <td className="py-2 pr-6 text-right text-muted-foreground">{f.conversione === null ? "n.d." : formatPercentuale(f.conversione)}</td>
                  <td className="border-l py-2 pl-6 pr-4 text-right">{oggi ? formatNumero(oggi.n) : "0"}</td>
                  <td className="whitespace-nowrap py-2 pr-4 text-right text-muted-foreground">{formatValuta(oggi?.valore ?? 0, valuta)}</td>
                  <td className="py-2 text-right text-muted-foreground">{oggi?.giorniMedi != null ? formatDecimale(oggi.giorniMedi) : "n.d."}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        «Oggi in questa fase» è il dato reale di GHL. GHL però non registra lo storico dei passaggi: le colonne «stima» considerano
        che un&apos;opportunità oggi in una fase sia passata da tutte quelle precedenti, quindi sono inaffidabili se la pipeline ha fasi
        di uscita in mezzo (es. «Fake», «Fuori target»). Le ultime tre colonne, che non dipendono dal periodo, riguardano le {formatNumero(totaleAperte)} opportunità
        aperte oggi in questa pipeline ({formatValuta(valoreAperte, valuta)}) e da quanti giorni, in media, sono ferme nella fase.
      </p>
    </Riquadro>
  );
}
