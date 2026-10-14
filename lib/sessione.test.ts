// Test del cookie di accesso e del controllo della password.
// Si lanciano con: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { creaSessione, DURATA_SESSIONE_MS, passwordCorretta, sessioneValida, percorsoSicuro } from "./sessione";

const SEGRETO = "segreto-di-prova-abbastanza-lungo-per-i-test";
const PASSWORD = "password di prova";
const ORA = Date.UTC(2026, 9, 14, 10, 0, 0);

test("una sessione appena creata è valida", () => {
  const valore = creaSessione(SEGRETO, PASSWORD, ORA);
  assert.equal(sessioneValida(valore, SEGRETO, PASSWORD, ORA + 1000), true);
});

test("una sessione scade dopo 30 giorni", () => {
  const valore = creaSessione(SEGRETO, PASSWORD, ORA);
  assert.equal(sessioneValida(valore, SEGRETO, PASSWORD, ORA + DURATA_SESSIONE_MS - 1), true);
  assert.equal(sessioneValida(valore, SEGRETO, PASSWORD, ORA + DURATA_SESSIONE_MS + 1), false);
});

test("una sessione firmata con un altro segreto non vale", () => {
  const valore = creaSessione("un-altro-segreto-lungo-quanto-basta-davvero", PASSWORD, ORA);
  assert.equal(sessioneValida(valore, SEGRETO, PASSWORD, ORA), false);
});

test("cambiare la password chiude le sessioni aperte", () => {
  const valore = creaSessione(SEGRETO, PASSWORD, ORA);
  assert.equal(sessioneValida(valore, SEGRETO, "password nuova", ORA), false);
});

test("una sessione modificata a mano non vale", () => {
  const valore = creaSessione(SEGRETO, PASSWORD, ORA);
  const [versione, , firma] = valore.split(".");
  const allungata = `${versione}.${ORA + DURATA_SESSIONE_MS * 10}.${firma}`;
  assert.equal(sessioneValida(allungata, SEGRETO, PASSWORD, ORA), false);
  for (const v of ["", "v1", "v1.abc.def", "x.1.2", undefined]) {
    assert.equal(sessioneValida(v, SEGRETO, PASSWORD, ORA), false, String(v));
  }
});

test("la password si confronta esattamente", () => {
  assert.equal(passwordCorretta(PASSWORD, PASSWORD), true);
  assert.equal(passwordCorretta("password di prov", PASSWORD), false);
  assert.equal(passwordCorretta("", PASSWORD), false);
  assert.equal(passwordCorretta(PASSWORD.toUpperCase(), PASSWORD), false);
});

test("dopo l'accesso si torna solo a pagine dell'app", () => {
  assert.equal(percorsoSicuro("/clienti/abc?periodo=7"), "/clienti/abc?periodo=7");
  assert.equal(percorsoSicuro("/"), "/");
  assert.equal(percorsoSicuro(null), "/");
  assert.equal(percorsoSicuro("https://sito-esterno.example"), "/");
  assert.equal(percorsoSicuro("//sito-esterno.example"), "/");
  assert.equal(percorsoSicuro("/\\sito-esterno.example"), "/");
  assert.equal(percorsoSicuro("/accesso"), "/");
});
