# Audit interfaccia — Sales Process Insights

Data: 12/10/2026 · Branch: `redesign-salesprocess` · Schermate esaminate: Panoramica agenzia, Dashboard cliente, Impostazioni, caricamento, errori, menu, filtri, tabelle, grafici. Verifiche fatte: lettura del codice, browser a 1100 px e 375 px, misura del contrasto (formula WCAG), detector di Impeccable (nessun rilievo automatico).

## Punteggio (metodo Impeccable)

| # | Area | Voto | Problema principale |
|---|------|------|--------------------|
| 1 | Accessibilità | 2/4 | testo grigio sotto 4,5:1 su fondi grigi; focus non uniforme; niente link "salta al contenuto" |
| 2 | Prestazioni | 3/4 | buone (calcoli in memoria, CSS leggero); nessuna animazione pesante perché non ce ne sono |
| 3 | Temi e token | 2/4 | token presenti ma molti colori scritti a mano; nessuna modalità scura |
| 4 | Responsive | 2/4 | menu mobile tagliato; bersagli touch sotto 44 px; filtri che vanno a capo male |
| 5 | Coerenza dell'implementazione | 3/4 | identità chiara, ma frecce Unicode come icone, conferme del browser, card tutte uguali |
| | **Totale** | **12/20** | **Accettabile: serve lavoro mirato** |

**Verdetto coerenza**: superato con riserva. Il sistema è riconoscibile (SalesProcess: nero, arancio, Red Hat Display), ma mancano gli stati, i componenti condivisi e il movimento.

## Problemi in ordine di impatto

### P1 — Importanti

1. **Testo secondario sotto il contrasto minimo** (Accessibilità, WCAG 1.4.3). Il grigio `#69727D` dà 4,36:1 sul fondo pagina, 4,13:1 sulle pillole, 4,40:1 sulle righe selezionate; il bianco al 45% sul nero ("Clienti" nel menu) dà 4,43:1. Serve ≥ 4,5:1. → Scurire il grigio secondario e alzare le opacità sul nero. *Fase 3.*
2. **Nessuna modalità scura** e colori scritti a mano (`#ff9a33`, `emerald-700`, `red-700`, `amber-600`, `bg-white`, `white/45` ecc. in 10+ punti). → Token semantici chiaro/scuro (fondo, superfici, testo, bordi, successo, attenzione, errore) e sostituzione di tutti i valori fissi. *Fase 3.*
3. **Conferme delle azioni distruttive con la finestra del browser** (`confirm()` per "Rimuovi token" e "Togli cliente"): grezze, fuori stile, poco chiare su cosa succede. → Finestra di conferma del sistema con titolo, spiegazione e pulsante rosso. *Fase 4.*
4. **Nessun riscontro dopo i salvataggi**: in Impostazioni l'esito compare come riga di testo che può finire fuori schermo; aggiunta di un cliente senza conferma visibile né passo successivo evidente. → Notifiche (toast) per successo ed errore, e dopo l'aggiunta di un cliente apertura diretta della sua scheda con il campo token pronto. *Fase 4.*
5. **Mancano le pagine di errore e "non trovato"**: un errore imprevisto mostra la pagina tecnica di Next. → `error.tsx` e `not-found.tsx` con logo, spiegazione e azione. *Fase 4.*
6. **Menu su telefono tagliato**: "Impostazioni" resta solo come icona e l'elenco clienti sparisce. → Menu mobile a scomparsa con tutte le voci e i clienti. *Fase 4.*
7. **Bersagli touch piccoli**: pillole del periodo, scelte dei grafici e pulsanti piccoli sono alti 28-32 px su tablet/telefono (minimo 44). → Altezza minima maggiore sui dispositivi touch. *Fase 5.*

### P2 — Medi

8. **Caricamento generico**: lo stesso scheletro (blocco nero + rettangoli) per tutte le pagine, anche per Impostazioni che non ha il pannello nero. → Scheletri specifici per pagina che anticipano la struttura reale. *Fase 4.*
9. **Pagina cliente troppo lunga e a card identiche**: 10 riquadri bianchi uguali uno sotto l'altro; quattro classifiche separate. → Classifiche riunite in un pannello con schede (Canali, Campagne, Fonti, Tag); barra di navigazione interna alle sezioni. *Fasi 4-5.*
10. **Icone miste**: frecce Unicode (▲ ▼ ↕) come icone nelle variazioni e nell'ordinamento, accanto alle icone Lucide. → Solo Lucide. *Fase 5.*
11. **Focus da tastiera non uniforme**: alcuni pulsanti personalizzati (pillole, righe delle classifiche, interruttore confronto) usano il contorno predefinito del browser o nessuno. → Un unico anello di focus arancio su tutto. Aggiungere "Salta al contenuto". *Fasi 3 e 5.*
12. **Nessuna scorciatoia da tastiera** per uno strumento d'uso quotidiano. → `/` cerca, `1`/`2`/`3` periodo, `C` confronto, `?` elenco scorciatoie. *Fase 4.*
13. **Microcopy da rifinire**: "Clienti con avvisi: 0 su 1", sottotitoli lunghi, "Filtri" generico, messaggi d'errore tecnici in alcuni punti. → Testi brevi, diretti, in seconda persona, nel tono SalesProcess. *Fase 4.*
14. **Grafico non descritto per i lettori di schermo**. → Etichetta riassuntiva sul grafico (la tabella dei numeri c'è già). *Fase 5.*
15. **Interruttore "Confronta" e pillole senza stato premuto evidente da tastiera**; disabilitati non sempre distinguibili. *Fase 5.*

### P3 — Rifinitura

16. **Zero movimento**: cambi pagina, apertura dei dettagli, filtri e salvataggi avvengono di colpo. → Transizioni brevi (150-300 ms) con token, entrata delle liste a scaletta leggera, feedback su pulsanti e interruttori, rispetto di "riduci movimento". *Fase 6.*
17. **Favicon di Next.js** al posto del marchio. → Icona SalesProcess. *Fase 3.*
18. **Raggi diversi** tra pannello nero (24px), card (≈20px), campi (pillola) e tabelle (12px) senza una regola. → Scala di raggi a token (22px come il sito). *Fase 3.*
19. **Numeri che saltano** quando cambiano i filtri (nessuna transizione dei valori). *Fase 6.*

## Cosa funziona già (da mantenere)

- Identità forte e coerente con il marchio: pannello nero dei numeri, arancio usato solo per azioni e selezioni.
- Ogni numero dichiara fonte, periodo e definizione.
- Tabelle con ordinamento accessibile (`aria-sort`), ricerca ed export CSV; grafico con tabella dei numeri alternativa e legenda non affidata al solo colore (linea piena/tratteggiata).
- Filtri incrociati immediati, senza ricaricare la pagina.
- Colori dei grafici già verificati per contrasto e daltonismo.

## Lista di lavoro

1. Fase 3 — token chiaro/scuro, contrasti corretti, componenti base condivisi (pulsante, campo, select, tabella, card, badge, finestra modale, notifiche, schede, menu), favicon e logo.
2. Fase 4 — conferme, notifiche, pagine di errore, menu mobile, scheletri, stati vuoti, scorciatoie, microcopy, navigazione interna della pagina cliente.
3. Fase 5 — applicazione del sistema schermata per schermata, icone uniche, stati hover/focus/attivo/disabilitato, bersagli touch.
4. Fase 6 — movimento con token e "riduci movimento".
5. Fase 7 — verifica contrasto, tastiera, dimensioni, prestazioni, rifinitura finale.
