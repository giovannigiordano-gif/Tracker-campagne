# Product

<!-- impeccable:product-schema 1 -->

> Nota: il titolare ha chiesto di lavorare in autonomia senza domande (2026-10-12). I fatti segnati *(inferito)* sono dedotti da PROGETTO.md, CLAUDE.md e dalle conversazioni di lavoro, non confermati in un'intervista.

## Platform

web

## Users

- **Titolare dell'agenzia** (unico utente oggi): gestisce un'agenzia di marketing che usa GoHighLevel come agency (172 sub-account) e le campagne Meta Ads dei clienti dal proprio Business Manager. Competenze tecniche limitate. Usa l'app ogni giorno per capire in pochi secondi come stanno andando i clienti: lead, opportunità, vendite, campagne.
- *(inferito)* In futuro possibili collaboratori dell'agenzia (account, media buyer) con lo stesso bisogno di lettura rapida.

## Product Purpose

Web app interna (Agency Insights) che legge in sola lettura GoHighLevel e Meta Ads e mostra, per l'agenzia e per ogni cliente: lead, opportunità, pipeline, venduto, attribuzione alle campagne, e in seguito costi Meta e analisi scritte da Claude. Successo = il titolare capisce cosa funziona e cosa no per ogni cliente senza aprire GHL o Business Manager.

## Positioning

Incrocia i dati del CRM (GHL) con quelli pubblicitari (Meta) a livello di singola campagna e annuncio, usando gli ID di attribuzione registrati da GHL: mostra il costo reale per lead, opportunità e vendita, non solo le metriche della piattaforma pubblicitaria.

## Operating Context

- Uso quotidiano su desktop e tablet, interfaccia in italiano.
- Flusso tipico: Panoramica agenzia → cliente → filtri per canale/campagna → tabelle ed export CSV.
- Configurazione in Impostazioni: scelta dei sub-account da monitorare, token GHL per sub-account (verificati e cifrati), note di contesto per l'AI.
- Fasi future già pianificate: campagne Meta (Fase 3), incrocio attribuzione (Fase 4), analisi AI (Fase 5), login e deploy (Fase 6).

## Capabilities and Constraints

- Sola lettura su GHL e Meta; nessun database (solo file in data/); dati personali dei contatti mai su disco né all'AI.
- Next.js 16 (App Router, Cache Components), Tailwind v4, shadcn/ui (Base UI), Recharts, TanStack Table v9.
- Ogni numero deve dichiarare fonte (GHL o Meta) e periodo.
- Non esiste ancora una pagina di login (arriva in Fase 6).

## Brand Commitments

- Marchio **SalesProcess** (salesprocess.it), scelto dal titolare come identità della piattaforma: vedi BRAND.md.
- Tono di voce del marchio: diretto, energico, orientato al risultato ("Più clienti, più fatturato", "Fatturare. Fatturare. Fatturare.").

## Evidence on Hand

- Dati reali di un cliente di prova (un sub-account) usati per verifiche; nessuna testimonianza, case study o dato commerciale da mostrare nell'interfaccia.
- Logo ufficiale non presente nel progetto: il simbolo è ridisegnato in SVG (components/brand.tsx).

## Product Principles

1. Leggibilità in pochi secondi: il numero importante si vede prima di tutto il resto.
2. Ogni dato è tracciabile: fonte, periodo e definizione sempre a portata.
3. Interattività che risponde subito: filtri e confronti ricalcolano senza attese.
4. Onestà sui limiti: stime e dati mancanti sono dichiarati, mai mascherati.
5. Privacy per costruzione: i dati personali compaiono solo dove servono a lavorare.

## Accessibility & Inclusion

*(inferito)* Contrasto WCAG AA, navigazione completa da tastiera, rispetto di prefers-reduced-motion (richiesti esplicitamente nel brief del 2026-10-12).
