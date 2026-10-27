"use client";
// Pulsante "Scarica" con un piccolo menu: Excel (tutte le tabelle della sezione nello stesso file, un foglio
// ciascuna, più un foglio "Info" con fonte e periodo) oppure CSV (una tabella per file).
// Le tabelle si calcolano solo all'apertura del menu e i file si creano nel browser.
import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuGroup, MenuGroupLabel, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { scaricaCsv, scaricaExcel } from "@/lib/export/scarica";
import { nomeFileExport, tabellaInfo, type RigaInfo, type TabellaExport } from "@/lib/export/tabella";
import { formatNumero } from "@/lib/format";

type Props = {
  titolo: string; // nome della sezione, all'inizio del nome del file (es. "Andamento")
  contesto: string[]; // cliente e periodo, per il nome del file
  tabelle: () => TabellaExport[];
  info?: () => RigaInfo[]; // fonte, periodo e filtri: foglio "Info" del file Excel
  etichetta?: string;
  disabilitato?: boolean;
};

export function MenuScarica({ etichetta = "Scarica", disabilitato = false, ...props }: Props) {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" size="sm" disabled={disabilitato} />}>
        <Download aria-hidden /> {etichetta}
        <ChevronDown className="-mr-1 opacity-70" aria-hidden />
      </MenuTrigger>
      <MenuContent>
        <Voci {...props} />
      </MenuContent>
    </Menu>
  );
}

// Il contenuto del menu esiste solo quando il menu è aperto: le tabelle si calcolano qui
function Voci({ titolo, contesto, tabelle, info }: Omit<Props, "etichetta" | "disabilitato">) {
  const t = tabelle();
  const righe = (x: TabellaExport) => (x.righe.length === 1 ? "1 riga" : `${formatNumero(x.righe.length)} righe`);
  return (
    <>
      <MenuItem
        onClick={() => scaricaExcel(info ? [...t, tabellaInfo(info())] : t, nomeFileExport([titolo, ...contesto], "xlsx"))}
      >
        <FileSpreadsheet aria-hidden />
        <span className="flex min-w-0 flex-col">
          <span className="font-semibold text-titolo">Excel (.xlsx)</span>
          <span className="text-caption text-muted-foreground">
            {t.length === 1 ? righe(t[0]) : `${t.length} fogli: ${t.map((x) => x.nome).join(", ")}`}
          </span>
        </span>
      </MenuItem>
      <MenuSeparator />
      <MenuGroup>
        {t.length > 1 && <MenuGroupLabel>CSV, un file per tabella</MenuGroupLabel>}
        {t.map((x) => (
          <MenuItem
            key={x.nome}
            onClick={() => scaricaCsv(x, nomeFileExport(t.length > 1 ? [titolo, x.nome, ...contesto] : [titolo, ...contesto], "csv"))}
          >
            <FileText aria-hidden />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-semibold text-titolo">{t.length > 1 ? x.nome : "CSV"}</span>
              <span className="text-caption text-muted-foreground">{righe(x)}</span>
            </span>
          </MenuItem>
        ))}
      </MenuGroup>
    </>
  );
}
