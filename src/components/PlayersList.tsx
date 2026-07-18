"use client"
import Link from "next/link"
import { useState, useMemo } from "react"
import { Search, X } from "lucide-react"

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
}

export function PlayersList({ players, teams }: { players: PlayerItem[]; teams: TeamItem[] }) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [teamFilter, setTeamFilter] = useState("")

  const roles = useMemo(() => [...new Set(players.map((p) => p.role))].sort(), [players])

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (roleFilter && p.role !== roleFilter) return false
      if (teamFilter && p.team?.shortName !== teamFilter) return false
      return true
    })
  }, [players, search, roleFilter, teamFilter])

  const hasFilters = search || roleFilter || teamFilter

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
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)]"
        >
          <option value="">All Teams</option>
          {teams.map((t) => <option key={t.id} value={t.shortName}>{t.shortName}</option>)}
        </select>
        {hasFilters && (
          <button onClick={() => { setSearch(""); setRoleFilter(""); setTeamFilter("") }} className="text-xs text-[var(--accent)] hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-[var(--muted-foreground)]">No players match your filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-all hover:border-[var(--accent)] hover:shadow-lg"
            >
              <div className="mb-3 flex items-center gap-3">
                {player.photo && player.photo !== "/placeholder-player.svg" ? (
                  <img src={player.photo} alt={player.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <img src="/placeholder-player.svg" alt={player.name} className="h-12 w-12 rounded-full bg-[var(--muted)] p-2" />
                )}
                <div>
                  <p className="font-semibold">{player.name}</p>
                  <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                    {player.team?.logo && <img src={player.team.logo} alt="" className="h-4 w-4 rounded-full object-cover" />}
                    {player.role} &middot; {player.team?.shortName}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="font-bold">{player.runs}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Runs</p>
                </div>
                <div>
                  <p className="font-bold">{player.wickets}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Wkts</p>
                </div>
                <div>
                  <p className="font-bold">{player.matchesPlayed}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Matches</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
