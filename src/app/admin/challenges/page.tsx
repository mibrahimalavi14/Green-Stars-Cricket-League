"use client"

import { useState, useEffect, useCallback } from "react"
import { Trophy, Loader2, Plus, Trash2, Power, Save, Calendar, Clock } from "lucide-react"

interface Challenge {
  id: string
  type: string
  title: string
  question: string
  options: string
  correctAnswer: string
  pointValue: number
  active: boolean
  date: string | null
  weekStart: string | null
  createdAt: string
  _count?: { attempts: number }
}

function pktDateInput(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" })
}

function pktTodayInput() {
  return pktDateInput(new Date())
}

function pktMondayInput() {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }))
  const diff = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - diff)
  return monday.toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" })
}

function parseOptions(options: string) {
  try { return JSON.parse(options) } catch { return [] }
}

export default function AdminChallengesPage() {
  const [daily, setDaily] = useState<Challenge[]>([])
  const [weekly, setWeekly] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [type, setType] = useState<"DAILY" | "WEEKLY">("DAILY")
  const [title, setTitle] = useState("")
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState<string[]>(["", "", "", ""])
  const [correctAnswer, setCorrectAnswer] = useState("")
  const [pointValue, setPointValue] = useState(20)
  const [active, setActive] = useState(true)
  const [date, setDate] = useState(pktTodayInput())
  const [weekStart, setWeekStart] = useState(pktMondayInput())
  const [showForm, setShowForm] = useState(false)

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/admin/challenges")
    if (!res.ok) return
    const data = await res.json()
    setDaily(data.daily || [])
    setWeekly(data.weekly || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function toggleActive(c: Challenge) {
    setBusy(c.id)
    const res = await fetch("/api/admin/challenges", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    })
    setBusy("")
    if (res.ok) {
      setMessage("Updated")
      fetchData()
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error || "Failed to update")
    }
  }

  async function deleteChallenge(id: string) {
    if (!confirm("Delete this challenge? This cannot be undone.")) return
    const res = await fetch("/api/admin/challenges", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setMessage("Deleted")
      fetchData()
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error || "Failed to delete")
    }
  }

  async function createChallenge() {
    setError("")
    setMessage("")
    if (!question.trim() || correctAnswer.trim() === "") {
      setError("Question and correct answer are required")
      return
    }
    const cleanOptions = options.map(o => o.trim()).filter(Boolean)
    if (cleanOptions.length < 2) {
      setError("Add at least 2 options")
      return
    }
    if (!cleanOptions.includes(correctAnswer)) {
      setError("Correct answer must match one of the options")
      return
    }
    setBusy("create")
    const res = await fetch("/api/admin/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        title: title.trim(),
        question: question.trim(),
        options: cleanOptions,
        correctAnswer,
        pointValue,
        active,
        date: type === "DAILY" ? date : undefined,
        weekStart: type === "WEEKLY" ? weekStart : undefined,
      }),
    })
    setBusy("")
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Failed to create")
      return
    }
    setMessage(type === "DAILY" ? "Daily challenge created" : "Weekly challenge created")
    setTitle("")
    setQuestion("")
    setOptions(["", "", "", ""])
    setCorrectAnswer("")
    setShowForm(false)
    fetchData()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Trophy className="h-7 w-7 text-[var(--accent)]" />
          Quiz Challenges
        </h1>
        <p className="text-[var(--muted-foreground)]">Daily + weekly challenges. Points add to players&apos; total quiz score &amp; level.</p>
      </div>

      {message && <p className="mb-3 rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-500">{message}</p>}
      {error && <p className="mb-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-500">{error}</p>}

      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Plus className="h-5 w-5 text-[var(--accent)]" />
            New Challenge
          </h2>
          <button onClick={() => setShowForm(!showForm)} className="text-sm text-[var(--accent)] hover:underline">
            {showForm ? "Hide" : "Show"}
          </button>
        </div>
        {showForm && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={type === "DAILY"} onChange={() => { setType("DAILY"); setCorrectAnswer("") }} className="accent-[var(--accent)]" />
                Daily Challenge
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={type === "WEEKLY"} onChange={() => { setType("WEEKLY"); setCorrectAnswer("") }} className="accent-[var(--accent)]" />
                Weekly Challenge
              </label>
            </div>

            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional, e.g. Sunday Special)" aria-label="Title"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm" />
            <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Question" aria-label="Question"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm" />

            <div className="flex flex-wrap gap-3">
              {type === "DAILY" ? (
                <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <Calendar className="h-4 w-4" /> Date
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="Date"
                    className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
                </label>
              ) : (
                <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <Clock className="h-4 w-4" /> Week starting (Monday)
                  <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} aria-label="Week start"
                    className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
                </label>
              )}
              <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                Points
                <input type="number" value={pointValue} min={5} max={200} onChange={e => setPointValue(Number(e.target.value))} aria-label="Points"
                  className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="accent-[var(--accent)]" />
                Active
              </label>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {options.map((opt, i) => (
                <input key={i} value={opt} onChange={e => {
                  const next = [...options]
                  next[i] = e.target.value
                  setOptions(next)
                }} placeholder={`Option ${i + 1}`} aria-label={`Option ${i + 1}`}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm" />
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm">
              Correct answer:
              <select value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)} aria-label="Correct answer"
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                <option value="">Select...</option>
                {options.map((o, i) => o.trim() ? <option key={i} value={o.trim()}>{o.trim()}</option> : null)}
              </select>
            </label>

            <button onClick={createChallenge} disabled={busy === "create"}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50">
              {busy === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Create {type === "DAILY" ? "Daily" : "Weekly"} Challenge
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Daily Challenges</h2>
            {daily.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">No daily challenges yet</p>
            ) : (
              <div className="space-y-2">
                {daily.map(c => (
                  <div key={c.id} className={`flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 ${!c.active ? "opacity-60" : ""}`}>
                    <span className="w-24 shrink-0 text-xs text-[var(--muted-foreground)]">{c.date ? pktDateInput(new Date(c.date)) : "-"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{c.question}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {c.pointValue} pts · {c._count?.attempts || 0} attempts{c.title ? ` · ${c.title}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--muted-foreground)]">Answer: {c.correctAnswer}</span>
                    <button onClick={() => toggleActive(c)} disabled={busy === c.id} aria-label={c.active ? "Deactivate" : "Activate"}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${c.active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                      {busy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                    </button>
                    <button onClick={() => deleteChallenge(c.id)} aria-label="Delete challenge"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/10 text-red-500 transition-colors hover:bg-red-600/20">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Weekly Challenges</h2>
            {weekly.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">No weekly challenges yet</p>
            ) : (
              <div className="space-y-2">
                {weekly.map(c => (
                  <div key={c.id} className={`flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 ${!c.active ? "opacity-60" : ""}`}>
                    <span className="w-24 shrink-0 text-xs text-[var(--muted-foreground)]">Wk {c.weekStart ? pktDateInput(new Date(c.weekStart)) : "-"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{c.question}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {c.pointValue} pts · {c._count?.attempts || 0} attempts{c.title ? ` · ${c.title}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--muted-foreground)]">Answer: {c.correctAnswer}</span>
                    <button onClick={() => toggleActive(c)} disabled={busy === c.id} aria-label={c.active ? "Deactivate" : "Activate"}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${c.active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                      {busy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                    </button>
                    <button onClick={() => deleteChallenge(c.id)} aria-label="Delete challenge"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/10 text-red-500 transition-colors hover:bg-red-600/20">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
