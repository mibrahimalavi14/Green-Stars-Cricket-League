"use client"

import { useState } from "react"

function PredictionsInner({
  teams,
  seasonId,
  initialPredictions,
  locked,
}: {
  teams: { id: string; name: string; shortName: string; logo: string; color: string }[]
  seasonId: string
  initialPredictions: { id: string; name: string; email: string; predictedTeamId: string; createdAt: string }[]
  locked: boolean
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [emailError, setEmailError] = useState("")
  const [predictions, setPredictions] = useState(initialPredictions)
  const [voted, setVoted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !selectedTeam) return
    if (locked) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email (e.g., name@gmail.com)")
      return
    }
    setEmailError("")
    setSubmitting(true)
    setMessage("")
    try {
      const res = await fetch("/api/season-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, predictedTeamId: selectedTeam, seasonId }),
      })
      const data = await res.json()
      if (res.ok) {
        setPredictions((prev) => [data, ...prev])
        setVoted(true)
      } else {
        setMessage(data.error || "Something went wrong")
      }
    } catch {
      setMessage("Failed to submit")
    }
    setSubmitting(false)
  }

  const teamMap = new Map(teams.map((t) => [t.id, t]))

  const teamsWithVotes = teams
    .map((t) => ({
      ...t,
      votes: predictions.filter((p) => p.predictedTeamId === t.id).length,
    }))
    .sort((a, b) => b.votes - a.votes)

  const maxVotes = teamsWithVotes[0]?.votes || 1
  const alreadyVoted = !!email && predictions.some((p) => p.email === email)

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Predict the Season Winner</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">
        {locked
          ? "Predictions are now closed. Check the results below!"
          : "Pick which team will win Season 1!"}
      </p>

      {!locked && !voted && (
        <form onSubmit={handleSubmit} className="mb-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Enter Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Enter Your Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError("") }}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                placeholder="your@email.com"
              />
              {emailError && <p className="mt-1.5 text-xs text-red-500">{emailError}</p>}
            </div>
          </div>

          {alreadyVoted ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center dark:border-green-800/40 dark:bg-green-900/20">
              <p className="text-base font-semibold text-green-700 dark:text-green-400">This email has already voted!</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium">Select Your Predicted Winner</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setSelectedTeam(team.id)}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                        selectedTeam === team.id
                          ? "border-[var(--accent)] bg-[var(--accent)]/10"
                          : "border-[var(--border)] hover:border-[var(--accent)]/50"
                      }`}
                    >
                      <img src={team.logo} alt={team.name} className="h-10 w-10 rounded-full object-cover" />
                      <span className="text-center text-xs font-medium">{team.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedTeam}
                className="w-full rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Prediction"}
              </button>
            </>
          )}

          {message && (
            <p className="mt-3 text-center text-sm text-red-500">{message}</p>
          )}
        </form>
      )}

      <div className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">Votes by Team</h2>
        <div className="space-y-3">
          {teamsWithVotes.map((team, i) => (
            <div key={team.id} className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <span className="w-6 text-center text-lg font-bold text-[var(--muted-foreground)]">{i + 1}</span>
              <img src={team.logo} alt={team.name} className="h-10 w-10 rounded-full object-cover" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                   <span className="font-semibold">{team.name}</span>
                  <span className="text-lg font-bold">{team.votes} vote{team.votes !== 1 ? "s" : ""}</span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(team.votes / maxVotes) * 100}%`,
                      backgroundColor: team.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">
          All Votes ({predictions.length})
        </h2>
        {predictions.length === 0 ? (
          <p className="text-[var(--muted-foreground)]">No predictions yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {predictions.map((p) => {
              const team = teamMap.get(p.predictedTeamId)
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--muted)] text-xs font-bold uppercase">
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{p.name}</span>
                    <span className="mx-2 text-[var(--muted-foreground)]">predicted</span>
                    {team && (
                       <span className="inline-flex items-center gap-1.5 font-semibold">
                        {team.logo && <img src={team.logo} alt="" className="h-5 w-5 rounded-full" />}
                        {team.name}
                      </span>
                    )}
                    <span className="ml-3 whitespace-nowrap text-xs text-[var(--muted-foreground)]">
                      {new Date(p.createdAt).toLocaleString("en-GB", {
                        day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit",
                        timeZone: "Asia/Karachi",
                      })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function PredictionsClient(props: {
  teams: { id: string; name: string; shortName: string; logo: string; color: string }[]
  seasonId: string
  initialPredictions: { id: string; name: string; email: string; predictedTeamId: string; createdAt: string }[]
  locked: boolean
}) {
  return <PredictionsInner {...props} />
}
