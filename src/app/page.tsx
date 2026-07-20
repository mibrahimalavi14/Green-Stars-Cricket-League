import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"

import { MatchCard } from "@/components/MatchCard"
import { NewsNotification } from "@/components/NewsNotification"
import { TeamCard } from "@/components/TeamCard"
import { NewsCard } from "@/components/NewsCard"
import { ReviewsSection } from "@/components/ReviewsSection"
import { SponsorsSection } from "@/components/SponsorsSection"
import { CountdownTimer } from "@/components/CountdownTimer"
import { AnimatedCounter } from "@/components/AnimatedCounter"
import { FadeInView } from "@/components/FadeInView"
import { Youtube, Trophy, Users, Calendar, MapPin, Award, Timer } from "lucide-react"

export const revalidate = 300

async function HomePage() {
  const season = await prisma.season.findFirst({ where: { isActive: true } })
  const [allTeamsData, matches, news, winners, matchCount, players] = await Promise.all([
    prisma.team.findMany({
      include: { players: true, _count: { select: { players: true } } },
    }),
    prisma.match.findMany({
      take: 6,
      where: { status: { not: "completed" } },
      orderBy: { date: "asc" },
      include: { team1: true, team2: true },
    }),
    prisma.news.findMany({ where: { published: true }, take: 3, orderBy: { createdAt: "desc" } }),
    prisma.season.findMany({
      where: { winnerId: { not: "" } },
      include: { teams: true },
      orderBy: { year: "desc" },
    }),
    prisma.match.count(),
    season ? prisma.player.findMany({ where: { team: { seasonId: season.id } }, include: { team: true } }) : Promise.resolve([]),
  ])

  const teams = allTeamsData.slice(0, 8)
  const teamCount = allTeamsData.length
  const playerCount = allTeamsData.reduce((a, b) => a + b._count.players, 0)

  const latestNews = news.length > 0 ? news[0] : null

  return (
    <>
      <NewsNotification news={latestNews ? { id: latestNews.id, title: latestNews.title, excerpt: latestNews.excerpt || "", createdAt: latestNews.createdAt.toISOString(), type: latestNews.type } : null} />
      <section className="relative flex min-h-[70vh] w-full items-center justify-center overflow-hidden">
        <Image src="/images/optimized/banner.webp" alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/50" />
        {/* Floating cricket balls */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-[20%] h-3 w-3 animate-bounce rounded-full border-2 border-white/20" style={{ animationDuration: "3s" }} />
          <div className="absolute right-[15%] top-[30%] h-2 w-2 animate-bounce rounded-full border-2 border-gscl-gold/30" style={{ animationDuration: "4s", animationDelay: "0.5s" }} />
          <div className="absolute left-[20%] bottom-[25%] h-4 w-4 animate-bounce rounded-full border-2 border-white/10" style={{ animationDuration: "3.5s", animationDelay: "1s" }} />
          <div className="absolute right-[25%] bottom-[35%] h-2.5 w-2.5 animate-bounce rounded-full border-2 border-gscl-gold/20" style={{ animationDuration: "4.5s", animationDelay: "0.3s" }} />
          <div className="absolute left-[45%] top-[15%] h-1.5 w-1.5 animate-ping rounded-full bg-white/20" style={{ animationDuration: "2s", animationDelay: "0.8s" }} />
          <div className="absolute right-[40%] bottom-[20%] h-1.5 w-1.5 animate-ping rounded-full bg-gscl-gold/20" style={{ animationDuration: "2.5s", animationDelay: "1.2s" }} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <h1 className="mb-4 text-5xl font-bold text-white md:text-7xl">
            Green Stars <span className="animate-gradient bg-gradient-to-r from-gscl-gold via-yellow-300 to-gscl-gold bg-clip-text text-transparent">Cricket League</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80">
            {season?.name || "Welcome to the most exciting cricket league"} — Where champions rise and legends are made.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/fixtures" className="animate-float rounded-lg bg-gscl-gold px-6 py-3 font-semibold text-gscl-dark transition-all hover:scale-105 hover:opacity-90">
              View Fixtures
            </Link>
            <Link href="/live" className="animate-glow-pulse rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:bg-white/10" style={{ animationDelay: "0.5s" }}>
              Live Scores
            </Link>
          </div>
        </div>
      </section>

      <FadeInView>
      <section className="border-b border-[var(--border)] bg-[var(--card)] py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              { label: "Teams", value: teamCount, icon: Users },
              { label: "Players", value: playerCount, icon: Trophy },
              { label: "Matches", value: matchCount, icon: Calendar },
              { label: "Season", value: season?.year || 2026, icon: Trophy },
              { label: "Founded", value: "Haripur", icon: MapPin },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-[var(--muted)] p-4 text-center">
                <s.icon className="mx-auto mb-1 h-5 w-5 text-[var(--accent)]" />
                <div className="text-2xl font-bold">{typeof s.value === "number" ? <AnimatedCounter value={s.value} /> : s.value}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{s.label}</div>
              </div>
            ))}
          </div>

          {winners.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 rounded-lg bg-[var(--muted)] p-4">
              <Award className="h-5 w-5 text-gscl-gold" />
              {winners.map((w) => {
                const winnerTeam = w.teams.find(t => t.id === w.winnerId)
                return (
                  <span key={w.id} className="flex items-center gap-1.5 text-sm">
                    <span className="font-semibold">{w.name}</span>: 
                    {winnerTeam?.logo && <img src={winnerTeam.logo} alt="" className="h-5 w-5 rounded-full object-cover" />}
                    {winnerTeam?.name || w.winnerId}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </section>
      </FadeInView>

      {players.length > 0 && (
        <FadeInView>
        <section className="border-t border-[var(--border)] py-10">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Tournament Leaders</h2>
              <div className="flex items-center gap-3">
                <Link href="/dream-team" className="text-sm text-[var(--accent)] hover:underline">Dream Team</Link>
                <Link href="/players/stats" className="text-sm text-[var(--accent)] hover:underline">Full Stats</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {(() => {
                const tR = players.filter(p => p.runs > 0).sort((a, b) => b.runs - a.runs)[0]
                const tW = players.filter(p => p.wickets > 0).sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)[0]
                const m6 = players.filter(p => p.sixes > 0).sort((a, b) => b.sixes - a.sixes)[0]
                const sR = players.filter(p => p.ballsFaced >= 10).sort((a, b) => (b.runs / b.ballsFaced) - (a.runs / a.ballsFaced))[0]
                const aR = players.filter(p => p.runs >= 20 && p.wickets >= 2).sort((a, b) => (b.runs + b.wickets * 20) - (a.runs + a.wickets * 20))[0]
                return (<>
                  <LeaderCard label="Orange Cap" value={tR ? String(tR.runs) : "-"} stat="Runs" name={tR?.name || "Yet to be decided"} team={tR?.team?.shortName} color="orange" />
                  <LeaderCard label="Purple Cap" value={tW ? String(tW.wickets) : "-"} stat="Wickets" name={tW?.name || "Yet to be decided"} team={tW?.team?.shortName} color="violet" />
                  <LeaderCard label="Most Sixes" value={m6 ? String(m6.sixes) : "-"} stat="Sixes" name={m6?.name || "Yet to be decided"} team={m6?.team?.shortName} color="purple" />
                  <LeaderCard label="Best Strike Rate" value={sR ? ((sR.runs / sR.ballsFaced) * 100).toFixed(1) : "-"} stat="SR (min 10 balls)" name={sR?.name || "Yet to be decided"} team={sR?.team?.shortName} color="cyan" />
                  <LeaderCard label="Best All-Rounder" value={aR ? String(aR.runs + aR.wickets * 20) : "-"} stat="Pts" name={aR?.name || "Yet to be decided"} team={aR?.team?.shortName} color="amber" />
                </>)
              })()}
            </div>
          </div>
        </section>
        </FadeInView>
      )}

      {matches.length > 0 && (
        <FadeInView>
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Upcoming Matches</h2>
              <Link href="/fixtures" className="text-sm text-[var(--accent)] hover:underline">View All</Link>
            </div>
            {matches[0] && (
              <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
                <Timer className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-[var(--muted-foreground)]">Next match in:</span>
                <span className="font-bold tabular-nums"><CountdownTimer targetDate={matches[0].date.toISOString()} /></span>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match as any} showMatchNo={true} />
              ))}
            </div>
          </div>
        </section>
        </FadeInView>
      )}

      <FadeInView>
      <section className="content-visibility-auto border-t border-[var(--border)] bg-[var(--card)] py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Teams</h2>
            <Link href="/teams" className="text-sm text-[var(--accent)] hover:underline">View All</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {teams.map((t) => (
              <TeamCard key={t.id} team={t as any} />
            ))}
          </div>
        </div>
      </section>
      </FadeInView>

      <FadeInView>
      <section className="content-visibility-auto border-t border-[var(--border)] bg-[var(--card)] py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Latest News</h2>
            <Link href="/news" className="text-sm text-[var(--accent)] hover:underline">View All</Link>
          </div>
          {news.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {news.map((n) => (
                <NewsCard key={n.id} news={n as any} />
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--muted-foreground)]">No news yet. Stay tuned!</p>
          )}
        </div>
      </section>
      </FadeInView>

      <FadeInView>
      <section className="content-visibility-auto py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <Youtube className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-2xl font-bold">Live on YouTube</h2>
          <p className="mb-6 text-[var(--muted-foreground)]">Watch all matches live on our YouTube channel</p>
          <a
            href="https://www.youtube.com/@GreenStarsCricketLeague"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Youtube className="h-5 w-5" /> Subscribe to GSCL
          </a>
        </div>
      </section>
      </FadeInView>

      <FadeInView>
      <section className="content-visibility-auto border-t border-[var(--border)] py-10">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="mb-6 text-xl font-bold">Our Partners</h2>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-4">
                <img src="/images/optimized/gscl-logo.webp" alt="" className="h-10 w-10 rounded-full object-cover" />
                <span className="font-semibold text-sm">GSCL</span>
              </div>
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)] px-6 py-4">
                <p className="text-sm font-semibold text-[var(--muted-foreground)]">Your Logo Here</p>
              </div>
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)] px-6 py-4">
                <p className="text-sm font-semibold text-[var(--muted-foreground)]">Your Logo Here</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-[var(--muted-foreground)]">Interested in partnering with GSCL? <Link href="/contact" className="text-[var(--accent)] hover:underline">Contact us</Link></p>
        </div>
      </section>
      </FadeInView>

      <SponsorsSection />
      <ReviewsSection />
    </>
  )
}

