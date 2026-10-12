"use client"
// Schede: gestiscono da sole frecce, Home/Fine e ruoli ARIA. Aspetto a pillole come il resto dei controlli.
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "cn"

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-stack", className)} {...props} />
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("relative inline-flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-control bg-muted p-1", className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative z-[1] inline-flex h-8 items-center gap-1.5 rounded-control px-3.5 text-sm font-semibold whitespace-nowrap text-muted-foreground",
        "transition-[color,transform] motion-fast hover:text-titolo active:scale-[0.97] data-active:text-titolo pointer-coarse:h-10",
        "data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4",
        className
      )}
      {...props}
    />
  )
}

// Indicatore che scorre sotto la scheda attiva (dimensioni e posizione fornite da Base UI)
function TabsIndicator({ className, ...props }: TabsPrimitive.Indicator.Props) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      className={cn(
        "absolute top-0 left-0 z-0 h-[var(--active-tab-height)] w-[var(--active-tab-width)] [translate:var(--active-tab-left)_var(--active-tab-top)] rounded-control bg-raised shadow-[0_1px_2px_rgb(0_0_0/0.08)]",
        "transition-[translate,width,height] motion-base",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel data-slot="tabs-content" className={cn("min-w-0 outline-none", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsIndicator, TabsContent }
