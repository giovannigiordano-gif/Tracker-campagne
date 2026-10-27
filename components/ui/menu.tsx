"use client"
// Menu a comparsa (Base UI): si apre sotto il pulsante con una breve dissolvenza; da tastiera si usa con le
// frecce, Invio ed Esc. Stile delle app Apple: scheda bianca sospesa, voci con evidenziazione arrotondata.
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { cn } from "cn"

const Menu = MenuPrimitive.Root
const MenuTrigger = MenuPrimitive.Trigger

function MenuContent({
  className,
  children,
  align = "end",
  sideOffset = 6,
  ...props
}: MenuPrimitive.Popup.Props & { align?: "start" | "center" | "end"; sideOffset?: number }) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner align={align} sideOffset={sideOffset} className="z-[var(--z-modal)] outline-none">
        <MenuPrimitive.Popup
          data-slot="menu-content"
          className={cn(
            "flex min-w-52 max-w-[min(22rem,calc(100vw-2rem))] origin-[var(--transform-origin)] flex-col rounded-block bg-card p-1 text-sm text-foreground shadow-overlay ring-1 ring-border outline-none",
            "transition-[opacity,scale] motion-fast data-starting-style:scale-[0.97] data-starting-style:opacity-0 data-ending-style:opacity-0",
            className
          )}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function MenuItem({ className, ...props }: MenuPrimitive.Item.Props) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      className={cn(
        "flex min-h-9 cursor-default items-center gap-2.5 rounded-[0.625rem] px-3 py-1.5 text-left outline-none select-none pointer-coarse:min-h-11",
        "data-highlighted:bg-accent data-highlighted:text-titolo data-disabled:pointer-events-none data-disabled:opacity-50",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-brand-icona",
        className
      )}
      {...props}
    />
  )
}

function MenuGroup(props: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="menu-group" {...props} />
}

function MenuGroupLabel({ className, ...props }: MenuPrimitive.GroupLabel.Props) {
  return <MenuPrimitive.GroupLabel data-slot="menu-label" className={cn("px-3 pt-2 pb-1 text-caption text-muted-foreground", className)} {...props} />
}

function MenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return <MenuPrimitive.Separator data-slot="menu-separator" className={cn("mx-2 my-1 h-px bg-border", className)} {...props} />
}

export { Menu, MenuTrigger, MenuContent, MenuItem, MenuGroup, MenuGroupLabel, MenuSeparator }
