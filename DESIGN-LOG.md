# Design log — redesign SalesProcess

Decisioni prese in autonomia durante il redesign (branch `redesign-salesprocess`), una riga di motivazione ciascuna.

## Metodo
- 2026-10-12 · Nessuna domanda al titolare (richiesta esplicita): il contesto prodotto di Impeccable (PRODUCT.md) è stato dedotto da PROGETTO.md e CLAUDE.md e i fatti dedotti sono segnati *(inferito)*.
- Il mondo visivo è già SalesProcess (fissato dal titolare nella sessione precedente) → trattato come **estensione/rifinitura** del mondo esistente, non come ricerca di un nuovo stile: niente "torneo" di direzioni alternative di Impeccable.
- Skill usate: impeccable (audit, extract, harden/onboard/clarify, polish, animate, verifica finale), frontend-design, design-taste-frontend, ui-ux-pro-max, motion-design, dataviz (colori dei grafici).

## Fase 1 — Branding
- Palette, caratteri, forme e tono ricavati dal sito e raccolti in BRAND.md.
- Colori di stato dedotti (il sito non ne ha): verde/ambra/rosso più scuri e freddi dell'arancio per non confondersi col colore del marchio.
- Nessuna ombra nel sistema: il sito separa con il colore, non con le ombre.
- Raggio delle card portato a 22px, come sul sito.

## Fase 2 — Audit
- Audit con il metodo Impeccable (5 aree, voto 12/20) più le regole di UX/UI Pro Max; contrasti misurati con la formula WCAG invece che a occhio.
- Il detector automatico di Impeccable non ha trovato problemi: i rilievi vengono da codice, browser e misure.
- La skill UX/UI Pro Max non ha potuto usare il suo motore di ricerca (Python non installato sul computer): ho letto direttamente le sue linee guida e i file di dati.

