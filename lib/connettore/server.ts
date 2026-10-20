// Server MCP del connettore: gli strumenti che Claude (claude.ai, app desktop, Cowork) usa per leggere i dati
// dell'app e scrivere le analisi con l'abbonamento del titolare.
// Regole: SOLA LETTURA su GHL e Meta; a Claude arrivano solo dati aggregati (riepilogo.ts), mai dati personali.
// L'unica scrittura è "salva_analisi", che salva il testo dell'analisi nell'app (non tocca GHL né Meta).
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readAccounts, type Account } from "../accounts";
import { leggiAnalisi, MASSIMO_CARATTERI, salvaAnalisi } from "../analisi";
import { caricaDashboardCliente } from "../data/cliente";
import { caricaPanoramica } from "../data/panoramica";
import { etichettaSelezione, leggiSelezione, type Selezione } from "../period";
import { riepilogoCliente } from "./riepilogo";

const ISTRUZIONI = `SalesProcess Insights è la dashboard interna di un'agenzia di marketing: per ogni cliente legge contatti, opportunità e vendite da GoHighLevel (CRM) e le campagne da Meta Ads, in SOLA LETTURA.
Come usarlo:
- "elenco_clienti" per i clienti seguiti e il loro contesto (settore, obiettivi, costo per lead obiettivo).
- "panoramica_clienti" per un confronto veloce tra clienti, con avvisi e criticità.
- "analisi_cliente" per tutti i numeri di un cliente: GHL, campagne Meta, incrocio tra i due, criticità.
- "salva_analisi" per salvare nell'app un'analisi completa: il titolare la ritrova nella dashboard del cliente.
Regole: cita sempre la fonte (GHL o Meta) e il periodo dei numeri; non inventare dati che non ci sono; questa app non può modificare, mettere in pausa o creare campagne: le azioni consigliate le farà il titolare. Rispondi in italiano.`;

const SCHEMA_PERIODO = {
  giorni: z.enum(["7", "30", "90"]).optional().describe("Ultimi 7, 30 o 90 giorni (predefinito 30). Ignorato se ci sono da e a."),
  da: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Primo giorno del periodo personalizzato (AAAA-MM-GG)"),
  a: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Ultimo giorno del periodo personalizzato (AAAA-MM-GG)"),
};

class ErroreStrumento extends Error {}

function selezione({ giorni, da, a }: { giorni?: string; da?: string; a?: string }): Selezione {
  if (da || a) {
    const sel = leggiSelezione({ periodo: "custom", da, a });
    if (sel.tipo !== "custom") throw new ErroreStrumento("Periodo non valido: servono da e a (AAAA-MM-GG), con da ≤ a e al massimo un anno.");
    return sel;
  }
  return leggiSelezione({ periodo: giorni ?? "30" });
}

// Il cliente si può indicare con l'ID del sub-account o con il nome (anche solo una parte)
async function trovaCliente(cliente: string): Promise<Account> {
  const elenco = await readAccounts();
  const cercato = cliente.trim().toLowerCase();
  const esatto = elenco.find((a) => a.locationId === cliente.trim() || a.name.toLowerCase() === cercato);
  if (esatto) return esatto;
  const simili = elenco.filter((a) => a.name.toLowerCase().includes(cercato));
  if (simili.length === 1) return simili[0];
  if (simili.length > 1) throw new ErroreStrumento(`Più clienti corrispondono a "${cliente}": ${simili.map((a) => a.name).join(", ")}. Indica il nome completo.`);
  throw new ErroreStrumento(`Nessun cliente corrisponde a "${cliente}". Usa elenco_clienti per vedere i nomi.`);
}

const testo = (dati: unknown) => ({ content: [{ type: "text" as const, text: typeof dati === "string" ? dati : JSON.stringify(dati) }] });

// Gli errori diventano un risultato leggibile da Claude (non un'eccezione del protocollo)
async function protetto(fn: () => Promise<ReturnType<typeof testo>>) {
  try {
    return await fn();
  } catch (e) {
    const messaggio = e instanceof ErroreStrumento ? e.message : `Errore nel leggere i dati: ${(e as Error).message}`;
    return { ...testo(messaggio), isError: true };
  }
}

const SOLA_LETTURA = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

