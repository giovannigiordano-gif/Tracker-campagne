# Agency Insights — istruzioni per Claude

Le specifiche complete del progetto sono in PROGETTO.md; le regole di Next.js per gli agenti sono in AGENTS.md.
@PROGETTO.md
@AGENTS.md

## Come lavoriamo
- Il titolare ha competenze di programmazione limitate: rispondi in italiano, spiega passo per passo cosa deve fare lui (token, file, servizi), commenta il codice in italiano.
- Alla fine di ogni fase FERMATI: cosa hai fatto, come si prova, cosa serve per la fase successiva.
- Tutto il lavoro va su GitHub: `origin` = github.com/giovannigiordano-gif/Tracker-campagne, branch `main`. Commit e push a fine fase.
- Mai committare `.env` né `data/` (sono in .gitignore). Mai scrivere token, ID dell'agency o nomi dei clienti in file versionati: il repository è pubblico.
- Non chiedere mai al titolare di incollare token in chat: vanno nel file `.env` o nella pagina Impostazioni dell'app.

## Regole non negoziabili (sintesi di PROGETTO.md)
- Niente database: persistenza solo su file in `data/` (accounts.json, cache/, reports/, secrets/). Scritture atomiche: file temporaneo + rename.
- SOLA LETTURA su GHL e Meta: l'app non crea, modifica, mette in pausa o cancella nulla.
- Dati personali dei contatti (nomi, email, telefoni) mai su disco né all'AI: solo aggregati. Contatti grezzi solo in memoria.
- Non inventare endpoint o campi: verifica sulla documentazione ufficiale attuale prima di scrivere ogni client.
- Chiamate esterne solo lato server; il browser non vede mai un token.
- Ogni numero mostrato deve essere riconducibile alla sua fonte (GHL o Meta) e al periodo.

## Decisioni prese e fatti verificati
- **Accesso GHL (verificato il 2026-10-12)**: il token agency (Private Integration) legge solo i sub-account (`GET /locations/search`, `GET /locations/{id}`). Contatti, pipeline, opportunità e campi personalizzati rispondono 401 con il token agency. `POST /oauth/location-token` non accetta token Private Integration.
  → Strada scelta dal titolare: **un token Private Integration per ogni sub-account**, inserito dalla pagina Impostazioni dell'app e salvato cifrato (AES-GCM con `ENCRYPTION_KEY`) in `data/secrets/`, mai in accounts.json. In sviluppo è accettato anche `GHL_TOKEN_<LOCATIONID>` nel `.env`. Tutto il codice passa da un'unica interfaccia `getLocationClient(locationId)`.
  → Scope da spuntare nel token di sub-account: `contacts.readonly`, `opportunities.readonly`, `locations.readonly`, `locations/customFields.readonly`, `calendars.readonly`, `calendars/events.readonly`.
