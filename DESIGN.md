---
name: SalesProcess Insights
description: Cruscotto interno dell'agenzia per lead, pipeline e vendite, nel marchio SalesProcess
colors:
  brand-orange: "#ff8200"
  brand-orange-hover: "#ff952e"
  brand-ink: "#000000"
  focus-orange: "#c45f00"
  page-grey: "#f4f5f6"
  card-white: "#ffffff"
  track-grey: "#e9ebed"
  orange-tint: "#fff1e3"
  hairline: "#dde0e3"
  field-stroke: "#878f98"
  body-graphite: "#2b2f33"
  title-black: "#000000"
  secondary-slate: "#565e67"
  panel-black: "#000000"
  panel-black-raised: "#17181a"
  success-green: "#17733f"
  success-tint: "#e6f4ec"
  warning-amber: "#8f5300"
  warning-tint: "#fff2d9"
  danger-red: "#b42318"
  danger-tint: "#fdebea"
  chart-current: "#d96c00"
  chart-previous: "#f2a15a"
  dark-page: "#000000"
  dark-card: "#141517"
  dark-raised: "#3a3e44"
  dark-track: "#1e2023"
  dark-hairline: "#2a2d31"
  dark-body: "#e8eaed"
  dark-secondary: "#a2a9b1"
  dark-success: "#4ade80"
  dark-warning: "#fbbf24"
  dark-danger: "#f87171"
  dark-chart-previous: "#94500f"
typography:
  display:
    fontFamily: "Red Hat Display, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Red Hat Display, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Red Hat Display, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Red Hat Display, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "tnum"
  label:
    fontFamily: "Red Hat Display, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.35
  caption:
    fontFamily: "Red Hat Display, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.45
rounded:
  control: "9999px"
  panel: "22px"
  block: "14px"
  sm: "8px"
spacing:
  stack: "16px"
  panel: "24px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand-orange}"
    textColor: "{colors.brand-ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.brand-orange-hover}"
    textColor: "{colors.brand-ink}"
  button-inverse:
    backgroundColor: "{colors.panel-black}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.control}"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.title-black}"
    rounded: "{rounded.control}"
    height: "40px"
  button-destructive:
    backgroundColor: "{colors.danger-tint}"
    textColor: "{colors.danger-red}"
    rounded: "{rounded.control}"
    height: "40px"
  input:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.title-black}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.body-graphite}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  kpi-panel:
    backgroundColor: "{colors.panel-black}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  segmented-track:
    backgroundColor: "{colors.track-grey}"
    rounded: "{rounded.control}"
    padding: "4px"
  segmented-active:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.title-black}"
    rounded: "{rounded.control}"
    height: "32px"
  nav-item-active:
    backgroundColor: "{colors.brand-orange}"
    textColor: "{colors.brand-ink}"
    rounded: "{rounded.control}"
    height: "40px"
  badge-success:
    backgroundColor: "{colors.success-tint}"
    textColor: "{colors.success-green}"
    rounded: "{rounded.control}"
---

# Design System: SalesProcess Insights

<!-- Scritto alla fine del redesign (Fase 7) leggendo il codice consegnato: app/globals.css e components/ui. I token in alto sono la fonte normativa; il testo spiega dove e perché usarli. -->

## Overview

**Creative North Star: "Il cruscotto in nero e arancio"**

È uno strumento di lavoro, non una vetrina: il titolare apre l'app per sapere in pochi secondi quanti lead, opportunità e vendite ha portato ogni cliente, e cosa controllare. Il marchio SalesProcess entra nei dettagli precisi: il nero pieno del menu e del pannello dei numeri, l'arancio solo dove c'è un'azione o una selezione, un solo carattere (Red Hat Display) usato pesante per titoli e numeri. Tutto il resto è grigio freddo e silenzioso, così i numeri parlano.

La densità è media: card ampie (22px di raggio, 24px di margine interno) con dentro dati compatti e tabelle a righe da 44px. Le superfici sono piatte e si separano con il colore, non con le ombre, come sul sito salesprocess.it. Il movimento è breve e serve a mostrare cosa è cambiato, per esempio i numeri che si ricalcolano dopo un filtro. Non c'è movimento decorativo.

**Key Characteristics:**
- Nero pieno del marchio per menu e pannello dei numeri; grigio freddo chiaro per il fondo; card bianche.
- Arancio solo per l'azione principale, la voce di menu attiva, gli interruttori accesi e i dati del periodo attuale nei grafici.
- Un solo carattere, Red Hat Display: 900 per titoli e numeri, 800 per i titoli di sezione, 600 per le etichette. Cifre tabellari ovunque.
- Tutti i controlli a pillola; pannelli con raggio grande; nessuna ombra sulle superfici.
- Tema chiaro e scuro progettati insieme, ogni coppia di colori misurata con la formula WCAG.

## Colors

Una palette quasi monocroma (nero, grigi freddi, bianco) con un solo accento arancio e tre colori di stato più scuri e freddi dell'arancio.

