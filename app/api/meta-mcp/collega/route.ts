// "Collega Meta Ads" (pulsante in Impostazioni): prepara l'accesso e manda il titolare sulla pagina di Meta.
// Solo POST (da un modulo dell'app): un semplice link o un'anteprima del browser non può avviarlo.
import { NextResponse, type NextRequest } from "next/server";
import { haAccesso } from "@/lib/accesso";
import { indirizzoRitorno, paginaImpostazioni } from "@/lib/meta-mcp/indirizzi";
import { avviaCollegamento, registraErroreMeta } from "@/lib/meta-mcp/oauth";

export async function POST(request: NextRequest) {
  if (!(await haAccesso())) return new NextResponse("Accesso richiesto", { status: 401 });
  try {
    const url = await avviaCollegamento(indirizzoRitorno(request));
    return NextResponse.redirect(url, 303);
  } catch (e) {
    await registraErroreMeta(`Non riesco a preparare l'accesso a Meta: ${(e as Error).message}`).catch(() => {});
    return NextResponse.redirect(paginaImpostazioni(request, "errore"), 303);
  }
}