## Fase 3 — Design system
- Token centralizzati in `app/globals.css` (colori chiaro/scuro, tipografia, spaziature, raggi, ombre, durate, curve, livelli): nei componenti non restano colori scritti a mano.
- Grigio secondario scurito a `#565E67` (da `#69727D`): il vecchio valore era sotto 4,5:1 sui fondi grigi.
- Neutri leggermente freddi, derivati dal grigio del sito, per non mescolare grigi caldi e freddi.
- Testo nero sopra l'arancio (8,5:1): il bianco del sito sui pulsanti grandi dà solo 2,5:1 e non va bene su pulsanti piccoli.
- Anello di focus arancio profondo `#C45F00` (≥ 3,8:1); su fondo nero arancio pieno.
- Nero pieno `#000` mantenuto per menu e pannello dei numeri anche se la skill "taste" consiglia il quasi-nero: il marchio usa il nero pieno e il brief vince.
- Modalità scura: fondo nero del marchio, superfici antracite, arancio pieno come accento; colori dei grafici riconvalidati sulla superficie scura (#FF8200 pieno + #94500F tratteggiato).
- Tema: automatico (segue il sistema) con scelta manuale chiaro/scuro nel menu; applicato da uno script prima del primo disegno per evitare il lampo bianco.
- Raggi: pannelli 22px (come il sito), blocchi interni 14px, tutti i controlli a pillola. Ombre solo per ciò che galleggia (modali, notifiche).
- Tipografia: solo Red Hat Display, scala fissa in rem (display 36px/900, titolo 34-28px/900, sezione 18px/800, testo 15px, etichette 13px, didascalie 12px). Cifre tabellari ovunque.
- Componenti unificati: pulsante (6 varianti, stato di caricamento, altezza 44px su touch), campo, menu a tendina nativo stilizzato, area di testo, interruttore, schede con indicatore scorrevole, finestra modale e pannello laterale, conferma distruttiva, notifiche, etichette di stato, messaggi, segnaposto di caricamento.
- Notifiche costruite su Base UI Toast (già installato) invece di aggiungere una libreria: annunciate ai lettori di schermo senza rubare il focus.
- Icone: solo Lucide (già nel progetto; la skill "taste" preferisce Phosphor ma ammette la libreria già in uso). Frecce Unicode sostituite con icone.
- Animazioni solo CSS (nessuna nuova dipendenza, regola "poche dipendenze" del progetto).
- Logo: simbolo a gradini + "salesprocess" nel menu, icona del browser col marchio al posto di quella di Next.js. Niente pagina di login: arriverà nella Fase 6 del progetto.
- Menu: colonna nera fissa da 1024px in su; sotto, barra nera con pulsante "Menu" che apre un pannello laterale con le stesse voci e i clienti (con filtro oltre 8 clienti).
- Su telefono resta fissa solo la barra del marchio; i filtri del periodo scorrono con la pagina per lasciare spazio ai dati.
- Aggiunto il link "Salta al contenuto" per chi usa la tastiera.
- Rimossi componenti non usati (tabella shadcn) e trattini lunghi dai testi visibili (sostituiti da "n.d." e da "dal ... al ...").

## Fase 4 — UX
- Notifiche dopo ogni salvataggio (cliente aggiunto, token salvato, modifiche, cache, dati aggiornati); gli errori dei moduli restano vicino al campo con `role="alert"`, perché vanno letti mentre si corregge.
- Conferma con finestra del sistema per "Rimuovi token" e "Rimuovi dall'app": titolo con il nome del cliente, conseguenze spiegate, pulsante rosso con il verbo dell'azione. Niente conferma per "Svuota la cache": non si perde nulla.
- Dopo "Aggiungi cliente" la scheda del nuovo cliente si apre da sola con il cursore nel campo del token: un passaggio in meno.
- Pagine "errore" e "non trovato" con spiegazione e azioni (Riprova, Vai alla panoramica, Apri Impostazioni) al posto delle pagine tecniche.
- Errori di token sulla pagina cliente: titolo "Serve un token valido" e pulsante diretto a Impostazioni.
- Scheletri di caricamento diversi per Panoramica, Cliente e Impostazioni, con la forma reale della pagina (anche il pannello nero).
- Stati vuoti utili: panoramica senza clienti (tre passi per iniziare), grafico senza dati (suggerisce 90 giorni), filtri senza risultati (pulsante Azzera), tabelle vuote con testo specifico.
- Scorciatoie: / cerca, 1-2-3 periodo, C confronto, R aggiorna, X azzera filtri, ? elenco. Non scattano mentre si scrive.
- Pagina cliente: indice delle sezioni fisso in alto (segna quella che stai guardando) e le quattro classifiche riunite in un pannello a schede "Da dove arrivano lead e vendite", con il numero di filtri attivi su ogni scheda: pagina più corta e meno card uguali.
- Su telefono i valori lunghi del pannello dei numeri usano la forma compatta (es. 124,5K €) invece di essere tagliati.
- Testi nel tono SalesProcess: seconda persona, frasi brevi, verbi d'azione ("Aggiorna i dati", "Verifica e salva", "Rimuovi dall'app"), "clienti seguiti", "Da controllare". Slogan del marchio solo nello stato vuoto iniziale ("Più clienti, più dati. Inizia dal primo.") e nella firma del menu.
- I passaggi per creare il token sono una lista numerata (è davvero una sequenza) dentro un "Come si crea il token" apribile.

## Fase 5 — Rifinitura dell'interfaccia
- Icone: solo Lucide anche nell'ordinamento delle tabelle (frecce su/giù al posto di ▲▼↕) e nella paginazione (frecce con etichetta per i lettori di schermo).
- Tabelle: righe alte 44px (comode al tocco), intestazioni con lo stile delle etichette, numeri allineati a destra con cifre tabellari, riga evidenziata al passaggio del mouse con la tinta arancio.
- Stato "premuto" uguale ovunque (leggero rimpicciolimento) su pulsanti, pillole, schede e scelta del tema.
- Griglia dei grafici con un token dedicato (`--viz-griglia`) per chiaro e scuro.
- Contenuto e barra dei filtri limitati a 1536px e centrati sugli schermi molto larghi: righe di tabella e grafici restano leggibili.
- Impostazioni: freccia che ruota sulle schede dei clienti, così si capisce che si aprono.
- Gerarchia tipografica applicata con le classi del sistema (`text-title`, `text-section`, `text-label`, `text-caption`) al posto di dimensioni scritte a mano.

## Fase 6 — Movimento
- Personalità "Corporate" della skill motion-design (strumento di lavoro): durate 150/200/300 ms come token (`--dur-fast/base/slow`), curva d'entrata `cubic-bezier(0.16, 1, 0.3, 1)`, d'uscita più rapida `cubic-bezier(0.7, 0, 0.84, 0)`; nessun rimbalzo.
- Momento firma: quando cambi filtro o periodo i numeri del pannello nero fanno un breve "scatto" (200 ms), le barre delle classifiche si allungano o accorciano e la linea del grafico si ridisegna in 300 ms: si vede che tutta la pagina si è ricalcolata.
- Continuità: il contenuto entra con dissolvenza e 6px di salita quando sostituisce lo scheletro; schede delle Impostazioni che si aprono con la stessa entrata; indicatore delle schede che scorre; cambio di tema con dissolvenza di 300 ms solo durante il cambio.
- Riscontro: pressione su pulsanti e pillole, interruttori che scorrono, notifiche che salgono ed escono di lato, finestre e pannello laterale che entrano dal punto giusto (centro con leggero ingrandimento, menu da sinistra), breve scossa del messaggio d'errore nei campi.
- Scaletta leggera (30 ms per elemento, massimo 12 elementi = 360 ms) per liste che compaiono come liste: classifiche, clienti a confronto, schede clienti, filtri attivi.
- Livello "ambientale" della skill motion-design volutamente escluso: in uno strumento di lavoro il movimento decorativo distrae (indicazione di Impeccable per la modalità Operate).
- "Riduci movimento": niente spostamenti né scosse, durate dimezzate, dissolvenze mantenute (il riscontro resta leggibile), grafico senza animazione. Il vecchio blocco che azzerava tutte le animazioni è stato sostituito perché toglieva anche il riscontro utile.
- Prestazioni: solo opacità e trasformazioni, più la larghezza delle barre delle classifiche (pochi elementi in un contenitore a dimensione fissa, nessun ricalcolo della pagina). Animazioni d'entrata con riempimento "backwards" per non lasciare trasformazioni attive dopo la fine.

## Fase 7 — Verifica e chiusura
- Contrasto: 34 coppie di colori misurate con la formula WCAG, chiaro e scuro. Tutte a norma AA: testi ≥ 4,5:1, bordi dei campi e anello di focus ≥ 3:1.
- Tastiera: ordine di tabulazione verificato (Salta al contenuto, marchio, menu, tema, filtri, contenuto), nessun salto forzato, tutti i controlli con un nome leggibile dai lettori di schermo.
- Anello di focus: ora compare subito nel colore giusto. Prima sfumava per 150 ms partendo dal colore del testo, e sulla voce di menu attiva era nero su nero.
- Dimensioni: nessuno scorrimento orizzontale a 320 (equivale allo zoom al 400%), 375, 768, 1024, 1366 e 1920px.
  - Corrette le pillole del grafico a 320px: ora scorrono nel loro binario invece di uscire dalla pagina.
  - Corretto lo scheletro di caricamento delle Impostazioni a 320px.
- Nome del cliente nella tabella della panoramica: area cliccabile portata ad almeno 24px di altezza.
- Prestazioni:
  - nessuno spostamento del layout durante il caricamento (CLS 0);
  - contenuto principale visibile in meno di 0,8 s in sviluppo;
  - nessuna animazione continua a pagina ferma;
  - CSS di 9 KB compressi.
  - Il pezzo più grande del JavaScript (~113 KB compressi) è la libreria dei grafici: lasciato così, accettabile per uno strumento interno.
- Rifinitura Impeccable: il detector automatico ha trovato 0 problemi. La revisione finale e DESIGN.md li ho fatti io con la checklist "polish" e la guida "document" di Impeccable, al posto dei sotto-agenti dedicati: le regole di questa sessione permettono i sotto-agenti solo su richiesta esplicita.
- Le domande che la guida "document" farebbe al titolare (metafora guida, tono) le ho decise io: "Il cruscotto in nero e arancio", coerente con il marchio e con l'uso da strumento di lavoro.
- Catture di revisione (.impeccable/review/) escluse da git: mostrano il nome di un cliente e il repository è pubblico.
- Pulizia: rimosso un import inutilizzato. Nessun console.log rimasto e nessun errore in console sulle 4 pagine.
- Logica di business, dati e API non toccati. In lib/ sono cambiati solo due testi mostrati a schermo:
  - "n.d." al posto di "—" quando un valore non è disponibile;
  - trattino normale tra le date.

## 2026-10-14 — Schede clienti in Panoramica e pulsante Condividi
- La tabella "Tutti i clienti" e "Clienti a confronto" sono sostituite da una scheda per cliente (richiesta del titolare: "uno spaccato rapido per ogni cliente").
  - Ogni scheda ha numeri chiave con variazione, andamento lead, lead per canale, avvisi e "Apri dashboard".
  - Griglia: 1 colonna su telefono, 2 da 768px, 3 da 1536px.
- Canali: barra unica con Meta Ads in arancio e tutti gli altri canali in un solo grigio (`--viz-resto`, #878F98 chiaro / #6B737C scuro), più la legenda con numeri e percentuali.
  - È una codifica "evidenza contro resto", non una palette a più colori.
  - Il validatore dataviz segnala il grigio come "poco saturo", ed è voluto; separazione per daltonici (ΔE ≥ 15) e contrasto (≥ 3:1) passano in entrambi i temi.
- Cliente in errore: la scheda mostra il motivo e "Apri Impostazioni" (pulsante principale) al posto dei numeri.
- Condividi:
  - finestra con stato di caricamento, avviso ambra "l'app gira solo sul tuo computer" in locale, "Copia link" come azione principale;
  - "Crea un nuovo link" e "Disattiva link" come azioni secondarie, con conferma dentro la stessa finestra (niente finestra sopra un'altra finestra);
  - il pulsante è il "trigger" della finestra, così chiudendola il focus della tastiera torna su "Condividi".
- Pagina condivisa:
  - solo la barra nera col marchio (senza link), barra del periodo senza scorciatoie e la stessa dashboard;
  - l'indice delle sezioni si aggancia in cima, perché non c'è la barra dei filtri fissa;
  - "Link non valido o disattivato" è una pagina neutra, senza indizi sul motivo.

## 2026-10-14 — Logo ufficiale
- Logo ufficiale fornito dal titolare (PNG 293×68, scritta bianca, simbolo e motto arancio) salvato in `public/brand/salesprocess-logo.png`.
  - Si mostra a 147×34 px, cioè metà della larghezza reale, così resta nitido sugli schermi ad alta densità.
  - Sta solo sulle barre nere (menu e pagina condivisa), perché la scritta è bianca.
- Il simbolo vettoriale (icona del browser, pagine di errore) è ridisegnato con le misure lette dai pixel del logo: cinque quadrati a zig-zag (20,5 / 17,5 / 13 / 10,5 / 7,8). Quello di prima era inventato e diverso.
- Tolto il motto "Fatturare. Fatturare. Fatturare." in fondo al menu: è già nel logo.
- Il logo usa un arancio leggermente più rosso (#FF7200) del colore del sito (#FF8200). L'interfaccia resta su #FF8200, misurato sul sito e già verificato per i contrasti.

## 2026-10-20 — Sezione "Campagne Meta" nella dashboard cliente
- Nuova sezione nell'indice della dashboard ("Campagne Meta"), prima di "Andamento". Non dipende dai filtri della pagina e lo dice nella descrizione.
- Criticità in cima (solo vista agenzia): elenco con icona e testo, prima gli errori (rosso) poi le attenzioni (ambra). Il colore non è mai l'unico segnale.
- 8 riquadri numerici, ognuno con la fonte a destra dell'etichetta ("Meta", "GHL", "Meta + GHL"), così ogni numero si riconduce alla sua origine.
  - I costi usano la variazione inversa (salire è rosso).
  - La spesa ha una variazione neutra, grigia: spendere di più non è né bene né male.
- Due grafici:
  - spesa al giorno a barre (`--viz-barra`);
  - lead al giorno a linee, GHL piena in arancio profondo (`--viz-attuale`) e Meta tratteggiata in grigio (`--viz-resto`), con legenda: due serie, quindi la legenda c'è sempre.
- Tabella per campagna con la tabella unica riusabile ed esportazione CSV; la riga "Senza campagna Meta" sta in fondo.
- Panoramica: nelle schede clienti si aggiungono "Spesa Meta" e "Costo per lead"; le criticità Meta finiscono tra gli avvisi della scheda.
- Stati: cliente senza account Meta → invito ad associarli in Impostazioni (nella pagina condivisa la sezione sparisce); collegamento scaduto → messaggio con il pulsante per le Impostazioni (nella pagina condivisa un messaggio neutro).

## 2026-10-20 — Connettore per Claude: consenso, sezione Analisi, scheda Impostazioni
- Pagina di consenso `/oauth/autorizza`: stessa struttura della pagina di accesso (barra nera col marchio, card stretta).
  - Tre righe con icona: cosa potrà fare, cosa non potrà fare, avviso «se non hai appena premuto Connetti, chiudi».
  - Password con mostra/nascondi; «Consenti» è l'azione principale (arancio) e «Annulla» la secondaria.
  - Il nome del client si mostra insieme all'host (claude.ai), perché il nome lo scrive il client stesso.
- Sezione «Analisi» nella dashboard cliente, dopo «Campagne Meta», solo per il titolare.
  - Analisi più recente aperta, storico a destra da 1024px in su (sotto su schermi stretti) ed «Elimina» con conferma.
  - Testo markdown con react-markdown e remark-gfm: niente HTML eseguito, link pericolosi scartati.
  - Gli stili sono mappati sui token: titoli `text-section`, corpo `text-body`, tabelle con `ring-border`, larghezza massima 75ch.
  - Senza analisi: riquadro grigio con l'esempio di richiesta da fare a Claude e il link alla scheda in Impostazioni.
- Impostazioni, scheda «Claude»:
  - indirizzo del connettore in un campo di sola lettura con «Copia»;
  - 4 passi numerati (è una sequenza vera);
  - avviso ambra in locale; badge «Collegato» e «Scollega Claude» dopo il primo collegamento.
