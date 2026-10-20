"use client";
// Scelta del tema: automatico (segue il sistema), chiaro, scuro. Ricordata nel browser.
// Lo script in app/layout.tsx applica il tema prima del primo disegno, così non c'è lampeggio.
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Pillola, usePillola } from "@/components/ui/pillola";
import { cn } from "@/lib/utils";

type Tema = "auto" | "chiaro" | "scuro";
const CHIAVE = "sp-tema";

export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem('${CHIAVE}')||'auto';var d=t==='scuro'||(t==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

function applica(tema: Tema) {
  const scuro = tema === "scuro" || (tema === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  const html = document.documentElement;
  // Dissolvenza dei colori solo durante il cambio, poi le transizioni tornano quelle dei componenti
  html.classList.add("cambio-tema");
  html.classList.toggle("dark", scuro);
  window.setTimeout(() => html.classList.remove("cambio-tema"), 350);
}

const OPZIONI: { v: Tema; label: string; Icona: typeof Sun }[] = [
  { v: "auto", label: "Automatico", Icona: Monitor },
  { v: "chiaro", label: "Chiaro", Icona: Sun },
  { v: "scuro", label: "Scuro", Icona: Moon },
];

export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>("auto");
  const { binario, stile, pronta, animata } = usePillola(tema);

  useEffect(() => {
    try {
      setTema((localStorage.getItem(CHIAVE) as Tema | null) ?? "auto");
    } catch {}
  }, []);

  // In automatico segue i cambi del sistema anche a pagina aperta
  useEffect(() => {
    if (tema !== "auto") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const cambia = () => applica("auto");
    mq.addEventListener("change", cambia);
    return () => mq.removeEventListener("change", cambia);
  }, [tema]);

  function scegli(t: Tema) {
    setTema(t);
    try {
      localStorage.setItem(CHIAVE, t);
    } catch {}
    applica(t);
  }

  return (
    <div ref={binario} className="relative inline-flex rounded-control bg-sidebar-hover p-0.5" role="group" aria-label="Tema">
      <Pillola stile={stile} animata={animata} />
      {OPZIONI.map(({ v, label, Icona }) => (
        <button
          key={v}
          type="button"
          aria-pressed={tema === v}
          data-attiva={tema === v}
          aria-label={label}
          title={label}
          onClick={() => scegli(v)}
          className={cn(
            "relative inline-flex size-8 items-center justify-center rounded-control transition-[color,transform] motion-fast active:scale-[0.92] pointer-coarse:size-10",
            tema === v ? "text-titolo" : "text-muted-foreground hover:text-titolo",
            tema === v && !pronta && "bg-raised shadow-raised"
          )}
        >
          <Icona className="size-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}
