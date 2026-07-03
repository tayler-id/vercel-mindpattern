"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-transparent bg-clip-padding font-mono text-xs font-semibold uppercase tracking-[0.08em] whitespace-nowrap transition-all duration-(--dur-fast) ease-(--ease-swift) outline-none select-none active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[#c8290f] disabled:bg-panel disabled:text-ink-faint",
        outline:
          "border-ink bg-paper text-ink hover:bg-ink hover:text-white aria-expanded:bg-ink aria-expanded:text-white disabled:border-transparent disabled:bg-panel disabled:text-ink-faint",
        secondary:
          "bg-panel text-ink hover:bg-ink hover:text-white aria-expanded:bg-ink aria-expanded:text-white disabled:bg-panel disabled:text-ink-faint",
        ghost:
          "hover:bg-panel hover:text-foreground aria-expanded:bg-panel aria-expanded:text-foreground disabled:opacity-50",
        destructive:
          "bg-destructive text-white hover:bg-[#a82209] focus-visible:outline-destructive disabled:bg-panel disabled:text-ink-faint",
        link: "text-primary underline-offset-4 hover:underline disabled:opacity-50",
      },
      size: {
        default:
          "h-8 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 px-3 text-[0.6875rem] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-3 text-[0.6875rem] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-8",
        "icon-xs":
          "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7",
        "icon-lg": "size-9",
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
