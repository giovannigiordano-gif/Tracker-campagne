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
