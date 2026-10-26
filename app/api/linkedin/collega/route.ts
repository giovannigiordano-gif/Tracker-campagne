// "Collega LinkedIn Ads" (pulsante in Impostazioni): manda il titolare sulla pagina di consenso di LinkedIn.
// Solo POST (da un modulo dell'app). Lo "state" casuale resta in un cookie per 10 minuti e si controlla al ritorno.
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { haAccesso } from "@/lib/accesso";
import { COOKIE_STATO, paginaImpostazioniLinkedIn, ritornoLinkedIn } from "@/lib/linkedin/indirizzi";
import { registraErroreLinkedIn, urlConsenso } from "@/lib/linkedin/oauth";

export async function POST(request: NextRequest) {
  if (!(await haAccesso())) return new NextResponse("Accesso richiesto", { status: 401 });
  const state = randomBytes(24).toString("base64url");
  try {
    const risposta = NextResponse.redirect(await urlConsenso(ritornoLinkedIn(request.headers), state), 303);
    risposta.cookies.set(COOKIE_STATO, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/linkedin",
      maxAge: 600,
    });
    return risposta;
  } catch (e) {
    await registraErroreLinkedIn((e as Error).message).catch(() => {});
    return NextResponse.redirect(paginaImpostazioniLinkedIn(request.headers, "errore"), 303);
  }
}
