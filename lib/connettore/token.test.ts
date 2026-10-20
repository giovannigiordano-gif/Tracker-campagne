// Test del connettore per Claude: token firmati, PKCE, indirizzi di ritorno, client ammessi, scambio dei token.
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { test } from "node:test";
import { leggiRichiesta } from "./autorizza";
import { accessoValido, scambiaToken } from "./scambio";
import {
  clientAmmesso,
  creaToken,
  DURATA_CODICE_MS,
  HOST_CLIENT_PREDEFINITI,
  hostClientAmmessi,
  leggiToken,
  pkceValido,
  RITORNO_CLAUDE,
  ritornoAmmesso,
  SCOPE,
  type Chiavi,
} from "./token";

const chiavi: Chiavi = { segreto: "s".repeat(40), password: "password-di-prova", generazione: 1 };
const CLIENT = "https://claude.ai/oauth/mcp-oauth-client-metadata";
const RISORSA = "https://app.example.com/mcp";
const ORA = 1_800_000_000_000;

function pkce() {
  const verificatore = randomBytes(32).toString("base64url");
  return { verificatore, challenge: createHash("sha256").update(verificatore).digest("base64url") };
}

function codice(challenge: string, ora = ORA) {
  return creaToken<"codice">({ t: "codice", cid: CLIENT, r: RISORSA, sc: SCOPE, ru: RITORNO_CLAUDE, cc: challenge }, DURATA_CODICE_MS, chiavi, ora);
}

test("un token si legge solo con il tipo giusto e prima della scadenza", () => {
  const t = creaToken<"accesso">({ t: "accesso", cid: CLIENT, r: RISORSA, sc: SCOPE }, 60_000, chiavi, ORA);
  assert.equal(leggiToken(t, "accesso", chiavi, ORA + 1000)?.cid, CLIENT);
  assert.equal(leggiToken(t, "rinnovo", chiavi, ORA + 1000), null);
  assert.equal(leggiToken(t, "accesso", chiavi, ORA + 60_001), null);
});

test("un token modificato a mano non vale", () => {
  const t = creaToken<"accesso">({ t: "accesso", cid: CLIENT, r: RISORSA, sc: SCOPE }, 60_000, chiavi, ORA);
  const [p, dati, firma] = t.split(".");
  const falso = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(dati, "base64url").toString()), r: "https://altro/mcp" })).toString("base64url");
  assert.equal(leggiToken(`${p}.${falso}.${firma}`, "accesso", chiavi, ORA), null);
  assert.equal(leggiToken("niente", "accesso", chiavi, ORA), null);
  assert.equal(leggiToken(undefined, "accesso", chiavi, ORA), null);
});

test("cambiare password o scollegare Claude annulla i token già dati", () => {
  const t = creaToken<"rinnovo">({ t: "rinnovo", cid: CLIENT, r: RISORSA, sc: SCOPE }, 60_000, chiavi, ORA);
  assert.ok(leggiToken(t, "rinnovo", chiavi, ORA));
  assert.equal(leggiToken(t, "rinnovo", { ...chiavi, password: "nuova" }, ORA), null);
  assert.equal(leggiToken(t, "rinnovo", { ...chiavi, generazione: 2 }, ORA), null);
});

test("PKCE: vale solo il verificatore giusto", () => {
  const { verificatore, challenge } = pkce();
  assert.ok(pkceValido(verificatore, challenge));
  assert.equal(pkceValido(pkce().verificatore, challenge), false);
  assert.equal(pkceValido("corto", challenge), false);
  assert.equal(pkceValido(null, challenge), false);
});

test("indirizzi di ritorno: uguali a quelli dichiarati, porta libera solo per quelli locali", () => {
  assert.ok(ritornoAmmesso(RITORNO_CLAUDE, [RITORNO_CLAUDE]));
  assert.equal(ritornoAmmesso("https://claude.ai/api/mcp/altro", [RITORNO_CLAUDE]), false);
  assert.ok(ritornoAmmesso("http://localhost:51234/callback", ["http://localhost/callback"]));
  assert.ok(ritornoAmmesso("http://127.0.0.1:8080/callback", ["http://127.0.0.1/callback"]));
  assert.equal(ritornoAmmesso("http://localhost:51234/altro", ["http://localhost/callback"]), false);
  assert.equal(ritornoAmmesso("https://attacco.example/callback", ["http://localhost/callback"]), false);
});

