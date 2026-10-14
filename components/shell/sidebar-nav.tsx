"use client";
// Menu dell'app (nero del marchio).
// Da tablet orizzontale in su: colonna fissa a sinistra. Su telefono e tablet verticale: barra in alto
// con il pulsante "Menu" che apre lo stesso menu in un pannello laterale.
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, Search, Settings } from "lucide-react";
import { esci } from "@/app/actions";
import { Marchio } from "@/components/brand";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PARAMETRI_GLOBALI } from "@/lib/period";
import { ThemeToggle } from "./theme-toggle";

type Cliente = { id: string; nome: string };

// Mantiene periodo e confronto scelti quando si cambia pagina
function useConQuery() {
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
    "flex min-h-10 items-center gap-2.5 rounded-control px-3.5 text-sm font-semibold transition-colors motion-fast pointer-coarse:min-h-11",
    attiva ? "bg-brand text-brand-ink" : "text-inverse-muted hover:bg-inverse-raised hover:text-inverse-foreground"
  );

const SOGLIA_RICERCA = 8; // con molti clienti compare il campo per filtrarli

function ContenutoMenu({ clienti, conAccesso, onNaviga }: { clienti: Cliente[]; conAccesso: boolean; onNaviga?: () => void }) {
  const pathname = usePathname();
  const conQuery = useConQuery();
  const [filtro, setFiltro] = useState("");
  const visibili = useMemo(
    () => clienti.filter((c) => c.nome.toLowerCase().includes(filtro.trim().toLowerCase())),
    [clienti, filtro]
  );

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-6" aria-label="Menu principale">
      <Link href={conQuery("/")} onClick={onNaviga} aria-current={pathname === "/" ? "page" : undefined} className={voce(pathname === "/")}>
        <LayoutDashboard className="size-4" aria-hidden /> Panoramica
      </Link>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <p className="px-3.5 text-caption text-inverse-muted">Clienti ({clienti.length})</p>
        {clienti.length > SOGLIA_RICERCA && (
          <label className="relative mx-1 block">
            <span className="sr-only">Filtra i clienti</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-inverse-muted" aria-hidden />
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Filtra clienti"
              className="h-9 w-full rounded-control border border-inverse-border bg-transparent pl-9 pr-3 text-sm text-inverse-foreground placeholder:text-inverse-muted"
            />
          </label>
        )}
        {clienti.length === 0 ? (
          <p className="px-3.5 text-sm text-inverse-muted">
            Nessun cliente ancora.{" "}
            <Link href={conQuery("/impostazioni")} onClick={onNaviga} className="font-semibold text-brand underline">
              Aggiungine uno
            </Link>
          </p>
        ) : (
          <ul className="flex min-h-0 flex-col gap-0.5 overflow-y-auto pr-1">
            {visibili.map((c) => {
              const href = `/clienti/${c.id}`;
              const attiva = pathname.startsWith(href);
              return (
                <li key={c.id}>
                  <Link
                    href={conQuery(href)}
                    onClick={onNaviga}
                    aria-current={attiva ? "page" : undefined}
                    className={cn(voce(attiva), "block truncate py-2.5 font-medium leading-tight")}
                    title={c.nome}
                  >
                    {c.nome}
                  </Link>
                </li>
              );
            })}
            {visibili.length === 0 && <li className="px-3.5 text-sm text-inverse-muted">Nessun cliente con questo nome</li>}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-inverse-border pt-4">
        <Link
          href={conQuery("/impostazioni")}
          onClick={onNaviga}
          aria-current={pathname.startsWith("/impostazioni") ? "page" : undefined}
          className={voce(pathname.startsWith("/impostazioni"))}
        >
          <Settings className="size-4" aria-hidden /> Impostazioni
        </Link>
        <div className="flex items-center justify-between gap-3 px-1">
          <ThemeToggle />
          {conAccesso && (
            <form action={esci}>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-control px-3 text-sm font-semibold text-inverse-muted transition-colors motion-fast hover:bg-inverse-raised hover:text-inverse-foreground"
              >
                <LogOut className="size-4" aria-hidden /> Esci
              </button>
            </form>
          )}
        </div>
      </div>
    </nav>
  );
}

export function SidebarNav({ clienti, conAccesso = false }: { clienti: Cliente[]; conAccesso?: boolean }) {
  const [aperto, setAperto] = useState(false);
  return (
    <>
      {/* Colonna fissa (schermi larghi) */}
      <div className="hidden min-h-0 flex-1 flex-col lg:flex">
        <ContenutoMenu clienti={clienti} conAccesso={conAccesso} />
      </div>

      {/* Pulsante e pannello laterale (schermi stretti) */}
      <button
        type="button"
        onClick={() => setAperto(true)}
        aria-label="Apri il menu"
        className="ml-auto inline-flex h-11 items-center gap-2 rounded-control px-4 text-sm font-semibold text-inverse-foreground transition-colors motion-fast hover:bg-inverse-raised lg:hidden"
      >
        <Menu className="size-5" aria-hidden /> Menu
      </button>
      <Dialog open={aperto} onOpenChange={setAperto}>
        <DialogContent lato className="superficie-inversa flex flex-col gap-6 bg-inverse text-inverse-foreground [&>button:last-child]:text-inverse-muted [&>button:last-child]:hover:bg-inverse-raised">
          <DialogTitle className="sr-only">Menu</DialogTitle>
          <Marchio />
          <ContenutoMenu clienti={clienti} conAccesso={conAccesso} onNaviga={() => setAperto(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
