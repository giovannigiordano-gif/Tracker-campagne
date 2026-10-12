// Pagina provvisoria della Fase 0: verrà sostituita dalla Panoramica agency in Fase 1.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold">Agency Insights</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Progetto in costruzione. Per verificare i collegamenti a GoHighLevel, Meta e
        Anthropic esegui <code className="font-mono">npm run check</code>.
      </p>
    </main>
  );
}
