---
name: SalesProcess Insights
description: Cruscotto interno dell'agenzia per lead, pipeline e vendite, con l'aspetto di un'app Apple per Mac e iPad e il marchio SalesProcess
colors:
  brand-orange: "#ff8200"
  brand-orange-hover: "#ff952e"
  brand-ink: "#000000"
  brand-icon: "#d96c00"
  focus-orange: "#c45f00"
  page-grey: "#f5f5f7"
  card-white: "#ffffff"
  raised-white: "#ffffff"
  track-grey: "#e8e8ed"
  track-grey-hover: "#dcdce1"
  orange-tint: "#fff1e3"
  hairline: "#e5e5ea"
  field-stroke: "#86868b"
  body-ink: "#1d1d1f"
  title-black: "#000000"
  secondary-grey: "#636366"
  sidebar-grey: "#ececf0"
  sidebar-hairline: "#d9d9de"
  sidebar-hover: "rgb(0 0 0 / 0.05)"
  widget-black: "#000000"
  widget-raised: "#1c1c1e"
  widget-white: "#ffffff"
  widget-muted: "rgb(255 255 255 / 0.66)"
  widget-hairline: "rgb(255 255 255 / 0.14)"
  success-green: "#17733f"
  success-tint: "#e6f4ec"
  warning-amber: "#8f5300"
  warning-tint: "#fff2d9"
  danger-red: "#b42318"
  danger-tint: "#fdebea"
  on-widget-success: "#4ade80"
  on-widget-danger: "#f87171"
  chart-current: "#d96c00"
  chart-previous: "#f2a15a"
  chart-rest: "#8e8e93"
  chart-grid: "#ececf0"
  dark-page: "#000000"
  dark-card: "#1c1c1e"
  dark-raised: "#5a5a5e"
  dark-track: "#2c2c2e"
  dark-track-hover: "#3a3a3c"
  dark-orange-tint: "#2b1a08"
  dark-hairline: "#38383a"
  dark-field-stroke: "#8e8e93"
  dark-body: "#f5f5f7"
  dark-title: "#ffffff"
  dark-secondary: "#98989d"
  dark-sidebar: "#161618"
  dark-sidebar-hairline: "#2a2a2c"
  dark-widget: "#2c2c2e"
  dark-widget-raised: "#3a3a3c"
  dark-success: "#4ade80"
  dark-success-tint: "#0f2a1a"
  dark-warning: "#fbbf24"
  dark-warning-tint: "#2a2108"
  dark-danger: "#f87171"
  dark-danger-tint: "#2d1213"
  dark-chart-previous: "#94500f"
  dark-chart-rest: "#6e6e73"
typography:
  display:
    fontFamily: "Red Hat Display, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Red Hat Display, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  headline-wide:
    fontFamily: "Red Hat Display, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Red Hat Display, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  number:
    fontFamily: "Red Hat Display, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  body:
    fontFamily: "Red Hat Text, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  control:
    fontFamily: "Red Hat Text, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
  label:
    fontFamily: "Red Hat Text, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.35
  caption:
    fontFamily: "Red Hat Text, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.45
rounded:
  control: "9999px"
  panel: "22px"
  panel-squircle: "30px"
  block: "14px"
  block-squircle: "18px"
  xl: "18px"
  md: "12px"
  sm: "8px"
spacing:
  stack: "16px"
  panel: "24px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand-orange}"
    textColor: "{colors.brand-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.brand-orange-hover}"
    textColor: "{colors.brand-ink}"
  button-secondary:
    backgroundColor: "{colors.track-grey}"
    textColor: "{colors.title-black}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.track-grey-hover}"
    textColor: "{colors.title-black}"
  button-ghost:
    textColor: "{colors.body-ink}"
    rounded: "{rounded.control}"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.track-grey}"
    textColor: "{colors.title-black}"
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
    textColor: "{colors.body-ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  card-muted:
    backgroundColor: "{colors.track-grey}"
    textColor: "{colors.body-ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  numbers-widget:
    backgroundColor: "{colors.widget-black}"
    textColor: "{colors.widget-white}"
    typography: "{typography.display}"
    rounded: "{rounded.panel}"
    padding: "28px 32px"
  logo-tile:
    backgroundColor: "{colors.widget-black}"
    rounded: "{rounded.block}"
    padding: "0 14px"
    height: "56px"
  segmented-track:
    backgroundColor: "{colors.track-grey}"
    rounded: "{rounded.control}"
    padding: "4px"
  segmented-thumb:
    backgroundColor: "{colors.raised-white}"
    textColor: "{colors.title-black}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    height: "32px"
  sidebar:
    backgroundColor: "{colors.sidebar-grey}"
    textColor: "{colors.body-ink}"
    width: "264px"
    padding: "16px 12px"
  nav-item:
    textColor: "{colors.body-ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  nav-item-hover:
    backgroundColor: "{colors.sidebar-hover}"
  nav-item-active:
    backgroundColor: "{colors.brand-orange}"
    textColor: "{colors.brand-ink}"
    rounded: "{rounded.control}"
    height: "36px"
  toolbar:
    height: "64px"
    padding: "12px 32px"
  switch-on:
    backgroundColor: "{colors.brand-orange}"
    rounded: "{rounded.control}"
    width: "48px"
    height: "28px"
  badge-success:
    backgroundColor: "{colors.success-tint}"
    textColor: "{colors.success-green}"
    typography: "{typography.caption}"
    rounded: "{rounded.control}"
    height: "24px"
  table-row:
    textColor: "{colors.body-ink}"
    height: "44px"
    padding: "0 12px"
