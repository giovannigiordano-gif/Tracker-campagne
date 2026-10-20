// Test della lettura dell'elenco degli account pubblicitari di Meta (nomi di fantasia).
// Si lanciano con: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { leggiPaginaAccount } from "./account";

const risposta = {
  structuredContent: {
    ad_accounts: [
      { ad_account_id: "act_111", ad_account_name: "Negozio di prova", business_name: "Azienda Uno", is_queryable: true },
      { ad_account_id: "222", ad_account_name: "", business_name: null, is_queryable: false, not_queryable_reason: "Accesso non concesso" }, // come il server MCP: solo il numero
      { ad_account_name: "Senza ID" },
    ],
    next_cursor: "pagina2",
  },
};

test("legge id, nome, azienda e disponibilità degli account", () => {
  const { account, prossima } = leggiPaginaAccount(risposta);
  assert.equal(prossima, "pagina2");
  assert.deepEqual(account, [
    { id: "act_111", nome: "Negozio di prova", azienda: "Azienda Uno", interrogabile: true, motivo: null },
    { id: "act_222", nome: "act_222", azienda: null, interrogabile: false, motivo: "Accesso non concesso" },
  ]);
});

test("funziona anche quando la risposta arriva come testo JSON", () => {
  const { account, prossima } = leggiPaginaAccount({
    content: [{ type: "text", text: JSON.stringify({ ad_accounts: [{ ad_account_id: "act_333", ad_account_name: "Tre" }] }) }],
  });
  assert.equal(account.length, 1);
  assert.equal(account[0].nome, "Tre");
  assert.equal(prossima, null);
});

test("risposta vuota o inattesa: nessun account", () => {
  assert.deepEqual(leggiPaginaAccount({}).account, []);
  assert.deepEqual(leggiPaginaAccount({ content: [{ type: "text", text: "non è JSON" }] }).account, []);
});
