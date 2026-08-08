"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Trophy, Vote, Loader2, ThumbsUp, Check, X, Crown, Users, Medal } from "lucide-react"
import VoteVerification from "@/components/VoteVerification"
import { formatDateTime } from "@/lib/utils"

interface SeasonInfo {
  id: string
  name: string
  year: number
}

interface Nominee {
  id: string
  name: string
  role: string
  photo: string
  teamId: string
  teamName: string
  teamShortName: string
  teamLogo: string
  runs: number
  wickets: number
  catches: number
  innings: number
  impact: number
  votes: number
}

export default function PlayerOfSeasonPage() {
  const [seasons, setSeasons] = useState<SeasonInfo[]>([])
  const [seasonId, setSeasonId] = useState("")
  const [nominees, setNominees] = useState<Nominee[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [userVote, setUserVote] = useState<{ playerId: string; playerName: string; createdAt?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [verifiedToken, setVerifiedToken] = useState("")
  const [selectedPlayer, setSelectedPlayer] = useState<Nominee | null>(null)
  const [error, setError] = useState("")
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem("pos_email")
    const savedName = localStorage.getItem("pos_name")
    const savedToken = localStorage.getItem("pos_verified")
    if (savedEmail) setEmail(savedEmail)
    if (savedName) setName(savedName)
    if (savedToken) setVerifiedToken(savedToken)

    fetch("/api/seasons")
      .then(r => r.json())
      .then((data: SeasonInfo[]) => {
        setSeasons(data)
        if (data.length > 0) setSeasonId(data[0].id)
      })
      .catch(() => setError("Failed to load seasons"))
      .finally(() => {
        setLoading(false)
        setInitialized(true)
      })
  }, [])

  const fetchData = useCallback(async (sid: string, voterEmail?: string) => {
    if (!sid) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ seasonId: sid })
      if (voterEmail) params.set("email", voterEmail)
      const res = await fetch(`/api/player-of-season?${params}`)
      if (!res.ok) throw new Error("Failed to load")
      const data = await res.json()
      setNominees(data.nominees)
      setTotalVotes(data.totalVotes)
      if (data.userVote) setUserVote(data.userVote)
      setError("")
    } catch {
      setError("Failed to load voting data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialized || !seasonId) return
    const savedEmail = localStorage.getItem("pos_email")
    fetchData(seasonId, savedEmail || undefined)
  }, [seasonId, initialized, fetchData])

  async function handleVote() {
    if (!selectedPlayer || !email.trim() || !seasonId || !verifiedToken) return
    setError("")
    setSubmitting(true)
    try {
      const res = await fetch("/api/player-of-season", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seasonId,
          playerId: selectedPlayer.id,
          email: email.trim(),
          name: name.trim() || "Anonymous",
          verifiedToken,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("pos_verified")
          setVerifiedToken("")
        }
        setError(data.error || "Failed to vote")
        return
      }
      localStorage.setItem("pos_email", email.trim())
      localStorage.setItem("pos_name", name.trim() || "Anonymous")
      setSelectedPlayer(null)
      await fetchData(seasonId, email.trim())
    } catch {
      setError("Network error. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const closeModal = useCallback(() => setSelectedPlayer(null), [])

  useEffect(() => {
    if (!selectedPlayer) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [selectedPlayer, closeModal])

  const maxVotes = Math.max(...nominees.map(p => p.votes), 1)
  const leaderboard = [...nominees].sort((a, b) => b.votes - a.votes || b.impact - a.impact)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-2 flex items-center gap-2">
        <Trophy className="h-6 w-6 text-[var(--accent)]" />
        <h1 className="text-3xl font-bold">Player of the Season</h1>
      </div>
      <p className="mb-6 text-[var(--muted-foreground)]">
        Vote for the standout performer of the season. One vote per email.
      </p>

      {seasons.length > 1 && (
        <div className="mb-6 flex items-center gap-3">
          <label htmlFor="season-select" className="text-sm text-[var(--muted-foreground)]">Season</label>
          <select
            id="season-select"
            value={seasonId}
            onChange={e => { setSeasonId(e.target.value); setUserVote(null) }}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          >
            {seasons.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
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

      {error && !loading && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
        </div>
      ) : nominees.length === 0 ? (
        <p className="py-12 text-center text-[var(--muted-foreground)]">
          No players found for this season yet. Votes open once completed matches exist.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {leaderboard.map(p => {
            const isVoted = userVote?.playerId === p.id
            const isSelected = selectedPlayer?.id === p.id
            const pct = totalVotes > 0 ? (p.votes / maxVotes) * 100 : 0
            return (
              <div
                key={p.id}
                className={`relative rounded-xl border p-4 transition-all ${
                  isVoted
                    ? "border-green-500/50 bg-green-500/5"
                    : isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-lg"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50"
                }`}
              >
                {isVoted && (
                  <div className="absolute right-3 top-3">
                    <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                      <Check className="h-3 w-3" /> Your pick
                    </span>
                  </div>
                )}

                <div className="mb-3 flex items-center gap-3">
                  {p.photo && p.photo !== "/placeholder-player.svg" ? (
                    <img src={p.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)] text-lg font-bold">
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/players/${p.id}`} className="font-semibold hover:text-[var(--accent)] hover:underline">
                      {p.name}
                    </Link>
                    <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                      {p.teamLogo && <img src={p.teamLogo} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />}
                      {p.teamName} · {p.role}
                    </p>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  {p.runs > 0 && (
                    <span className="rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500 dark:text-blue-400">
                      {p.runs} runs
                    </span>
                  )}
                  {p.wickets > 0 && (
                    <span className="rounded-lg bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 dark:text-green-400">
                      {p.wickets} wickets
                    </span>
                  )}
                  {p.catches > 0 && (
                    <span className="rounded-lg bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-500 dark:text-purple-400">
                      {p.catches} catches
                    </span>
                  )}
                  <span className="rounded-lg bg-[var(--muted)] px-2 py-1 text-xs text-[var(--muted-foreground)]">
                    {p.innings} innings
                  </span>
                </div>

                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-[var(--muted-foreground)]">
                      <Vote className="h-3 w-3" /> {p.votes} vote{p.votes !== 1 ? "s" : ""}
                    </span>
                    {totalVotes > 0 && (
                      <span className="text-[var(--muted-foreground)]">
                        {((p.votes / totalVotes) * 100).toFixed(0)}%
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
                    onClick={() => setSelectedPlayer(p)}
                    disabled={!!userVote}
                    className={`w-full rounded-lg py-2 text-sm font-semibold transition-colors ${
                      isSelected
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                        : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                    }`}
                  >
                    {isSelected ? "Selected" : "Vote for Player of the Season"}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selectedPlayer && !userVote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[var(--accent)]" />
                <h3 className="text-lg font-bold">Vote for Player of the Season</h3>
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
              Voting for: <span className="font-semibold text-[var(--accent)]">{selectedPlayer.name}</span>
            </div>

            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  setVerifiedToken("")
                  localStorage.removeItem("pos_verified")
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
                purpose="pos"
                verifiedToken={verifiedToken}
                onVerified={token => {
                  setVerifiedToken(token)
                  localStorage.setItem("pos_verified", token)
                }}
                onReset={() => {
                  setVerifiedToken("")
                  localStorage.removeItem("pos_verified")
                }}
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleVote}
                  disabled={!email.trim() || !verifiedToken || submitting}
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
    </div>
  )
}
