// Indirizzo a cui Meta rimanda dopo l'accesso. Si ricava dalla richiesta (localhost in locale,
// tracker-campagne.vercel.app online); APP_URL nelle variabili d'ambiente lo forza, se servisse.
import type { NextRequest } from "next/server";

export function indirizzoRitorno(request: NextRequest) {
  const base = process.env.APP_URL?.trim().replace(/\/$/, "") || request.nextUrl.origin;
  return `${base}/api/meta-mcp/ritorno`;
}

// Dove torna il titolare dopo l'accesso a Meta, con l'esito da mostrare in Impostazioni
export function paginaImpostazioni(request: NextRequest, esito: "collegato" | "annullato" | "errore") {
  return new URL(`/impostazioni?meta=${esito}#meta-ads`, request.nextUrl.origin);
}
