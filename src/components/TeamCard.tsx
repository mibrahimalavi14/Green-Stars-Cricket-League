import Link from "next/link"
import { TeamData } from "@/types"

export function TeamCard({ team }: { team: TeamData }) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="group relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_0_30px_-5px_var(--accent)]"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-[var(--accent)]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--muted)] overflow-hidden ring-2 ring-transparent transition-all duration-300 group-hover:ring-[var(--accent)]" style={{ backgroundColor: team.color }}>
          {team.logo && !team.logo.includes("placeholder") ? (
            <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-white">{team.shortName}</span>
          )}
        </div>
        <div>
          <h3 className="font-semibold transition-colors duration-300 group-hover:text-[var(--accent)]">{team.name}</h3>
          <p className="text-xs text-[var(--muted-foreground)]">{team.players?.length || 0} Players</p>
        </div>
      </div>
    </Link>
  )
}
