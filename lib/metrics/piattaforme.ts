// Le piattaforme pubblicitarie gestite dall'app (Meta e LinkedIn): nome, canale corrispondente in GHL, sezione della
// dashboard e regola per abbinare i lead del CRM alle campagne. Puro: lo usano server, browser e connettore Claude.
import type { Canale } from "../ghl/types";
import type { DatiMeta } from "../meta/normalize";
import { UNITA_CAMPAGNA, UNITA_GRUPPO_ANNUNCI, type Unita } from "./criticita";
import { perIdCampagna, risolutoreCampagne, type OpzioniIncrocio } from "./meta";

export type IdPiattaforma = "meta" | "linkedin";

// Testi della tabella per riga: su LinkedIn ogni riga è un "gruppo di annunci" di Campaign Manager
// (l'API lo chiama ancora "campaign"), su Meta una campagna
type Tabella = { colonna: string; titolo: string; cerca: string; vuoto: string };

export type Piattaforma = {
  id: IdPiattaforma;
  nome: string; // per le etichette ("Spesa", fonte "Meta + GHL"...)
  canale: Canale; // canale dei lead in GHL
  titolo: string; // titolo della sezione nella dashboard
  impostazioni: string; // dove si collega e si associa l'account
  giorniUtc: boolean; // LinkedIn conta i giorni in UTC, Meta nel fuso dell'account pubblicitario
  perNome: boolean; // abbinamento lead → campagna anche dal nome in utm_campaign (LinkedIn)
  unita: Unita; // come si chiamano le righe nei testi delle criticità
  tabella: Tabella;
};

export const PIATTAFORME: Record<IdPiattaforma, Piattaforma> = {
  meta: {
    id: "meta",
    nome: "Meta",
    canale: "Meta Ads",
    titolo: "Campagne Meta",
    impostazioni: "/impostazioni#meta-ads",
    giorniUtc: false,
    perNome: false,
    unita: UNITA_CAMPAGNA,
    tabella: {
      colonna: "Campagna",
      titolo: "Campagne del periodo",
      cerca: "Cerca una campagna…",
      vuoto: "Nessuna campagna con spesa o lead nel periodo.",
    },
  },
  linkedin: {
    id: "linkedin",
    nome: "LinkedIn",
    canale: "LinkedIn Ads",
    titolo: "Campagne LinkedIn",
    impostazioni: "/impostazioni#linkedin-ads",
    giorniUtc: true,
    perNome: true,
    unita: UNITA_GRUPPO_ANNUNCI,
    tabella: {
      colonna: "Gruppo di annunci",
      titolo: "Gruppi di annunci del periodo",
      cerca: "Cerca un gruppo di annunci…",
      vuoto: "Nessun gruppo di annunci con spesa o lead nel periodo.",
    },
  },
};

// Opzioni per incrocio e criticità di una piattaforma (canale, abbinamento lead → campagna, nome delle righe)
export function opzioniIncrocio(p: Piattaforma, dati: Pick<DatiMeta, "campagne">): Required<OpzioniIncrocio> & { unita: Unita } {
  return { canale: p.canale, campagnaDi: p.perNome ? risolutoreCampagne(dati) : perIdCampagna, unita: p.unita };
}
