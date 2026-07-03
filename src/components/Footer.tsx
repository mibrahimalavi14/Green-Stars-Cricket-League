import Link from "next/link"
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-lg font-bold text-[var(--accent)]">GSCL</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Green Stars Cricket League - Where champions are made. Follow us for live scores, updates, and more.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Quick Links</h4>
            <div className="flex flex-col gap-2 text-sm text-[var(--muted-foreground)]">
              <Link href="/teams" className="transition-colors hover:text-[var(--accent)]">Teams</Link>
              <Link href="/fixtures" className="transition-colors hover:text-[var(--accent)]">Fixtures</Link>
              <Link href="/points-table" className="transition-colors hover:text-[var(--accent)]">Standings</Link>
              <Link href="/predictions" className="transition-colors hover:text-[var(--accent)]">Predictions</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Contact</h4>
            <div className="flex flex-col gap-2 text-sm text-[var(--muted-foreground)]">
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Karachi, Pakistan</span>
              <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@gscl.pk</span>
              <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> +92 300 1234567</span>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Follow Us</h4>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/greenstarscricketleague" target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--muted)] p-2 transition-colors hover:bg-[var(--accent)]">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="rounded-full bg-[var(--muted)] p-2 transition-colors hover:bg-[var(--accent)]">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://www.instagram.com/green_stars_cricket_league" target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--muted)] p-2 transition-colors hover:bg-[var(--accent)]">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://www.youtube.com/@GreenStarsCricketLeague" target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--muted)] p-2 transition-colors hover:bg-[var(--accent)]">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-[var(--border)] pt-6 text-center text-sm text-[var(--muted-foreground)]">
          &copy; {new Date().getFullYear()} Green Stars Cricket League. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
