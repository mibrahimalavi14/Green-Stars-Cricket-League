import Link from "next/link"
import { ChevronRight } from "lucide-react"

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="mb-6 flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
      <Link href="/" className="transition-colors hover:text-[var(--accent)]">Home</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5" />
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-[var(--accent)]">{item.label}</Link>
          ) : (
            <span className="text-[var(--foreground)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