export default HomePage

function LeaderCard({ label, stat, value, name, team, color }: { label: string; stat: string; value: string; name: string; team?: string; color: string }) {
  const circleMap: Record<string, string> = {
    orange: "bg-orange-100 text-orange-600 dark:text-orange-400 dark:bg-orange-900/30",
    violet: "bg-violet-100 text-violet-700 dark:text-violet-400 dark:bg-violet-900/60",
    purple: "bg-purple-100 text-purple-600 dark:text-purple-400 dark:bg-purple-900/30",
    cyan: "bg-cyan-100 text-cyan-600 dark:text-cyan-400 dark:bg-cyan-900/30",
    amber: "bg-amber-100 text-amber-600 dark:text-amber-400 dark:bg-amber-900/30",
  }
  const labelMap: Record<string, string> = {
    orange: "text-orange-600 dark:text-orange-400",
    violet: "text-violet-700 dark:text-violet-400",
    purple: "text-purple-600 dark:text-purple-400",
    cyan: "text-cyan-600 dark:text-cyan-400",
    amber: "text-amber-600 dark:text-amber-400",
  }
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg">
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-[var(--accent)]/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className={`relative mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-transform duration-300 group-hover:scale-110 ${circleMap[color] || circleMap.orange}`}>
        {name.charAt(0)}
      </div>
      <div className={`relative text-[10px] font-semibold uppercase tracking-wider ${labelMap[color] || labelMap.orange}`}>{label}</div>
      <div className="relative mt-1 truncate text-sm font-bold">{name}</div>
      <div className="relative text-lg font-bold">{value}</div>
      <div className="relative text-[10px] text-[var(--muted-foreground)]">{team || stat}</div>
    </div>
  )
}
