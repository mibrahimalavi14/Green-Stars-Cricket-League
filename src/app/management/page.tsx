import Image from "next/image"
import type { Metadata } from "next"
import { Crown, User } from "lucide-react"

export const metadata: Metadata = {
  title: "Management | Green Stars Cricket League",
}

export const dynamic = "force-dynamic"

type Member = {
  name: string
  role: string
  photo?: string
  quote?: string
}

const management: Member[] = [
  {
    name: "Muhammad Ibrahim Alavi",
    role: "Chairman",
    photo: "/images/optimized/chairman.webp",
    quote:
      "GSCL is not just a league — it is a platform for the youth of Haripur to showcase their talent and pursue their dreams.",
  },
]

export default function ManagementPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">GSCL Management</h1>
        <p className="text-[var(--muted-foreground)]">
          The leadership behind Green Stars Cricket League.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {management.map((m) => (
          <div
            key={m.name}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center transition-colors hover:bg-[var(--muted)]"
          >
            {m.photo ? (
              <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-[var(--muted)] ring-2 ring-gscl-gold/40">
                <Image
                  src={m.photo}
                  alt={m.name}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-[var(--muted)] ring-2 ring-[var(--accent)]/30">
                <User className="h-12 w-12 text-[var(--muted-foreground)]" />
              </div>
            )}
            <h3 className="text-lg font-bold">{m.name}</h3>
            <p className="mb-2 text-sm font-semibold text-[var(--accent)]">{m.role}</p>
            {m.quote && (
              <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                &quot;{m.quote}&quot;
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-[var(--muted-foreground)]">
        <Crown className="mr-1 inline h-3.5 w-3.5 text-gscl-gold" />
        More management members will be added soon.
      </p>
    </div>
  )
}
