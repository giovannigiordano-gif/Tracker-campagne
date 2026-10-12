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
- **Design SalesProcess** (redesign del 2026-10-12, branch `redesign-salesprocess`): token in `app/globals.css`, regole in DESIGN.md, decisioni in DESIGN-LOG.md, riepilogo per il titolare in REPORT-FINALE.md. Nei componenti solo token (mai colori scritti a mano), testo nero sull'arancio, nessuna ombra sulle card, icone solo Lucide. Le pagine nuove seguono DESIGN.md.
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

## Comandi
- `npm run dev`: avvia l'app in locale (http://localhost:3000)
- `npm run check`: verifica i collegamenti a GHL, Meta e Anthropic
- `npm run build`: build di produzione

## Stato delle fasi
- [x] Fase 0: scaffold, .env.example, `npm run check`, test di accesso GHL (2026-10-12)
- [x] Fase 1: client GHL, cache, Panoramica agency, Contatti e lead, Impostazioni con token cifrati (2026-10-12)
- [x] Fase 2: pipeline, opportunità e venduto, insieme al restyling Sales Process e alla dashboard interattiva (2026-10-12)
- [ ] Fase 3: client Meta Marketing API, pagina Campagne, mappatura in Impostazioni
- [ ] Fase 4: attribuzione e pagina Incrocio
- [ ] Fase 5: MCP Meta e analisi AI, con fallback
- [ ] Fase 6: login, Dockerfile, deploy su Railway o Render, README per utente non tecnico
