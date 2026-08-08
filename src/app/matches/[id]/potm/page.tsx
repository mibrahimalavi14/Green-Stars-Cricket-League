"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Star, Medal, ThumbsUp, Trophy, Users, Vote, Loader2, Check, X } from "lucide-react"
import VoteVerification from "@/components/VoteVerification"
import { formatDateTime } from "@/lib/utils"

interface PlayerWithVotes {
  id: string
  name: string
  role: string
  photo: string
  teamId: string
  performance: {
    battingRuns: number
    ballsFaced: number
    fours: number
    sixes: number
    bowlingWickets: number
    bowlingRuns: number
    ballsBowled: number
    catches: number
    stumpings: number
    runOuts: number
  }
  votes: number
  score: number
  hasStats: boolean
}

interface MatchInfo {
  id: string
  matchNo: number
  date: string
  venue: string
  result: string
  status: string
  team1Score: string
  team2Score: string
  team1: { id: string; name: string; shortName: string; logo: string; color: string }
  team2: { id: string; name: string; shortName: string; logo: string; color: string }
}

export default function PotmVotePage() {
  const params = useParams()
  const matchId = params.id as string

  const [match, setMatch] = useState<MatchInfo | null>(null)
  const [players, setPlayers] = useState<PlayerWithVotes[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [userVote, setUserVote] = useState<{ playerId: string; playerName: string; createdAt?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [verifiedToken, setVerifiedToken] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const fetchData = useCallback(async (voterEmail?: string) => {
    try {
      const params = new URLSearchParams({ matchId })
      if (voterEmail) params.set("email", voterEmail)
      const res = await fetch(`/api/potm?${params}`)
      if (!res.ok) throw new Error("Failed to load")
      const data = await res.json()
      setMatch(data.match)
      setPlayers(data.players)
      setTotalVotes(data.totalVotes)
      if (data.userVote) setUserVote(data.userVote)
    } catch {
      setError("Failed to load voting data")
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useEffect(() => {
    const savedEmail = localStorage.getItem("potm_email")
    const savedName = localStorage.getItem("potm_name")
    const savedToken = localStorage.getItem("potm_verified")
    if (savedEmail) setEmail(savedEmail)
    if (savedName) setName(savedName)
    if (savedToken) setVerifiedToken(savedToken)
    fetchData(savedEmail || undefined)
  }, [fetchData])

  async function handleVote() {
    if (!selectedPlayer || !email.trim() || !verifiedToken) return
    setError("")
    setSubmitting(true)
    try {
      const res = await fetch("/api/potm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          playerId: selectedPlayer,
          email: email.trim(),
          name: name.trim() || "Anonymous",
          verifiedToken,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("potm_verified")
          setVerifiedToken("")
        }
        setError(data.error || "Failed to vote")
        return
      }
      localStorage.setItem("potm_email", email.trim())
      localStorage.setItem("potm_name", name.trim() || "Anonymous")
      setSuccess(true)
      await fetchData(email.trim())
    } catch {
      setError("Network error. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const closeModal = useCallback(() => { setShowForm(false); setSelectedPlayer(null) }, [])

  useEffect(() => {
    if (!showForm) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [showForm, closeModal])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  if (!match || match.status !== "completed") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-[var(--muted-foreground)]">Voting is not available for this match.</p>
        <Link href="/fixtures" className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline">Back to Fixtures</Link>
      </div>
    )
  }

  const team1Players = players.filter(p => p.teamId === match.team1.id)
  const team2Players = players.filter(p => p.teamId === match.team2.id)
  const maxVotes = Math.max(...players.map(p => p.votes), 1)
  const topPerformerId = players.find(p => p.hasStats)?.id || null

  function PlayerCard({ player }: { player: PlayerWithVotes }) {
    const pct = totalVotes > 0 ? (player.votes / maxVotes) * 100 : 0
    const isVoted = userVote?.playerId === player.id
    const isSelected = selectedPlayer === player.id
    const isTop = player.id === topPerformerId
    const perf = player.performance
    const hasBatting = perf.ballsFaced > 0
    const hasBowling = perf.ballsBowled > 0
    const hasFielding = perf.catches > 0 || perf.stumpings > 0 || perf.runOuts > 0

    return (
      <div
        className={`relative rounded-xl border p-4 transition-all ${
          isVoted
            ? "border-green-500/50 bg-green-500/5"
            : isSelected
            ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-lg"
            : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50"
        }`}
      >
        {isTop && (
          <div className="absolute left-3 top-3">
            <span className="flex items-center gap-1 rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
              <Trophy className="h-3 w-3" /> Top performance
            </span>
          </div>
        )}
        {isVoted && (
          <div className="absolute right-3 top-3">
            <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
              <Check className="h-3 w-3" /> Your pick
            </span>
          </div>
        )}

        <div className="mb-3 flex items-center gap-3">
          {player.photo && player.photo !== "/placeholder-player.svg" ? (
            <img src={player.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)] text-lg font-bold">
              {player.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Link href={`/players/${player.id}`} className="font-semibold hover:text-[var(--accent)] hover:underline">
              {player.name}
            </Link>
            <p className="text-xs text-[var(--muted-foreground)]">{player.role}</p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {hasBatting && (
            <span className="rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500 dark:text-blue-400">
              {perf.battingRuns} runs ({perf.ballsFaced}b)
              {perf.ballsFaced > 0 && ` · SR ${((perf.battingRuns / perf.ballsFaced) * 100).toFixed(0)}`}
              {perf.fours > 0 && ` · ${perf.fours}×4`}
              {perf.sixes > 0 && ` · ${perf.sixes}×6`}
            </span>
          )}
          {hasBowling && (
            <span className="rounded-lg bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 dark:text-green-400">
              {perf.bowlingWickets} wkt · {Math.floor(perf.ballsBowled / 6)}.{perf.ballsBowled % 6} ov · {perf.bowlingRuns} runs
            </span>
          )}
          {hasFielding && (
            <span className="rounded-lg bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-500 dark:text-purple-400">
              {perf.catches > 0 && `${perf.catches} catch${perf.catches > 1 ? "es" : ""}`}
              {perf.stumpings > 0 && ` · ${perf.stumpings} stumping${perf.stumpings > 1 ? "s" : ""}`}
              {perf.runOuts > 0 && ` · ${perf.runOuts} run out${perf.runOuts > 1 ? "s" : ""}`}
            </span>
          )}
          {!hasBatting && !hasBowling && !hasFielding && (
            <span className="text-xs text-[var(--muted-foreground)]">No notable stats</span>
          )}
        </div>

        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-[var(--muted-foreground)]">
              <Vote className="h-3 w-3" /> {player.votes} vote{player.votes !== 1 ? "s" : ""}
            </span>
            {totalVotes > 0 && (
              <span className="text-[var(--muted-foreground)]">
                {((player.votes / totalVotes) * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: isVoted ? "#22c55e" : "var(--accent)",
              }}
            />
          </div>
        </div>

        {!userVote && (
          <button
            onClick={() => setSelectedPlayer(player.id)}
            disabled={!!userVote}
            className={`w-full rounded-lg py-2 text-sm font-semibold transition-colors ${
              isSelected
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
            }`}
          >
            {isSelected ? "Selected" : "Vote for POTM"}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href={`/matches/${matchId}`} className="mb-4 inline-block text-sm text-[var(--accent)] hover:underline">
        &larr; Back to Match
      </Link>

      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Star className="h-6 w-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold">Player of the Match</h1>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="text-center shrink-0">
                {match.team1.logo && <img src={match.team1.logo} alt="" className="mx-auto mb-1 h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover" />}
                <p className="text-xs sm:text-sm font-semibold">{match.team1.shortName}</p>
                <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                  {match.team1Score || ""}
                </p>
              </div>
              <span className="text-sm sm:text-lg font-bold text-[var(--muted-foreground)]">vs</span>
              <div className="text-center shrink-0">
                {match.team2.logo && <img src={match.team2.logo} alt="" className="mx-auto mb-1 h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover" />}
                <p className="text-xs sm:text-sm font-semibold">{match.team2.shortName}</p>
                <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                  {match.team2Score || ""}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                {new Date(match.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs text-green-500 font-medium truncate max-w-[120px]">{match.result}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
          <Users className="h-4 w-4" /> {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
        </div>
        {userVote && (
          <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-500">
            You voted for {userVote.playerName}
            {userVote.createdAt && (
              <span className="ml-1 text-xs opacity-80">· {formatDateTime(userVote.createdAt)}</span>
            )}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>
      )}

      {showForm && !userVote && selectedPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-[var(--accent)]" />
                <h3 className="text-lg font-bold">Vote for POTM</h3>
              </div>
              <button
                onClick={closeModal}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 px-3 py-2 text-sm">
              Voting for: <span className="font-semibold text-[var(--accent)]">{players.find(p => p.id === selectedPlayer)?.name || "Unknown"}</span>
            </div>

            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  setVerifiedToken("")
                  localStorage.removeItem("potm_verified")
                }}
                placeholder="Your email (required)"
                autoFocus
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
              />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
              />
              <VoteVerification
                email={email}
                name={name}
                purpose="potm"
                verifiedToken={verifiedToken}
                onVerified={token => {
                  setVerifiedToken(token)
                  localStorage.setItem("potm_verified", token)
                }}
                onReset={() => {
                  setVerifiedToken("")
                  localStorage.removeItem("potm_verified")
                }}
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleVote}
                  disabled={!email.trim() || !verifiedToken || !selectedPlayer || submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                  Submit Vote
                </button>
                <button
                  onClick={closeModal}
                  className="rounded-lg bg-[var(--muted)] px-4 py-2.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPlayer && !showForm && !userVote && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-foreground)] shadow-lg transition-transform hover:scale-105"
        >
          <Vote className="h-4 w-4" />
          Vote Now
        </button>
      )}

      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Medal className="h-5 w-5 text-[var(--accent)]" />
          {match.team1.name}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {team1Players.filter(p => p.hasStats).map(p => (
            <PlayerCard key={p.id} player={p} />
          ))}
          {team1Players.filter(p => p.hasStats).length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)]">No player performances recorded</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Medal className="h-5 w-5 text-[var(--accent)]" />
          {match.team2.name}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {team2Players.filter(p => p.hasStats).map(p => (
            <PlayerCard key={p.id} player={p} />
          ))}
          {team2Players.filter(p => p.hasStats).length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)]">No player performances recorded</p>
          )}
        </div>
      </div>

      {totalVotes > 0 && (
        <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Trophy className="h-5 w-5 text-[var(--accent)]" />
            Leaderboard
          </h3>
          <div className="space-y-2">
            {[...players].sort((a, b) => b.votes - a.votes).map((p, i) => {
              const pct = totalVotes > 0 ? (p.votes / totalVotes) * 100 : 0
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm font-bold text-[var(--muted-foreground)]">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className={`text-sm font-medium ${userVote?.playerId === p.id ? "text-green-500" : ""}`}>
                        {p.name}
                        {userVote?.playerId === p.id && " ✓"}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {p.votes} vote{p.votes !== 1 ? "s" : ""} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: i === 0 ? "var(--accent)" : userVote?.playerId === p.id ? "#22c55e" : "#64748b",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
