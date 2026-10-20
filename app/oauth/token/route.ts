// Scambio dei token del connettore per Claude (codice → token, rinnovo). Logica in lib/connettore/scambio.ts.
// Claude manda i dati come form (application/x-www-form-urlencoded) e attende al massimo 10 secondi.
import { intestazioniJson } from "@/lib/connettore/indirizzi";
import { scambiaToken } from "@/lib/connettore/scambio";
import { chiaviConnettore } from "@/lib/connettore/stato";

export async function POST(request: Request) {
  const chiavi = await chiaviConnettore();
  if (!chiavi) {
    return Response.json({ error: "temporarily_unavailable", error_description: "App non configurata" }, { status: 503, headers: intestazioniJson });
  }
  let form: URLSearchParams;
  try {
    form = new URLSearchParams(await request.text());
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400, headers: intestazioniJson });
  }
  const esito = scambiaToken(form, chiavi);
  return Response.json(esito.corpo, { status: esito.stato, headers: intestazioniJson });
}
