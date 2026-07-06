"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { signIn } from "next-auth/react"
import { AuthProvider } from "./AuthProvider"

function PredictionsInner({
  teams,
  seasonId,
  initialPredictions,
  locked,
}: {
  teams: { id: string; name: string; shortName: string; logo: string; color: string }[]
  seasonId: string
  initialPredictions: { id: string; name: string; email: string; predictedTeamId: string }[]
  locked: boolean
}) {
  const { data: session } = useSession()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [predictions, setPredictions] = useState(initialPredictions)

  useEffect(() => {
    if (session?.user) {
      if (session.user.name) setName(session.user.name)
      if (session.user.email) setEmail(session.user.email)
    }
  }, [session])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !selectedTeam) return
    if (locked) return
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
        setMessage("Prediction submitted!")
        setPredictions((prev) => [data, ...prev])
        setName("")
        setEmail("")
        setSelectedTeam("")
      } else {
        setMessage(data.error || "Something went wrong")
      }
    } catch {
      setMessage("Failed to submit")
    }
    setSubmitting(false)
  }

  const teamMap = new Map(teams.map((t) => [t.id, t]))

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Predict the Season Winner</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">
        {locked
          ? "Predictions are now closed. Check the results below!"
          : "Pick which team will win Season 1!"}
      </p>

      {!locked && (
        <form onSubmit={handleSubmit} className="mb-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
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
              <label className="mb-1 block text-sm font-medium">Enter Your Gmail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                placeholder="your.email@gmail.com"
              />
            </div>
          </div>

          <div className="mb-6">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/predictions", redirect: true })}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--border)] bg-white px-6 py-2.5 text-sm font-medium text-gray-900 transition-all hover:bg-gray-50 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

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

          {message && (
            <p className={`mt-3 text-center text-sm ${message === "Prediction submitted!" ? "text-green-600" : "text-red-500"}`}>
              {message}
            </p>
          )}
        </form>
      )}

      <div>
        <h2 className="mb-4 text-xl font-semibold">
          Predictions ({predictions.length})
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
                      <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: team.color }}>
                        {team.logo && <img src={team.logo} alt="" className="h-4 w-4 rounded-full" />}
                        {team.name}
                      </span>
                    )}
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
  initialPredictions: { id: string; name: string; email: string; predictedTeamId: string }[]
  locked: boolean
}) {
  return (
    <AuthProvider>
      <PredictionsInner {...props} />
    </AuthProvider>
  )
}
