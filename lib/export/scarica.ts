// Scaricamento dei file nel browser: il file si crea qui e va direttamente sul computer di chi lo scarica,
// senza passare dal server.
import { creaCsv } from "./csv";
import type { TabellaExport } from "./tabella";
import { creaXlsx } from "./xlsx";

function scaricaBlob(blob: Blob, nomeFile: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Il browser ha bisogno di un attimo per avviare il download prima che l'indirizzo venga liberato
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function scaricaCsv(tabella: TabellaExport, nomeFile: string) {
  // BOM UTF-8: così Excel legge bene le lettere accentate
  scaricaBlob(new Blob(["﻿" + creaCsv(tabella)], { type: "text/csv;charset=utf-8" }), nomeFile);
}

export function scaricaExcel(tabelle: TabellaExport[], nomeFile: string) {
  const dati = creaXlsx(tabelle, new Date());
  scaricaBlob(new Blob([dati.buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), nomeFile);
}
