"use client"
import { formatDate, relativeDateLabel, getVenueMapsUrl } from "@/lib/utils"
import { MatchData } from "@/types"

export function MatchCard({ match, showMatchNo }: { match: MatchData; showMatchNo?: boolean }) {
  const date = new Date(match.date)
  const rel = relativeDateLabel(date)
  const navHref = match.status === "live" ? "/live" : "/fixtures"

  return (
    <div
      onClick={() => { window.location.href = navHref }}
      className={`group cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-all hover:border-[var(--accent)] hover:shadow-lg ${
        match.status === "live" ? "ring-2 ring-red-500" : ""
      }`}
    >
      {(match.status === "live" || showMatchNo) && (
        <div className="mb-2 flex items-center gap-2">
          {match.status === "live" && <><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /><span className="text-xs font-semibold text-red-500">LIVE</span></>}
          {showMatchNo && match.matchNo > 0 && <span className="text-xs text-[var(--muted-foreground)]">Match {match.matchNo}</span>}
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {match.team1.logo ? (
            <img src={match.team1.logo} alt={match.team1.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: match.team1.color, color: "#fff" }}>
              {match.team1.shortName}
            </div>
          )}
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-medium">{match.team1.name}</p>
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
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-medium">{match.team2.name}</p>
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
