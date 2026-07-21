"use client"
import Link from "next/link"
import { useState, useMemo } from "react"
import { Search, X } from "lucide-react"
import { TeamCollapsible } from "@/components/TeamCollapsible"

interface PlayerItem {
  id: string
  name: string
  role: string
  runs: number
  wickets: number
  matchesPlayed: number
  photo: string
  team: { shortName: string; logo: string } | null
}

interface TeamItem {
  id: string
  shortName: string
  name: string
  logo?: string | null
}

export function PlayersList({ players, teams }: { players: PlayerItem[]; teams: TeamItem[] }) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")

  const roles = useMemo(() => [...new Set(players.map((p) => p.role))].sort(), [players])

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (roleFilter && p.role !== roleFilter) return false
      return true
    })
  }, [players, search, roleFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, PlayerItem[]>()
    for (const p of filtered) {
      const key = p.team?.shortName || "Ungrouped"
      const g = map.get(key) || []
      g.push(p)
      map.set(key, g)
    }
    return map
  }, [filtered])

  const hasFilters = search || roleFilter

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[var(--accent)]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)]"
        >
          <option value="">All Roles</option>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {hasFilters && (
          <button onClick={() => { setSearch(""); setRoleFilter("") }} className="text-xs text-[var(--accent)] hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-[var(--muted-foreground)]">No players match your filters.</p>
      ) : (
        teams.map(team => {
          const teamPlayers = grouped.get(team.shortName)
          if (!teamPlayers) return null
          return (
            <TeamCollapsible key={team.id} title={team.name} subtitle={`${teamPlayers.length} players`} logo={team.logo}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                      <th className="p-3 text-left">Player</th>
                      <th className="p-3 text-center">Role</th>
                      <th className="p-3 text-center">Runs</th>
                      <th className="p-3 text-center">Wkts</th>
                      <th className="p-3 text-center">Mat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPlayers.map(p => (
                      <tr key={p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                        <td className="p-3">
                          <Link href={`/players/${p.id}`} className="flex items-center gap-2">
                            {p.photo && p.photo !== "/placeholder-player.svg" ? (
                              <img src={p.photo} alt={p.name} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <img src="/placeholder-player.svg" alt={p.name} className="h-8 w-8 rounded-full bg-[var(--muted)] p-1" />
                            )}
                            <span className="font-medium">{p.name}</span>
                          </Link>
                        </td>
                        <td className="p-3 text-center">{p.role}</td>
                        <td className="p-3 text-center font-medium">{p.runs}</td>
                        <td className="p-3 text-center font-medium">{p.wickets}</td>
                        <td className="p-3 text-center">{p.matchesPlayed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TeamCollapsible>
          )
        })
      )}
    </>
  )
}