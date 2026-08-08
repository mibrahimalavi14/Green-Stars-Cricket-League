import Link from "next/link"
import Image from "next/image"
import fs from "fs"
import path from "path"
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

export const dynamic = "force-dynamic"

async function HomePage() {
  const season = await prisma.season.findFirst({ where: { isActive: true } })
  const [allTeamsData, matches, news, winners, matchCount, players] = await Promise.all([
    prisma.team.findMany({
      where: { seasonId: season?.id },
      include: { players: true, _count: { select: { players: true } } },
    }),
    prisma.match.findMany({
      take: 6,
      where: { status: { not: "completed" }, seasonId: season?.id },
      orderBy: { date: "asc" },
      include: { team1: true, team2: true },
    }),
    prisma.news.findMany({ where: { published: true }, take: 3, orderBy: { createdAt: "desc" } }),
    prisma.season.findMany({
      where: { winnerId: { not: "" } },
      include: { teams: true },
      orderBy: { year: "desc" },
    }),
    prisma.match.count({ where: { seasonId: season?.id } }),
    season ? prisma.player.findMany({ where: { team: { seasonId: season.id } }, include: { team: true } }) : Promise.resolve([]),
  ])

  const teams = allTeamsData.slice(0, 8)
  const teamCount = allTeamsData.length
  const playerCount = allTeamsData.reduce((a, b) => a + b._count.players, 0)
  const seasonRuns = players.reduce((a, p) => a + p.runs, 0)
  const hasSignature = fs.existsSync(path.join(process.cwd(), "public", "images", "optimized", "signature.png"))

  const latestNews = news.length > 0 ? news[0] : null

  let moment = await prisma.momentOfTheDay.findFirst({
    where: { active: true },
    orderBy: { date: "desc" },
  })
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayMoment = await prisma.momentOfTheDay.findFirst({
    where: { active: true, date: { gte: todayStart } },
    orderBy: { date: "desc" },
  })
  if (todayMoment) moment = todayMoment

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
          <h1 className="mb-4 text-3xl font-bold text-white sm:text-5xl md:text-7xl">
            Green Stars <span className="animate-gradient bg-gradient-to-r from-gscl-gold via-yellow-300 to-gscl-gold bg-clip-text text-transparent">Cricket League</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80">
            {season?.name || "Welcome to the most exciting cricket league"} — Where champions rise and legends are made.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/fixtures" className="animate-float rounded-lg bg-gscl-gold px-6 py-3 font-semibold text-gscl-dark transition-all hover:scale-105 hover:opacity-90">
              View Fixtures
            </Link>
            <Link href="/live" className="animate-glow-pulse rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:bg-white/10" style={{ animationDelay: "0.5s" }}>
              Live Scores
            </Link>
          </div>
        </div>
      </section>

      {moment && (
        <FadeInView>
          <section className="relative overflow-hidden border-b border-[var(--border)]">
            {moment.imageUrl && (
              <div className="absolute inset-0">
                <img src={moment.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
              </div>
            )}
            <div className={`relative mx-auto max-w-7xl px-4 py-10 ${!moment.imageUrl ? "bg-gradient-to-r from-[var(--card)] via-[var(--card)]/95 to-[var(--muted)]" : ""}`}>
              <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                <div className="flex-1 text-center md:text-left">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gscl-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gscl-gold">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gscl-gold" />
                    Moment of the Day
                  </div>
                  <h2 className="mb-2 text-2xl font-bold md:text-3xl">{moment.title}</h2>
                  {moment.description && (
                    <p className={`mb-4 max-w-xl text-sm leading-relaxed ${moment.imageUrl ? "text-white/80" : "text-[var(--muted-foreground)]"}`}>
                      {moment.description}
                    </p>
                  )}
                  {moment.link && (
                    <a href={moment.link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-gscl-gold px-5 py-2.5 text-sm font-semibold text-gscl-dark transition-all hover:scale-105 hover:opacity-90">
                      Learn More →
                    </a>
                  )}
                </div>
                {moment.imageUrl && (
                  <div className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-xl md:h-56 md:w-56">
                    <img src={moment.imageUrl} alt={moment.title} loading="lazy" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
                  </div>
                )}
              </div>
            </div>
          </section>
        </FadeInView>
      )}

      <FadeInView>
      <section className="border-b border-[var(--border)] bg-[var(--card)] py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Teams", value: teamCount, icon: Users },
              { label: "Players", value: playerCount, icon: Trophy },
              { label: "Matches", value: matchCount, icon: Calendar },
              { label: "Season Runs", value: seasonRuns, icon: Award },
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
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold sm:text-2xl">Tournament Leaders</h2>
              <div className="flex items-center gap-3">
                <Link href="/dream-team" className="text-xs text-[var(--accent)] hover:underline sm:text-sm">Dream Team</Link>
                <Link href="/players/stats" className="text-xs text-[var(--accent)] hover:underline sm:text-sm">Full Stats</Link>
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

      <FadeInView>
      <section className="content-visibility-auto border-t border-[var(--border)] bg-[var(--card)] py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Chairman&apos;s Message</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">A word from the heart of GSCL</p>
          </div>
          <div className="grid items-start gap-8 md:grid-cols-5">
            <div className="flex justify-center md:col-span-2">
              <Image
                src="/images/optimized/chairman.webp"
                alt="Chairman Hafiz Muhammad Ibrahim Alavi"
                width={1044}
                height={1507}
                className="h-auto w-56 rounded-xl shadow-lg md:w-64"
              />
            </div>
            <div className="md:col-span-3">
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                Assalam-o-Alaikum, cricket fans.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                When I look at the young cricketers of Haripur, I see the future of Pakistan cricket.
                Green Stars Cricket League was born from a simple belief — that every talented young
                player, no matter where they come from, deserves a fair chance to shine.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                The energy, the passion and the discipline you bring to every match fills me with pride.
                This league is not just about winning matches or lifting trophies; it is about building
                character, learning teamwork, and chasing dreams with heart. Every run you score and every
                wicket you take writes a new chapter in the story of GSCL.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                I want to thank every player, coach, official, sponsor and supporter who makes this dream
                possible. This is your league, and together we will take it to new heights.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                May Allah bless our league and our community. Let us keep playing with passion,
                sportsmanship and respect.
              </p>
              <div className="mt-8 border-t border-[var(--border)] pt-5 text-right">
                <p className="text-sm font-bold">Hafiz Muhammad Ibrahim Alavi</p>
                <p className="text-xs text-[var(--muted-foreground)]">Chairman, Green Stars Cricket League</p>
                {hasSignature ? (
                  <img src="/images/optimized/signature.png" alt="Signature of Hafiz Muhammad Ibrahim Alavi" className="mt-3 ml-auto h-16 w-auto rounded-lg bg-white object-contain shadow-sm ring-1 ring-[var(--border)]" loading="lazy" />
                ) : (
                  <p className="mt-4 font-serif text-xl italic text-gscl-gold" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}>
                    Hafiz Muhammad Ibrahim Alavi
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      </FadeInView>

      {matches.length > 0 && (
        <FadeInView>
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Upcoming Matches{season ? ` — ${season.name}` : ""}</h2>
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
            <h2 className="text-2xl font-bold">Teams{season ? ` — ${season.name}` : ""}</h2>
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
            <p className="mt-4 text-xs text-[var(--muted-foreground)]">Interested in partnering with GSCL? <Link href="/contact?purpose=sponsorship" className="text-[var(--accent)] hover:underline">Contact us</Link></p>
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