- **API GHL**: base `https://services.leadconnectorhq.com`, header `Version: v3` (dalla documentazione attuale). Ricerca contatti: `POST /contacts/search` (sola lettura). Header di rate limit ricevuti: `x-ratelimit-max=100` ogni `x-ratelimit-interval-milliseconds=10000`, `x-ratelimit-limit-daily=200000`.
- **Meta**: Graph/Marketing API `v26.0` (luglio 2026). Account assegnati al System User: `GET /{system-user-id}/assigned_ad_accounts`.
- **Anthropic**: SDK ufficiale `@anthropic-ai/sdk`, modello predefinito `claude-opus-5-5` (configurabile con `ANTHROPIC_MODEL`).
- **Next.js 16.4**: il middleware si chiama `proxy.ts`. Cache Components è attivo (default di create-next-app): i dati dinamici vanno dentro `<Suspense>`; non usare `"use cache"` per i dati delle API, la cache è il nostro `lib/cache.ts` come da PROGETTO.md. Per il deploy useremo `output: "standalone"`.
- Gli script in `scripts/` girano con `tsx`; il package non è `"type": "module"`, quindi niente top-level await negli script.
- **Design SalesProcess** (redesign del 2026-10-12, unito a `main`): token in `app/globals.css`, regole in DESIGN.md, decisioni in DESIGN-LOG.md, riepilogo per il titolare in REPORT-FINALE.md. Nei componenti solo token (mai colori scritti a mano), testo nero sull'arancio, nessuna ombra sulle card, icone solo Lucide. Le pagine nuove seguono DESIGN.md.
- **Ricerca contatti GHL** (doc: doc.clickup.com/8631005/d/h/87cpx-158396/6e629989abe7fad): `POST /contacts/search` con `pageLimit` max 500, filtro `{field:"dateAdded", operator:"range", value:{gte,lte}}` (ISO), paginazione a cursore con il `searchAfter` dell'ultimo contatto (necessaria oltre 10.000). Verificato su 3.742 contatti: nessun doppione né mancante.
- **Mappatura attribuzione (proposta, da confermare dal titolare)** in `lib/ghl/normalize.ts`: si usa `attributionSource` (primo contatto), altrimenti `lastAttributionSource`. `campaign`→utmCampaign (nome campagna), `campaignId`, `adId`; `utmMedium` = nome gruppo di inserzioni e `utmContent` = nome annuncio nei lead Meta; `adGroupId` assente nei lead Meta (l'adset si ricava dall'annuncio via Meta in Fase 4); `sessionSource`→origine. Canale "Meta Ads" solo con `Paid Social` o ID campagna/annuncio: `Social media` + facebook/instagram sono messaggi organici, non annunci.
- **Struttura pagine**: ogni `page.tsx` rende un `<Suspense>` con dentro un componente async che fa `await params/searchParams` e carica i dati (Cache Components lo richiede). Chiavi di cache GHL: `ghl:<locationId>:...` (così "Aggiorna dati" svuota un cliente solo), `ghl:agency:locations` per l'elenco sub-account.
- **Privacy nei test**: non stampare né fotografare la tabella contatti o qualunque dato personale durante le verifiche (né nel terminale né con screenshot): l'AI non deve vedere dati personali. Verificare solo conteggi.
- Tabelle: `@tanstack/react-table` v9 (API diversa dalla v8: `useTable`, `tableFeatures`, `table.FlexRender`); guida in `node_modules/@tanstack/react-table/skills/`. Tabella unica riusabile: `components/dashboard/data-table.tsx`.
- **Opportunità GHL**: `GET /opportunities/search` (limit max 100). Le pagine numerate (`page=N`) funzionano e si leggono in parallelo (3.248 opportunità in ~1 s invece di 18 s col cursore); oltre 10.000 si usa il cursore `startAfter`+`startAfterId`. Filtri `date`/`endDate` (mm-dd-yyyy) agiscono su createdAt. Le opportunità hanno un loro array `attributions` (isFirst/isLast) con nomi diversi dai contatti: `utmSessionSource`, `utmCampaignId`, `utmAdId`, `utmCampaign` → mappati in `normalizeOpportunity`. Vinte/perse si datano con `lastStatusChangeAt`.
- **Definizioni KPI**: lead = contatti creati nel periodo; opportunità = create nel periodo; vinte/perse/venduto = chiuse nel periodo (lastStatusChangeAt); tasso di chiusura = vinte/(vinte+perse).
- **Pipeline**: GHL non ha lo storico dei cambi fase. Il dato reale mostrato è "oggi in questa fase" per le opportunità create nel periodo; "arrivate qui" e "passaggio" sono stime (fasi percorse in ordine) e sono inaffidabili con fasi di uscita in mezzo (es. "Fake"). Possibile miglioria: segnare le fasi di uscita per pipeline in Impostazioni.
- **Brand salesprocess.it** (deciso dal titolare il 2026-10-12): arancio `#FF8200` (pulsanti, evidenze; testo NERO sopra l'arancio, il bianco non è leggibile), nero pieno per menu laterale e pannello dei numeri, Red Hat Display (900 per titoli e numeri), pulsanti a pillola, angoli ampi. Grafici in arancio più profondo `#D96C00` (contrasto ≥ 3:1) e `#F2A15A` tratteggiato per il periodo precedente, verificati col validatore della skill dataviz. Logo ricreato in SVG in `components/brand.tsx`.
- **Dashboard interattiva**: i filtri (canale, campagna, fonte, tag, pipeline) sono stato del browser e ricalcolano tutto con le funzioni pure di `lib/metrics/dashboard.ts`. Al browser arrivano righe ridotte; i dati personali solo per le righe delle tabelle del periodo corrente.
- `.gitignore` usa `/data/` (solo la cartella dati in radice): `data/` escludeva per errore anche `lib/data/`.
- Il server di sviluppo a volte non vede i file salvati dagli strumenti di modifica: se una modifica non compare, `touch` del file o riavvio del server.
- Next mantiene nascosta in memoria la pagina precedente: nei test via JS cercare solo elementi visibili.
- Dopo `git checkout`, merge o spostamenti di cartelle: riavviare il server di sviluppo e cancellare `.next/dev` (altrimenti serve CSS e tipi vecchi).
- **Struttura delle pagine** (2026-10-14): `app/(agenzia)/` = pagine del titolare con menu laterale (Panoramica, clienti, Impostazioni); `app/(condivisa)/condivisa/[codice]` = dashboard vista dal cliente, senza menu. `app/layout.tsx` contiene solo carattere, tema e notifiche. Gli indirizzi non sono cambiati.
- **Panoramica** (2026-10-14): una scheda per cliente (`components/dashboard/scheda-cliente.tsx`) con numeri chiave, andamento lead, lead per canale (`RigaPanoramica.canali`, solo conteggi) e avvisi. Chiave di cache `ghl:<id>:panoramica:v2:…`.
- **Link condivisi con i clienti** (deciso dal titolare il 2026-10-14): pulsante "Condividi" nella dashboard cliente.
  - Un link per cliente, valido finché il titolare non lo disattiva o lo sostituisce.
  - Il cliente vede tutta la dashboard, elenchi dei contatti compresi (scelta del titolare), ma niente "Aggiorna i dati", "Condividi", menu o Impostazioni. Può cambiare periodo.
  - Codice: 32 byte casuali; in `data/secrets/condivisioni.json` ci sono solo l'impronta SHA-256 e una copia cifrata (`lib/condivisioni.ts`). Mai stampare il codice nei test.
  - Pagine condivise con `noindex` e `referrer: no-referrer`.
  - I link funzionano per i clienti solo quando l'app sarà online (Fase 6).
- **Accesso del titolare** (fatto il 2026-10-14): password `APP_PASSWORD`.
  - Cookie firmato `sp_accesso` (HMAC con `SESSION_SECRET`, almeno 32 caratteri), valido 30 giorni; cambiare la password chiude le sessioni. Codice in `lib/sessione.ts` (funzioni pure, testate) e `lib/accesso.ts`.
  - `proxy.ts` blocca tutto tranne `/accesso`, `/condivisa/*` e i file statici: reindirizza le pagine, risponde 401 alle azioni.
  - Ogni azione in `app/actions.ts` chiama `richiediAccesso()`, ogni pagina dell'agenzia `richiediAccessoPagina()`: le azioni del server si possono chiamare da qualsiasi indirizzo.
  - In locale senza `APP_PASSWORD` l'app resta aperta. In produzione senza `APP_PASSWORD` o `SESSION_SECRET` ogni pagina risponde 503 "App non ancora configurata".
  - Le prove in locale si fanno con `.env.development.local` (escluso da git), da cancellare dopo.
- **Hosting su Vercel** (deciso dal titolare il 2026-10-14, piano Hobby per la fase di test; cambia "Non Vercel" di PROGETTO.md). Su Vercel i file non si conservano, quindi i dati dell'app vanno in **Vercel Blob privato** (spazio file, non database), cifrati. La cache dei dati GHL resta in memoria, per stare nei limiti Hobby (2.000 scritture al mese; se si superano, Blob si blocca per 30 giorni). Le variabili d'ambiente si inseriscono SOLO nel pannello di Vercel, mai su GitHub.
  - Codice: `lib/archivio.ts` (`archivio.leggi/modifica/cancella`). In locale scrive i file in `data/`. Su Vercel scrive in Blob privato sotto `dati/`, con contenuto cifrato con `ENCRYPTION_KEY` e scritture con ETag (`ifMatch`), che in caso di conflitto rileggono e riprovano.
  - Le letture restano in memoria per 30 s, per consumare poche operazioni: un cambiamento può impiegare fino a 30 s ad arrivare alle altre istanze.
  - Verificato il 2026-10-20: `get()` di Vercel Blob restituisce un ETag "debole" (`W/"…"`) quando comprime la risposta, mentre `put` con `ifMatch` vuole quello normale. `archivio.ts` toglie il prefisso `W/`. Il rifiuto "Precondition failed: ETag mismatch" può arrivare anche come `Error` generico, quindi si riconosce anche dal messaggio. Il finto Blob dei test riproduce entrambi i comportamenti.
  - Scelta automatica: Blob se esiste `BLOB_STORE_ID` o `BLOB_READ_WRITE_TOKEN`, oppure con `ARCHIVIO=file|blob` per forzarla.
  - Su Vercel senza Blob collegato le letture sono vuote e i salvataggi danno un errore chiaro; le Impostazioni lo segnalano.
  - SDK: `@vercel/blob` 2.8.1. Usano l'archivio `accounts.ts`, `ghl/tokens.ts` e `condivisioni.ts`; `cache.ts` scrive su disco solo in modalità file.
- **Configurazione Vercel fatta il 2026-10-20** (con Vercel CLI 64.7.0, account del titolare, team `spit5`, progetto `tracker-campagne`).
  - Spazio Blob privato `tracker-campagne-dati` in `fra1`, collegato a tutti gli ambienti.
  - Variabili di produzione: `APP_PASSWORD`, `SESSION_SECRET` (diversa da quella locale), `ENCRYPTION_KEY` (UGUALE a quella locale, così i token copiati restano leggibili), `GHL_AGENCY_TOKEN`, `GHL_COMPANY_ID`, `GHL_API_VERSION` e `BLOB_READ_WRITE_TOKEN`, messa da Vercel.
  - La password per entrare online è solo in `.env.produzione.local` sul computer del titolare (escluso da git).
  - `.env.vercel.local` contiene il token dello spazio Blob, scaricato con `vercel env pull`. Serve a `npm run carica-su-vercel`, che copia online clienti e token senza sovrascrivere ciò che c'è già.
  - Attenzione: `vercel link` e `vercel blob create-store` creano `.env.local` e aggiungono righe a `.gitignore`. Bisogna rinominare `.env.local` (in locale l'app userebbe lo spazio Blob online) e ripristinare `.gitignore` (la riga `.env*` escluderebbe anche `.env.example`).
  - Per ripubblicare con nuove variabili serve un nuovo deploy: un commit su `main` oppure `vercel redeploy`. Non usare `vercel deploy` dalla cartella locale, che caricherebbe anche file locali.
- **Meta Ads MCP** (server ufficiale `https://mcp.facebook.com/ads`, avviato il 2026-10-20). Codice in `lib/meta-mcp/`, rotte `app/api/meta-mcp/collega` (POST) e `app/api/meta-mcp/ritorno` (GET), scheda "Meta Ads" in Impostazioni (`app/(agenzia)/impostazioni/meta-ads.tsx`).
  - OAuth 2.1 con il SDK ufficiale `@modelcontextprotocol/sdk` 1.32.1: PKCE S256, controllo dello `state`, token cifrati in `secrets/meta-mcp.json` nell'archivio, rinnovo automatico 5 minuti prima della scadenza.
  - Permessi chiesti: solo `ads_mcp_management ads_read`. Strumenti abilitati: solo quelli in `STRUMENTI_LETTURA` che Meta non segnala come modifiche (`classificaStrumenti`, testata).
  - Verificato il 2026-10-20: la registrazione automatica dei client (DCR) di Meta risponde "Dynamic registration is not available for this client", sia con indirizzo locale sia online. Serve quindi l'ID di un'app Meta for Developers del titolare (`META_APP_ID`, non segreto) con il caso d'uso "Create & manage ads with ads MCP server" e gli indirizzi `<sito>/api/meta-mcp/ritorno` in "Facebook Login for Business".
  - La verifica del collegamento usa solo `tools/list` e `ads_get_ad_accounts`, pagina per pagina con `limit` e `cursor`. Salva i nomi degli strumenti e l'elenco degli account (id, nome, azienda, se è interrogabile) in `ultimaVerifica.account`.
  - Risposta reale (2026-10-20): `structuredContent.ad_accounts[]` con `ad_account_id` (solo il numero, l'app lo porta a `act_<numero>`), `ad_account_name`, `business_name`, `is_queryable`, `not_queryable_reason`, `next_cursor`. Lettura in `lib/meta-mcp/account.ts` (testata).
  - Il token vede solo gli account scelti nella finestra di approvazione di Meta e su cui il titolare ha un ruolo. Per aggiungerne altri si usa "Collega di nuovo". Il token dura circa 60 giorni e Meta non dà un refresh_token: alla scadenza va ricollegato.
- **Account Meta per cliente** (2026-10-20): nella scheda di ogni cliente in Impostazioni c'è la scelta multipla "Account pubblicitari Meta", con l'elenco dall'ultima verifica e l'indicazione di quelli già scelti per altri clienti. Si salva in `metaAdAccountIds` (formato `act_<numero>`, validato in `modificaCliente`).
- **Sezione "Campagne Meta"** (2026-10-20, scelte del titolare: in ogni cliente + criticità in Panoramica; prima numeri e criticità, il testo scritto dall'AI dopo).
  - Il token del collegamento MCP funziona anche sulla Graph/Marketing API `v26.0` (verificato). Client in `lib/meta/graph.ts`: solo GET, segue `paging.next`, riprova con attesa sui codici di limite (4, 17, 32, 613, 80000-80014); codice 190 = collegamento scaduto.
  - Letture per account (`lib/data/meta-cliente.ts`): insights `level=campaign`, `time_increment=1` su periodo precedente + corrente in una chiamata; campagne (nome, stato, obiettivo); annunci con `effective_status` DISAPPROVED/WITH_ISSUES e `issues_info`; account (nome, valuta, `account_status`, fuso); frequenza degli ultimi 7 giorni. Chiavi di cache `meta:<act>:…`, svuotate da "Aggiorna i dati".
  - Lead lato Meta = `actions` con `action_type` "lead" (`lib/meta/normalize.ts`).
  - Incrocio (`lib/metrics/meta.ts`): costo per lead = spesa / lead GHL del canale "Meta Ads"; costo per opportunità e per vendita; ROAS dal CRM = venduto / spesa; tabella per campagna unita ai dati GHL tramite l'ID campagna.
  - Criticità (`lib/metrics/criticita.ts`, testate), solo nella vista dell'agenzia e negli avvisi della Panoramica:
    - account non attivo (`account_status` ≠ 1): errore;
    - costo per lead sopra "Costo per lead obiettivo" (`thresholds.maxCpl`, in Impostazioni); senza obiettivo, se peggiora di oltre il 50% sul periodo precedente con almeno 5 lead in entrambi: attenzione;
    - spesa senza risultati: campagne attive con obiettivo lead (`OUTCOME_LEADS`, `LEAD_GENERATION`) che negli ultimi 3 giorni spendono almeno l'obiettivo (o 30) senza lead né su Meta né in GHL: errore;
    - annunci rifiutati o con problemi nelle campagne attive: errore se rifiutati, altrimenti attenzione;
    - frequenza degli ultimi 7 giorni oltre 3: attenzione.
  - Nella pagina condivisa la sezione c'è (senza criticità) solo se il cliente ha account Meta associati; un errore Meta mostra un messaggio neutro.
  - La variazione della spesa è grigia (`Delta neutra`): spendere di più non è né buono né cattivo.
  - **Niente confronto tra lead di Meta e lead del CRM** (deciso dal titolare il 2026-10-20, cambia la sezione "Discrepanze" e lo "scarto lead" di PROGETTO.md). I lead si contano solo in GHL: nella dashboard (anche nel link condiviso) non ci sono più "Lead secondo Meta", "Costo per lead di Meta", la linea tratteggiata e la colonna "Lead Meta". A Claude non arrivano `leadMeta`/`cplMeta` (`riepilogo.ts`, testato) e istruzioni e prompt dicono di non confrontare le due cifre. I lead di Meta restano solo nel calcolo interno della criticità "spesa senza risultati".
- **Date.now() e Cache Components**: Next.js rifiuta `Date.now()` mentre prepara le pagine in anticipo. Per misurare durate si usa `performance.now()` (vedi `archivio.ts`), per l'ora corrente si chiama prima `await connection()`.
- **Connettore per Claude** (fatto il 2026-10-20, scelta del titolare: le analisi le scrive Claude con il suo abbonamento, e si salvano anche nell'app). Sostituisce la chiamata all'API Anthropic prevista nella Fase 5: niente `ANTHROPIC_API_KEY`.
  - L'app è un server MCP remoto su `<sito>/mcp` (Streamable HTTP senza sessioni, `WebStandardStreamableHTTPServerTransport` del SDK 1.32.1, `enableJsonResponse`). Il titolare lo aggiunge in Claude: Personalizza → Connettori → Aggiungi connettore personalizzato. Funziona su claude.ai, app desktop, mobile e Cowork.
  - Requisiti verificati su claude.com/docs/connectors/building (authentication, lazy-authentication, index):
    - 401 con `WWW-Authenticate: Bearer resource_metadata=…`;
    - metadati RFC 9728 e RFC 8414 in `app/.well-known/…`;
    - PKCE S256; `/token` in form-urlencoded;
    - ritorno `https://claude.ai/api/mcp/auth_callback`;
    - Claude usa il CIMD se ci sono `client_id_metadata_document_supported: true` e `"none"` tra i metodi del token endpoint;
    - limiti: risultato di uno strumento circa 150.000 caratteri, 240 s per chiamata.
  - OAuth senza archivio (`lib/connettore/`): codici e token firmati HMAC con `SESSION_SECRET`, impronta di `APP_PASSWORD` e una "generazione" in `secrets/connettore.json`.
    - Durate: codice 2 minuti, accesso 1 ora, rinnovo 60 giorni con rotazione.
    - "Scollega Claude" in Impostazioni incrementa la generazione e annulla tutti i token; anche cambiare la password li annulla.
    - Limite noto: senza archivio un codice non si può segnare come già usato (lo protegge PKCE) e i token di rinnovo vecchi restano validi fino alla scadenza o allo scollegamento.
  - Pagina di consenso `/oauth/autorizza` con la password dell'app, sempre richiesta.
    - Accetta solo `client_id` https su `claude.ai`/`claude.com` (variabile `CONNETTORE_CLIENT_HOST` per cambiarli) e legge il CIMD per controllare il `redirect_uri`, con porta libera per gli indirizzi locali di Claude Code.
    - Se il CIMD non si raggiunge, accetta solo il ritorno fisso di claude.ai.
    - `X-Frame-Options: DENY` in next.config.
  - `proxy.ts` lascia passare `/mcp`, `/oauth/…` e `/.well-known/…`, che hanno il proprio controllo.
  - Strumenti (`lib/connettore/server.ts`), con annotazioni `readOnlyHint`:
    - `elenco_clienti`, `panoramica_clienti`, `analisi_cliente`, `analisi_salvate`;
    - `salva_analisi`, l'unica scrittura, solo nell'app;
    - prompt `analisi_campagne` (sezioni fisse di PROGETTO.md) e `controllo_clienti`.
  - Privacy: `analisi_cliente` usa `caricaDashboardCliente(…, { conDatiPersonali: false })` e `riepilogoCliente` (`lib/connettore/riepilogo.ts`, testato), che produce solo aggregati. Verificato sui dati reali: nessuna email né telefono, le sole sequenze lunghe di cifre sono ID di campagne Meta.
  - Analisi salvate in `reports/<locationId>.json` nell'archivio (ultime 50, `lib/analisi.ts`); in PROGETTO.md era un `.md` per analisi, ma online così si consumano meno scritture. Sezione "Analisi" nella dashboard, solo per il titolare (non nel link condiviso), con storico ed "Elimina".
  - Provato in locale l'intero giro: consenso, scambio, rinnovo, strumenti, salvataggio, revoca. Online il connettore funziona solo con `APP_PASSWORD` e `SESSION_SECRET` impostati.
- **Test**: `npm test` (node:test lanciato da tsx, nessuna dipendenza in più), file `*.test.ts` accanto al codice in `lib/`.
- **Idee in sospeso**:
  - il token Meta scade intorno al 2026-12-19: il titolare deve premere "Collega di nuovo" in Impostazioni.

## Comandi
- `npm run dev`: avvia l'app in locale (http://localhost:3000)
- `npm run check`: verifica i collegamenti a GHL, Meta e Anthropic
- `npm test`: test automatici (accesso, archivio, link condivisi, conteggi per canale, Meta e criticità, connettore per Claude)
- `npm run build`: build di produzione

## Stato delle fasi
- [x] Fase 0: scaffold, .env.example, `npm run check`, test di accesso GHL (2026-10-12)
- [x] Fase 1: client GHL, cache, Panoramica agency, Contatti e lead, Impostazioni con token cifrati (2026-10-12)
- [x] Fase 2: pipeline, opportunità e venduto, insieme al restyling Sales Process e alla dashboard interattiva (2026-10-12)
- [x] Fase 3: client Meta Marketing API, sezione Campagne Meta con criticità, mappatura in Impostazioni (2026-10-20)
- [ ] Fase 4: attribuzione e pagina Incrocio
- [x] Fase 5: MCP Meta (2026-10-20) e analisi AI tramite il connettore per Claude, con l'abbonamento del titolare (2026-10-20)
- [ ] Fase 6: login, Dockerfile, deploy su Railway o Render, README per utente non tecnico
