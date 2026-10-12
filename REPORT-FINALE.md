# Report finale del redesign SalesProcess

Data: 12 ottobre 2026. Lavoro sul branch `redesign-salesprocess`, 7 fasi, un salvataggio (commit) per fase.

## In breve

L'app ora ha l'aspetto e il tono di SalesProcess:
- colori: nero pieno e arancio `#FF8200`;
- carattere: Red Hat Display;
- pulsanti a pillola e angoli grandi come sul sito.

È più facile da usare: ogni azione dà una conferma, gli errori dicono cosa fare, i caricamenti mostrano la forma della pagina e ci sono le scorciatoie da tastiera. Funziona con il tema chiaro e scuro, su telefono, tablet e computer.

Non ho toccato il funzionamento: dati, conti, collegamenti a GoHighLevel e Meta e salvataggi sono gli stessi di prima. Ho cambiato solo aspetto, disposizione, testi dell'interfaccia e animazioni.

## Come vederlo

1. Apri il terminale nella cartella del progetto.
2. Avvia l'app con `npm run dev`.
3. Apri http://localhost:3000.

Il redesign è sul branch `redesign-salesprocess`; la versione precedente è intatta su `main`. Più sotto trovi come passare dall'una all'altra.

## Cosa è cambiato, schermata per schermata

### Su tutte le pagine
- **Marchio**:
  - logo SalesProcess (simbolo a gradini) in alto nel menu e come icona della scheda del browser;
  - firma "Fatturare. Fatturare. Fatturare." in fondo al menu.
- **Menu nero a sinistra** sui computer, con la voce attiva in arancio. Su telefono e tablet in verticale diventa una barra nera con il pulsante **Menu**, che apre lo stesso menu di lato. Con più di 8 clienti compare un campo per cercarli.
- **Tema chiaro, scuro o automatico** (segue il computer): si sceglie con le tre icone in fondo al menu. Il tema scuro usa il nero del marchio.
- **Barra del periodo**:
  - si sceglie tra 7, 30 e 90 giorni o date a scelta, e si attiva l'interruttore "Confronta con il periodo precedente";
  - sui computer resta fissa in alto, su telefono scorre con la pagina per lasciare spazio ai numeri.
- **Notifiche** in basso a destra dopo ogni azione (dati aggiornati, token salvato, cliente aggiunto...), che spariscono da sole.
- **Scorciatoie da tastiera** (premi `?` per vederle):
  - `/` cerca;
  - `1` `2` `3` scelgono il periodo;
  - `C` attiva il confronto;
  - `R` aggiorna i dati;
  - `X` azzera i filtri.
- **Caricamento**: al posto della pagina vuota compaiono dei blocchi grigi con la forma della pagina che sta arrivando.
- **Animazioni brevi e con uno scopo**:
  - quando cambi periodo o filtro, i numeri fanno un piccolo scatto;
  - le barre si allungano e il grafico si ridisegna, così vedi che tutto si è ricalcolato;
  - se sul computer hai attivato "Riduci movimento", restano solo dissolvenze leggere.
- **Accessibilità**:
  - con il tasto Tab si vede sempre dove sei (contorno arancio);
  - c'è il collegamento "Salta al contenuto";
  - tutti i colori del testo sono abbastanza contrastati da leggersi bene.

### Panoramica agenzia
- **Pannello nero dei numeri chiave**: Lead, Opportunità, Vinte, Venduto, Tasso di chiusura, Da controllare. Sotto ogni numero c'è la variazione rispetto al periodo precedente, con freccia verde o rossa e il valore di prima.
- **Clienti a confronto**: barre orizzontali dei primi 12 clienti, per Venduto, Vinte o Lead. Cliccando un cliente si apre la sua pagina.
- **Tutti i clienti**: tabella ordinabile con ricerca, mini-grafico dei lead e interruttore "Solo da controllare".
- **Prima volta, senza clienti**: un pannello "Più clienti, più dati. Inizia dal primo." con i 3 passi da fare.

