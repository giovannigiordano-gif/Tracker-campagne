// Ritorno da Meta dopo l'accesso: salva i token (cifrati), verifica il collegamento e torna alle Impostazioni.
import { NextResponse, type NextRequest } from "next/server";
import { haAccesso } from "@/lib/accesso";
import { verificaCollegamento } from "@/lib/meta-mcp/client";
import { indirizzoRitorno, paginaImpostazioni } from "@/lib/meta-mcp/indirizzi";
import { completaCollegamento, registraErroreMeta } from "@/lib/meta-mcp/oauth";

export async function GET(request: NextRequest) {
  if (!(await haAccesso())) return NextResponse.redirect(new URL("/accesso", request.nextUrl.origin));
  const p = request.nextUrl.searchParams;

  // Il titolare ha annullato, o Meta ha rifiutato
  const errore = p.get("error");
  if (errore) {
    const annullato = errore === "access_denied";
    await registraErroreMeta(
      annullato ? "Accesso a Meta annullato: nessun collegamento salvato." : `Meta ha rifiutato l'accesso (${p.get("error_description") ?? errore}).`
    ).catch(() => {});
    return NextResponse.redirect(paginaImpostazioni(request, annullato ? "annullato" : "errore"));
  }

  const codice = p.get("code");
  const stato = p.get("state");
  if (!codice || !stato) return NextResponse.redirect(paginaImpostazioni(request, "errore"));

  try {
    await completaCollegamento(codice, stato, indirizzoRitorno(request));
  } catch (e) {
    await registraErroreMeta((e as Error).message).catch(() => {});
    return NextResponse.redirect(paginaImpostazioni(request, "errore"));
  }
  await verificaCollegamento().catch(() => {}); // il risultato si vede in Impostazioni
  return NextResponse.redirect(paginaImpostazioni(request, "collegato"));
}