### Primary
- **Arancio SalesProcess** (brand-orange): azione principale della schermata, voce di menu attiva, interruttori accesi, selezione del testo. Il testo sopra è sempre nero (brand-ink, 8,5:1): il bianco darebbe 2,5:1.
- **Arancio profondo di focus** (focus-orange): solo l'anello di focus da tastiera sulle superfici chiare (≥ 3,8:1). Sulle superfici nere l'anello usa l'arancio pieno.

### Neutral
- **Nero del pannello** (panel-black): menu laterale e pannello dei numeri chiave. Nel tema scuro il pannello diventa dark-card per staccarsi dal fondo nero.
- **Grigio pagina** (page-grey): fondo dell'app. **Bianco card** (card-white): pannelli e campi.
- **Grigio traccia** (track-grey): binario delle pillole, righe in evidenza, scheletri di caricamento.
- **Tinta arancio** (orange-tint): righe di tabella al passaggio del mouse e voci selezionate nelle classifiche.
- **Grafite** (body-graphite): testo corrente. **Nero titolo** (title-black): titoli e numeri. **Ardesia** (secondary-slate): testo secondario, ≥ 5,5:1 su tutti i fondi chiari.
- **Filo** (hairline): bordi delle card e divisori. **Bordo campo** (field-stroke): contorno di campi e pulsanti secondari, ≥ 3:1.

### Stati
- **Verde** (success-green su success-tint), **Ambra** (warning-amber su warning-tint), **Rosso** (danger-red su danger-tint): sempre accompagnati da un'icona e da una parola, mai solo dal colore. Sul pannello nero si usano le versioni chiare (dark-success, dark-danger).

### Grafici
- **Periodo attuale** (chart-current, linea piena) e **periodo precedente** (chart-previous, linea tratteggiata): coppia validata con lo script dataviz anche per chi non distingue i colori. Nel tema scuro: arancio pieno e dark-chart-previous.

### Named Rules
**La regola dell'unico arancio.** L'arancio pieno compare su una sola azione per schermata più gli stati di selezione. Se due pulsanti sono arancio, uno dei due è sbagliato.

**La regola del testo nero sull'arancio.** Sopra l'arancio il testo è sempre nero, in entrambi i temi.

## Typography

**Display Font:** Red Hat Display (con system-ui come riserva)
**Body Font:** Red Hat Display

**Character:** un solo carattere geometrico del marchio. La gerarchia nasce dal peso (900, 800, 600, 400) e dalla dimensione, non dal mescolare famiglie.

### Hierarchy
- **Display** (900, 36px, interlinea 1): solo i numeri del pannello nero.
- **Headline** (900, 28px su telefono e 34px da 1024px, interlinea 1,1): titolo della pagina, uno per schermata.
- **Title** (800, 18px, interlinea 1,3): titoli delle card e delle sezioni.
- **Body** (400, 15px, interlinea 1,55): testi e descrizioni, al massimo 65 caratteri per riga.
- **Label** (600, 13px): etichette dei numeri, intestazioni di tabella, titoletti dei moduli.
- **Caption** (500, 12px): fonte dei dati, date di aggiornamento, note.

### Named Rules
**La regola delle cifre allineate.** Tutta l'app usa cifre tabellari (`tnum`): i numeri nelle colonne e nei pannelli non ballano quando cambiano.

**La regola niente maiuscolo.** Etichette e titoli in minuscolo normale; nessun testo tutto maiuscolo con spaziatura larga.

## Layout

- Da 1024px in su: menu nero fisso a sinistra (264px) e area contenuto a destra; barra dei filtri fissa in alto. Contenuto e filtri centrati con larghezza massima 1536px.
- Sotto 1024px: barra nera in alto con il marchio e il pulsante "Menu", che apre un pannello laterale con le stesse voci. Su telefono la barra dei filtri scorre con la pagina.
- Margini: 16px su telefono, 32px da 1024px. Tra le sezioni 32px (spacing.section), dentro le card 24px (spacing.panel), tra elementi impilati 16px (spacing.stack). La scala di base è 4px.
- La pagina cliente ha un indice delle sezioni fisso sotto la barra dei filtri, che segna la sezione visibile.
- Verificato senza scorrimento orizzontale a 320, 375, 768, 1024, 1366 e 1920px. Le tabelle larghe scorrono dentro la loro card; le pillole troppo lunghe scorrono di lato nel loro binario.

## Elevation & Depth

Il sistema è piatto. Le superfici si separano col colore: fondo grigio, card bianche con un filo di bordo da 1px e pannello nero per i numeri. L'unica ombra è per ciò che galleggia sopra la pagina, cioè finestre modali, pannello laterale e notifiche.

