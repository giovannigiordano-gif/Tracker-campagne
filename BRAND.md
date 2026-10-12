# Brand SalesProcess — estratto da salesprocess.it

Analisi del sito pubblico fatta il 12/10/2026 (home, sezioni "4 reparti", testimonianze, metodo, contatti, footer). Dove il sito non dice nulla (colori di stato, modalità scura, icone di interfaccia) le scelte sono dedotte in modo coerente e segnate *(dedotto)*.

## Palette

| Ruolo | Colore | Dove si vede sul sito |
|---|---|---|
| Primario | **Arancio SalesProcess `#FF8200`** | sfondi di sezione, card, pulsanti, simbolo del logo, tagline |
| Nero | **`#000000`** (nero pieno, non grigio scuro) | hero, card video, sfondi delle fotografie, testo dei titoli |
| Bianco | `#FFFFFF` | sfondo delle pagine, titoli sopra l'arancio o il nero |
| Testo corrente | `#333333` | paragrafi |
| Grigio secondario | `#69727D` | testi di servizio, icone social |
| Grigio chiaro | `#EDEDED` (90%) | testi su fondo scuro, separatori |
| Sfumatura arancio | `#FF8200` → `#FFB066` → bianco caldo | fondi delle sezioni "reparti" e "testimonianze" |

**Colori di stato** *(dedotto, il sito non ne usa)*: verde per esito positivo, ambra per attenzione, rosso per errore. Sono scelti più freddi e scuri dell'arancio, così non si confondono con il colore del marchio:
- successo `#1F8A4C`
- attenzione `#B26B00`
- errore `#C62828`
- informazione: si usa il nero o il grigio, mai un blu (estraneo al marchio)

**Modalità scura** *(dedotto)*: il sito è già per metà nero (hero, card video, foto su fondo nero). La modalità scura dell'app usa il nero del marchio come fondo, superfici grigio antracite leggermente più chiare e l'arancio pieno come accento.

## Caratteri e gerarchia tipografica

- **Red Hat Display** (Google Fonts): il carattere del marchio, per titoli e testi.
  - Titoli principali: peso **900**, molto grandi (95px nella hero, 70px per il secondo livello), interlinea stretta, nessun maiuscolo forzato.
  - Sottotitoli: peso 500, 22px.
  - Pulsanti: peso **800**, maiuscolo nel sito (es. "CANDIDA LA TUA AZIENDA").
- Montserrat 700 maiuscolo solo per i titoletti del footer (LINK UTILI, CONTATTI, SOCIAL); Nunito e Roboto compaiono da plugin di WordPress: **non** fanno parte dell'identità.
- Testo corrente del sito: carattere di sistema 16px / 24px.

Per l'app: un solo carattere, Red Hat Display, con pesi 400-500 per il testo, 700 per le etichette forti, 800 per i pulsanti e 900 per numeri e titoli.

## Logo

- Simbolo: quadrati arancio pieni disposti a gradini (una "scala" pixelata che sale), senza contorni né sfumature.
- Scritta: "salesprocess" tutta minuscola, Red Hat Display bold, bianca su fondo scuro.
- Tagline sotto la scritta: "FATTURARE. FATTURARE. FATTURARE." in arancio, maiuscolo spaziato, piccola.
- Il logo vive su fondi neri o fotografici scuri.
- Nel progetto non c'è il file ufficiale: il simbolo è ridisegnato in SVG in `components/brand.tsx` (sostituibile con il file ufficiale messo in `public/`).

## Forme, spazi, materia

- **Raggi**: 22px per card e pannelli (il valore più usato), 12px per elementi interni, pulsanti a pillola (raggio pieno), cerchi per le icone social.
- **Ombre**: nessuna. Il sito è piatto: separa con il colore (arancio, nero, bianco), non con ombre.
- **Spazio bianco**: sezioni molto ariose con titoli enormi; card arancio piene con testo nero o bianco.
- **Fotografie**: iperrealistiche, mani che tengono oggetti arancio (contratto, penna, tocco di laurea) su fondo nero; illustrazioni 3D di oggetti arancio (megafono). Nessuna foto di stock generica.
- **Icone**: poche, semplici, a tinta piena (social in cerchi). Per l'app: un'unica libreria lineare e sobria (Lucide), mai emoji.
- **Animazioni sul sito**: entrate in dissolvenza delle sezioni, testo "Un unico obiettivo comune" che si rivela, caroselli. Movimento presente ma non invadente.

## Tono di voce

- Diretto, energico, orientato al risultato, in seconda persona ("la tua Azienda", "Hai un progetto?").
- Frasi brevi e affermazioni nette: "Più clienti. Più fatturato.", "Risultati concreti, non promesse.", "Fatturare. Fatturare. Fatturare."
- Parla di numeri e risultati misurabili ("+250% di fatturato in meno di 6 mesi", "metodo 4 in 1").
- Concreto e informale quando serve ("Vieni a prendere un caffè con noi!").
- Maiuscole iniziali enfatiche (Clienti, Fatturato, Marketing) nel sito: nell'app **no**, si usa l'italiano corretto in minuscolo per leggibilità.

**Nell'app**: stesso spirito, ma da strumento di lavoro. Etichette brevi e chiare, verbi d'azione ("Aggiorna i dati", "Salva il token", "Aggiungi cliente"), messaggi che dicono cosa è successo e cosa fare, niente slogan dentro le schermate operative. La tagline del marchio resta come firma nel menu.
