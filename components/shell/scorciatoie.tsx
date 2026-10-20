"use client";
// Scorciatoie da tastiera per l'uso quotidiano. Non scattano mentre si scrive in un campo.
// "?" apre l'elenco. Gli elementi della pagina si dichiarano con data-scorciatoia="...".
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Keyboard } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const ELENCO: [string, string][] = [
  ["/", "Cerca nella tabella o nell'elenco della pagina"],
  ["1  2  3", "Periodo: 7, 30 o 90 giorni"],
  ["C", "Attiva o disattiva il confronto con il periodo precedente"],
  ["R", "Aggiorna i dati"],
  ["X", "Azzera i filtri della dashboard del cliente"],
  ["?", "Mostra questo elenco"],
];

function staScrivendo(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

// Primo elemento visibile con quella scorciatoia (Next tiene in memoria anche la pagina precedente, nascosta)
function trova(nome: string) {
  return [...document.querySelectorAll<HTMLElement>(`[data-scorciatoia="${nome}"]`)].find((e) => e.getClientRects().length > 0);
}

export function Scorciatoie() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [aperto, setAperto] = useState(false);

  useEffect(() => {
    function premuto(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || staScrivendo(e.target)) return;
      const vai = (modifiche: Record<string, string | null>) => {
        if (pathname.startsWith("/impostazioni")) return;
        const p = new URLSearchParams(params.toString());
        for (const [k, v] of Object.entries(modifiche)) v === null ? p.delete(k) : p.set(k, v);
        router.push(`${pathname}?${p.toString()}`);
      };
      switch (e.key) {
        case "/":
          trova("cerca")?.focus();
          break;
        case "1":
        case "2":
        case "3":
          vai({ periodo: { "1": "7", "2": "30", "3": "90" }[e.key]!, da: null, a: null });
          break;
        case "c":
        case "C":
          vai({ confronto: params.get("confronto") === "0" ? null : "0" });
          break;
        case "r":
        case "R":
          trova("aggiorna")?.click();
          break;
        case "x":
        case "X":
          trova("azzera")?.click();
          break;
        case "?":
          setAperto(true);
          break;
        default:
          return;
      }
      e.preventDefault();
    }
    window.addEventListener("keydown", premuto);
    return () => window.removeEventListener("keydown", premuto);
  }, [router, pathname, params]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAperto(true)}
        className="hidden h-8 items-center gap-1.5 rounded-control px-2.5 text-caption text-muted-foreground transition-colors motion-fast hover:bg-muted hover:text-titolo lg:inline-flex"
        aria-keyshortcuts="?"
      >
        <Keyboard className="size-4" aria-hidden /> Scorciatoie
      </button>
      <Dialog open={aperto} onOpenChange={setAperto}>
        <DialogContent>
          <DialogTitle>Scorciatoie da tastiera</DialogTitle>
          <DialogDescription>Funzionano quando non stai scrivendo in un campo.</DialogDescription>
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 text-sm">
            {ELENCO.map(([tasti, cosa]) => (
              <div key={tasti} className="contents">
                <dt className="flex gap-1">
                  {tasti.split("  ").map((t) => (
                    <kbd key={t} className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-muted px-2 font-sans text-xs font-semibold text-titolo shadow-raised">
                      {t}
                    </kbd>
                  ))}
                </dt>
                <dd className="text-foreground">{cosa}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </>
  );
}
