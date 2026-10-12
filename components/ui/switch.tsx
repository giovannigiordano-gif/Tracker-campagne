"use client"
// Interruttore acceso/spento (ruolo "switch" per i lettori di schermo). Acceso = arancio del marchio.
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-6 w-11 shrink-0 items-center rounded-control border border-transparent",
        "bg-input/60 transition-colors motion-fast data-checked:bg-brand",
        "after:absolute after:-inset-2.5 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.25)] transition-transform motion-base data-checked:translate-x-[1.375rem] data-checked:bg-black"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
