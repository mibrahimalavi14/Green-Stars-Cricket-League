"use client"

import { useState, useEffect, useCallback } from "react"
import { Trophy, Loader2, Plus, Trash2, Power, Save, Calendar, Clock, Eye } from "lucide-react"

interface ChallengeQuestion {
  id?: string
  question: string
  options: string[]
  correctAnswer: string
}

interface Challenge {
  id: string
  type: string
  title: string
  pointValue: number
  timeLimitSeconds: number
  active: boolean
  date: string | null
  weekStart: string | null
  questions: ChallengeQuestion[]
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

function emptyQuestion(): ChallengeQuestion {
  return { question: "", options: ["", "", "", ""], correctAnswer: "" }
}

export default function AdminChallengesPage() {
  const [daily, setDaily] = useState<Challenge[]>([])
  const [weekly, setWeekly] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState<string>("")

  const [type, setType] = useState<"DAILY" | "WEEKLY">("DAILY")
  const [title, setTitle] = useState("")
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([emptyQuestion(), emptyQuestion()])
  const [pointValue, setPointValue] = useState(5)
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(10)
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

  function addQuestion() {
    setQuestions(prev => [...prev, emptyQuestion()])
  }

  function removeQuestion(index: number) {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  function updateQuestion(index: number, patch: Partial<ChallengeQuestion>) {
    setQuestions(prev => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  function updateOption(qIndex: number, optIndex: number, value: string) {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q
      const options = [...q.options]
      options[optIndex] = value
      return { ...q, options }
    }))
  }

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
    const clean = questions.map(q => ({
      question: q.question.trim(),
      options: q.options.map(o => o.trim()).filter(Boolean),
      correctAnswer: q.correctAnswer.trim(),
    }))
    const filled = clean.filter(q => q.question)
    if (filled.length < 12) {
      setError(`Add at least 12 questions (currently ${filled.length}). 10 are served per player — pool should be 12-20 so everyone gets different questions.`)
      return
    }
    if (filled.length > 20) {
      setError("Maximum 20 questions allowed")
      return
    }
    for (const q of filled) {
      if (q.options.length < 2) {
        setError(`Question "${q.question.slice(0, 40)}..." needs at least 2 options`)
        return
      }
      if (!q.options.includes(q.correctAnswer)) {
        setError(`Correct answer for "${q.question.slice(0, 40)}..." must match one of its options`)
        return
      }
    }
    setBusy("create")
    const res = await fetch("/api/admin/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        title: title.trim(),
        questions: filled,
        pointValue,
        timeLimitSeconds,
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
    setQuestions([emptyQuestion(), emptyQuestion()])
    setShowForm(false)
    fetchData()
  }

  function renderList(list: Challenge[], dailyMode: boolean) {
    if (list.length === 0) {
      return <p className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">No {dailyMode ? "daily" : "weekly"} challenges yet</p>
    }
    return (
      <div className="space-y-2">
        {list.map(c => (
          <div key={c.id} className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 ${!c.active ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-[var(--muted-foreground)]">
                {dailyMode ? (c.date ? pktDateInput(new Date(c.date)) : "-") : `Wk ${c.weekStart ? pktDateInput(new Date(c.weekStart)) : "-"}`}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{c.title || `${dailyMode ? "Daily" : "Weekly"} Challenge`}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {c.questions?.length || 0} questions · +{c.pointValue} pts/correct · {c.timeLimitSeconds}s/question · {c._count?.attempts || 0} attempts
                </p>
              </div>
              <button onClick={() => setExpanded(expanded === c.id ? "" : c.id)} aria-label="View questions"
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${expanded === c.id ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                <Eye className="h-4 w-4" />
              </button>
              <button onClick={() => toggleActive(c)} disabled={busy === c.id} aria-label={c.active ? "Deactivate" : "Activate"}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${c.active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                {busy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              </button>
              <button onClick={() => deleteChallenge(c.id)} aria-label="Delete challenge"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/10 text-red-500 transition-colors hover:bg-red-600/20">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {expanded === c.id && (
              <div className="mt-3 space-y-1.5 border-t border-[var(--border)] pt-3">
                {c.questions?.map((q, qi) => (
                  <div key={q.id || qi} className="rounded-lg bg-[var(--muted)]/50 p-2.5 text-xs">
                    <p className="font-medium">{qi + 1}. {q.question}</p>
                    <p className="mt-0.5 text-[var(--muted-foreground)]">
                      {q.options.join(" · ")} — <span className="text-green-500">Answer: {q.correctAnswer}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Trophy className="h-7 w-7 text-[var(--accent)]" />
          Quiz Challenges
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Daily + weekly challenges — 12-20 question pool, every player gets a random 10 with a per-question timer.
        </p>
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
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={type === "DAILY"} onChange={() => setType("DAILY")} className="accent-[var(--accent)]" />
                Daily Challenge
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={type === "WEEKLY"} onChange={() => setType("WEEKLY")} className="accent-[var(--accent)]" />
                Weekly Challenge
              </label>
            </div>

            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional, e.g. Sunday Special)" aria-label="Title"
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
                Points/correct
                <input type="number" value={pointValue} min={1} max={50} onChange={e => setPointValue(Number(e.target.value))} aria-label="Points per question"
                  className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                Sec/question
                <input type="number" value={timeLimitSeconds} min={5} max={60} onChange={e => setTimeLimitSeconds(Number(e.target.value))} aria-label="Seconds per question"
                  className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="accent-[var(--accent)]" />
                Active
              </label>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">Questions ({questions.filter(q => q.question.trim()).length} filled / 12-20 required)</p>
                <button onClick={addQuestion} disabled={questions.length >= 20} className="flex min-h-10 items-center gap-1.5 rounded-lg bg-[var(--accent)]/10 px-3 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-40">
                  <Plus className="h-4 w-4" /> Add Question
                </button>
              </div>
              {questions.map((q, qi) => (
                <div key={qi} className="mb-4 rounded-lg border border-[var(--border)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Question {qi + 1}</p>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(qi)} aria-label={`Remove question ${qi + 1}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600/20">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <input value={q.question} onChange={e => updateQuestion(qi, { question: e.target.value })} placeholder="Question" aria-label={`Question ${qi + 1}`}
                    className="mb-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, oi) => (
                      <input key={oi} value={opt} onChange={e => updateOption(qi, oi, e.target.value)}
                        placeholder={`Option ${oi + 1}`} aria-label={`Question ${qi + 1} option ${oi + 1}`}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm" />
                    ))}
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-sm">
                    Correct answer:
                    <select value={q.correctAnswer} onChange={e => updateQuestion(qi, { correctAnswer: e.target.value })} aria-label={`Question ${qi + 1} correct answer`}
                      className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                      <option value="">Select...</option>
                      {q.options.map((o, oi) => o.trim() ? <option key={oi} value={o.trim()}>{o.trim()}</option> : null)}
                    </select>
                  </label>
                </div>
              ))}
            </div>

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
            {renderList(daily, true)}
          </div>
          <div>
            <h2 className="mb-3 text-lg font-semibold">Weekly Challenges</h2>
            {renderList(weekly, false)}
          </div>
        </div>
      )}
    </div>
  )
}
