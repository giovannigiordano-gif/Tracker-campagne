// Segnaposto di caricamento con riflesso che scorre (fermo se è attivo "riduci movimento").
import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "rounded-block bg-muted bg-[linear-gradient(90deg,transparent_0%,color-mix(in_oklab,var(--card)_55%,transparent)_50%,transparent_100%)] bg-[length:200%_100%]",
        "motion-safe:animate-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
