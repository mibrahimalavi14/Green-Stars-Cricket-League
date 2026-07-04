import Link from "next/link"
import { TeamData } from "@/types"

export function TeamCard({ team }: { team: TeamData }) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="group rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-all hover:border-[var(--accent)] hover:shadow-lg"
    >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--muted)] overflow-hidden" style={{ backgroundColor: team.color }}>
            {team.logo && !team.logo.includes("placeholder") ? (
              <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-white">{team.shortName}</span>
            )}
          </div>
        <div>
          <h3 className="font-semibold group-hover:text-[var(--accent)]">{team.name}</h3>
          <p className="text-xs text-[var(--muted-foreground)]">{team.players?.length || 0} Players</p>
        </div>
      </div>
    </Link>
  )
}
