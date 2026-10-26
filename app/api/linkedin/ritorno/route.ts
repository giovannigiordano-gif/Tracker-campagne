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
    await registraErroreLinkedIn(
      annullato ? "Accesso a LinkedIn annullato: nessun collegamento salvato." : `LinkedIn ha rifiutato l'accesso (${p.get("error_description") ?? errore}).`
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
