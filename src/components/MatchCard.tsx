import Link from "next/link"
import { formatDate, formatTime } from "@/lib/utils"
import { MatchData } from "@/types"

export function MatchCard({ match }: { match: MatchData }) {
  const date = new Date(match.date)
  const isToday = new Date().toDateString() === date.toDateString()

  return (
    <Link
      href={match.status === "live" ? `/live` : `/fixtures`}
      className={`group rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-all hover:border-[var(--accent)] hover:shadow-lg ${
        match.status === "live" ? "ring-2 ring-red-500" : ""
      }`}
    >
      {match.status === "live" && (
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-xs font-semibold text-red-500">LIVE</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          {match.team1.logo ? (
            <img src={match.team1.logo} alt={match.team1.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: match.team1.color, color: "#fff" }}>
              {match.team1.shortName}
            </div>
          )}
          <div className="text-right">
            <p className="text-sm font-medium">{match.team1.name}</p>
            {match.team1Score && <p className="text-lg font-bold">{match.team1Score}</p>}
          </div>
        </div>
        <div className="text-center">
          <span className="text-xs font-semibold text-[var(--accent)]">VS</span>
          {match.status === "upcoming" && (
            <div className="mt-1 text-xs text-[var(--muted-foreground)]">
              {isToday ? formatTime(date) : formatDate(date)}
            </div>
          )}
        </div>
        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="text-left">
            <p className="text-sm font-medium">{match.team2.name}</p>
            {match.team2Score && <p className="text-lg font-bold">{match.team2Score}</p>}
          </div>
          {match.team2.logo ? (
            <img src={match.team2.logo} alt={match.team2.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: match.team2.color, color: "#fff" }}>
              {match.team2.shortName}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 text-center text-xs text-[var(--muted-foreground)]">
        {match.status === "completed" ? match.result : match.venue}
      </div>
    </Link>
  )
}
