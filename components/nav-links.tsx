"use client";
// Menu principale: i link mantengono il periodo scelto (?periodo=...)
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const VOCI = [
  { href: "/", label: "Panoramica" },
  { href: "/impostazioni", label: "Impostazioni" },
];

export function NavLinks() {
  const pathname = usePathname();
  const params = useSearchParams();
  const periodo = new URLSearchParams();
  for (const k of ["periodo", "da", "a"]) {
    const v = params.get(k);
    if (v) periodo.set(k, v);
  }
  const query = periodo.toString();

  return (
    <nav className="flex items-center gap-1 text-sm">
      {VOCI.map((v) => {
        const attivo = v.href === "/" ? pathname === "/" || pathname.startsWith("/clienti") : pathname.startsWith(v.href);
        return (
          <Link
            key={v.href}
            href={query ? `${v.href}?${query}` : v.href}
            className={cn(
              "rounded-md px-3 py-1.5 font-medium transition-colors",
              attivo ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v.label}
          </Link>
        );
      })}
    </nav>
  );
}
