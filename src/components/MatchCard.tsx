"use client"
import { formatDate, relativeDateLabel, getVenueMapsUrl } from "@/lib/utils"
import { MatchData } from "@/types"
import { Trophy } from "lucide-react"

export function MatchCard({ match, showMatchNo }: { match: MatchData; showMatchNo?: boolean }) {
  const date = new Date(match.date)
  const rel = relativeDateLabel(date)
  const navHref = match.status === "live" ? "/live" : "/fixtures"

  const team1Won = match.status === "completed" && match.result?.startsWith(match.team1.name)
  const team2Won = match.status === "completed" && match.result?.startsWith(match.team2.name)

  return (
    <div
      onClick={() => { window.location.href = navHref }}
      className={`group cursor-pointer rounded-lg border bg-[var(--card)] p-4 transition-all hover:shadow-lg ${
        match.status === "live" ? "border-red-500 ring-2 ring-red-500" :
        match.status === "completed" ? "border-[var(--border)]" :
        "border-[var(--border)] hover:border-[var(--accent)]"
      }`}
    >
      {(match.status === "live" || showMatchNo) && (
        <div className="mb-2 flex items-center gap-2">
          {match.status === "live" && <><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /><span className="text-xs font-semibold text-red-500">LIVE</span></>}
          {showMatchNo && match.matchNo > 0 && <span className="text-xs text-[var(--muted-foreground)]">Match {match.matchNo}</span>}
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 ${team1Won ? "bg-green-500/10" : ""}`}>
          {match.team1.logo ? (
            <img src={match.team1.logo} alt={match.team1.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: match.team1.color, color: "#fff" }}>
              {match.team1.shortName}
            </div>
          )}
          <div className="min-w-0 text-right">
            <p className="flex items-center justify-end gap-1.5 truncate text-sm font-medium">
              {match.team1.name}
              {team1Won && <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
            </p>
            {match.team1Score && <p className="text-lg font-bold">{match.team1Score}</p>}
          </div>
        </div>
        <div className="shrink-0 text-center">
          <span className="text-xs font-semibold text-[var(--accent)]">VS</span>
          {match.status === "upcoming" && (
            <div className="mt-1 text-xs">
              {rel.label ? (
                <span className={rel.className}>{rel.label}</span>
              ) : (
                <span className="text-[var(--muted-foreground)]">{formatDate(date)}</span>
              )}
            </div>
          )}
        </div>
        <div className={`flex min-w-0 flex-1 items-center justify-end gap-3 rounded-lg p-2 ${team2Won ? "bg-green-500/10" : ""}`}>
          <div className="min-w-0 text-left">
            <p className="flex items-center gap-1.5 truncate text-sm font-medium">
              {match.team2.name}
              {team2Won && <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
            </p>
            {match.team2Score && <p className="text-lg font-bold">{match.team2Score}</p>}
          </div>
          {match.team2.logo ? (
            <img src={match.team2.logo} alt={match.team2.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: match.team2.color, color: "#fff" }}>
              {match.team2.shortName}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 text-center text-xs text-[var(--muted-foreground)]">
        {match.status === "completed" ? (
          <>
            <span>{match.result}</span>
            {match.manOfMatch && (
              <span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                MOTM: {match.manOfMatch}
              </span>
            )}
          </>
        ) : (
          (() => { const url = getVenueMapsUrl(match.venue); return url ? <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hover:text-[var(--accent)] underline underline-offset-2">{match.venue}</a> : <>{match.venue}</> })()
        )}
      </div>
    </div>
  )
}
