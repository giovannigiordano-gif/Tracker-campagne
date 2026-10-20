// Dashboard di un cliente: lead, opportunità, vendite, pipeline, con filtri interattivi.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { richiediAccessoPagina } from "@/lib/accesso";
import { BoxErrore, ScheletroCliente } from "@/components/bits";
import { ClientDashboard } from "@/components/dashboard/client-dashboard";
import { getAccount } from "@/lib/accounts";
import { leggiAnalisi } from "@/lib/analisi";
import { caricaDashboardCliente } from "@/lib/data/cliente";
import { messaggioErrore } from "@/lib/data/panoramica";
import { GhlError } from "@/lib/ghl/http";
import { leggiConfronto, leggiSelezione } from "@/lib/period";

type Props = PageProps<"/clienti/[locationId]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locationId } = await params;
  const account = await getAccount(locationId);
  return { title: account?.name ?? "Pagina non trovata" };
}

export default function ClientePage(props: Props) {
  return (
    <Suspense fallback={<ScheletroCliente />}>
      <Cliente {...props} />
    </Suspense>
  );
}

async function Cliente({ params, searchParams }: Props) {
  await richiediAccessoPagina(); // secondo controllo, oltre al proxy
  const { locationId } = await params;
  const query = await searchParams;
  const account = await getAccount(locationId);
  if (!account) notFound();

  try {
    // Le analisi salvate non devono bloccare la dashboard se l'archivio non risponde
    const [dati, analisi] = await Promise.all([
      caricaDashboardCliente(account, leggiSelezione(query)),
      leggiAnalisi(locationId).catch(() => []),
    ]);
    return <ClientDashboard dati={dati} confronto={leggiConfronto(query)} analisi={analisi} />;
  } catch (e) {
    const problemaToken = e instanceof GhlError && (e.tipo === "auth" || e.tipo === "token_mancante");
    return (
      <div className="flex flex-col gap-section">
        <h1 className="text-title">{account.name}</h1>
        <BoxErrore
          titolo={problemaToken ? "Serve un token valido" : "Dati non disponibili"}
          messaggio={messaggioErrore(e, account.name)}
          conImpostazioni={problemaToken}
        />
      </div>
    );
  }
}
