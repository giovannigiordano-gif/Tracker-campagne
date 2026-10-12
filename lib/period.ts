// Periodi di analisi (7, 30, 90 giorni o date personalizzate) e periodo precedente per il confronto.
// I giorni si contano nel fuso orario del cliente: "oggi" a Roma non è "oggi" a New York.

export type Selezione =
  | { tipo: "preset"; giorni: 7 | 30 | 90 }
  | { tipo: "custom"; da: string; a: string }; // giorni nel formato YYYY-MM-DD

export type Intervallo = {
  daGiorno: string; // primo giorno incluso (YYYY-MM-DD)
  aGiorno: string; // ultimo giorno incluso
  inizio: Date; // mezzanotte del primo giorno, nel fuso del cliente
  fine: Date; // ultimo istante dell'ultimo giorno, nel fuso del cliente
  giorni: string[];
};

export const FUSO_PREDEFINITO = "Europe/Rome";
const PRESET = [7, 30, 90] as const;
const GIORNO_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_GIORNI_CUSTOM = 366;

// ---------------------------------------------------------------- fusi orari
const formattatori = new Map<string, Intl.DateTimeFormat>();

function formattatore(tz: string) {
  let f = formattatori.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    });
    formattatori.set(tz, f);
  }
  return f;
}

export function fusoValido(tz: string | null | undefined): string {
  if (!tz) return FUSO_PREDEFINITO;
  try {
    formattatore(tz);
    return tz;
  } catch {
    return FUSO_PREDEFINITO;
  }
}

function partiInFuso(t: number, tz: string) {
  const p: Record<string, number> = {};
  for (const { type, value } of formattatore(tz).formatToParts(new Date(t))) {
    if (type !== "literal") p[type] = Number(value);
  }
  return p as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

// Giorno di calendario (YYYY-MM-DD) di un istante, nel fuso indicato
export function giornoInFuso(data: Date | string, tz: string): string {
  const p = partiInFuso(new Date(data).getTime(), tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

function scartoFuso(t: number, tz: string) {
  const p = partiInFuso(t, tz);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
}

// Mezzanotte di un giorno nel fuso indicato (gestisce anche i cambi di ora legale)
export function inizioGiorno(giorno: string, tz: string): Date {
  const [y, m, d] = giorno.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d);
  let t = utc - scartoFuso(utc, tz);
  const secondo = scartoFuso(t, tz);
  if (utc - secondo !== t) t = utc - secondo;
  return new Date(t);
}

export function aggiungiGiorni(giorno: string, n: number): string {
  const [y, m, d] = giorno.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function differenzaGiorni(da: string, a: string) {
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${da}T00:00:00Z`)) / 86_400_000);
}

function creaIntervallo(daGiorno: string, aGiorno: string, tz: string): Intervallo {
  const n = differenzaGiorni(daGiorno, aGiorno) + 1;
  return {
    daGiorno,
    aGiorno,
    inizio: inizioGiorno(daGiorno, tz),
    // ultimo millisecondo prima della mezzanotte del giorno dopo
    fine: new Date(inizioGiorno(aggiungiGiorni(aGiorno, 1), tz).getTime() - 1),
    giorni: Array.from({ length: n }, (_, i) => aggiungiGiorni(daGiorno, i)),
  };
}

// ---------------------------------------------------------------- lettura dall'URL
type ParametriUrl = Record<string, string | string[] | undefined>;

const primo = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Legge ?periodo=7|30|90 oppure ?periodo=custom&da=YYYY-MM-DD&a=YYYY-MM-DD (predefinito: 30 giorni)
export function leggiSelezione(params: ParametriUrl): Selezione {
  const periodo = primo(params.periodo);
  if (periodo === "custom") {
    const da = primo(params.da) ?? "";
    const a = primo(params.a) ?? "";
    if (GIORNO_RE.test(da) && GIORNO_RE.test(a) && da <= a && differenzaGiorni(da, a) < MAX_GIORNI_CUSTOM) {
      return { tipo: "custom", da, a };
    }
  }
  const n = Number(periodo);
  if ((PRESET as readonly number[]).includes(n)) return { tipo: "preset", giorni: n as 7 | 30 | 90 };
  return { tipo: "preset", giorni: 30 };
}

// ?confronto=0 nasconde il confronto con il periodo precedente (predefinito: attivo)
export function leggiConfronto(params: ParametriUrl): boolean {
  return primo(params.confronto) !== "0";
}

// Parametri da aggiungere ai link per mantenere periodo e confronto scelti
export function queryPeriodo(sel: Selezione, confronto = true): string {
  const base = sel.tipo === "preset" ? `periodo=${sel.giorni}` : `periodo=custom&da=${sel.da}&a=${sel.a}`;
  return confronto ? base : `${base}&confronto=0`;
}

// Parametri dell'indirizzo che fanno parte dei filtri globali
export const PARAMETRI_GLOBALI = ["periodo", "da", "a", "confronto"] as const;

// ---------------------------------------------------------------- periodo corrente e precedente
export function risolviPeriodo(sel: Selezione, tz: string, adesso = new Date()) {
  const fuso = fusoValido(tz);
  const oggi = giornoInFuso(adesso, fuso);
  let daGiorno: string;
  let aGiorno: string;
  if (sel.tipo === "preset") {
    aGiorno = oggi;
    daGiorno = aggiungiGiorni(oggi, -(sel.giorni - 1));
  } else {
    aGiorno = sel.a > oggi ? oggi : sel.a;
    daGiorno = sel.da > aGiorno ? aGiorno : sel.da;
  }
  const n = differenzaGiorni(daGiorno, aGiorno) + 1;
  const corrente = creaIntervallo(daGiorno, aGiorno, fuso);
  const precedente = creaIntervallo(aggiungiGiorni(daGiorno, -n), aggiungiGiorni(daGiorno, -1), fuso);
  return { corrente, precedente, giorni: n, fuso, includeOggi: aGiorno === oggi };
}

// ---------------------------------------------------------------- formattazione
export function formatGiorno(giorno: string) {
  const [y, m, d] = giorno.split("-");
  return `${d}/${m}/${y}`;
}

export function formatIntervallo(i: Pick<Intervallo, "daGiorno" | "aGiorno">) {
  return i.daGiorno === i.aGiorno ? formatGiorno(i.daGiorno) : `${formatGiorno(i.daGiorno)} - ${formatGiorno(i.aGiorno)}`;
}

export function etichettaSelezione(sel: Selezione) {
  return sel.tipo === "preset" ? `Ultimi ${sel.giorni} giorni` : `Dal ${formatGiorno(sel.da)} al ${formatGiorno(sel.a)}`;
}
