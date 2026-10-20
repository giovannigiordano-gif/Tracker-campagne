"use client";
// Moduli della pagina Impostazioni. Ogni salvataggio dà un riscontro (notifica o errore vicino al campo);
// le azioni distruttive chiedono conferma. I dati vengono salvati sul server dalle azioni in app/actions.ts.
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Copy, KeyRound, Link2Off, RefreshCw, Search, Trash2, UserMinus } from "lucide-react";
import {
  aggiungiCliente,
  modificaCliente,
  rimuoviCliente,
  rimuoviToken,
  salvaToken,
  scollegaConnettore,
  scollegaMetaMcp,
  svuotaCache,
  verificaMetaMcp,
  type EsitoAzione,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ConfermaAzione } from "@/components/ui/conferma";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useNotifica } from "@/components/ui/toast";
import type { Account } from "@/lib/accounts";
import type { AccountMeta } from "@/lib/meta-mcp/account";
import type { GhlLocation } from "@/lib/ghl/types";

function Invia({ children, variant, disabled }: { children: React.ReactNode; variant?: "default" | "outline"; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} loading={pending} disabled={disabled}>
      {children}
    </Button>
  );
}

// Successo → notifica; errore → messaggio vicino al campo (restituito al chiamante)
function useEsito(esito: EsitoAzione, titoloSuccesso: string) {
  const notifica = useNotifica();
  const ultimo = useRef<EsitoAzione>(null);
  useEffect(() => {
    if (!esito || esito === ultimo.current) return;
    ultimo.current = esito;
    // Il messaggio del server diventa descrizione solo se aggiunge qualcosa al titolo
    if (esito.ok) notifica("successo", titoloSuccesso, esito.messaggio !== titoloSuccesso ? esito.messaggio : undefined);
  }, [esito, notifica, titoloSuccesso]);
  return esito && !esito.ok ? esito.messaggio : null;
}

function ErroreCampo({ id, testo }: { id: string; testo: string | null }) {
  if (!testo) return null;
  return (
    <p key={testo} id={id} role="alert" className="text-sm font-medium text-danger motion-safe:animate-scuoti">
      {testo}
    </p>
  );
}

