// Link condiviso sbagliato, sostituito o disattivato: una sola pagina per tutti i casi,
// senza indizi sul motivo.
import { Simbolo } from "@/components/brand";

export default function LinkNonValido() {
  return (
    <div className="flex max-w-xl flex-col items-start gap-5 py-10">
      <Simbolo size={36} />
      <h1 className="text-title">Link non valido o disattivato</h1>
      <p className="text-body text-muted-foreground">Chiedi un nuovo link a chi te l&apos;ha mandato.</p>
    </div>
  );
}