---

# Design System: SalesProcess Insights

<!-- Riscritto il 2026-10-20 dopo il redesign "app Apple", leggendo il codice consegnato (app/globals.css, components/ui, components/shell, components/dashboard). Sostituisce per intero il sistema precedente (menu nero, card piatte, solo Red Hat Display 900). I token in alto sono la fonte normativa; il testo spiega dove e perché usarli. -->

## Overview

**Creative North Star: "L'app nativa col marchio SalesProcess"**

SalesProcess Insights ha l'aspetto di un'app Apple per Mac e iPad, vestita col marchio: barra laterale grigio chiaro, barra degli strumenti che diventa vetro quando la pagina scorre, titolo grande che si ritira nella barra, schede bianche sospese sul grigio Apple con ombre morbide e angoli continui. Il titolare la deve riconoscere come un'app che usa già ogni giorno: controlli a segmenti, interruttori, liste e finestre si comportano come su Mac e iPhone.

Il marchio entra in tre punti precisi. L'arancio è il colore d'accento di sistema, come il blu sulle app Apple: voce attiva, icone della barra laterale, interruttori, azione principale, grafici. Sopra l'arancio il testo è sempre nero. Il nero pieno vive solo in due oggetti: il widget dei numeri chiave e la tessera col logo ufficiale. La gerarchia tipografica imita SF Display e SF Text: Red Hat Display 800 per titoli grandi e numeri, Red Hat Text per tutto il resto.

La densità è quella di uno strumento di lavoro: schede ampie (24px di margine interno) con dati compatti, tabelle a righe da 44px, movimento breve (150–320ms) che mostra cosa è cambiato. Il sistema rifiuta il cruscotto di prima, con menu nero e card piatte bordate.

**Key Characteristics:**
- Fondo grigio Apple, schede bianche sospese con ombra morbida a più livelli; nel tema scuro fondo nero e schede grafite con un filo di luce.
- Angoli continui (squircle) dove il browser li supporta; controlli tutti a capsula.
- Arancio come colore d'accento di sistema, sempre con testo nero sopra.
- Nero pieno solo nel widget dei numeri e nella tessera del logo.
- Red Hat Display 800 per titoli e numeri, Red Hat Text per testi e controlli; cifre tabellari ovunque.
- Vetro (saturazione e sfocatura) solo sulle barre sotto cui scorre del contenuto.
- Tema chiaro e scuro progettati insieme, ogni coppia di colori misurata.

## Colors

Neutri del mondo Apple (grigi leggermente freddi, bianco, quasi nero), un solo accento arancio e il nero del marchio usato con parsimonia.

### Primary
- **Arancio SalesProcess** (brand-orange): azione principale della schermata, voce attiva della barra laterale, interruttori accesi, selezione del testo, colore dei controlli nativi (`accent-color`). Il testo sopra è sempre brand-ink (nero, 8,45:1); il bianco darebbe circa 2,5:1. Al passaggio del mouse brand-orange-hover.
- **Arancio per icone** (brand-icon): le icone della barra laterale e del pulsante Menu su fondo chiaro, sempre accanto a una parola che le spiega. Nel tema scuro le icone usano l'arancio pieno.
- **Arancio profondo di focus** (focus-orange): l'anello di focus da tastiera e il cursore di testo su fondo chiaro (4,2:1 sul bianco). Nel tema scuro e sulle superfici nere l'anello è l'arancio pieno.
- **Tinta arancio** (orange-tint): righe di tabella al passaggio del mouse e voci selezionate nelle classifiche.