### Pagina di un cliente
- **Indice delle sezioni** fisso in alto (Numeri, Andamento, Provenienza, Pipeline, Vendite, Contatti): segna dove sei e ti porta alla sezione con un clic.
- **Filtri**:
  - in cima scegli la pipeline;
  - i filtri attivi compaiono come pillole che togli con la "x", oppure "Azzera" li toglie tutti;
  - se un filtro non trova niente, un avviso te lo dice.
- **Pannello nero dei numeri**: Lead, Da annunci Meta, Opportunità, Vinte, Venduto, Tasso di chiusura.
- **Andamento**: grafico del periodo attuale (linea arancio piena) confrontato con il precedente (linea tratteggiata). Puoi scegliere cosa mostrare e se raggruppare per giorni o settimane.
- **Da dove arrivano lead e vendite**:
  - le quattro classifiche di prima (Canali, Campagne, Fonti, Tag) sono ora un solo pannello a schede, con pagina più corta e meno riquadri uguali;
  - cliccando una voce filtri tutta la pagina.
- **Pipeline**: l'imbuto mostra in evidenza il dato reale "Oggi in questa fase". Le colonne calcolate sono indicate chiaramente come "stima".
- **Vendite e Contatti**: tabelle con ricerca, ordinamento, pagine ed esportazione in CSV; righe più alte, comode da toccare su tablet.
- **Errori**: se il token del cliente manca o è scaduto, la pagina dice "Serve un token valido" e ha un pulsante che porta dritto alle Impostazioni.

### Impostazioni
- **I tuoi clienti**: una scheda apribile per cliente, con l'etichetta dello stato del token (Token salvato, Token dal file .env, Manca il token). Le schede dei clienti senza token si aprono da sole.
- Dentro la scheda:
  - il token, che l'app verifica prima di salvarlo;
  - "Come si crea il token", con i 4 passi numerati;
  - i dati del cliente;
  - il pulsante "Rimuovi dall'app".
- **Conferme**: "Rimuovi token" e "Rimuovi dall'app" chiedono conferma in una finestra che spiega cosa succede. Svuotare la cache non chiede conferma, perché non si perde nulla.
- **Aggiungi un cliente**: dopo l'aggiunta si apre subito la scheda del nuovo cliente, con il cursore già nel campo del token.
- **Errori dei campi**: compaiono in rosso sotto il campo, con un piccolo scossone che li fa notare.

### Pagine di errore e "non trovato"
Al posto delle pagine tecniche ci sono una spiegazione semplice e dei pulsanti: Riprova, Vai alla panoramica, Apri Impostazioni.

## Decisioni principali prese in autonomia

Tutte sono annotate, con il motivo, in `DESIGN-LOG.md`. Le più importanti:

1. **Testo nero sui pulsanti arancio** (il sito usa il bianco): il bianco sull'arancio si legge male sui pulsanti piccoli (contrasto 2,5:1 contro 8,5:1 del nero).
2. **Grigio del testo secondario un po' più scuro** di quello del sito: quello originale era troppo chiaro per leggersi bene sui fondi grigi.
3. **Nessuna ombra sulle card**, come sul sito: le superfici si distinguono con il colore. Le ombre restano solo per ciò che galleggia (finestre e notifiche).
4. **Un solo carattere (Red Hat Display)**: la gerarchia nasce da peso e dimensione. Cifre tutte della stessa larghezza, così i numeri restano allineati.
5. **Colori di stato** (verde, ambra, rosso) scelti più scuri dell'arancio per non confondersi con il marchio, sempre con un'icona e una parola, mai solo il colore.
6. **Tema scuro** con il fondo nero del marchio e l'arancio pieno. Tema automatico come predefinito.
7. **Classifiche riunite in un pannello a schede** nella pagina cliente: si scorre meno e si vede meglio cosa filtra cosa.
8. **Animazioni nello stile "strumento di lavoro"**: brevi (0,15-0,3 secondi), senza rimbalzi né effetti decorativi continui.
9. **Nessuna libreria nuova**: notifiche, finestre e animazioni usano componenti già installati, come chiede la regola "poche dipendenze".
10. **Icone solo Lucide**, la libreria già presente: frecce e simboli di testo sostituiti con icone vere.
11. **DESIGN.md**: il manuale del design system, per disegnare le pagine future (Campagne Meta, Incrocio, Analisi AI, Login) nello stesso stile. Il nome guida, "Il cruscotto in nero e arancio", l'ho scelto io.

