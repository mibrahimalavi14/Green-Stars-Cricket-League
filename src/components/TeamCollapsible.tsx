"use client"
import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

export function TeamCollapsible({ title, subtitle, logo, defaultOpen, children }: {
  title: string
  subtitle?: string
  logo?: string | null
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen ?? true)
  return (
    <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between border-b border-[var(--border)] bg-[var(--muted)] px-5 py-3 text-left transition-colors hover:bg-[var(--muted)]/80">
        <div className="flex items-center gap-3">
          {logo && <img src={logo} alt="" className="h-7 w-7 rounded-full object-cover" />}
          <div>
            <h2 className="font-semibold">{title}</h2>
            {subtitle && <p className="text-xs text-[var(--muted-foreground)]">{subtitle}</p>}
          </div>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" /> : <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}