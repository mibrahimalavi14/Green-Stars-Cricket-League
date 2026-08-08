import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getCurrentWorkspaceId } from "@/lib/workspace"
import { Calendar, Users, Shield, Newspaper, PlusCircle, MessageSquare, Trophy, Image, Brain, Star, Sparkles, BarChart3, Database, FileText, Activity, FlaskConical, PenLine, Users2 } from "lucide-react"

export const dynamic = "force-dynamic"

async function AdminPage() {
  const workspaceId = await getCurrentWorkspaceId()

  const [teams, players, matches, news, contacts] = await Promise.all([
    prisma.team.count({ where: { season: { workspaceId } } }),
    prisma.player.count({ where: { team: { season: { workspaceId } } } }),
    prisma.match.count({ where: { season: { workspaceId } } }),
    prisma.news.count(),
    prisma.contact.count(),
  ])
  const counts = { teams, players, matches, news, contacts }

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

        <Link href="/admin/practice" className="rounded-xl border border-purple-500/40 bg-[var(--card)] p-6 transition-all hover:border-purple-500 hover:shadow-lg">
          <FlaskConical className="mb-3 h-8 w-8 text-purple-500" />
          <h3 className="text-lg font-semibold">Practice / Training</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Clone season, practice matches, promote setups</p>
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

        <Link href="/admin/gallery" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Image className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Gallery</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Manage photo gallery</p>
        </Link>

        <Link href="/admin/sponsors" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Users className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Sponsors</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Manage sponsors</p>
        </Link>

        <Link href="/admin/quiz" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Brain className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Quizzes</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Create & manage match quizzes</p>
        </Link>

        <Link href="/admin/squad" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Users className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Squad</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Set playing XI per match</p>
        </Link>

        <Link href="/admin/potm" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Star className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">POTM Voting</h3>
          <p className="text-sm text-[var(--muted-foreground)]">View votes & set official MOTM</p>
        </Link>

        <Link href="/admin/player-of-season" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Trophy className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Player of Season</h3>
          <p className="text-sm text-[var(--muted-foreground)]">View votes & announce winner</p>
        </Link>

        <Link href="/admin/news" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Newspaper className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">News</h3>
          <p className="text-2xl font-bold">{counts.news}</p>
          <p className="text-sm text-[var(--muted-foreground)]">Manage news articles</p>
        </Link>

        <Link href="/admin/moments" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Sparkles className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Moment of the Day</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Feature daily highlights & milestones</p>
        </Link>

        <Link href="/admin/matches?action=add" className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <PlusCircle className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Quick Add</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Add new match</p>
        </Link>

        <Link href="/admin/analytics" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <BarChart3 className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Analytics</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Usage metrics & trends for v2.0 planning</p>
        </Link>

        <Link href="/admin/restore" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-amber-500/50 hover:shadow-lg">
          <Database className="mb-3 h-8 w-8 text-amber-500" />
          <h3 className="text-lg font-semibold">Data Restore</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Recalculate stats, rebuild snapshots, restore data</p>
        </Link>

        <Link href="/admin/system" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-green-500/50 hover:shadow-lg">
          <Activity className="mb-3 h-8 w-8 text-green-500" />
          <h3 className="text-lg font-semibold">System Monitor</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Health, DB, errors, backups, storage</p>
        </Link>

        <Link href="/admin/match-notes" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-blue-500/50 hover:shadow-lg">
          <FileText className="mb-3 h-8 w-8 text-blue-500" />
          <h3 className="text-lg font-semibold">Match Notes</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Weather, pitch, injuries, fines, referee notes</p>
        </Link>

        <Link href="/admin/contact" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <MessageSquare className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Contact Messages</h3>
          <p className="text-2xl font-bold">{counts.contacts}</p>
          <p className="text-sm text-[var(--muted-foreground)]">View messages from visitors</p>
        </Link>

        <Link href="/admin/chairman-message" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <PenLine className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Chairman's Message</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Edit the home page message, name & signature</p>
        </Link>

        <Link href="/admin/management" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg">
          <Users2 className="mb-3 h-8 w-8 text-[var(--accent)]" />
          <h3 className="text-lg font-semibold">Management</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Add, edit & remove management members</p>
        </Link>
      </div>
    </div>
  )
}

export default AdminPage
