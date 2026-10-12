"use client";
// true se l'utente ha chiesto al sistema di ridurre le animazioni ("riduci movimento").
// Serve dove l'animazione non passa dal CSS (es. i grafici di Recharts).
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function iscriviti(avvisa: () => void) {
  const mq = matchMedia(QUERY);
  mq.addEventListener("change", avvisa);
  return () => mq.removeEventListener("change", avvisa);
}

export function useRiduciMovimento() {
  return useSyncExternalStore(
    iscriviti,
    () => matchMedia(QUERY).matches,
    () => true // sul server nessuna animazione
  );
}
