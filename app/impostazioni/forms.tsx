"use client";
// Moduli della pagina Impostazioni (girano nel browser, i dati vengono salvati sul server dalle azioni)
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  aggiungiCliente,
  modificaCliente,
  rimuoviCliente,
  rimuoviToken,
  salvaToken,
  svuotaCache,
  type EsitoAzione,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Account } from "@/lib/accounts";
import type { GhlLocation } from "@/lib/ghl/types";
import { cn } from "@/lib/utils";

function Invia({ children, variant }: { children: React.ReactNode; variant?: "default" | "outline" | "destructive" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending}>
      {pending ? "Attendere…" : children}
    </Button>
  );
}

function Esito({ esito }: { esito: EsitoAzione }) {
  if (!esito) return null;
  return (
    <p role="status" className={cn("text-sm", esito.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
      {esito.messaggio}
    </p>
  );
}

const selectClass = "h-9 w-full rounded-lg border border-input bg-background px-2 text-sm";

// ---------------------------------------------------------------- aggiungi cliente
export function AggiungiClienteForm({ disponibili }: { disponibili: GhlLocation[] }) {
  const [esito, azione] = useActionState(aggiungiCliente, null);
  const [cerca, setCerca] = useState("");
  const filtrati = useMemo(
    () => disponibili.filter((l) => l.name.toLowerCase().includes(cerca.toLowerCase())),
    [disponibili, cerca],
  );

  return (
    <form action={azione} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cerca-sub">Cerca tra i {disponibili.length} sub-account GHL non ancora aggiunti</Label>
        <Input id="cerca-sub" placeholder="Scrivi una parte del nome…" value={cerca} onChange={(e) => setCerca(e.target.value)} />
      </div>
      <select name="locationId" size={8} required className={cn(selectClass, "h-auto py-1")} aria-label="Sub-account da aggiungere">
        {filtrati.map((l) => (
          <option key={l.id} value={l.id} className="rounded px-1 py-0.5">
            {l.name}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-3">
        <Invia>Aggiungi cliente</Invia>
        <Esito esito={esito} />
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- token del sub-account
export function TokenForm({ locationId, haToken }: { locationId: string; haToken: boolean }) {
  const [esito, azione] = useActionState(salvaToken, null);
  return (
    <form action={azione} className="flex flex-col gap-2">
      <input type="hidden" name="locationId" value={locationId} />
      <Label htmlFor={`token-${locationId}`}>{haToken ? "Sostituisci il token" : "Incolla il token Private Integration del sub-account"}</Label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={`token-${locationId}`}
          name="token"
          type="password"
          autoComplete="off"
          placeholder="pit-…"
          required
          className="w-full sm:w-96"
        />
        <Invia>Verifica e salva</Invia>
      </div>
      <Esito esito={esito} />
    </form>
  );
}

export function RimuoviTokenForm({ locationId }: { locationId: string }) {
  return (
    <form
      action={rimuoviToken}
      onSubmit={(e) => { if (!confirm("Rimuovere il token salvato? I dati di questo cliente non saranno più leggibili finché non ne inserisci uno nuovo.")) e.preventDefault(); }}
    >
      <input type="hidden" name="locationId" value={locationId} />
      <Invia variant="outline">Rimuovi token</Invia>
    </form>
  );
}

// ---------------------------------------------------------------- dati del cliente
export function ClienteForm({ cliente }: { cliente: Account }) {
  const [esito, azione] = useActionState(modificaCliente, null);
  const id = (campo: string) => `${campo}-${cliente.locationId}`;
  return (
    <form action={azione} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="locationId" value={cliente.locationId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("name")}>Nome</Label>
        <Input id={id("name")} name="name" defaultValue={cliente.name} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("timezone")}>Fuso orario (per contare i giorni)</Label>
        <Input id={id("timezone")} name="timezone" defaultValue={cliente.timezone} placeholder="Europe/Rome" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("currency")}>Valuta</Label>
        <Input id={id("currency")} name="currency" defaultValue={cliente.currency} maxLength={3} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("leadDropPct")}>Avvisami se i lead calano più del (%)</Label>
        <Input
          id={id("leadDropPct")}
          name="leadDropPct"
          type="number"
          min={1}
          max={100}
          defaultValue={cliente.thresholds.leadDropPct ?? ""}
          placeholder="30 (predefinito)"
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={id("notes")}>Note di contesto per l&apos;analisi AI</Label>
        <Textarea
          id={id("notes")}
          name="notes"
          defaultValue={cliente.notes}
          rows={3}
          placeholder="Settore, offerta, obiettivo delle campagne, CPL target…"
        />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="active" defaultChecked={cliente.active} className="size-4" />
        Attivo (mostra in Panoramica)
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Invia>Salva modifiche</Invia>
        <Esito esito={esito} />
      </div>
    </form>
  );
}

export function RimuoviClienteForm({ locationId, nome }: { locationId: string; nome: string }) {
  return (
    <form
      action={rimuoviCliente}
      onSubmit={(e) => { if (!confirm(`Togliere ${nome} dai clienti monitorati? Verrà cancellato anche il suo token salvato. Su GHL non cambia nulla.`)) e.preventDefault(); }}
    >
      <input type="hidden" name="locationId" value={locationId} />
      <Invia variant="destructive">Togli dai clienti monitorati</Invia>
    </form>
  );
}

// ---------------------------------------------------------------- cache
export function SvuotaCacheForm() {
  return (
    <form action={svuotaCache}>
      <Invia variant="outline">Svuota tutta la cache</Invia>
    </form>
  );
}