export function creaServerMcp() {
  const server = new McpServer({ name: "salesprocess-insights", title: "SalesProcess Insights", version: "1.0.0" }, { instructions: ISTRUZIONI });

  server.registerTool(
    "elenco_clienti",
    {
      title: "Elenco clienti",
      description: "Clienti seguiti dall'agenzia, con contesto (note su settore, offerta, obiettivi), valuta, costo per lead obiettivo e account Meta associati.",
      annotations: { title: "Elenco clienti", ...SOLA_LETTURA },
    },
    () =>
      protetto(async () =>
        testo(
          (await readAccounts()).map((a) => ({
            id: a.locationId,
            nome: a.name,
            attivo: a.active,
            valuta: a.currency,
            fusoOrario: a.timezone,
            noteDiContesto: a.notes || null,
            obiettivoCostoPerLead: a.thresholds.maxCpl ?? null,
            accountMetaAssociati: a.metaAdAccountIds.length,
          }))
        )
      )
  );

  server.registerTool(
    "panoramica_clienti",
    {
      title: "Panoramica clienti",
      description:
        "Numeri chiave di tutti i clienti attivi nel periodo, con il periodo precedente per confronto: lead, opportunità, vinte, venduto (GHL), spesa e costo per lead reale (Meta + GHL), avvisi e criticità.",
      inputSchema: SCHEMA_PERIODO,
      annotations: { title: "Panoramica clienti", ...SOLA_LETTURA },
    },
    (args) =>
      protetto(async () => {
        const sel = selezione(args);
        const righe = await caricaPanoramica(sel);
        return testo({
          periodo: etichettaSelezione(sel),
          fonte: "GoHighLevel e Meta Marketing API",
          clienti: righe.map((r) => ({
            id: r.locationId,
            nome: r.nome,
            valuta: r.valuta,
            periodo: { da: r.daGiorno, a: r.aGiorno },
            ghl: r.kpi && {
              lead: r.kpi.lead,
              leadPrecedente: r.kpiPrec?.lead ?? null,
              leadDaMetaAds: r.kpi.leadMeta,
              opportunita: r.kpi.oppCreate,
              vinte: r.kpi.vinte,
              perse: r.kpi.perse,
              venduto: r.kpi.venduto,
              vendutoPrecedente: r.kpiPrec?.venduto ?? null,
              tassoChiusuraPct: r.kpi.tassoChiusura === null ? null : Math.round(r.kpi.tassoChiusura * 10) / 10,
            },
            leadPerCanale: r.canali,
            meta: r.meta && {
              spesa: Math.round(r.meta.spesa * 100) / 100,
              spesaPrecedente: Math.round(r.meta.spesaPrec * 100) / 100,
              costoPerLeadReale: r.meta.cplReale === null ? null : Math.round(r.meta.cplReale * 100) / 100,
              costoPerLeadRealePrecedente: r.meta.cplRealePrec === null ? null : Math.round(r.meta.cplRealePrec * 100) / 100,
            },
            avvisi: r.avvisi,
            datiMancanti: r.problemaToken ? "Token GHL mancante o scaduto: dati del CRM non disponibili." : null,
          })),
        });
      })
  );

  server.registerTool(
    "analisi_cliente",
    {
      title: "Dati completi di un cliente",
      description:
        "Tutti i numeri aggregati di un cliente nel periodo e nel periodo precedente: KPI di GoHighLevel, lead per canale, campagna, fonte e tag, andamento, pipeline; spesa e risultati delle campagne Meta, incrocio con i lead e le vendite del CRM, criticità. Solo aggregati, nessun dato personale.",
      inputSchema: { cliente: z.string().min(1).describe("Nome del cliente (anche parziale) o ID del sub-account GHL"), ...SCHEMA_PERIODO },
      annotations: { title: "Dati completi di un cliente", ...SOLA_LETTURA },
    },
    ({ cliente, ...periodo }) =>
      protetto(async () => {
        const account = await trovaCliente(cliente);
        const dati = await caricaDashboardCliente(account, selezione(periodo), { conDatiPersonali: false });
        return testo(riepilogoCliente(dati, account));
      })
  );

  server.registerTool(
    "analisi_salvate",
    {
      title: "Analisi salvate",
      description:
        "Analisi già salvate nell'app per un cliente (dalla più recente). Senza id restituisce l'elenco con titolo, data e periodo; con id restituisce il testo completo. Utile per confrontare con le analisi precedenti.",
      inputSchema: {
        cliente: z.string().min(1).describe("Nome del cliente (anche parziale) o ID del sub-account GHL"),
        id: z.string().optional().describe("ID dell'analisi da leggere per intero"),
      },
      annotations: { title: "Analisi salvate", ...SOLA_LETTURA },
    },
    ({ cliente, id }) =>
      protetto(async () => {
        const account = await trovaCliente(cliente);
        const elenco = await leggiAnalisi(account.locationId);
        if (id) {
          const una = elenco.find((a) => a.id === id);
          if (!una) throw new ErroreStrumento("Analisi non trovata: usa analisi_salvate senza id per l'elenco.");
          return testo(una);
        }
        return testo({ cliente: account.name, analisi: elenco.map(({ id, creataIl, titolo, periodo }) => ({ id, creataIl, titolo, periodo })) });
      })
  );

  server.registerTool(
    "salva_analisi",
    {
      title: "Salva analisi nell'app",
      description:
        "Salva un'analisi scritta (markdown) nella dashboard del cliente, dove il titolare la ritrova con lo storico. Scrive solo nell'app: non modifica nulla su GoHighLevel né su Meta.",
      inputSchema: {
        cliente: z.string().min(1).describe("Nome del cliente (anche parziale) o ID del sub-account GHL"),
        titolo: z.string().min(1).max(140).describe("Titolo breve, es. \"Campagne Meta: ultimi 30 giorni\""),
        periodo: z.string().min(1).max(140).describe("Periodo analizzato, es. \"Dal 21/09/2026 al 20/10/2026\""),
        testo: z.string().min(1).max(MASSIMO_CARATTERI).describe("Testo dell'analisi in markdown"),
      },
      annotations: { title: "Salva analisi nell'app", readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    ({ cliente, titolo, periodo, testo: corpo }) =>
      protetto(async () => {
        const account = await trovaCliente(cliente);
        const salvata = await salvaAnalisi(account.locationId, { titolo, periodo, testo: corpo, autore: "Claude (connettore)" });
        return testo(`Analisi salvata per ${account.name} (id ${salvata.id}). Il titolare la trova nella dashboard del cliente, sezione "Analisi".`);
      })
  );

  server.registerPrompt(
    "analisi_campagne",
    {
      title: "Analisi delle campagne di un cliente",
      description: "Analisi completa di campagne Meta e risultati nel CRM per un cliente, salvata nell'app.",
      argsSchema: {
        cliente: z.string().describe("Nome del cliente"),
        giorni: z.string().optional().describe("7, 30 o 90 (predefinito 30)"),
      },
    },
    ({ cliente, giorni }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Analizza le campagne del cliente "${cliente}" negli ultimi ${giorni && ["7", "30", "90"].includes(giorni) ? giorni : "30"} giorni.
1. Leggi i dati con analisi_cliente (e, se ci sono, l'ultima analisi con analisi_salvate per vedere cosa è cambiato).
2. Scrivi un report in italiano con queste sezioni: Sintesi; Cosa funziona; Cosa non funziona; Discrepanze tra lead Meta e lead GHL; Azioni consigliate (da 3 a 5, in ordine di priorità).
3. Per ogni numero indica la fonte (GHL o Meta) e il confronto con il periodo precedente quando è utile. Tieni conto delle note di contesto e del costo per lead obiettivo del cliente. Non inventare dati mancanti: dillo.
4. Le azioni le farà il titolare: l'app è in sola lettura.
5. Alla fine salva il report con salva_analisi.`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "controllo_clienti",
    {
      title: "Controllo di tutti i clienti",
      description: "Giro rapido su tutti i clienti: chi va bene, chi ha problemi, da dove partire.",
      argsSchema: { giorni: z.string().optional().describe("7, 30 o 90 (predefinito 7)") },
    },
    ({ giorni }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Fai un controllo di tutti i clienti negli ultimi ${giorni && ["7", "30", "90"].includes(giorni) ? giorni : "7"} giorni con panoramica_clienti.
Dimmi in poche righe per ciascuno com'è andata rispetto al periodo precedente, poi elenca le criticità in ordine di urgenza e per i 2 clienti più critici approfondisci con analisi_cliente. Cita sempre la fonte (GHL o Meta) dei numeri.`,
          },
        },
      ],
    })
  );

  return server;
}
