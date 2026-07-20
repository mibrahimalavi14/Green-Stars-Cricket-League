import { prisma } from "@/lib/prisma"

export async function SponsorsSection() {
  const sponsors = await prisma.sponsor.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  })

  if (sponsors.length === 0) return null

  const tiers = ["platinum", "gold", "silver"]
  const tierLabels: Record<string, string> = { platinum: "Platinum Partners", gold: "Gold Partners", silver: "Silver Partners" }

  return (
    <section className="py-12">
      <h2 className="mb-8 text-center text-2xl font-bold">Our Sponsors</h2>
      {tiers.map(tier => {
        const items = sponsors.filter(s => s.tier === tier)
        if (items.length === 0) return null
        return (
          <div key={tier} className="mb-8">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">{tierLabels[tier]}</p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {items.map(s => (
                <a key={s.id} href={s.website || "#"} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2 transition-opacity hover:opacity-80">
                  {s.logo ? (
                    <img src={s.logo} alt={s.name} className="h-16 w-16 rounded-xl object-contain" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--muted)] text-lg font-bold text-[var(--accent)]">{s.name.charAt(0)}</div>
                  )}
                  <span className="text-xs font-medium text-[var(--muted-foreground)] group-hover:text-[var(--accent)]">{s.name}</span>
                </a>
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}
