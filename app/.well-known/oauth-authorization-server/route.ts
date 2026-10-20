// Metadati del server di autorizzazione (RFC 8414): pagina di consenso, scambio dei token, PKCE, CIMD
import { indirizzoBase, metadatiAutorizzazione } from "@/lib/connettore/indirizzi";

export function GET(request: Request) {
  return Response.json(metadatiAutorizzazione(indirizzoBase(request.headers)), {
    headers: { "cache-control": "public, max-age=300", "access-control-allow-origin": "*" },
  });
}
