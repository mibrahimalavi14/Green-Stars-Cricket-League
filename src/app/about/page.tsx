import Image from "next/image"
import { Users, Star, Heart, MapPin } from "lucide-react"

export const dynamic = "force-dynamic"

function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">About GSCL</h1>
      <p className="mb-10 text-[var(--muted-foreground)]">
        Green Stars Cricket League — a vision born in Haripur, powered by passion.
      </p>

      <div className="mb-12 overflow-hidden rounded-xl border border-[var(--border)]">
        <Image
          src="/images/optimized/banner.webp"
          alt="Green Stars Cricket League"
          width={1024}
          height={400}
          priority
          className="h-64 w-full object-cover md:h-80"
        />
      </div>

      <div className="mb-12 grid gap-8">
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="relative bg-gradient-to-br from-gscl-gold/20 via-gscl-dark to-gscl-gold/10 p-6">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(circle at 30% 50%, rgba(255,215,0,0.4) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(0,0,0,0.3) 0%, transparent 50%)"}} />
            <Image
              src="/images/optimized/chairman.webp"
              alt="Chairman Muhammad Ibrahim Alavi"
              width={600}
              height={600}
              className="relative w-full rounded-xl shadow-lg"
            />
          </div>
          <div className="p-6">
            <h2 className="mb-1 text-center text-xl font-bold">Chairman</h2>
            <p className="mb-3 text-center text-sm font-bold text-[var(--muted-foreground)]">Muhammad Ibrahim Alavi</p>
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
              GSCL is not just a league — it is a platform for the youth of Haripur to showcase their talent and
              pursue their dreams. My vision is to build a cricket ecosystem where every player, regardless of
              their background, gets a fair chance to rise. The passion I see in these young cricketers reminds
              me why we started this journey.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12 space-y-6 text-sm leading-relaxed text-[var(--muted-foreground)]">
        <p>
          The <strong className="text-[var(--foreground)]">Green Stars Cricket League (GSCL)</strong> is a
          fast-growing grassroots cricket league based in Haripur, Pakistan. Founded with the mission to
          discover and nurture local cricketing talent, GSCL brings together teams from across the region
          to compete in an exciting, high-energy 4-over format.
        </p>
        <p>
        Our league is built on the values of sportsmanship, competition, and community. Every season, 8
        teams battle through a round-robin league stage, followed by playoffs, culminating in a
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
            <Users className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <h3 className="mb-1 font-semibold">8 Teams</h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            Each with a unique identity and a squad of passionate players.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Star className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <h3 className="mb-1 font-semibold">4-Over Format</h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            Fast-paced, action-packed cricket where every ball counts — perfect for modern audiences and players alike.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <MapPin className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <h3 className="mb-1 font-semibold">Haripur, Pakistan</h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            A grassroots league rooted in the local community, nurturing talent from the region.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-xl font-bold">Contact & Follow</h2>
        </div>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          Based in Haripur, Pakistan. Follow us on social media for the latest updates, live scores, and behind-the-scenes content.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">

          <a href="https://www.instagram.com/green_stars_cricket_league" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]">
            Instagram
          </a>
          <a href="https://www.youtube.com/@GreenStarsCricketLeague" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]">
            YouTube
          </a>
          <a href="/contact" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]">
            Contact Us
          </a>
          <a href="/about/version" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]">
            Version Info
          </a>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
