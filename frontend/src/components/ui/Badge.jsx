import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        scheduled: "bg-[#2555ff]/10 text-[#2555ff] border border-[#2555ff]/20",
        arrived: "bg-amber-50 text-[#b45309] border border-amber-200/80",
        completed: "bg-emerald-50 text-[#15803d] border border-emerald-200/80",
        cancelled: "bg-rose-50 text-[#b91c1c] border border-rose-200/80",
        outline: "text-[#0f172a] border border-slate-200 bg-white",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
