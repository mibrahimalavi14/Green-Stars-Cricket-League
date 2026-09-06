import Image from "next/image"
import type { Metadata } from "next"
import { Crown, User } from "lucide-react"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Management | Green Stars Cricket League",
}

export const dynamic = "force-dynamic"

type Member = {
  id?: string
  name: string
  role: string
  photo?: string
  quote?: string
}

const fallbackMembers: Member[] = [
  {
    name: "Muhammad Ibrahim Alavi",
    role: "Chairman",
    photo: "/images/management/Chairman Muhammad Ibrahim Alavi.png",
    quote:
      "GSCL is not just a league — it is a platform for the youth of Haripur to showcase their talent and pursue their dreams.",
  },
]

export default async function ManagementPage() {
  const dbMembers = await prisma.managementMember.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, role: true, photo: true, quote: true },
  })

  const members: Member[] =
    dbMembers.length > 0
      ? dbMembers.map((m) => ({ id: m.id, name: m.name, role: m.role, photo: m.photo || undefined, quote: m.quote || undefined }))
      : fallbackMembers

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">GSCL Management</h1>
        <p className="text-[var(--muted-foreground)]">
          The leadership behind Green Stars Cricket League.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <div
            key={m.id || m.name}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center transition-colors hover:bg-[var(--muted)]"
          >
            {m.photo ? (
              <div className="relative mx-auto mb-4 aspect-[3/4] w-full max-w-44 overflow-hidden rounded-xl shadow-md">
                <Image src={m.photo} alt={m.name} fill sizes="176px" className="object-cover" />
              </div>
            ) : (
              <div className="mx-auto mb-4 flex h-44 w-44 items-center justify-center rounded-2xl bg-[var(--muted)] ring-2 ring-[var(--accent)]/30">
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
