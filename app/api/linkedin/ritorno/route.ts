// Ritorno da LinkedIn dopo il consenso: controlla lo "state", scambia il codice con i token (salvati cifrati),
// verifica il collegamento leggendo gli account pubblicitari e torna alle Impostazioni.
import { NextResponse, type NextRequest } from "next/server";
import { haAccesso } from "@/lib/accesso";
import { verificaLinkedIn } from "@/lib/linkedin/api";
import { COOKIE_STATO, paginaImpostazioniLinkedIn, ritornoLinkedIn } from "@/lib/linkedin/indirizzi";
import { completaAccesso, registraErroreLinkedIn } from "@/lib/linkedin/oauth";

export async function GET(request: NextRequest) {
  if (!(await haAccesso())) return NextResponse.redirect(new URL("/accesso", request.nextUrl.origin));
  const p = request.nextUrl.searchParams;
  const vai = (esito: "collegato" | "annullato" | "errore") => {
    const r = NextResponse.redirect(paginaImpostazioniLinkedIn(request.headers, esito));
    r.cookies.delete({ name: COOKIE_STATO, path: "/api/linkedin" });
    return r;
  };

  // Il titolare ha annullato (user_cancelled_login, user_cancelled_authorize) o LinkedIn ha rifiutato
  const errore = p.get("error");
  if (errore) {
    const annullato = errore.startsWith("user_cancelled");
    const descrizione = p.get("error_description") ?? errore;
    // Permessi non validi: l'app LinkedIn non ha (ancora) il prodotto "Advertising API" approvato.
    // Visto il 2026-10-26: "The requested permission scope is not valid"
    const permessi = /scope/i.test(`${errore} ${descrizione}`);
    await registraErroreLinkedIn(
      annullato
        ? "Accesso a LinkedIn annullato: nessun collegamento salvato."
        : permessi
          ? "LinkedIn non ha ancora autorizzato la tua app a leggere le campagne (permessi r_ads e r_ads_reporting): serve l'approvazione di «Advertising API» nella scheda Products dell'app su LinkedIn Developers. Quando è approvata, premi di nuovo «Collega LinkedIn Ads»."
          : `LinkedIn ha rifiutato l'accesso (${descrizione}).`
    ).catch(() => {});
    return vai(annullato ? "annullato" : "errore");
  }

  // Lo "state" deve essere quello creato da questo browser (protezione dagli attacchi CSRF)
  const codice = p.get("code");
  const state = p.get("state");
  if (!codice || !state || state !== request.cookies.get(COOKIE_STATO)?.value) {
    await registraErroreLinkedIn("Ritorno da LinkedIn non valido o scaduto: riprova «Collega LinkedIn Ads».").catch(() => {});
    return vai("errore");
  }

  try {
    await completaAccesso(codice, ritornoLinkedIn(request.headers));
  } catch (e) {
    await registraErroreLinkedIn((e as Error).message).catch(() => {});
    return vai("errore");
  }
  await verificaLinkedIn().catch(() => {}); // il risultato si vede in Impostazioni
  return vai("collegato");
}
