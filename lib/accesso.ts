// Controllo dell'accesso del titolare lato server (pagine e azioni).
// Il proxy (proxy.ts) blocca già le pagine senza accesso; qui c'è il secondo controllo, dentro le pagine e
// dentro ogni azione: le azioni del server si possono chiamare da qualsiasi indirizzo, anche da /condivisa/…
//
// Configurazione (file .env in locale, pannello di Vercel online):
// - APP_PASSWORD: la password del titolare. In locale, se manca, l'app resta aperta come prima.
//   Online (produzione) è obbligatoria: senza, l'app non si apre.
// - SESSION_SECRET: almeno 32 caratteri casuali, firma il cookie di accesso.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { NOME_COOKIE, sessioneValida } from "./sessione";

export type ConfigAccesso =
  | { stato: "libero" } // in locale senza password: accesso libero
  | { stato: "pronto"; password: string; segreto: string }
  | { stato: "da-configurare"; errore: string }; // online senza password o segreto: tutto bloccato

export function configAccesso(): ConfigAccesso {
  const password = process.env.APP_PASSWORD?.trim() ?? "";
  const segreto = process.env.SESSION_SECRET?.trim() ?? "";
  if (!password) {
    return process.env.NODE_ENV === "production"
      ? { stato: "da-configurare", errore: "Manca APP_PASSWORD: impostala tra le variabili d'ambiente." }
      : { stato: "libero" };
  }
  if (segreto.length < 32) return { stato: "da-configurare", errore: "Manca SESSION_SECRET (servono almeno 32 caratteri casuali)." };
  return { stato: "pronto", password, segreto };
}

export async function haAccesso(): Promise<boolean> {
  await connection(); // controllo fatto a ogni richiesta (usa l'ora corrente per la scadenza), mai in anticipo
  const config = configAccesso();
  if (config.stato === "libero") return true;
  if (config.stato === "da-configurare") return false;
  const valore = (await cookies()).get(NOME_COOKIE)?.value;
  return sessioneValida(valore, config.segreto, config.password);
}

// Per le azioni del server: senza accesso l'azione non parte
export async function richiediAccesso() {
  if (!(await haAccesso())) throw new Error("Accesso scaduto: entra di nuovo con la password.");
}

// Per le pagine dell'agenzia: senza accesso si va alla pagina di accesso
export async function richiediAccessoPagina() {
  if (!(await haAccesso())) redirect("/accesso");
}