test("client ammessi: solo documenti https sugli host di Claude", () => {
  assert.ok(clientAmmesso(CLIENT, HOST_CLIENT_PREDEFINITI));
  assert.ok(clientAmmesso("https://claude.ai/oauth/claude-code-client-metadata", HOST_CLIENT_PREDEFINITI));
  assert.equal(clientAmmesso("https://claude.ai.attacco.example/x", HOST_CLIENT_PREDEFINITI), false);
  assert.equal(clientAmmesso("http://claude.ai/x", HOST_CLIENT_PREDEFINITI), false);
  assert.equal(clientAmmesso("https://claude.ai/", HOST_CLIENT_PREDEFINITI), false);
  assert.equal(clientAmmesso("non-un-indirizzo", HOST_CLIENT_PREDEFINITI), false);
  assert.deepEqual(hostClientAmmessi(""), HOST_CLIENT_PREDEFINITI);
  assert.deepEqual(hostClientAmmessi(" Esempio.it , altro.it"), ["esempio.it", "altro.it"]);
});

test("richiesta di collegamento: servono PKCE S256 e la risorsa giusta", () => {
  const { challenge } = pkce();
  const campi = (extra: Record<string, string>) => {
    const tutti: Record<string, string> = { response_type: "code", client_id: CLIENT, redirect_uri: RITORNO_CLAUDE, code_challenge: challenge, code_challenge_method: "S256", state: "abc", ...extra };
    return (n: string) => tutti[n] ?? null;
  };
  const ok = leggiRichiesta(campi({}), "https://app.example.com");
  assert.ok(ok.ok && ok.richiesta.risorsa === RISORSA && ok.richiesta.stato === "abc");
  assert.equal(leggiRichiesta(campi({ code_challenge_method: "plain" }), "https://app.example.com").ok, false);
  assert.equal(leggiRichiesta(campi({ response_type: "token" }), "https://app.example.com").ok, false);
  assert.equal(leggiRichiesta(campi({ resource: "https://altro.example.com/mcp" }), "https://app.example.com").ok, false);
  assert.ok(leggiRichiesta(campi({ resource: `${RISORSA}/` }), "https://app.example.com").ok);
});

test("scambio: codice + verificatore danno i token, che aprono solo questa risorsa", () => {
  const { verificatore, challenge } = pkce();
  const form = new URLSearchParams({ grant_type: "authorization_code", code: codice(challenge), client_id: CLIENT, redirect_uri: RITORNO_CLAUDE, code_verifier: verificatore });
  const esito = scambiaToken(form, chiavi, ORA + 1000);
  assert.equal(esito.stato, 200);
  const accesso = String(esito.corpo.access_token);
  assert.ok(accessoValido(`Bearer ${accesso}`, RISORSA, chiavi, ORA + 2000));
  assert.equal(accessoValido(`Bearer ${accesso}`, "https://altro.example.com/mcp", chiavi, ORA + 2000), false);
  assert.equal(accessoValido(null, RISORSA, chiavi, ORA + 2000), false);
  // Il token di rinnovo non vale come accesso
  assert.equal(accessoValido(`Bearer ${esito.corpo.refresh_token}`, RISORSA, chiavi, ORA + 2000), false);
});

test("scambio: rifiuta verificatore sbagliato, codice scaduto, ritorno diverso e altro client", () => {
  const { verificatore, challenge } = pkce();
  const base = { grant_type: "authorization_code", code: codice(challenge), client_id: CLIENT, redirect_uri: RITORNO_CLAUDE, code_verifier: verificatore };
  const prova = (extra: Record<string, string>, ora = ORA + 1000) => scambiaToken(new URLSearchParams({ ...base, ...extra }), chiavi, ora);
  assert.equal(prova({ code_verifier: pkce().verificatore }).corpo.error, "invalid_grant");
  assert.equal(prova({}, ORA + DURATA_CODICE_MS + 1).corpo.error, "invalid_grant");
  assert.equal(prova({ redirect_uri: "http://localhost/callback" }).corpo.error, "invalid_grant");
  assert.equal(prova({ client_id: "https://claude.ai/altro" }).corpo.error, "invalid_grant");
  assert.equal(prova({ grant_type: "password" }).corpo.error, "unsupported_grant_type");
});

test("rinnovo: dà una nuova coppia di token; dopo lo scollegamento non vale più", () => {
  const { verificatore, challenge } = pkce();
  const primo = scambiaToken(
    new URLSearchParams({ grant_type: "authorization_code", code: codice(challenge), client_id: CLIENT, redirect_uri: RITORNO_CLAUDE, code_verifier: verificatore }),
    chiavi,
    ORA
  );
  const form = new URLSearchParams({ grant_type: "refresh_token", refresh_token: String(primo.corpo.refresh_token), client_id: CLIENT });
  const rinnovo = scambiaToken(form, chiavi, ORA + 3_600_000);
  assert.equal(rinnovo.stato, 200);
  assert.notEqual(rinnovo.corpo.refresh_token, primo.corpo.refresh_token);
  assert.equal(scambiaToken(form, { ...chiavi, generazione: 2 }, ORA + 3_600_000).corpo.error, "invalid_grant");
});
