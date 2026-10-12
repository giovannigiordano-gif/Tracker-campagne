// Pulsante del design system SalesProcess.
// Varianti: default (arancio, azione principale: una sola per schermata), inverse (nero del marchio),
// outline, ghost, destructive, link. Stati: hover, focus (anello globale), premuto, disabilitato, in corso.
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"
import { cn } from "cn"

const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-control border border-transparent",
    "font-bold whitespace-nowrap select-none transition-[background-color,border-color,color,transform] motion-fast",
    "active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 aria-busy:cursor-progress",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-brand text-brand-ink hover:bg-brand-hover",
        inverse: "bg-inverse text-inverse-foreground hover:bg-inverse-raised",
        outline: "border-input bg-card text-titolo hover:border-titolo hover:bg-muted aria-expanded:bg-muted",
        ghost: "text-foreground hover:bg-muted hover:text-titolo aria-expanded:bg-muted",
        destructive: "bg-danger-soft text-danger hover:bg-danger hover:text-white dark:hover:text-black",
        link: "rounded-sm px-0 text-titolo underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3.5 text-sm pointer-coarse:h-11",
        default: "h-10 px-4 text-sm pointer-coarse:h-11",
        lg: "h-12 px-6 text-base",
        icon: "size-10 pointer-coarse:size-11",
        "icon-sm": "size-9 pointer-coarse:size-11",
        // compatibilità con i componenti generati da shadcn
        xs: "h-8 px-3 text-xs pointer-coarse:h-11",
        "icon-xs": "size-8 pointer-coarse:size-11",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { loading?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle className="animate-spin" aria-hidden />}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
