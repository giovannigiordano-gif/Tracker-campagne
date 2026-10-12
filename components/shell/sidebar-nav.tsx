"use client";
// Menu laterale (nero): Panoramica, elenco clienti, Impostazioni.
// I link mantengono periodo e confronto scelti nella barra dei filtri.
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { PARAMETRI_GLOBALI } from "@/lib/period";

function useQueryGlobale() {
  const params = useSearchParams();
  const q = new URLSearchParams();
  for (const k of PARAMETRI_GLOBALI) {
    const v = params.get(k);
    if (v) q.set(k, v);
  }
  const s = q.toString();
  return (href: string) => (s ? `${href}?${s}` : href);
}

const voce = (attiva: boolean) =>
  cn(
    "flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
    attiva ? "bg-brand text-brand-ink" : "text-white/75 hover:bg-white/10 hover:text-white",
  );

export function SidebarNav({ clienti }: { clienti: { id: string; nome: string }[] }) {
  const pathname = usePathname();
  const conQuery = useQueryGlobale();

  return (
    <nav className="flex flex-1 items-center gap-1 lg:flex-col lg:items-stretch lg:gap-0.5" aria-label="Menu principale">
      <Link href={conQuery("/")} className={voce(pathname === "/")}>
        <LayoutDashboard className="size-4" /> Panoramica
      </Link>

      {clienti.length > 0 && (
        <div className="hidden lg:mt-6 lg:mb-6 lg:block">
          <p className="mb-2 px-3.5 text-xs font-semibold text-white/45">Clienti</p>
          <ul className="flex flex-col gap-0.5">
            {clienti.map((c) => {
              const href = `/clienti/${c.id}`;
              return (
                <li key={c.id}>
                  <Link href={conQuery(href)} className={cn(voce(pathname.startsWith(href)), "block truncate font-medium")} title={c.nome}>
                    {c.nome}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Link href={conQuery("/impostazioni")} className={cn(voce(pathname.startsWith("/impostazioni")), "ml-auto lg:ml-0")}>
        <Settings className="size-4" /> Impostazioni
      </Link>
    </nav>
  );
}
