import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Calendar, Users, Shield, Newspaper, PlusCircle, MessageSquare, Trophy } from "lucide-react"

export const dynamic = "force-dynamic"

async function AdminPage() {

  const counts = {
    teams: await prisma.team.count(),
    players: await prisma.player.count(),
    matches: await prisma.match.count(),
    news: await prisma.news.count(),
    contacts: await prisma.contact.count(),
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Admin Dashboard</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Manage your cricket league</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/teams" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Users className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Teams</h3>
          <p className="text-2xl font-bold">{counts.teams}</p>
          <p className="text-sm text-[var(--muted-foreground)]">Manage teams</p>
        </Link>

        <Link href="/admin/players" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Shield className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Players</h3>
          <p className="text-2xl font-bold">{counts.players}</p>
          <p className="text-sm text-[var(--muted-foreground)]">Manage players</p>
        </Link>

        <Link href="/admin/matches" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Calendar className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Matches</h3>
          <p className="text-2xl font-bold">{counts.matches}</p>
          <p className="text-sm text-[var(--muted-foreground)]">Manage fixtures & scores</p>
        </Link>



          <Link href="/admin/seasons" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Calendar className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Seasons</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Manage seasons & prediction lock</p>
        </Link>

        <Link href="/admin/performances" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Shield className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Performances</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Enter player batting/bowling stats</p>
        </Link>

        <Link href="/admin/predictions" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Trophy className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Predictions</h3>
          <p className="text-sm text-[var(--muted-foreground)]">View season predictions</p>
        </Link>

        <Link href="/admin/news" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Newspaper className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">News</h3>
          <p className="text-2xl font-bold">{counts.news}</p>
          <p className="text-sm text-[var(--muted-foreground)]">Manage news articles</p>
        </Link>

        <Link href="/admin/matches?action=add" className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <PlusCircle className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Quick Add</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Add new match</p>
        </Link>

        <Link href="/admin/contact" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <MessageSquare className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Contact Messages</h3>
          <p className="text-2xl font-bold">{counts.contacts}</p>
          <p className="text-sm text-[var(--muted-foreground)]">View messages from visitors</p>
        </Link>
      </div>
    </div>
  )
}

export default AdminPage
