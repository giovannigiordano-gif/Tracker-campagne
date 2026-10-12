// Dashboard di un cliente: lead, opportunità, vendite, pipeline, con filtri interattivi.
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BoxErrore, CaricamentoPagina } from "@/components/bits";
import { ClientDashboard } from "@/components/dashboard/client-dashboard";
import { getAccount } from "@/lib/accounts";
import { caricaDashboardCliente } from "@/lib/data/cliente";
import { messaggioErrore } from "@/lib/data/panoramica";
import { leggiConfronto, leggiSelezione } from "@/lib/period";

type Props = PageProps<"/clienti/[locationId]">;

export default function ClientePage(props: Props) {
  return (
    <Suspense fallback={<CaricamentoPagina />}>
      <Cliente {...props} />
    </Suspense>
  );
}

async function Cliente({ params, searchParams }: Props) {
  const { locationId } = await params;
  const query = await searchParams;
  const account = await getAccount(locationId);
  if (!account) notFound();

  try {
    const dati = await caricaDashboardCliente(account, leggiSelezione(query));
    return <ClientDashboard dati={dati} confronto={leggiConfronto(query)} />;
  } catch (e) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-black tracking-tight">{account.name}</h1>
        <BoxErrore messaggio={messaggioErrore(e, account.name)} />
      </div>
    );
  }
}
