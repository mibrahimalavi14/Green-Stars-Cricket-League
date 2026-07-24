"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDate, getVenueMapsUrl } from "@/lib/utils"
import type { Match, Team, Inning } from "@prisma/client"

type MatchWithRelations = Match & {
  team1: Team
  team2: Team
  innings: Inning[]
}

type Tab = "live" | "upcoming" | "completed"

export function MatchCenterClient({ matches }: { matches: MatchWithRelations[] }) {
  const live = matches.filter((m) => m.status === "live")
  const upcoming = matches.filter((m) => m.status === "upcoming")
  const completed = matches.filter((m) => m.status === "completed").reverse()

  const defaultTab: Tab = live.length > 0 ? "live" : upcoming.length > 0 ? "upcoming" : "completed"
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "live", label: "Live", count: live.length },
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "completed", label: "Completed", count: completed.length },
  ]

  const activeMatches = activeTab === "live" ? live : activeTab === "upcoming" ? upcoming : completed

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold sm:text-3xl">Match Center</h1>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        {matches.length} matches &middot; 5-over format
      </p>

      <div className="mb-6 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "bg-[var(--muted)] text-[var(--muted-foreground)]"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  activeTab === tab.key
                    ? "bg-[var(--accent-foreground)]/20 text-[var(--accent-foreground)]"
                    : "bg-red-500 text-white"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeMatches.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            {activeTab === "live" && "No live matches right now."}
            {activeTab === "upcoming" && "No upcoming matches scheduled."}
            {activeTab === "completed" && "No completed matches yet."}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {activeTab === "live" &&
          live.map((m) => (
            <Link
              key={m.id}
              href="/live"
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 transition-all hover:border-[var(--accent)] hover:shadow-lg sm:p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <span className="text-xs font-semibold text-red-500">LIVE</span>
                  {m.matchNo > 0 && (
                    <span className="text-xs text-[var(--muted-foreground)]">Match {m.matchNo}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <TeamInfo team={m.team1} score={m.team1Score} />
                  <span className="shrink-0 text-xs font-semibold text-[var(--accent)]">vs</span>
                  <TeamInfo team={m.team2} score={m.team2Score} right />
                </div>
                <p className="mt-1 text-[10px] text-[var(--muted-foreground)] sm:text-xs">{m.venue}</p>
              </div>
            </Link>
          ))}

        {activeTab === "upcoming" &&
          upcoming.map((m) => (
            <Link
              key={m.id}
              href={`/matches/${m.id}`}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 transition-all hover:border-[var(--accent)] hover:shadow-lg sm:p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  {m.matchNo > 0 && (
                    <span className="text-xs font-semibold text-[var(--accent)]">Match {m.matchNo}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <TeamInfo team={m.team1} />
                  <span className="shrink-0 text-xs font-semibold text-[var(--accent)]">vs</span>
                  <TeamInfo team={m.team2} right />
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--muted-foreground)] sm:text-xs">
                  <span>{formatDate(m.date)}</span>
                  <span>&middot;</span>
                  <VenueLink venue={m.venue} />
                </div>
              </div>
            </Link>
          ))}

        {activeTab === "completed" &&
          completed.map((m) => (
            <Link
              key={m.id}
              href={`/matches/${m.id}`}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 transition-all hover:border-[var(--accent)] hover:shadow-lg sm:p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  {m.matchNo > 0 && (
                    <span className="text-xs font-semibold text-[var(--muted-foreground)]">Match {m.matchNo}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <TeamInfo team={m.team1} score={m.team1Score} result={m.result} teamName={m.team1.name} />
                  <span className="shrink-0 text-xs font-semibold text-[var(--accent)]">vs</span>
                  <TeamInfo team={m.team2} score={m.team2Score} result={m.result} teamName={m.team2.name} right />
                </div>
                {m.result && (
                  <p className="mt-1 text-[10px] font-medium text-green-600 dark:text-green-400 sm:text-xs">{m.result}</p>
                )}
              </div>
            </Link>
          ))}
      </div>
    </div>
  )
}

function TeamInfo({
  team,
  score,
  result,
  teamName,
  right,
}: {
  team: Team
  score?: string
  result?: string
  teamName?: string
  right?: boolean
}) {
  const won = result && teamName ? result.startsWith(teamName) : false

  return (
    <div className={`flex min-w-0 items-center gap-2 ${right ? "flex-row-reverse" : ""}`}>
      {team.logo ? (
        <img
          src={team.logo}
          alt={team.name}
          className="h-7 w-7 shrink-0 rounded-full object-cover sm:h-8 sm:w-8"
        />
      ) : (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white sm:h-8 sm:w-8"
          style={{ backgroundColor: team.color }}
        >
          {team.shortName?.charAt(0)}
        </div>
      )}
      <div className={`min-w-0 ${right ? "text-right" : "text-left"}`}>
        <p className={`truncate text-xs font-medium sm:text-sm ${won ? "text-green-600 dark:text-green-400" : ""}`}>
          {team.name}
        </p>
        {score && <p className="text-sm font-bold sm:text-base">{score}</p>}
      </div>
    </div>
  )
}

function VenueLink({ venue }: { venue: string }) {
  const url = getVenueMapsUrl(venue)
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-[var(--accent)] underline underline-offset-2"
        onClick={(e) => e.stopPropagation()}
      >
        {venue}
      </a>
    )
  }
  return <span>{venue}</span>
}