### Neutral
- **Grigio pagina** (page-grey): fondo dell'app e delle barre in vetro. **Bianco scheda** (card-white): schede, finestre, campi. **Bianco rialzato** (raised-white): la pillola scelta sopra un binario.
- **Grigio binario** (track-grey): binario dei controlli a segmenti e delle schede, pulsanti secondari, scheletri di caricamento, scheda "muted" degli stati vuoti; al passaggio track-grey-hover.
- **Grigio barra laterale** (sidebar-grey) con il suo filo a destra (sidebar-hairline); al passaggio sulle voci sidebar-hover.
- **Quasi nero** (body-ink): testo corrente. **Nero titolo** (title-black): titoli, numeri, testo dei controlli scelti. **Grigio secondario** (secondary-grey): testo secondario, intestazioni di tabella, fonti; ≥ 4,9:1 su bianco, fondo, binari e barra laterale.
- **Filo** (hairline): separatori, contorno delle tabelle, filo sotto la barra in vetro. **Bordo campo** (field-stroke): contorno dei campi di testo (3,6:1 sul bianco) e binario degli interruttori spenti (al 50%).

### Il nero del marchio
- **Nero widget** (widget-black) con widget-raised per gli scheletri, testo widget-white, etichette widget-muted (≥ 8:1) e fili widget-hairline. Nel tema scuro il widget diventa grafite (dark-widget) per staccarsi dal fondo nero.
- Sul nero le variazioni usano on-widget-success e on-widget-danger.

### Stati
- **Verde** (success-green su success-tint), **Ambra** (warning-amber su warning-tint), **Rosso** (danger-red su danger-tint): testo ≥ 4,5:1 anche sulla propria tinta, sempre insieme a un'icona Lucide e a una parola.

### Grafici
- **Periodo attuale** (chart-current, linea piena e barre) e **periodo precedente** (chart-previous, tratteggiato), verificati col validatore dataviz sulla scheda bianca. **Resto** (chart-rest) per "tutto il resto" accanto all'arancio (≥ 3:1). **Griglia** (chart-grid) solo orizzontale. Nel tema scuro: arancio pieno, dark-chart-previous, dark-chart-rest.

### Tema scuro
Come le app Apple al buio: dark-page nero, schede dark-card, binari dark-track, testo dark-body e dark-title, secondario dark-secondary (≥ 4,85:1 su dark-card e dark-track). La pillola scelta è dark-raised. Le ombre diventano un filo di luce (vedi Elevation & Depth).

### Named Rules
**La regola del testo nero sull'arancio.** Sopra l'arancio il testo e le icone sono sempre neri, in entrambi i temi.

**La regola dell'accento di sistema.** L'arancio pieno marca ciò che è attivo o principale: una sola azione principale per schermata, più gli stati di selezione (voce attiva, interruttore acceso). Se due pulsanti sono arancio, uno dei due è sbagliato.

**La regola dei due neri.** Il nero pieno come superficie esiste in due oggetti soli: il widget dei numeri e la tessera del logo. Menu, barre, schede di benvenuto e finestre non sono mai nere.

**La regola dei soli token.** Nei componenti si usano solo i token di `app/globals.css` (classi come `bg-brand`, `bg-muted`, `text-muted-foreground`, `rounded-panel`, `shadow-card`), mai colori scritti a mano.

## Typography

**Display Font:** Red Hat Display (con system-ui come riserva)
**Body Font:** Red Hat Text (con system-ui come riserva)

**Character:** la stessa divisione di SF Display e SF Text nelle app Apple: il Display, pesante e stretto nella spaziatura, per titoli grandi e numeri; il Text, più aperto, per leggere e per i controlli. Entrambi sono caratteri del marchio SalesProcess.

### Hierarchy
- **Display** (800, 36px, interlinea 1, −0,03em, cifre tabellari): solo i numeri del widget nero.
- **Headline** (800, 30px su telefono e tablet, 34px da 1024px, interlinea 1,08, a capo bilanciato): il titolo grande della pagina, uno per schermata (`text-title`).
- **Title** (700, 19px, interlinea 1,25): titoli delle schede, delle sezioni e delle finestre (`text-section`).
- **Number** (800, 22px): i numeri dentro le schede, più piccoli del widget (`text-numero`).
- **Body** (400, 15px, interlinea 1,5): testi e descrizioni, al massimo 65 caratteri per riga nelle descrizioni delle schede.
- **Control** (600, 14px): pulsanti, segmenti, schede, voci attive. Le voci di menu a riposo sono a 500.
- **Label** (600, 13px): etichette dei numeri, intestazioni di tabella, titoletti di gruppo.
- **Caption** (500, 12px): fonte dei dati, data di aggiornamento, titoletto "Clienti" della barra laterale.

