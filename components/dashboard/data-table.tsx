"use client";
// Tabella riusabile (TanStack Table v9): ricerca, ordinamento, pagine e pulsante "Scarica" (CSV o Excel).
// I file vengono creati qui nel browser e scaricati sul tuo computer: non vengono salvati sul server.
// Si scaricano le righe come si vedono: con la ricerca e l'ordinamento attuali, tutte le pagine.
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from "lucide-react";
import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ColonnaExport, RigaInfo, ValoreExport } from "@/lib/export/tabella";
import { formatNumero } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MenuScarica } from "./scarica";

export const funzioniTabella = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

export type Colonna<T extends RowData> = ColumnDef<typeof funzioniTabella, T, any>;

// Cosa scaricare: titolo (nome del file e del foglio), cliente e periodo, colonne con il loro tipo e valori di una riga
export type EsportaTabella<T> = {
  titolo: string;
  contesto: string[];
  colonne: ColonnaExport[];
  riga: (r: T) => ValoreExport[];
  info?: () => RigaInfo[];
};

// ---------------------------------------------------------------- tabella
export function DataTable<T extends RowData>({
  dati,
  colonne,
  ordinamento,
  cercabili,
  segnapostoRicerca = "Cerca…",
  esporta,
  vuoto = "Nessun risultato",
  perPagina = 25,
  strumenti,
}: {
  dati: T[];
  colonne: Colonna<T>[];
  ordinamento?: SortingState;
  cercabili?: string[];
  segnapostoRicerca?: string;
  esporta?: EsportaTabella<T>;
  vuoto?: string;
  perPagina?: number;
  strumenti?: React.ReactNode; // altri controlli accanto alla ricerca
}) {
  const table = useTable({
    features: funzioniTabella,
    columns: colonne,
    data: dati,
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: (col) => (cercabili ? cercabili.includes(col.id) : true),
    initialState: { sorting: ordinamento ?? [], pagination: { pageIndex: 0, pageSize: perPagina } },
  });

  const filtrate = table.getFilteredRowModel().rows.length;
  const pagine = Math.max(table.getPageCount(), 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {cercabili && (
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              placeholder={segnapostoRicerca}
              aria-label={segnapostoRicerca.replace("…", "")}
              data-scorciatoia="cerca"
              aria-keyshortcuts="/"
              value={String(table.state.globalFilter ?? "")}
              onChange={(e) => table.setGlobalFilter(e.target.value)}
              className="h-9 pl-10"
            />
          </div>
        )}
        {strumenti}
        {esporta && (
          <div className="ml-auto">
            <MenuScarica
              etichetta={`Scarica (${formatNumero(filtrate)})`}
              disabilitato={filtrate === 0}
              titolo={esporta.titolo}
              contesto={esporta.contesto}
              info={esporta.info}
              tabelle={() => [
                { nome: esporta.titolo, colonne: esporta.colonne, righe: table.getSortedRowModel().rows.map((r) => esporta.riga(r.original)) },
              ]}
            />
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-block ring-1 ring-border">
        <table className="w-full text-sm">
          {/* Come le liste del Mac: intestazioni leggere, righe alternate, filo sotto l'intestazione */}
          <thead className="bg-card text-left shadow-[inset_0_-1px_0_var(--border)]">
            {table.getHeaderGroups().map((g) => (
              <tr key={g.id}>
                {g.headers.map((h) => {
                  const verso = h.column.getIsSorted();
                  const numerica = (h.column.columnDef.meta as { numerica?: boolean } | undefined)?.numerica;
                  return (
                    <th
                      key={h.id}
                      className={cn("h-10 whitespace-nowrap px-3 text-label text-muted-foreground", numerica && "text-right")}
                      aria-sort={verso === "asc" ? "ascending" : verso === "desc" ? "descending" : undefined}
                    >
                      {h.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={h.column.getToggleSortingHandler()}
                          className={cn("group/sort -mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors motion-fast hover:bg-muted hover:text-titolo", numerica && "flex-row-reverse")}
                        >
                          <table.FlexRender header={h} />
                          {verso === "asc" ? (
                            <ArrowUp className="size-3.5 text-titolo" aria-hidden />
                          ) : verso === "desc" ? (
                            <ArrowDown className="size-3.5 text-titolo" aria-hidden />
                          ) : (
                            <ChevronsUpDown className="size-3.5 text-muted-foreground opacity-60 transition-opacity motion-fast group-hover/sort:opacity-100" aria-hidden />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={h} />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={colonne.length} className="px-3 py-10 text-center text-sm text-muted-foreground">{vuoto}</td>
              </tr>
            ) : (
              table.getRowModel().rows.map((r) => (
                <tr key={r.id} className="transition-colors motion-fast even:bg-background/70 hover:bg-accent/70">
                  {r.getAllCells().map((c) => {
                    const numerica = (c.column.columnDef.meta as { numerica?: boolean } | undefined)?.numerica;
                    return (
                      <td key={c.id} className={cn("h-11 max-w-64 truncate px-3 text-foreground", numerica && "text-right tabular-nums")}>
                        <table.FlexRender cell={c} />
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(pagine > 1 || filtrate !== dati.length) && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground" aria-live="polite">
          <span>
            {formatNumero(filtrate)} righe{filtrate !== dati.length && ` su ${formatNumero(dati.length)}`}
          </span>
          {pagine > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Pagina precedente">
                <ChevronLeft aria-hidden />
              </Button>
              <span className="min-w-28 text-center tabular-nums">Pagina {table.state.pagination.pageIndex + 1} di {pagine}</span>
              <Button variant="outline" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Pagina successiva">
                <ChevronRight aria-hidden />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
