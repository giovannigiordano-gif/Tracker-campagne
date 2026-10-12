# Progetto: Agency Insights — dashboard GoHighLevel + Meta Ads

## Chi sono e come lavoriamo
Sono il titolare di un'agenzia di marketing. Uso GoHighLevel (GHL) come agency: ogni cliente è un sub-account (location). Gestisco le campagne Meta Ads dei clienti dal mio Business Manager.
Ho competenze di programmazione limitate: scrivi tu tutto il codice e spiegami in modo semplice, passo per passo, cosa devo fare io (creare token, compilare file, configurare servizi). Commenta il codice in italiano.

## Obiettivo
Una web app interna che:
1. elenca tutti i sub-account GHL della mia agency;
2. per ogni cliente mostra una dashboard completa su contatti, lead, pipeline e opportunità;
3. permette di associare a ogni sub-account uno o più account pubblicitari Meta;
4. mostra le performance delle campagne Meta e le incrocia con i dati GHL;
5. genera analisi scritte con Claude collegato al server MCP ufficiale di Meta Ads.

## Vincoli non negoziabili
- NIENTE database: niente Postgres, MySQL, SQLite, Supabase, Firebase, Redis o simili. Persistenza solo su file: data/accounts.json, data/cache/, data/reports/, data/secrets/. Segreti in .env.
- SOLA LETTURA su GHL e Meta: l'app non crea, modifica, mette in pausa o cancella nulla, mai.
- I dati personali dei contatti (nomi, email, telefoni) non vengono mai scritti su disco né inviati al modello AI. Su disco e all'AI vanno solo dati aggregati.
- Non inventare endpoint, campi o parametri: prima di scrivere ogni client verifica sulla documentazione ufficiale attuale (GHL: marketplace.gohighlevel.com/docs; Meta: developers.facebook.com/docs/marketing-api; Anthropic: docs.claude.com). Se qualcosa non torna, chiedimelo.
- Poche dipendenze, codice leggibile.

## Stack
- Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, Recharts per i grafici, TanStack Table per le tabelle.
- Tutte le chiamate esterne solo lato server (route handlers / server actions). Il browser non vede mai un token.
- Login semplice: password in .env (APP_PASSWORD), cookie di sessione firmato, middleware che protegge tutte le pagine.
- Deploy su un server Node con disco persistente (Railway o Render con volume montato su /app/data). Non Vercel. Includi un Dockerfile.

## Configurazione
Crea .env.example con: APP_PASSWORD, SESSION_SECRET, ENCRYPTION_KEY, GHL_AGENCY_TOKEN, GHL_COMPANY_ID, GHL_API_VERSION, META_SYSTEM_USER_TOKEN, META_GRAPH_VERSION, ANTHROPIC_API_KEY, ANTHROPIC_MODEL.
Eventuali token per singolo sub-account vanno in .env con nome GHL_TOKEN_<LOCATIONID>.

data/accounts.json contiene un array di clienti con: locationId, name, metaAdAccountIds (array, formato act_...), currency, timezone, notes (settore, offerta, obiettivo, target di CPL: è il contesto per l'AI), active (true/false). Mai token in chiaro in questo file.
La pagina Impostazioni legge e scrive questo file (scrittura atomica: file temporaneo + rename).

## Integrazione GHL
- Base URL https://services.leadconnectorhq.com, header Authorization: Bearer e Version.
- FASE 0, test di accesso, in quest'ordine:
  a) GET /locations/search con il token agency: elenco sub-account;
  b) lettura contatti e opportunità di UNA location con il token agency passando locationId;
  c) se (b) fallisce, prova lo scambio token via /oauth/locationToken se il token lo consente;
  d) altrimenti usa un Private Integration Token per sub-account.
  Riportami quale strada funziona e costruisci il client di conseguenza, con un'interfaccia unica getLocationClient(locationId).
- Dati da leggere: contatti (paginazione completa), pipeline e fasi, opportunità, campi personalizzati; opzionali appuntamenti e conversazioni.
- Rate limit: coda per token sotto le 100 richieste ogni 10 secondi, retry con backoff esponenziale sui 429, rispetto degli header di rate limit.
- Normalizza in tipi interni (Contact, Opportunity, Pipeline, Stage) con un oggetto attribution: utmSource, utmMedium, utmCampaign, utmTerm, utmContent, campaignId, adsetId, adId, origine.
- Prima di implementare l'attribuzione, prendi 20 contatti recenti di una location, mostrami quali campi di attribuzione contengono davvero e proponi la mappatura.

## Integrazione Meta — numeri (Marketing API)
- Graph API Insights con META_SYSTEM_USER_TOKEN (System User del mio Business Manager, permesso ads_read sugli account dei clienti). Usa la versione Graph corrente.
- Per ogni ad account: insights a livello account, campagna, gruppo, annuncio, con time_increment=1. Campi: spend, impressions, reach, frequency, clicks, inline_link_clicks, ctr, cpc, cpm, actions, cost_per_action_type. Anagrafica campagne: nome, stato, obiettivo, budget.
- Per periodi lunghi usa i report asincroni. Gestisci i limiti (header x-business-use-case-usage) con backoff.
- Il numero di lead lato Meta si legge da actions (verifica quali action_type usare per Lead Ads e per conversioni sito).