## Verifiche fatte (Fase 7)

- **Contrasto** (norma WCAG AA): 34 coppie di colori misurate, nel tema chiaro e in quello scuro. Tutte a norma.
- **Tastiera**: si raggiunge tutto con Tab, nell'ordine giusto, e il contorno di focus si vede sempre. Ho corretto un caso in cui sulla voce di menu attiva il contorno era nero su nero per un istante.
- **Dimensioni dello schermo**:
  - provate a 320px (equivale a uno zoom al 400%), 375, 768, 1024, 1366 e 1920px, senza nulla che esce dai bordi;
  - ho corretto due casi a 320px: le pillole del grafico e lo scheletro di caricamento delle Impostazioni.
- **Coerenza**: stessi colori, raggi, pulsanti e caratteri su tutte le pagine, nei due temi.
- **Prestazioni**: la pagina non "salta" mentre carica, il contenuto principale arriva in meno di un secondo e non ci sono animazioni che girano a vuoto.
- **Errori**: build di produzione riuscita, controllo dei tipi pulito, nessun errore nella console del browser, detector automatico di Impeccable con 0 problemi.

## Punti rimasti aperti

1. **Unire il redesign alla versione principale**: oggi è su un branch a parte. Quando ti va bene, dimmi "unisci il redesign" e lo porto su `main`.
2. **Provato con un solo cliente**: con molti clienti conviene dare un'occhiata alla Panoramica, soprattutto alla tabella e a "Clienti a confronto", che mostra i primi 12.
3. **Peso dei grafici**: la libreria dei grafici è la parte più pesante del codice (circa 113 KB compressi). Per uno strumento interno va bene. Se un giorno l'app sembrasse lenta su telefono, si può caricare solo quando serve.
4. **La "N" nera in basso a sinistra** che vedi mentre provi l'app è di Next.js: compare solo in sviluppo, non nella versione pubblicata.
5. **Pagine ancora da fare** (fasi del progetto, non del redesign): Campagne Meta, Incrocio, Analisi AI e la pagina di login. Andranno disegnate seguendo `DESIGN.md`.
6. **Fuori dal redesign, in sospeso da prima**:
   - confermare la mappatura dell'attribuzione (campagna, gruppo, annuncio) che ti avevo proposto;
   - il token Meta per la Fase 3 del progetto;
   - rendere privato il repository GitHub.

## Come tornare alla versione precedente

La versione di prima non è stata toccata: è sul branch `main`. Il redesign è sul branch `redesign-salesprocess`.

Per **rivedere la versione precedente**, chiudi l'app (Ctrl+C nel terminale) e scrivi:

```bash
git checkout main
```

poi riavvia con `npm run dev`.

Per **tornare al redesign**:

```bash
git checkout redesign-salesprocess
```

Se un giorno, dopo averlo unito a `main`, volessi annullarlo, chiedimelo: lo tolgo con un'operazione che non cancella la storia (si chiama "revert") e si può sempre rifare.

## Dove trovare i dettagli

- `BRAND.md`: colori, caratteri e tono ricavati da salesprocess.it.
- `AUDIT.md`: i problemi trovati all'inizio (voto 12/20) e cosa andava sistemato.
- `DESIGN-LOG.md`: ogni decisione presa, fase per fase, con il motivo.
- `DESIGN.md`: il manuale del design system per le pagine future.
- `PRODUCT.md`: il contesto del prodotto usato dalla skill Impeccable.
