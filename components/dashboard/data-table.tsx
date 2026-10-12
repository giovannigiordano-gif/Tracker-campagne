"use client";
// Tabella riusabile (TanStack Table v9): ricerca, ordinamento, pagine ed export CSV.
// Il CSV viene creato qui nel browser e scaricato sul tuo computer: non viene salvato sul server.
import { Download, Search } from "lucide-react";
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
import { formatNumero } from "@/lib/format";
import { cn } from "@/lib/utils";

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

// ---------------------------------------------------------------- CSV
function cellaCsv(valore: unknown) {
  let s = String(valore ?? "");
  // Evita che Excel interpreti il contenuto come una formula
  if (/^[=@]/.test(s) || /^[+-][^\d\s]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function scaricaCsv(intestazione: string[], righe: unknown[][], nomeFile: string) {
  const testo = [intestazione, ...righe].map((r) => r.map(cellaCsv).join(";")).join("\r\n");
  // ";" e BOM UTF-8: così Excel in italiano apre il file correttamente
  const blob = new Blob(["﻿" + testo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeFile;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------- tabella
export function DataTable<T extends RowData>({
  dati,
  colonne,
  ordinamento,
  cercabili,
  segnapostoRicerca = "Cerca…",
  csv,
  vuoto = "Nessun risultato",
  perPagina = 25,
  strumenti,
}: {
  dati: T[];
  colonne: Colonna<T>[];
  ordinamento?: SortingState;
  cercabili?: string[];
  segnapostoRicerca?: string;
  csv?: { nomeFile: string; intestazione: string[]; riga: (r: T) => unknown[] };
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
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={segnapostoRicerca}
              value={String(table.state.globalFilter ?? "")}
              onChange={(e) => table.setGlobalFilter(e.target.value)}
              className="h-9 rounded-full pl-9"
            />
          </div>
        )}
        {strumenti}
        {csv && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            disabled={filtrate === 0}
            onClick={() => scaricaCsv(csv.intestazione, table.getSortedRowModel().rows.map((r) => csv.riga(r.original)), csv.nomeFile)}
          >
            <Download /> Esporta CSV ({formatNumero(filtrate)})
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            {table.getHeaderGroups().map((g) => (
              <tr key={g.id}>
                {g.headers.map((h) => {
                  const verso = h.column.getIsSorted();
                  const numerica = (h.column.columnDef.meta as { numerica?: boolean } | undefined)?.numerica;
                  return (
                    <th
                      key={h.id}
                      className={cn("whitespace-nowrap px-3 py-2.5 font-semibold text-foreground", numerica && "text-right")}
                      aria-sort={verso === "asc" ? "ascending" : verso === "desc" ? "descending" : undefined}
                    >
                      {h.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={h.column.getToggleSortingHandler()}
                          className={cn("inline-flex items-center gap-1 hover:text-black", numerica && "flex-row-reverse")}
                        >
                          <table.FlexRender header={h} />
                          <span className="text-xs text-muted-foreground">{verso === "asc" ? "▲" : verso === "desc" ? "▼" : "↕"}</span>
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
                <td colSpan={colonne.length} className="px-3 py-10 text-center text-muted-foreground">{vuoto}</td>
              </tr>
            ) : (
              table.getRowModel().rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-accent/60">
                  {r.getAllCells().map((c) => {
                    const numerica = (c.column.columnDef.meta as { numerica?: boolean } | undefined)?.numerica;
                    return (
                      <td key={c.id} className={cn("max-w-64 truncate px-3 py-2", numerica && "text-right")}>
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
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {formatNumero(filtrate)} righe{filtrate !== dati.length && ` su ${formatNumero(dati.length)}`}
          </span>
          {pagine > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Precedente
              </Button>
              <span>Pagina {table.state.pagination.pageIndex + 1} di {pagine}</span>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Successiva
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
