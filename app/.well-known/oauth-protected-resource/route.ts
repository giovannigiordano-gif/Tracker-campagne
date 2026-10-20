// Metadati della risorsa protetta (RFC 9728): Claude li legge per sapere dove fare l'accesso al connettore
import { indirizzoBase, metadatiRisorsa } from "@/lib/connettore/indirizzi";

export function GET(request: Request) {
  return Response.json(metadatiRisorsa(indirizzoBase(request.headers)), {
    headers: { "cache-control": "public, max-age=300", "access-control-allow-origin": "*" },
  });
}
