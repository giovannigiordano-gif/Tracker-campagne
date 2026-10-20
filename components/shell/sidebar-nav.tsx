"use client";
// Menu dell'app, come la barra laterale delle app per Mac: fondo grigio chiaro, icone nel colore d'accento
// (arancio), voce attiva piena d'arancio con testo nero, titoletto grigio per i clienti.
// Da 1024px in su: colonna fissa a sinistra. Su telefono e tablet: barra in alto con il pulsante "Menu"
// che apre lo stesso menu in un pannello laterale; al centro della barra compare il titolo della pagina
// quando quello grande è scorso via.
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, Search, Settings } from "lucide-react";
import { esci } from "@/app/actions";
import { TesseraLogo } from "@/components/brand";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PARAMETRI_GLOBALI } from "@/lib/period";
import { TitoloCompatto } from "./barra-strumenti";
import { ThemeToggle } from "./theme-toggle";

type Cliente = { id: string; nome: string };

const ALTEZZA_BARRA_TELEFONO = 56; // px: barra del marchio su telefono e tablet

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
    "group/voce flex min-h-9 items-center gap-2.5 rounded-control px-3 text-sm font-medium transition-[background-color,color,transform] motion-fast active:scale-[0.98] pointer-coarse:min-h-11",
    attiva ? "bg-brand font-semibold text-brand-ink" : "text-foreground hover:bg-sidebar-hover"
  );

// Icona della voce: arancio come le icone delle barre laterali Apple, nera sulla voce attiva
const icona = (attiva: boolean) => cn("size-[1.0625rem] shrink-0", attiva ? "text-brand-ink" : "text-brand-icona");

// Iniziale del cliente in un quadratino, come le etichette delle app Apple: aiuta a trovarlo a colpo d'occhio
function Iniziale({ nome, attiva }: { nome: string; attiva: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-[0.375rem] text-[0.6875rem] font-bold",
        attiva ? "bg-brand-ink/12 text-brand-ink" : "bg-muted text-muted-foreground"
      )}
    >
      {nome.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

const SOGLIA_RICERCA = 8; // con molti clienti compare il campo per filtrarli

function ContenutoMenu({ clienti, conAccesso, onNaviga }: { clienti: Cliente[]; conAccesso: boolean; onNaviga?: () => void }) {
  const pathname = usePathname();
  const conQuery = useConQuery();
  const [filtro, setFiltro] = useState("");
  const visibili = useMemo(
    () => clienti.filter((c) => c.nome.toLowerCase().includes(filtro.trim().toLowerCase())),
    [clienti, filtro]
  );
  const inPanoramica = pathname === "/";
  const inImpostazioni = pathname.startsWith("/impostazioni");

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-5" aria-label="Menu principale">
      <Link href={conQuery("/")} onClick={onNaviga} aria-current={inPanoramica ? "page" : undefined} className={voce(inPanoramica)}>
        <LayoutDashboard className={icona(inPanoramica)} aria-hidden /> Panoramica
      </Link>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        <p className="px-3 text-caption font-semibold text-muted-foreground">Clienti ({clienti.length})</p>
        {clienti.length > SOGLIA_RICERCA && (
          <label className="relative mb-1 block">
            <span className="sr-only">Filtra i clienti</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Cerca"
              className="h-8 w-full rounded-control bg-sidebar-hover pl-8 pr-3 text-sm text-titolo placeholder:text-muted-foreground"
            />
          </label>
        )}
        {clienti.length === 0 ? (
          <p className="px-3 text-sm text-muted-foreground">
            Nessun cliente ancora.{" "}
            <Link href={conQuery("/impostazioni")} onClick={onNaviga} className="font-semibold text-titolo underline">
              Aggiungine uno
            </Link>
          </p>
        ) : (
          <ul className="-mx-1 flex min-h-0 flex-col gap-0.5 overflow-y-auto px-1">
            {visibili.map((c) => {
              const href = `/clienti/${c.id}`;
              const attiva = pathname.startsWith(href);
              return (
                <li key={c.id}>
                  <Link
                    href={conQuery(href)}
                    onClick={onNaviga}
                    aria-current={attiva ? "page" : undefined}
                    className={cn(voce(attiva), "py-1.5 leading-tight")}
                    title={c.nome}
                  >
                    <Iniziale nome={c.nome} attiva={attiva} />
                    <span className="min-w-0 truncate">{c.nome}</span>
                  </Link>
                </li>
              );
            })}
            {visibili.length === 0 && <li className="px-3 text-sm text-muted-foreground">Nessun cliente con questo nome</li>}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-sidebar-border pt-3">
        <Link
          href={conQuery("/impostazioni")}
          onClick={onNaviga}
          aria-current={inImpostazioni ? "page" : undefined}
          className={voce(inImpostazioni)}
        >
          <Settings className={icona(inImpostazioni)} aria-hidden /> Impostazioni
        </Link>
        <div className="flex items-center justify-between gap-3 px-1">
          <ThemeToggle />
          {conAccesso && (
            <form action={esci}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-control px-3 text-sm font-medium text-muted-foreground transition-colors motion-fast hover:bg-sidebar-hover hover:text-titolo pointer-coarse:h-11"
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

      {/* Barra in alto (schermi stretti): titolo della pagina centrato su tutta la barra quando quello grande
          è scorso via; la tessera del logo gli lascia il posto (regola .barra-telefono in globals.css) */}
      <div className="pointer-events-none absolute inset-y-0 inset-x-16 flex items-center justify-center lg:hidden">
        <TitoloCompatto margineAlto={ALTEZZA_BARRA_TELEFONO} className="min-w-0" />
      </div>
      <button
        type="button"
        onClick={() => setAperto(true)}
        aria-label="Apri il menu"
        className="ml-auto inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-2 rounded-control px-2.5 text-sm font-semibold text-titolo transition-colors motion-fast hover:bg-muted pointer-coarse:h-11 pointer-coarse:min-w-11 sm:px-3.5 lg:hidden"
      >
        <Menu className="size-5 text-brand-icona" aria-hidden />
        <span className="max-sm:sr-only">Menu</span>
      </button>
      <Dialog open={aperto} onOpenChange={setAperto}>
        <DialogContent lato className="flex flex-col gap-5 bg-sidebar">
          <DialogTitle className="sr-only">Menu</DialogTitle>
          <TesseraLogo />
          <ContenutoMenu clienti={clienti} conAccesso={conAccesso} onNaviga={() => setAperto(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
