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

## Comandi
- `npm run dev`: avvia l'app in locale (http://localhost:3000)
- `npm run check`: verifica i collegamenti a GHL, Meta e Anthropic
- `npm run build`: build di produzione

## Stato delle fasi
- [x] Fase 0: scaffold, .env.example, `npm run check`, test di accesso GHL (2026-10-12)
- [ ] Fase 1: client GHL, cache, Panoramica agency, Contatti e lead (prima Eko, poi tutti)
- [ ] Fase 2: pipeline e opportunità
- [ ] Fase 3: client Meta Marketing API, pagina Campagne, mappatura in Impostazioni
- [ ] Fase 4: attribuzione e pagina Incrocio
- [ ] Fase 5: MCP Meta e analisi AI, con fallback
- [ ] Fase 6: login, Dockerfile, deploy su Railway o Render, README per utente non tecnico