// ---------------------------------------------------------------- aggiungi cliente
export function AggiungiClienteForm({ disponibili }: { disponibili: GhlLocation[] }) {
  const [esito, azione] = useActionState(aggiungiCliente, null);
  const [cerca, setCerca] = useState("");
  const [scelto, setScelto] = useState("");
  const errore = useEsito(esito, "Cliente aggiunto");
  const filtrati = useMemo(
    () => disponibili.filter((l) => l.name.toLowerCase().includes(cerca.trim().toLowerCase())),
    [disponibili, cerca]
  );

  // Dopo l'aggiunta: apre la scheda del nuovo cliente e mette il cursore sul campo del token
  useEffect(() => {
    if (!esito?.ok || !scelto) return;
    let tentativi = 0;
    const id = setInterval(() => {
      const campo = document.getElementById(`token-${scelto}`) as HTMLInputElement | null;
      if (campo || ++tentativi > 20) {
        clearInterval(id);
        if (campo) {
          campo.closest("details")?.setAttribute("open", "");
          campo.scrollIntoView({ block: "center", behavior: "smooth" });
          campo.focus({ preventScroll: true });
        }
      }
    }, 100);
    return () => clearInterval(id);
  }, [esito, scelto]);

  return (
    <form action={azione} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="cerca-sub">Cerca tra i {disponibili.length} sub-account GHL</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="cerca-sub"
            placeholder="Scrivi una parte del nome"
            value={cerca}
            onChange={(e) => setCerca(e.target.value)}
            className="pl-10"
            data-scorciatoia="cerca"
            aria-keyshortcuts="/"
          />
        </div>
      </div>
      <select
        name="locationId"
        size={8}
        required
        value={scelto}
        onChange={(e) => setScelto(e.target.value)}
        aria-label="Sub-account da aggiungere"
        className="w-full rounded-block border border-input bg-card p-1.5 text-base text-titolo md:text-sm"
      >
        {filtrati.map((l) => (
          <option key={l.id} value={l.id} className="rounded-md px-2.5 py-1.5">
            {l.name}
          </option>
        ))}
      </select>
      <p className="text-caption text-muted-foreground" aria-live="polite">
        {filtrati.length === 0 ? "Nessun sub-account con questo nome." : `${filtrati.length} risultati. Selezionane uno e premi Aggiungi.`}
      </p>
      <ErroreCampo id="errore-aggiungi" testo={errore} />
      <div>
        <Invia disabled={!scelto}>Aggiungi cliente</Invia>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- token del sub-account
export function TokenForm({ locationId, haToken }: { locationId: string; haToken: boolean }) {
  const [esito, azione] = useActionState(salvaToken, null);
  const errore = useEsito(esito, "Token salvato");
  const idErrore = `errore-token-${locationId}`;
  return (
    <form action={azione} className="flex flex-col gap-2">
      <input type="hidden" name="locationId" value={locationId} />
      <Label htmlFor={`token-${locationId}`}>{haToken ? "Sostituisci il token" : "Incolla il token del sub-account"}</Label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={`token-${locationId}`}
          name="token"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="pit-..."
          required
          aria-invalid={!!errore || undefined}
          aria-describedby={errore ? idErrore : undefined}
          className="w-full sm:w-96"
        />
        <Invia>
          <KeyRound aria-hidden /> Verifica e salva
        </Invia>
      </div>
      <ErroreCampo id={idErrore} testo={errore} />
    </form>
  );
}

export function RimuoviTokenButton({ locationId, nome }: { locationId: string; nome: string }) {
  return (
    <ConfermaAzione
      etichetta="Rimuovi token"
      icona={<Trash2 aria-hidden />}
      variantePulsante="ghost"
      titolo={`Rimuovere il token di ${nome}?`}
      descrizione="Senza token l'app non può più leggere i dati di questo cliente finché non ne inserisci uno nuovo. Su GoHighLevel non cambia nulla."
      conferma="Rimuovi token"
      successo="Token rimosso"
      esegui={async () => {
        const fd = new FormData();
        fd.set("locationId", locationId);
        await rimuoviToken(fd);
      }}
    />
  );
}

// ---------------------------------------------------------------- dati del cliente
// Scelta degli account pubblicitari Meta del cliente (uno o più). Elenco dall'ultima verifica del collegamento Meta.
function AccountMetaCampo({
  cliente,
  disponibili,
  assegnati,
}: {
  cliente: Account;
  disponibili: AccountMeta[];
  assegnati: Record<string, string>; // account già scelti per altri clienti: id -> nome del cliente
}) {
  const scelti = new Set(cliente.metaAdAccountIds);
  // Account scelti in passato ma non più visibili su Meta: restano finché non li togli
  const nonVisibili = cliente.metaAdAccountIds.filter((id) => !disponibili.some((a) => a.id === id));
  const titoloId = `titolo-meta-${cliente.locationId}`;
  return (
    <fieldset className="flex flex-col gap-2 sm:col-span-2" aria-labelledby={titoloId}>
      <input type="hidden" name="metaAdAccountIdsPresenti" value="1" />
      <legend id={titoloId} className="text-sm font-semibold text-titolo">Account pubblicitari Meta</legend>
      {disponibili.length === 0 && nonVisibili.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Collega Meta Ads (riquadro a destra): qui potrai scegliere gli account pubblicitari di questo cliente.
        </p>
      ) : (
        <>
          <p className="text-caption text-muted-foreground">
            Scegli gli account dove girano le inserzioni del cliente: serviranno per spesa, costo per lead e incrocio con i lead di GHL.
          </p>
          <ul className="flex flex-col gap-1">
            {disponibili.map((a) => (
              <li key={a.id}>
                <label className="flex min-h-11 items-center gap-3 rounded-block px-3 py-2 transition-colors motion-fast hover:bg-muted">
                  <input type="checkbox" name="metaAdAccountIds" value={a.id} defaultChecked={scelti.has(a.id)} className="size-4 shrink-0" />
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold text-titolo">{a.nome}</span>
                    <span className="text-caption text-muted-foreground">
                      {a.azienda ? `${a.azienda}, ` : ""}
                      {a.id}
                      {assegnati[a.id] && `, già scelto per ${assegnati[a.id]}`}
                      {!a.interrogabile && `, non leggibile da Meta${a.motivo ? ` (${a.motivo})` : ""}`}
                    </span>
                  </span>
                </label>
              </li>
            ))}
            {nonVisibili.map((id) => (
              <li key={id}>
                <label className="flex min-h-11 items-center gap-3 rounded-block px-3 py-2 transition-colors motion-fast hover:bg-muted">
                  <input type="checkbox" name="metaAdAccountIds" value={id} defaultChecked className="size-4 shrink-0" />
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold text-titolo">{id}</span>
                    <span className="text-caption text-muted-foreground">Non più visibile nel collegamento Meta</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
    </fieldset>
  );
}

export function ClienteForm({
  cliente,
  accountMeta = [],
  assegnati = {},
}: {
  cliente: Account;
  accountMeta?: AccountMeta[];
  assegnati?: Record<string, string>;
}) {
  const [esito, azione] = useActionState(modificaCliente, null);
  const errore = useEsito(esito, "Modifiche salvate");
  const id = (campo: string) => `${campo}-${cliente.locationId}`;
  return (
    <form action={azione} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="locationId" value={cliente.locationId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor={id("name")}>Nome</Label>
        <Input id={id("name")} name="name" defaultValue={cliente.name} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id("timezone")}>Fuso orario</Label>
        <Input id={id("timezone")} name="timezone" defaultValue={cliente.timezone} placeholder="Europe/Rome" required aria-describedby={id("aiuto-fuso")} />
        <p id={id("aiuto-fuso")} className="text-caption text-muted-foreground">Serve a contare i giorni come li vede il cliente.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id("currency")}>Valuta</Label>
        <Input id={id("currency")} name="currency" defaultValue={cliente.currency} maxLength={3} required className="uppercase" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id("leadDropPct")}>Avvisami se i lead calano più del</Label>
        <div className="relative">
          <Input
            id={id("leadDropPct")}
            name="leadDropPct"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            defaultValue={cliente.thresholds.leadDropPct ?? ""}
            placeholder="30"
            className="pr-9"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id("maxCpl")}>Costo per lead obiettivo</Label>
        <div className="relative">
          <Input
            id={id("maxCpl")}
            name="maxCpl"
            inputMode="decimal"
            defaultValue={cliente.thresholds.maxCpl ?? ""}
            placeholder="es. 15"
            className="pr-14"
            aria-describedby={id("aiuto-cpl")}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{cliente.currency}</span>
        </div>
        <p id={id("aiuto-cpl")} className="text-caption text-muted-foreground">
          Sopra questo costo per lead reale (spesa Meta / lead in GHL) l&apos;app lo segnala tra le criticità.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor={id("notes")}>Note per l&apos;analisi AI</Label>
        <Textarea
          id={id("notes")}
          name="notes"
          defaultValue={cliente.notes}
          rows={3}
          placeholder="Settore, offerta, obiettivo delle campagne, CPL target"
        />
      </div>
      <AccountMetaCampo cliente={cliente} disponibili={accountMeta} assegnati={assegnati} />
      <label className="flex items-center gap-3 text-sm font-medium text-titolo sm:col-span-2">
        <Switch name="active" defaultChecked={cliente.active} />
        Mostra il cliente in Panoramica e nel menu
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Invia>Salva modifiche</Invia>
        <ErroreCampo id={id("errore")} testo={errore} />
      </div>
    </form>
  );
}

export function RimuoviClienteButton({ locationId, nome }: { locationId: string; nome: string }) {
  return (
    <ConfermaAzione
      etichetta="Rimuovi dall'app"
      icona={<UserMinus aria-hidden />}
      variantePulsante="destructive"
      titolo={`Rimuovere ${nome} dall'app?`}
      descrizione="Il cliente sparisce da Panoramica e menu e il suo token salvato viene cancellato. Su GoHighLevel non cambia nulla: puoi aggiungerlo di nuovo quando vuoi."
      conferma="Rimuovi cliente"
      successo={`${nome} rimosso dall'app`}
      esegui={async () => {
        const fd = new FormData();
        fd.set("locationId", locationId);
        await rimuoviCliente(fd);
      }}
    />
  );
}

// ---------------------------------------------------------------- cache
export function SvuotaCacheButton() {
  const [inCorso, setInCorso] = useState(false);
  const notifica = useNotifica();
  return (
    <Button
      variant="outline"
      loading={inCorso}
      className="self-start"
      onClick={async () => {
        setInCorso(true);
        try {
          await svuotaCache();
          notifica("successo", "Cache svuotata", "I prossimi numeri verranno riletti da GoHighLevel.");
        } catch {
          notifica("errore", "Non sono riuscito a svuotare la cache", "Riprova tra un momento.");
        } finally {
          setInCorso(false);
        }
      }}
    >
      Svuota la cache
    </Button>
  );
}

// ---------------------------------------------------------------- Meta Ads
export function VerificaMetaButton() {
  const [inCorso, setInCorso] = useState(false);
  const notifica = useNotifica();
  return (
    <Button
      variant="outline"
      size="sm"
      loading={inCorso}
      onClick={async () => {
        setInCorso(true);
        try {
          const esito = await verificaMetaMcp();
          if (esito?.ok) notifica("successo", "Meta Ads risponde", esito.messaggio);
          else notifica("errore", "Verifica non riuscita", esito?.messaggio);
        } catch {
          notifica("errore", "Verifica non riuscita", "Riprova tra un momento.");
        } finally {
          setInCorso(false);
        }
      }}
    >
      {!inCorso && <RefreshCw aria-hidden />}
      {inCorso ? "Verifica in corso" : "Verifica collegamento"}
    </Button>
  );
}

export function ScollegaMetaButton() {
  return (
    <ConfermaAzione
      etichetta="Scollega"
      icona={<Link2Off aria-hidden />}
      variantePulsante="ghost"
      titolo="Scollegare Meta Ads dall'app?"
      descrizione="L'app dimentica il collegamento e non potrà più leggere le campagne da Meta finché non lo ricolleghi. Su Meta non cambia nulla: se vuoi, puoi revocare l'accesso anche dalle impostazioni del tuo account Meta."
      conferma="Scollega"
      successo="Meta Ads scollegato"
      esegui={() => scollegaMetaMcp()}
    />
  );
}

// ---------------------------------------------------------------- connettore per Claude
export function CopiaIndirizzo({ indirizzo }: { indirizzo: string }) {
  const notifica = useNotifica();
  async function copia() {
    try {
      await navigator.clipboard.writeText(indirizzo);
      notifica("successo", "Indirizzo copiato", "Incollalo in Claude, nel nuovo connettore.");
    } catch {
      // Senza accesso agli appunti si seleziona il testo, da copiare a mano
      const campo = document.getElementById("indirizzo-connettore") as HTMLInputElement | null;
      campo?.select();
      notifica("info", "Copia l'indirizzo a mano", "È già selezionato: premi Ctrl+C.");
    }
  }
  return (
    <div className="flex gap-2">
      <Label htmlFor="indirizzo-connettore" className="sr-only">
        Indirizzo del connettore
      </Label>
      <Input id="indirizzo-connettore" readOnly value={indirizzo} onFocus={(e) => e.currentTarget.select()} className="font-mono text-sm" />
      <Button type="button" variant="outline" onClick={copia}>
        <Copy aria-hidden /> Copia
      </Button>
    </div>
  );
}

export function ScollegaClaudeButton() {
  return (
    <ConfermaAzione
      etichetta="Scollega Claude"
      icona={<Link2Off aria-hidden />}
      variantePulsante="ghost"
      titolo="Scollegare Claude dall'app?"
      descrizione="Claude non potrà più leggere i dati né salvare analisi finché non ricolleghi il connettore (in Claude: Connetti, poi la password dell'app). Le analisi già salvate restano."
      conferma="Scollega"
      successo="Claude scollegato"
      esegui={() => scollegaConnettore()}
    />
  );
}