### Shadow Vocabulary
- **Sospeso** (`box-shadow: 0 24px 48px -16px rgb(0 0 0 / 0.28), 0 4px 12px -4px rgb(0 0 0 / 0.12)`): solo modali, pannello laterale, notifiche.
- **Pillola attiva** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.08)`): il segmento scelto sopra il binario grigio e l'indicatore delle schede.
- **Pomello** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.25)`): il cerchio degli interruttori, per staccarlo dal binario.

### Named Rules
**La regola del piatto.** Una card non ha mai ombra. Se serve più gerarchia si usa il pannello nero o la tinta, non un'ombra.

## Shapes

Tre raggi con un ruolo preciso: pillola completa per ogni controllo (pulsanti, campi, menu a tendina, pillole, etichette, voci di menu), 22px per i pannelli (come le card del sito) e 14px per i blocchi interni ai pannelli. Il simbolo del marchio è fatto di quadrati a gradini.

## Components

### Buttons
- **Shape:** pillola (9999px); alti 40px, 44px sui dispositivi touch.
- **Primary:** arancio con testo nero 700; al passaggio del mouse un arancio più chiaro.
- **Inverse:** nero del marchio con testo bianco; variante pronta per un'azione forte che non sia la principale (oggi non usata nelle schermate).
- **Outline / Ghost:** bordo campo su bianco / solo testo; al passaggio il bordo diventa nero o compare il grigio traccia.
- **Destructive:** tinta rossa con testo rosso; al passaggio rosso pieno. Sempre dentro una conferma.
- **States:** premuto = leggero rimpicciolimento (97%); in corso = icona che gira, pulsante disattivato e `aria-busy`; disattivato = 45% di opacità.

### Chips (pillole di scelta e filtri attivi)
- **Style:** binario grigio traccia con segmenti a pillola alti 32px; il segmento scelto è bianco (nel tema scuro dark-raised) con testo nero.
- **State:** `aria-pressed` su ogni segmento. I filtri attivi sono pillole con la "x" per toglierli.

### Cards / Containers
- **Corner Style:** 22px.
- **Background:** bianco con filo da 1px; variante "muted" in grigio traccia per gli stati vuoti; variante nera per il pannello dei numeri.
- **Shadow Strategy:** nessuna (vedi Elevation & Depth).
- **Internal Padding:** 24px.

### Inputs / Fields
- **Style:** pillola alta 40px (44px al tocco), bordo campo su bianco, testo 16px su telefono (niente zoom automatico) e 14px da tablet.
- **Focus:** anello arancio profondo da 2px, staccato di 2px.
- **Error / Disabled:** bordo rosso e fondo rosato, messaggio in rosso sotto il campo (annunciato ai lettori di schermo) con una breve scossa; disattivato con fondo grigio.

### Navigation
- **Style:** colonna nera; voci a pillola alte 40px in bianco al 66%; voce attiva in arancio con testo nero; elenco clienti con filtro sopra gli 8 clienti; tema (automatico, chiaro, scuro) e firma "Fatturare. Fatturare. Fatturare." in fondo.
- **Mobile:** barra nera con pulsante "Menu" e pannello laterale da sinistra.

### Pannello dei numeri (componente firma)
Card nera con i numeri chiave in Display 900 bianco, etichetta sopra e variazione sotto (freccia, percentuale verde o rossa, valore precedente). Quando cambia un filtro i numeri fanno un breve scatto di 200ms per mostrare che si sono ricalcolati. Su telefono i valori lunghi passano alla forma compatta (es. 124,5K €).

### Movimento
Durate 150, 200 e 300ms (`--dur-fast/base/slow`), curva d'entrata `cubic-bezier(0.16, 1, 0.3, 1)` e d'uscita `cubic-bezier(0.7, 0, 0.84, 0)`, nessun rimbalzo. Le entrate salgono di 6px con dissolvenza; nelle liste c'è una scaletta di 30ms, al massimo 12 elementi. Con "Riduci movimento" restano solo dissolvenze brevi.

## Do's and Don'ts

### Do:
- **Do** usare solo i token di `app/globals.css` (classi come `bg-brand`, `rounded-panel`, `p-panel`, `text-section`), mai colori scritti a mano.
- **Do** mettere testo nero sopra l'arancio, in entrambi i temi.
- **Do** accompagnare ogni colore di stato con un'icona Lucide e una parola.
- **Do** dare a ogni nuova schermata il suo scheletro di caricamento con la forma reale, uno stato vuoto che dice cosa fare e un errore con la strada per risolverlo.
- **Do** misurare il contrasto di ogni nuova coppia di colori, sia nel tema chiaro sia in quello scuro.

### Don't:
- **Don't** usare ombre sulle card o gradienti decorativi.
- **Don't** usare un secondo carattere o un monospazio per le etichette dei dati.
- **Don't** usare emoji o frecce testuali come icone: solo Lucide.
- **Don't** usare il bianco sopra l'arancio, né l'arancio come colore del testo su fondo chiaro.
- **Don't** aggiungere animazioni continue o decorative: il movimento risponde a un'azione o mostra un ricalcolo.
