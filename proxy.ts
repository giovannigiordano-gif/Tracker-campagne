// Proxy: gira prima di ogni pagina e la blocca se il titolare non ha fatto l'accesso.
// Restano libere: la pagina di accesso, i link condivisi con i clienti (/condivisa/…), i file statici.
// Le pagine e le azioni ricontrollano l'accesso anche da sole (lib/accesso.ts).
import { NextResponse, type NextRequest } from "next/server";
import { NOME_COOKIE, sessioneValida } from "@/lib/sessione";

export function proxy(request: NextRequest) {
  const password = process.env.APP_PASSWORD?.trim() ?? "";
  const segreto = process.env.SESSION_SECRET?.trim() ?? "";

  // In locale, senza password, l'app resta aperta come prima
  if (!password && process.env.NODE_ENV !== "production") return NextResponse.next();

  // Online senza configurazione: meglio nessuna pagina che pagine aperte a tutti
  if (!password || segreto.length < 32) {
    return new NextResponse(
      "App non ancora configurata: imposta APP_PASSWORD e SESSION_SECRET tra le variabili d'ambiente e ripubblica.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  if (sessioneValida(request.cookies.get(NOME_COOKIE)?.value, segreto, password)) return NextResponse.next();

  // Richieste che non sono pagine (azioni, invii): niente reindirizzamento, solo "non autorizzato"
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new NextResponse("Accesso richiesto", { status: 401 });
  }
  const accesso = new URL("/accesso", request.url);
  const da = request.nextUrl.pathname + request.nextUrl.search;
  if (da !== "/") accesso.searchParams.set("da", da);
  return NextResponse.redirect(accesso);
}

export const config = {
  // Tutto tranne file statici, pagina di accesso e link condivisi
  matcher: ["/((?!_next/static|_next/image|icon\\.svg|favicon\\.ico|brand/|accesso|condivisa/).*)"],
};
