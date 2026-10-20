"use client";
// Sezione "Analisi" della dashboard cliente (solo per il titolare): le analisi scritte da Claude con il
// connettore e salvate nell'app. La più recente è aperta; le precedenti si aprono dall'elenco.
// Il testo è markdown: si mostra con react-markdown, che non esegue HTML e scarta i link pericolosi.
import { useState } from "react";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Trash2 } from "lucide-react";
import { eliminaAnalisiSalvata } from "@/app/actions";
import { buttonVariants } from "@/components/ui/button";
import { ConfermaAzione } from "@/components/ui/conferma";
import type { Analisi } from "@/lib/analisi";
import { formatDataOra } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Riquadro } from "./ui";

// Stili del testo dell'analisi con i token del design system (niente plugin "typography")
const componenti: Components = {
  h1: ({ children }) => <h3 className="mt-6 text-section first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-6 text-section first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-5 text-label text-titolo first:mt-0">{children}</h4>,
  h4: ({ children }) => <h4 className="mt-4 text-label text-titolo first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="mt-3 text-body first:mt-0">{children}</p>,
  ul: ({ children }) => <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-body marker:text-muted-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-body marker:font-semibold marker:text-muted-foreground">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-titolo">{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-titolo underline underline-offset-4">
      {children}
    </a>
  ),
  blockquote: ({ children }) => <blockquote className="mt-3 border-l-2 border-border pl-4 text-muted-foreground">{children}</blockquote>,
  hr: () => <hr className="my-5 border-border" />,
  code: ({ children }) => <code className="rounded-sm bg-muted px-1 py-0.5 text-[0.9em]">{children}</code>,
  table: ({ children }) => (
    <div className="mt-3 overflow-x-auto rounded-block ring-1 ring-border">
      <table className="w-full border-collapse text-sm tabular-nums">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="bg-muted px-3 py-2 text-left font-semibold whitespace-nowrap text-titolo">{children}</th>,
  td: ({ children }) => <td className="border-t border-border px-3 py-2 align-top">{children}</td>,
};

function Testo({ markdown }: { markdown: string }) {
  return (
    <div className="max-w-[75ch] text-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={componenti}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

export function AnalisiPanel({ analisi, locationId, nomeCliente }: { analisi: Analisi[]; locationId: string; nomeCliente: string }) {
  const [apertaId, setApertaId] = useState(analisi[0]?.id ?? null);
  const aperta = analisi.find((a) => a.id === apertaId) ?? analisi[0] ?? null;
  const descrizione = "Analisi scritte da Claude con il tuo abbonamento, a partire dai numeri aggregati di questa dashboard. Le vedi solo tu.";

  if (!aperta) {
    return (
      <Riquadro id="analisi" titolo="Analisi" descrizione={descrizione}>
        <div className="flex flex-col items-start gap-3">
          <Sparkles className="size-5 text-brand-icona" aria-hidden />
          <p className="max-w-[65ch] text-sm">
            Nessuna analisi salvata per {nomeCliente}. Collega Claude all&apos;app (Impostazioni, scheda «Claude»), poi in Claude o Cowork chiedi per
            esempio: <em>«Analizza le campagne di {nomeCliente} degli ultimi 30 giorni e salva l&apos;analisi»</em>.
          </p>
          <Link href="/impostazioni#claude" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Come collegare Claude
          </Link>
        </div>
      </Riquadro>
    );
  }

  return (
    <Riquadro
      id="analisi"
      titolo="Analisi"
      descrizione={descrizione}
      azioni={
        <ConfermaAzione
          etichetta="Elimina"
          icona={<Trash2 aria-hidden />}
          variantePulsante="ghost"
          titolo={`Eliminare l'analisi «${aperta.titolo}»?`}
          descrizione="L'analisi sparisce dall'app. I dati dei clienti, su GoHighLevel e su Meta, non cambiano."
          conferma="Elimina analisi"
          successo="Analisi eliminata"
          esegui={() => eliminaAnalisiSalvata(locationId, aperta.id)}
        />
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <article aria-labelledby="titolo-analisi" className="min-w-0">
          <header className="mb-4 flex flex-col gap-1 border-b border-border pb-4">
            <h3 id="titolo-analisi" className="text-section">{aperta.titolo}</h3>
            <p className="text-caption text-muted-foreground">
              Periodo: {aperta.periodo}. Scritta da {aperta.autore} il {formatDataOra(aperta.creataIl)}.
            </p>
          </header>
          <Testo markdown={aperta.testo} />
        </article>
        {analisi.length > 1 && (
          <nav aria-label="Analisi precedenti" className="flex flex-col gap-2 lg:border-l lg:border-border lg:pl-6">
            <h3 className="text-label text-titolo">Storico ({analisi.length})</h3>
            <ul className="flex flex-col gap-1">
              {analisi.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setApertaId(a.id)}
                    aria-current={a.id === aperta.id ? "true" : undefined}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-block px-3 py-2 text-left transition-colors motion-fast hover:bg-muted pointer-coarse:py-3",
                      a.id === aperta.id && "bg-muted"
                    )}
                  >
                    <span className="line-clamp-2 text-sm font-semibold text-titolo">{a.titolo}</span>
                    <span className="text-caption text-muted-foreground">{formatDataOra(a.creataIl)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </Riquadro>
  );
}