Il titolo compatto che compare nella barra quando quello grande è scorso via è in Red Hat Text 600 a 15px, come i titoli delle barre di iOS.

### Named Rules
**La regola delle cifre allineate.** Tutta l'app usa cifre tabellari (`tnum`): i numeri nelle colonne e nel widget non ballano quando cambiano.

**La regola delle due famiglie.** Display solo per titoli (h1, h2, h3) e numeri; Text per tutto il resto. Niente terzo carattere, niente monospazio per i dati.

**La regola niente maiuscolo.** Etichette e titoli in minuscolo normale; nessun testo tutto maiuscolo con spaziatura larga, nessun occhiello sopra i titoli.

## Layout

- **Da 1024px:** griglia a due colonne. A sinistra la barra laterale fissa da 264px (altezza dello schermo), a destra il contenuto. In cima al contenuto la barra degli strumenti alta 64px, fissa, con i filtri (periodo a segmenti a sinistra, titolo compatto al centro, confronto e scorciatoie a destra). Contenuto e barra centrati con larghezza massima 1536px.
- **Sotto 1024px:** la barra laterale diventa una barra in vetro fissa in alto (56px) con la tessera compatta del logo a sinistra e il pulsante "Menu" a destra, che apre lo stesso menu in un pannello laterale. I filtri scorrono con la pagina.
- **Margini:** 16px su telefono, 32px da 1024px. Tra le sezioni 32px (spacing.section), dentro le schede 24px (spacing.panel), tra elementi impilati 16px (spacing.stack). Scala di base 4px.
- **Pagina:** titolo grande e azioni a destra, poi il widget nero dei numeri a tutta larghezza, poi la griglia delle schede. Nella pagina cliente un indice delle sezioni a segmenti si aggancia sotto la barra degli strumenti.
- **Pagina condivisa:** nessuna barra laterale; tessera compatta del logo in alto a sinistra, stessi margini e larghezza massima.
- Le tabelle larghe scorrono dentro il loro contenitore; i binari dei segmenti troppo lunghi scorrono di lato senza barra visibile.

## Elevation & Depth

Profondità alla maniera Apple: le schede galleggiano sul grigio con un'ombra morbida a più livelli (un filo quasi invisibile più due ombre diffuse); i controlli scelti si sollevano appena sopra il loro binario; finestre e notifiche sospese hanno un'ombra ampia. Le barre usano il vetro, non l'ombra: trasparenti in cima, vetro (grigio pagina al 72%, saturazione 180%, sfocatura 20px) con un filo sotto appena la pagina scorre. Nel tema scuro le ombre delle schede diventano un filo di luce bianca al 6%.

