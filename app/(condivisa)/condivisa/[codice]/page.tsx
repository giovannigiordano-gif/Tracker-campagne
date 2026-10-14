// Dashboard di un cliente vista dal cliente stesso, tramite il link creato con "Condividi".
// Stessi dati e stessi calcoli della dashboard del titolare, ma senza "Aggiorna i dati" e "Condividi":
// il cliente legge la copia già in cache e non può far ricaricare i dati da GHL.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BoxErrore, ScheletroCliente } from "@/components/bits";
import { ClientDashboard } from "@/components/dashboard/client-dashboard";
import { FilterBar } from "@/components/shell/filter-bar";
import { getAccount } from "@/lib/accounts";
import { condivisioni } from "@/lib/condivisioni";
import { caricaDashboardCliente } from "@/lib/data/cliente";
import { leggiConfronto, leggiSelezione } from "@/lib/period";

type Props = PageProps<"/condivisa/[codice]">;

// Cliente del link, solo se il link è attivo e il cliente è ancora seguito
async function clienteCondiviso(codice: string) {
  const locationId = await condivisioni.clienteDaCodice(codice);
  if (!locationId) return null;
  const account = await getAccount(locationId);
  return account?.active ? account : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codice } = await params;
  const account = await clienteCondiviso(codice);
  return { title: account?.name ?? "Link non valido" };
}

export default function PaginaCondivisa(props: Props) {
  return (
    <Suspense fallback={<ScheletroCliente />}>
      <DashboardCondivisa {...props} />
    </Suspense>
  );
}

async function DashboardCondivisa({ params, searchParams }: Props) {
  const { codice } = await params;
  const query = await searchParams;
  const account = await clienteCondiviso(codice);
  if (!account) notFound();

  try {
    const dati = await caricaDashboardCliente(account, leggiSelezione(query));
    return (
      <div className="flex flex-col gap-6">
        <FilterBar condivisa />
        <ClientDashboard dati={dati} confronto={leggiConfronto(query)} modo="condivisa" />
      </div>
    );
  } catch {
    // Al cliente nessun dettaglio tecnico (token, GHL, Impostazioni)
    return (
      <div className="flex flex-col gap-section">
        <h1 className="text-title">{account.name}</h1>
        <BoxErrore titolo="Dati momentaneamente non disponibili" messaggio="Riprova tra qualche minuto." />
      </div>
    );
  }
}
