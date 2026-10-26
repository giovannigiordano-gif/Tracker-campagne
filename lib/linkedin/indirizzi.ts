// Indirizzo a cui LinkedIn rimanda dopo il consenso: va registrato tra gli "Authorized redirect URLs" dell'app
// LinkedIn (scheda Auth). Si ricava dalle intestazioni come gli altri indirizzi pubblici dell'app (APP_URL lo forza).
import { indirizzoBase } from "../connettore/indirizzi";

export const ritornoLinkedIn = (h: Headers) => `${indirizzoBase(h)}/api/linkedin/ritorno`;

export const COOKIE_STATO = "sp_linkedin_stato";

// Dove torna il titolare dopo LinkedIn, con l'esito da mostrare in Impostazioni
export function paginaImpostazioniLinkedIn(h: Headers, esito: "collegato" | "annullato" | "errore") {
  return new URL(`/impostazioni?linkedin=${esito}#linkedin-ads`, indirizzoBase(h));
}
