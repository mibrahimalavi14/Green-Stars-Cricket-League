import { Shield, Users, Trophy, Star, Target, Heart } from "lucide-react"

export const dynamic = "force-dynamic"

function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">About GSCL</h1>
      <p className="mb-10 text-[var(--muted-foreground)]">
        Green Stars Cricket League — a vision born in Lahore, powered by passion.
      </p>

      <div className="mb-12 overflow-hidden rounded-xl border border-[var(--border)]">
        <img
          src="/images/teams/Banner.jpg"
          alt="Green Stars Cricket League"
          className="h-64 w-full object-cover md:h-80"
        />
      </div>

      <div className="mb-12 space-y-6 text-sm leading-relaxed text-[var(--muted-foreground)]">
        <p>
          The <strong className="text-[var(--foreground)]">Green Stars Cricket League (GSCL)</strong> is a
          fast-growing grassroots cricket league based in Lahore, Pakistan. Founded with the mission to
          discover and nurture local cricketing talent, GSCL brings together teams from across the region
          to compete in an exciting, high-energy 5-over format.
        </p>
        <p>
          Our league is built on the values of sportsmanship, competition, and community. Every season, 7
          teams battle through a double round-robin league stage, followed by playoffs, culminating in a
          grand final to crown the champion. From raw pace to classic swing, from powerful hitting to
          clever spin — GSCL is where the future stars of Pakistan cricket rise.
        </p>
        <p>
          With live scoring, player statistics, and real-time standings, GSCL offers fans a complete
          cricketing experience. Whether you are a player, a supporter, or a scout, GSCL is your
          platform to connect with the game you love.
        </p>
      </div>

      <div className="mb-12 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Trophy className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <h3 className="mb-1 font-semibold">Our Mission</h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            To provide a competitive platform for local cricketers and promote the sport at the grassroots level in Pakistan.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Users className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <h3 className="mb-1 font-semibold">7 Teams</h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            Each representing a unique identity, with their own captain, coach, and squad of passionate players.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Star className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <h3 className="mb-1 font-semibold">5-Over Format</h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            Fast-paced, action-packed cricket where every ball counts — perfect for modern audiences and players alike.
          </p>
        </div>
      </div>

      <div className="mb-12 rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
        <h2 className="mb-6 text-xl font-bold">League Format</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-bold text-[var(--accent)]">
              1
            </div>
            <div>
              <h4 className="mb-1 font-medium">Double Round Robin</h4>
              <p className="text-xs text-[var(--muted-foreground)]">
                Each team plays every other team twice — once home, once away. A total of 42 league matches.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-bold text-[var(--accent)]">
              2
            </div>
            <div>
              <h4 className="mb-1 font-medium">Points System</h4>
              <p className="text-xs text-[var(--muted-foreground)]">
                Win = 2 points, Tie/No Result = 1 point, Loss = 0 points. Net Run Rate decides ties.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-bold text-[var(--accent)]">
              3
            </div>
            <div>
              <h4 className="mb-1 font-medium">Playoffs</h4>
              <p className="text-xs text-[var(--muted-foreground)]">
                Top 4 teams qualify. Qualifier 1, Eliminator, Qualifier 2, and the Grand Final.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-bold text-[var(--accent)]">
              4
            </div>
            <div>
              <h4 className="mb-1 font-medium">Player Stats</h4>
              <p className="text-xs text-[var(--muted-foreground)]">
                Every run, wicket, and catch tracked. Batting, bowling, and fielding leaderboards updated live.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-xl font-bold">Contact & Follow</h2>
        </div>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          Based in Lahore, Pakistan. Follow us on social media for the latest updates, live scores, and behind-the-scenes content.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <a href="https://www.facebook.com/greenstarscricketleague" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]">
            Facebook
          </a>
          <a href="https://www.instagram.com/green_stars_cricket_league" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]">
            Instagram
          </a>
          <a href="https://www.youtube.com/@GreenStarsCricketLeague" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]">
            YouTube
          </a>
          <a href="/contact" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
