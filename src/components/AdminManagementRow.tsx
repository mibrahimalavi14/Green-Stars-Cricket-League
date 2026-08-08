"use client"

import { useState } from "react"
import Image from "next/image"
import { Pencil, User } from "lucide-react"
import { AdminDeleteButton } from "./AdminDeleteButton"
import { AdminMemberEdit } from "./AdminMemberEdit"

type Member = {
  id: string
  name: string
  role: string
  photo: string
  quote: string
  sortOrder: number
  active: boolean
}

export function AdminManagementRow({ member }: { member: Member }) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--muted)]">
          {member.photo ? (
            <Image src={member.photo} alt={member.name} width={128} height={128} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-6 w-6 text-[var(--muted-foreground)]" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{member.name}</p>
          <p className="text-sm text-[var(--accent)]">{member.role}</p>
          {member.quote && <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">&quot;{member.quote}&quot;</p>}
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Order: {member.sortOrder} · {member.active ? "Visible" : "Hidden"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)} aria-label={`Edit ${member.name}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
            <Pencil className="h-4 w-4" />
          </button>
          <AdminDeleteButton api={`/api/management/${member.id}`} id={member.id} label="member" />
        </div>
      </div>
      {editing && <AdminMemberEdit member={member} onClose={() => setEditing(false)} />}
    </div>
  )
}
