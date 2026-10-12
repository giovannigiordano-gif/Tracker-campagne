// Formattazione di numeri e date per l'interfaccia (in italiano).
// Gli orari sono mostrati nel fuso di Roma, anche se il server gira in UTC.

const numero = new Intl.NumberFormat("it-IT");
const decimale = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });
const ora = new Intl.DateTimeFormat("it-IT", {
  timeZone: "Europe/Rome", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
});
const dataOra = new Intl.DateTimeFormat("it-IT", {
  timeZone: "Europe/Rome", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});

export const formatNumero = (n: number) => numero.format(n);

const valute = new Map<string, Intl.NumberFormat>();
// Importi senza decimali (es. "€ 12.500"); con compatto=true "12,5 mila €" per gli spazi stretti
export function formatValuta(n: number, valuta = "EUR", compatto = false) {
  const chiave = `${valuta}-${compatto}`;
  let f = valute.get(chiave);
  if (!f) {
    try {
      f = new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: valuta,
        maximumFractionDigits: compatto ? 1 : 0,
        ...(compatto ? { notation: "compact" as const } : {}),
      });
    } catch {
      f = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });
    }
    valute.set(chiave, f);
  }
  return f.format(n);
}

// Giorno YYYY-MM-DD in formato breve: "12 ott"
const meseBreve = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "UTC" });
export const formatGiornoBreve = (g: string) => meseBreve.format(new Date(`${g}T12:00:00Z`)).replace(".", "");
export const formatDecimale = (n: number) => decimale.format(n);

export function formatPercentuale(n: number | null, conSegno = false) {
  if (n === null || !Number.isFinite(n)) return "n.d.";
  const testo = `${decimale.format(Math.abs(n))}%`;
  if (!conSegno) return testo;
  return n > 0 ? `+${testo}` : n < 0 ? `−${testo}` : testo;
}

export const formatAggiornato = (t: number) => ora.format(new Date(t)).replace(",", " alle");
export const formatDataOra = (t: Date | string | number) => dataOra.format(new Date(t)).replace(",", "");
