// Connettore per Claude (server MCP, trasporto "Streamable HTTP" senza sessioni: adatto a Vercel).
// Ogni richiesta deve avere un token valido; senza, risponde 401 e Claude avvia il collegamento (OAuth).
// Strumenti e regole in lib/connettore/server.ts.
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { indirizzoBase, indirizzoMcp, rispostaNonAutorizzato } from "@/lib/connettore/indirizzi";
import { accessoValido } from "@/lib/connettore/scambio";
import { creaServerMcp } from "@/lib/connettore/server";
import { chiaviConnettore } from "@/lib/connettore/stato";

// Claude aspetta fino a 240 secondi per strumento; la lettura di un cliente richiede di solito pochi secondi
export const maxDuration = 120;

async function gestisci(request: Request) {
  const base = indirizzoBase(request.headers);
  const chiavi = await chiaviConnettore();
  if (!chiavi) {
    return new Response("Connettore non disponibile: l'app non ha APP_PASSWORD e SESSION_SECRET.", { status: 503 });
  }
  if (!accessoValido(request.headers.get("authorization"), indirizzoMcp(base), chiavi)) return rispostaNonAutorizzato(base);

  // Senza sessioni il canale di notifiche (GET) e la chiusura (DELETE) non servono
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST" } });
  }
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  const server = creaServerMcp();
  await server.connect(transport);
  return transport.handleRequest(request);
}

export { gestisci as GET, gestisci as POST, gestisci as DELETE };
