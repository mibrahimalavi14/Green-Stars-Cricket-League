import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { MATCH_CONFIG } from "@/lib/config"
import { getVenueMapsUrl } from "@/lib/utils"
import { Calendar, MapPin, Trophy, Zap } from "lucide-react"

export const dynamic = "force-dynamic"

async function MatchesCenterPage() {
  const allMatches = await prisma.match.findMany({
    include: { team1: true, team2: true, innings: true },
    orderBy: { date: "desc" },
  })

  const live = allMatches.filter(m => m.status === "live")
  const upcoming = allMatches.filter(m => m.status === "scheduled").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const completed = allMatches.filter(m => m.status === "completed")

  const tabs = [
    { id: "live" as const, label: "Live", count: live.length, icon: Zap },
    { id: "upcoming" as const, label: "Upcoming", count: upcoming.length, icon: Calendar },
    { id: "completed" as const, label: "Completed", count: completed.length, icon: Trophy },
  ]

  const defaultTab = live.length > 0 ? "live" : upcoming.length > 0 ? "upcoming" : "completed"

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Match Center</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">All matches — live, upcoming & completed</p>

      <MatchTabs tabs={tabs} defaultTab={defaultTab} live={live} upcoming={upcoming} completed={completed} />
    </div>
  )
}

function MatchTabs({ tabs, defaultTab, live, upcoming, completed }: {
  tabs: { id: "live" | "upcoming" | "completed"; label: string; count: number; icon: any }[]
  defaultTab: string
  live: any[]
  upcoming: any[]
  completed: any[]
}) {
  const all = { live, upcoming, completed }
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map(t => (
          <a key={t.id} href={`#${t.id}`} className="flex items-center gap-1.5 rounded-lg bg-[var(--muted)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)]/10">
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {t.count > 0 && (
              <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${t.id === "live" ? "bg-red-500" : "bg-[var(--accent)]"}`}>
                {t.count}
              </span>
            )}
          </a>
        ))}
      </div>

      {tabs.map(t => {
        const matches = all[t.id]
        return (
          <div key={t.id} id={t.id} className="mb-10">
            <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <t.icon className="h-5 w-5 text-[var(--accent)]" />
              {t.label}
              <span className="text-sm font-normal text-[var(--muted-foreground)]">({matches.length})</span>
            </h2>
            {matches.length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
                <p className="text-[var(--muted-foreground)]">No {t.label.toLowerCase()} matches</p>
              </div>
            ) : (
              <div className="space-y-2">
                {matches.map(m => {
                  const inn1 = m.innings.find((i: any) => i.teamId === m.team1Id)
                  const inn2 = m.innings.find((i: any) => i.teamId === m.team2Id)
                  const t1Score = inn1 ? `${inn1.runs + inn1.extras}/${inn1.wickets}` : ""
                  const t2Score = inn2 ? `${inn2.runs + inn2.extras}/${inn2.wickets}` : ""
                  const venueUrl = getVenueMapsUrl(m.venue || "")

                  return (
                    <Link key={m.id} href={m.status === "live" ? "/live" : `/matches/${m.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4 transition-all hover:border-[var(--accent)] hover:shadow-lg">
                      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          {m.team1.logo ? <img src={m.team1.logo} alt="" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 rounded-full object-cover" /> : <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-[10px] font-bold">{m.team1.shortName?.charAt(0)}</div>}
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold truncate">{m.team1.shortName}</p>
                            {t1Score && <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] font-mono">{t1Score}</p>}
                          </div>
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)] font-medium shrink-0">vs</span>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="min-w-0 text-right">
                            <p className="text-xs sm:text-sm font-semibold truncate">{m.team2.shortName}</p>
                            {t2Score && <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] font-mono">{t2Score}</p>}
                          </div>
                          {m.team2.logo ? <img src={m.team2.logo} alt="" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 rounded-full object-cover" /> : <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-[10px] font-bold">{m.team2.shortName?.charAt(0)}</div>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {m.status === "live" && <span className="inline-block rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse mb-1">LIVE</span>}
                        {m.result && <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] truncate max-w-[140px]">{m.result}</p>}
                        <p className="text-[10px] text-[var(--muted-foreground)]">
                          {new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default MatchesCenterPage
