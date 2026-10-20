// Indirizzi pubblici del connettore, ricavati dalle intestazioni della richiesta (tracker-campagne.vercel.app
// online, localhost in locale). APP_URL nelle variabili d'ambiente li forza, se servisse.
// Pagina di consenso, scambio dei token e /mcp usano tutti questa stessa funzione: devono coincidere.
// L'indirizzo /mcp è quello da incollare in Claude.
import { SCOPE } from "./token";

export function indirizzoBase(h: Headers) {
  const forzato = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (forzato) return forzato;
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000").split(",")[0].trim();
  const locale = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  const protocollo = h.get("x-forwarded-proto")?.split(",")[0].trim() || (locale ? "http" : "https");
  return `${protocollo}://${host}`;
}

export const indirizzoMcp = (base: string) => `${base}/mcp`;
export const indirizzoMetadatiRisorsa = (base: string) => `${base}/.well-known/oauth-protected-resource/mcp`;

// Documento "protected resource metadata" (RFC 9728): dice a Claude dove fare l'accesso
export function metadatiRisorsa(base: string) {
  return {
    resource: indirizzoMcp(base),
    authorization_servers: [base],
    scopes_supported: [SCOPE],
    bearer_methods_supported: ["header"],
    resource_name: "SalesProcess Insights",
  };
}

// Documento "authorization server metadata" (RFC 8414). Claude usa il CIMD (niente registrazione dei client)
// solo se ci sono sia client_id_metadata_document_supported sia "none" tra i metodi del token endpoint.
export function metadatiAutorizzazione(base: string) {
  return {
    issuer: base,
    authorization_endpoint: `${base}/oauth/autorizza`,
    token_endpoint: `${base}/oauth/token`,
    scopes_supported: [SCOPE, "offline_access"],
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    client_id_metadata_document_supported: true,
    authorization_response_iss_parameter_supported: true,
  };
}

export const intestazioniJson = { "content-type": "application/json", "cache-control": "no-store" };

// Risposta 401 che fa partire il collegamento in Claude (serve proprio il 401 con questa intestazione)
export function rispostaNonAutorizzato(base: string, descrizione = "Collega di nuovo il connettore") {
  return new Response(JSON.stringify({ error: "invalid_token", error_description: descrizione }), {
    status: 401,
    headers: {
      ...intestazioniJson,
      "www-authenticate": `Bearer error="invalid_token", error_description="${descrizione}", resource_metadata="${indirizzoMetadatiRisorsa(base)}", scope="${SCOPE}"`,
    },
  });
}
