"use client";
// Tabella dei contatti del periodo: ricerca, filtro per canale, "solo senza attribuzione",
// ordinamento, pagine da 25 ed export CSV.
// Il CSV viene creato qui nel browser e scaricato sul tuo computer: non viene mai salvato sul server.
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RigaContatto } from "@/lib/data/contatti";
import { formatDataOra, formatNumero } from "@/lib/format";

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const helper = createColumnHelper<typeof features, RigaContatto>();

const columns = helper.columns([
  helper.accessor("data", { header: "Data", cell: (i) => formatDataOra(i.getValue()), sortFn: "alphanumeric" }),
  helper.accessor("nome", { header: "Nome", sortFn: "alphanumeric" }),
  helper.accessor("email", { header: "Email", enableSorting: false }),
  helper.accessor("telefono", { header: "Telefono", enableSorting: false }),
  helper.accessor("fonte", { header: "Fonte", sortFn: "alphanumeric" }),
  helper.accessor("canale", { header: "Canale", sortFn: "alphanumeric" }),
  helper.accessor("campagna", {
    header: "Campagna",
    sortFn: "alphanumeric",
    cell: (i) => i.getValue() || <Badge variant="outline" className="text-muted-foreground">senza</Badge>,
  }),
  helper.accessor("annuncio", { header: "Annuncio", sortFn: "alphanumeric" }),
  helper.accessor("tag", { header: "Tag", enableSorting: false }),
]);

const CERCABILI = new Set(["nome", "email", "telefono", "fonte", "canale", "campagna", "annuncio", "tag"]);

// ---------------------------------------------------------------- CSV
const COLONNE_CSV: [keyof RigaContatto, string][] = [
  ["data", "Data creazione"], ["nome", "Nome"], ["email", "Email"], ["telefono", "Telefono"],
  ["fonte", "Fonte"], ["canale", "Canale"], ["campagna", "Campagna"], ["gruppo", "Gruppo di inserzioni"],
  ["annuncio", "Annuncio"], ["tag", "Tag"],
];

function cellaCsv(valore: unknown) {
  let s = String(valore ?? "");
  // Evita che Excel interpreti il contenuto come formula
  if (/^[=@]/.test(s) || /^[+-][^\d\s]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function scaricaCsv(righe: RigaContatto[], nomeFile: string) {
  const intestazione = COLONNE_CSV.map(([, t]) => cellaCsv(t)).join(";");
  const corpo = righe.map((r) =>
    COLONNE_CSV.map(([k]) => cellaCsv(k === "data" ? formatDataOra(r.data) : r[k])).join(";"),
  );
  // ";" e BOM UTF-8: così Excel in italiano apre il file correttamente
  const blob = new Blob(["﻿" + [intestazione, ...corpo].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeFile;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------- componente
export function ContactsTable({ righe, nomeFile }: { righe: RigaContatto[]; nomeFile: string }) {
  const [soloSenza, setSoloSenza] = useState(false);
  const [canale, setCanale] = useState("");

  const canali = useMemo(() => [...new Set(righe.map((r) => r.canale))].sort(), [righe]);
  const dati = useMemo(
    () => righe.filter((r) => (!soloSenza || !r.attribuito) && (!canale || r.canale === canale)),
    [righe, soloSenza, canale],
  );

  const table = useTable({
    features,
    columns,
    data: dati,
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: (col) => CERCABILI.has(col.id),
    initialState: {
      sorting: [{ id: "data", desc: true }],
      pagination: { pageIndex: 0, pageSize: 25 },
    },
  });

  const filtrate = table.getFilteredRowModel().rows.length;
  const { pageIndex } = table.state.pagination;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Cerca per nome, email, telefono, campagna, tag…"
          value={String(table.state.globalFilter ?? "")}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          className="h-9 w-full sm:w-80"
        />
        <select
          value={canale}
          onChange={(e) => setCanale(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
          aria-label="Filtra per canale"
        >
          <option value="">Tutti i canali</option>
          {canali.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={soloSenza} onChange={(e) => setSoloSenza(e.target.checked)} className="size-4" />
          Solo senza attribuzione
        </label>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => scaricaCsv(table.getSortedRowModel().rows.map((r) => r.original), nomeFile)}
          disabled={filtrate === 0}
        >
          <Download /> Esporta CSV ({formatNumero(filtrate)})
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((g) => (
              <TableRow key={g.id}>
                {g.headers.map((h) => {
                  const ordinabile = h.column.getCanSort();
                  const verso = h.column.getIsSorted();
                  return (
                    <TableHead key={h.id} className="whitespace-nowrap">
                      {ordinabile ? (
                        <button type="button" onClick={h.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 hover:text-foreground">
                          <table.FlexRender header={h} />
                          <span className="text-xs text-muted-foreground">{verso === "asc" ? "▲" : verso === "desc" ? "▼" : "↕"}</span>
                        </button>
                      ) : (
                        <table.FlexRender header={h} />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                  Nessun contatto corrisponde ai filtri
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((r) => (
                <TableRow key={r.id}>
                  {r.getAllCells().map((c) => (
                    <TableCell key={c.id} className="max-w-56 truncate">
                      <table.FlexRender cell={c} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {formatNumero(filtrate)} contatti
          {filtrate !== righe.length && ` (su ${formatNumero(righe.length)} nel periodo)`}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Precedente
          </Button>
          <span className="tabular-nums">
            Pagina {pageIndex + 1} di {Math.max(table.getPageCount(), 1)}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Successiva
          </Button>
        </div>
      </div>
    </div>
  );
}
