import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2555ff]/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#2555ff] text-white shadow-sm hover:bg-[#1b44db] border border-[#2555ff]",
        secondary:
          "bg-white text-[#0f172a] border border-[#e2e8f0] shadow-xs hover:bg-[#f8fafc] hover:border-[#cbd5e1]",
        outline:
          "border border-[#e2e8f0] bg-transparent shadow-xs hover:bg-[#f8fafc] hover:text-[#0f172a]",
        ghost:
          "hover:bg-[#f1f5f9] hover:text-[#0f172a]",
        destructive:
          "bg-rose-50 text-[#b91c1c] border border-rose-200 hover:bg-rose-100",
      },
      size: {
        default: "h-9 px-4 py-2 rounded-lg",
        sm: "h-7 px-2.5 text-[11px] rounded-md",
        lg: "h-10 px-5 text-[14px] rounded-lg",
        icon: "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