## Integrazione Meta — analisi AI (MCP)
- Server MCP ufficiale Meta Ads: https://mcp.facebook.com/ads (beta, OAuth con Meta Business).
- Il backend chiama la Claude API usando il connettore MCP verso quel server. Verifica sulla documentazione Anthropic la sintassi attuale, gli header beta richiesti e come limitare gli strumenti.
- Collegamento: in Impostazioni un pulsante "Collega Meta MCP" esegue il flusso OAuth MCP una volta; salva i token cifrati (AES-GCM con ENCRYPTION_KEY) in data/secrets/meta-mcp.json e gestisci il refresh.
- Solo strumenti di lettura: abilita solo reporting/insights se l'API lo consente; in ogni caso il system prompt vieta qualsiasi modifica.
- Input all'AI: note del cliente, ad account, periodo, aggregati GHL (lead per giorno e per campagna, conversioni tra fasi, CPL reale, costo per opportunità e per vendita). Mai dati personali.
- Output: report in markdown con sezioni fisse (Sintesi; Cosa funziona; Cosa non funziona; Discrepanze tra lead Meta e lead GHL; 3-5 azioni consigliate in ordine di priorità). Salvalo in data/reports/<locationId>/<YYYY-MM-DD-HHmm>.md e mostralo in app. Aggiungi anche la modalità "domanda libera".
- Fallback: se il MCP non risponde o l'autorizzazione è scaduta, fai l'analisi passando a Claude i dati già presi dalla Marketing API, e indica nel report quale modalità è stata usata.

## Attribuzione e KPI incrociati
- Abbinamento a cascata lead → annuncio, gruppo, campagna (da UTM con ID dinamici o campi di attribuzione GHL), altrimenti solo livello cliente.
- Mostra sempre la percentuale di lead attribuiti.
- KPI: CPL reale = spesa / nuovi contatti da Meta in GHL; scarto lead = lead Meta − contatti GHL; costo per opportunità; costo per appuntamento; costo per vendita = spesa / opportunità vinte; ROAS da CRM = valore vinte / spesa; tasso di avanzamento per fase e per campagna.

## Cache
- Modulo cache.ts con get(key, ttl, fetcher): memoria + file JSON in data/cache/ solo per dati aggregati.
- Scadenze: dati di oggi 15 minuti, giorni passati 24 ore, anagrafiche 6 ore.
- Contatti grezzi solo in memoria. Pulsante "Aggiorna dati" per cliente e globale.

## Pagine
1. Panoramica agency: una riga per cliente con spesa, lead GHL, CPL reale, opportunità, vinte, ROAS, variazione sul periodo precedente, avvisi (soglie configurabili in accounts.json, token scaduti, rate limit).
2. Cliente · Contatti e lead: andamento giornaliero, per fonte, per tag, per campagna; tabella filtrabile con export CSV; contatti senza attribuzione.
3. Cliente · Pipeline: funnel per pipeline con conversione tra fasi, tempo medio per fase, valore, vinte e perse.
4. Cliente · Campagne Meta: KPI per campagna, gruppo, annuncio; andamento di spesa, CPL, frequenza.
5. Cliente · Incrocio: tabella per campagna con metriche Meta e GHL affiancate.
6. Analisi AI: genera report, domanda libera, storico.
7. Impostazioni: mappatura sub-account ↔ ad account, note di contesto, collegamento MCP, svuota cache.
Filtri globali: periodo (7, 30, 90 giorni, personalizzato) e confronto col periodo precedente. Interfaccia in italiano, pulita, leggibile anche su tablet.

## Fasi di lavoro
Alla fine di ogni fase FERMATI: riassumi cosa hai fatto, come lo provo, cosa mi serve per la fase successiva.
- Fase 0: crea CLAUDE.md con queste regole e il piano; scaffold del progetto; .env.example; script "npm run check" che testa GHL, Meta API e Anthropic e stampa un esito leggibile; test di accesso GHL descritto sopra.
- Fase 1: client GHL, cache, Panoramica agency, pagina Contatti e lead (prima su un solo cliente, poi su tutti).
- Fase 2: pipeline e opportunità.
- Fase 3: client Meta Marketing API, pagina Campagne, mappatura in Impostazioni.
- Fase 4: attribuzione e pagina Incrocio.
- Fase 5: collegamento MCP Meta e analisi AI, con fallback.
- Fase 6: login, Dockerfile, deploy guidato su Railway o Render, README in italiano per un utente non tecnico.

## Regole sempre valide
- Mai committare .env né la cartella data/ (aggiungile a .gitignore).
- Errori visibili nell'interfaccia, per cliente, con messaggio comprensibile (es. "token GHL scaduto per Cliente X").
- Ogni numero mostrato deve poter essere ricondotto alla sua fonte (GHL o Meta) e al periodo.
