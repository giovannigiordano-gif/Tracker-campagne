"use client"
// Interruttore acceso/spento (ruolo "switch" per i lettori di schermo), nelle proporzioni di iOS:
// pomello bianco sempre, binario arancio del marchio quando è acceso.
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-7 w-12 shrink-0 items-center rounded-control border border-transparent",
        "bg-input/50 transition-colors motion-base data-checked:bg-brand",
        "after:absolute after:-inset-2.5 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-6 translate-x-0.5 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.18),0_0_0_0.5px_rgb(0_0_0/0.04)] transition-transform motion-base data-checked:translate-x-[1.375rem]"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