### Shadow Vocabulary
- **Scheda** (`box-shadow: 0 0 0 0.5px rgb(0 0 0 / 0.05), 0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -10px rgb(0 0 0 / 0.1)`; scuro `0 0 0 1px rgb(255 255 255 / 0.06)`): tutte le schede bianche.
- **Sollevata** (`box-shadow: 0 0 0 0.5px rgb(0 0 0 / 0.04), 0 1px 3px rgb(0 0 0 / 0.12)`; scuro `0 1px 3px rgb(0 0 0 / 0.5)`): pillola dei segmenti, indicatore delle schede, tessera del logo.
- **Sospesa** (`box-shadow: 0 0 0 0.5px rgb(0 0 0 / 0.06), 0 24px 56px -16px rgb(0 0 0 / 0.28), 0 6px 16px -6px rgb(0 0 0 / 0.12)`; scuro con filo di luce all'8%): finestre modali, pannello laterale, notifiche, etichette HUD dei grafici.
- **Alone del campo** (`box-shadow: 0 0 0 4px` arancio al 28%): campo di testo con il focus, come su macOS.

### Named Rules
**La regola del vetro col contenuto.** Il vetro compare solo su una barra sotto cui scorre del contenuto. In cima alla pagina la barra è trasparente e senza filo.

**La regola dell'ombra morbida.** Le ombre sono diffuse e a più livelli, mai dure, mai spostate di lato, mai colorate. Il widget nero non ha ombra: si stacca col colore.

## Shapes

Angoli ampi e continui come le icone e le schede Apple. Tre raggi con un ruolo:
- **Capsula** (control) per ogni controllo: pulsanti, campi, segmenti, schede, voci di menu, etichette, interruttori.
- **Pannello** (panel, 22px; 30px dove il browser supporta `corner-shape: squircle`, perché lo squircle sembra meno arrotondato a parità di raggio) per schede, widget dei numeri e finestre.
- **Blocco** (block, 14px; 18px con squircle) per i blocchi interni alle schede: tabelle, griglie di numeri, avvisi, tessera del logo, notifiche.

Le etichette HUD dei grafici usano 12px (md). Le iniziali dei clienti nella barra laterale sono quadratini da 20px con angoli di 6px. Il simbolo del marchio sono cinque quadrati a zig-zag sempre più piccoli verso il basso (misure in `components/brand.tsx`).

## Components

### Buttons
Netti e silenziosi, come i pulsanti di macOS.
- **Shape:** capsula; alti 40px (36px piccoli, 48px grandi), 44px sui dispositivi touch.
- **Primary:** arancio con testo nero, Red Hat Text 600 a 14px, 16px di margine laterale; al passaggio l'arancio più chiaro.
- **Secondary:** grigio binario pieno con testo nero (come i pulsanti "bordered" di Apple); al passaggio grigio più scuro.
- **Ghost:** solo testo; al passaggio compare il grigio binario.
- **Destructive:** tinta rossa con testo rosso; al passaggio rosso pieno. Sempre dentro una conferma.
- **States:** premuto = rimpicciolimento al 97%; in corso = icona che gira, pulsante disattivato e `aria-busy`; disattivato = 45% di opacità; focus = anello globale da 2px staccato di 2px.

### Controlli a segmenti e schede (componente firma)
- **Style:** binario grigio a capsula con 4px di margine; segmenti alti 32px (40px al tocco) in Red Hat Text 600; una sola pillola bianca rialzata che **scorre e si allarga** sotto la scelta attiva (`components/ui/pillola.tsx`), invece di accendere e spegnere i pulsanti. Prima della misura la scelta attiva mostra il proprio fondo, senza salti.
- **State:** scelta attiva in nero titolo, le altre in grigio secondario che diventa nero al passaggio; `aria-pressed` su ogni segmento. Stesso disegno per periodo, ordinamento, indice delle sezioni, tema e schede.

### Interruttori
Proporzioni di iOS: binario 48×28px, pomello bianco da 24px sempre bianco con ombra leggera; binario arancio quando acceso, grigio bordo-campo al 50% quando spento.

### Cards / Containers
- **Corner Style:** pannello (22px, 30px con squircle).
- **Background:** bianco; variante "muted" in grigio binario per gli stati vuoti.
- **Shadow Strategy:** ombra Scheda (vedi Elevation & Depth); niente bordo.
- **Internal Padding:** 24px; titolo in Title 700 da 19px con descrizione in grigio secondario sotto, azioni a destra.
- **Dentro una scheda:** niente schede annidate. I gruppi di numeri stanno in una griglia divisa da fili da 1px (blocco con angoli da 14px), ogni cella con etichetta Caption, fonte del dato e numero in Number 800.

### Widget dei numeri
Scheda nera (grafite nel tema scuro) a tutta larghezza in cima alla pagina, da 2 a 6 colonne. Per ogni numero: etichetta Label in bianco al 66%, valore in Display 800 bianco, sotto la variazione (freccia Lucide e percentuale in verde o rosso chiari) e il valore precedente. Quando cambia un filtro i numeri fanno un breve scatto (220ms) per mostrare il ricalcolo. Su telefono i valori lunghi passano alla forma compatta.

### Inputs / Fields
- **Style:** capsula alta 40px (44px al tocco), bordo campo da 1px su bianco, 16px di margine; testo 16px su telefono (niente zoom su iOS) e 14px da tablet.
- **Focus:** bordo arancio profondo e alone arancio morbido da 4px attorno al campo, come su macOS.
- **Error / Disabled:** bordo rosso e fondo rosato, messaggio rosso sotto il campo con una breve scossa (320ms); disattivato con fondo grigio binario e opacità 60%.

### Navigation
- **Barra laterale (da 1024px):** colonna grigio chiaro da 264px con filo a destra. In alto la tessera nera del logo (56px, angoli da blocco), poi "Panoramica", il titoletto "Clienti (n)" in Caption grigio, l'elenco dei clienti (con campo "Cerca" sopra gli 8 clienti), in fondo sopra un filo Impostazioni, tema ed Esci.
- **Voci:** capsula alta 36px, Red Hat Text 500 a 14px, icona Lucide da 17px in arancio-icona; al passaggio un velo nero al 5%; voce attiva arancio pieno con testo e icona neri, 600. Ogni cliente ha la sua iniziale in un quadratino grigio (velo nero sulla voce attiva).
- **Mobile e tablet:** barra in vetro con tessera compatta del logo e pulsante "Menu"; il menu si apre come pannello laterale da sinistra sul grigio della barra laterale.

### Barra degli strumenti e titolo che si ritira (componente firma)
La barra degli strumenti è trasparente in cima alla pagina e diventa vetro con un filo sotto appena il contenuto ci scorre sotto. Il titolo grande della pagina, quando esce dalla vista, ricompare piccolo nella barra (Red Hat Text 600, 15px) entrando con una dissolvenza e una salita di 4px: da 1024px nello spazio tra i controlli, centrato; su telefono al centro della barra, mentre la tessera del logo si dissolve e si rimpicciolisce al 94% per lasciargli il posto. Il titolo compatto è nascosto ai lettori di schermo perché ripete l'h1.

### Tabelle
Come le liste del Mac: contenitore con angoli da blocco e filo da 1px, intestazioni in Label grigio su bianco con un filo sotto, righe da 44px alternate col grigio pagina, tinta arancio al passaggio. Le colonne numeriche sono allineate a destra; l'ordinamento si indica con frecce Lucide. Ricerca, export CSV e pagine sopra e sotto la tabella.

### Finestre
Finestre modali bianche (larghe fino a 448px) con angoli da pannello e ombra Sospesa, sopra un velo nero al 35% con sfocatura leggera; entrano con dissolvenza e ingrandimento dal 96%. Chiusura con Esc o con la X in alto a destra. Il pannello laterale scorre da sinistra.

### Etichette di stato
Capsule alte 24px in Caption 600: grigio binario con testo nero, oppure tinte di stato col proprio colore. Il testo dice sempre lo stato.

### Movimento
Durate 150, 220 e 320ms (`--dur-fast/base/slow`); curva d'uscita smorzata come i fogli di iOS (`cubic-bezier(0.32, 0.72, 0, 1)`), nessun rimbalzo. Le entrate salgono di 8px con dissolvenza; nelle liste c'è una scaletta di 30ms, al massimo 12 elementi. Con "Riduci movimento" restano solo dissolvenze brevi (80–120ms). Il cambio di tema sfuma i colori solo nel momento del cambio.

## Do's and Don'ts

### Do:
- **Do** usare solo i token di `app/globals.css` (es. `bg-brand`, `bg-muted`, `bg-card shadow-card`, `rounded-panel`, `p-panel`, `text-section`), mai colori scritti a mano.
- **Do** mettere testo e icone neri sopra l'arancio, in entrambi i temi.
- **Do** dare a ogni nuova scelta tra poche opzioni il controllo a segmenti con la pillola che scorre.
- **Do** usare il vetro solo su barre fisse sotto cui scorre del contenuto, trasparenti finché la pagina è in cima.
- **Do** accompagnare ogni colore di stato con un'icona Lucide e una parola.
- **Do** dare a ogni nuova schermata il suo scheletro di caricamento con la forma reale, uno stato vuoto che dice cosa fare e un errore con la strada per risolverlo.
- **Do** misurare il contrasto di ogni nuova coppia di colori, sia nel tema chiaro sia in quello scuro.

### Don't:
- **Don't** usare il nero pieno come superficie fuori dal widget dei numeri e dalla tessera del logo: niente menu, barre o schede nere.
- **Don't** usare il bianco sopra l'arancio, né l'arancio come colore del testo su fondo chiaro.
- **Don't** usare ombre dure, spostate di lato o colorate, né gradienti decorativi.
- **Don't** mettere schede dentro le schede: dentro una scheda si divide con fili e blocchi.
- **Don't** usare un terzo carattere, un monospazio per i dati o testo tutto maiuscolo con spaziatura larga.
- **Don't** mettere occhielli o didascalie sopra il titolo della pagina.
- **Don't** usare emoji o frecce testuali come icone: solo Lucide.
- **Don't** aggiungere animazioni continue o decorative: il movimento risponde a un'azione o mostra un ricalcolo.
