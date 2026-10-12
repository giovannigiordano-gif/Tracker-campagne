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
export const formatDecimale = (n: number) => decimale.format(n);

export function formatPercentuale(n: number | null, conSegno = false) {
  if (n === null || !Number.isFinite(n)) return "—";
  const testo = `${decimale.format(Math.abs(n))}%`;
  if (!conSegno) return testo;
  return n > 0 ? `+${testo}` : n < 0 ? `−${testo}` : testo;
}

export const formatAggiornato = (t: number) => ora.format(new Date(t)).replace(",", " alle");
export const formatDataOra = (t: Date | string | number) => dataOra.format(new Date(t)).replace(",", "");
