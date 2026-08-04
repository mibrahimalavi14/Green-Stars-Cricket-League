"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, Brain, ChevronDown, ChevronUp, Check, X, Sparkles, RotateCcw } from "lucide-react"

export default function AdminQuizPage() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [seasons, setSeasons] = useState<any[]>([])
  const [selectedSeason, setSelectedSeason] = useState("")
  const [seasonQuestions, setSeasonQuestions] = useState<any[]>([])
  const [sqLoading, setSqLoading] = useState(false)
  const [sqGenerating, setSqGenerating] = useState(false)
  const [sqMessage, setSqMessage] = useState("")

  const [matchId, setMatchId] = useState("")
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", "", "", ""])
  const [correctAnswer, setCorrectAnswer] = useState("")
  const [pointValue, setPointValue] = useState(10)
  const [adding, setAdding] = useState(false)

  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<Record<string, any[]>>({})

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [matchesRes, quizzesRes, seasonsRes] = await Promise.all([
      fetch("/api/matches"),
      fetch("/api/quiz"),
      fetch("/api/seasons"),
    ])
    const matchesData = await matchesRes.json()
    const quizzesData = await quizzesRes.json()
    const seasonsData = await seasonsRes.json()
    setMatches(Array.isArray(matchesData) ? matchesData : [])
    setQuizzes(Array.isArray(quizzesData) ? quizzesData : [])
    const seasonsArr = Array.isArray(seasonsData) ? seasonsData : Array.isArray(seasonsData?.seasons) ? seasonsData.seasons : []
    setSeasons(seasonsArr)
    if (seasonsArr.length > 0) {
      const active = seasonsArr.find((s: any) => s.isActive) || seasonsArr[0]
      setSelectedSeason(active.id)
    }
    setLoading(false)
  }

  async function loadSeasonQuestions(seasonId: string) {
    if (!seasonId) { setSeasonQuestions([]); return }
    setSqLoading(true)
    const res = await fetch(`/api/admin/season-quiz?seasonId=${seasonId}`)
    const data = await res.json()
    setSeasonQuestions(Array.isArray(data) ? data : [])
    setSqLoading(false)
  }

  useEffect(() => {
    if (selectedSeason) loadSeasonQuestions(selectedSeason)
  }, [selectedSeason])

  async function generateSeasonQuiz() {
    if (!selectedSeason) return
    if (!confirm("Regenerate the season quiz? This deletes existing questions and all attempts.")) return
    setSqGenerating(true)
    setSqMessage("")
    const res = await fetch("/api/admin/season-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seasonId: selectedSeason }),
    })
    const data = await res.json()
    setSqGenerating(false)
    if (!res.ok) {
      setSqMessage(`Error: ${data.error || "Failed to generate"}`)
    } else {
      setSqMessage(`Generated ${data.count} questions`)
      loadSeasonQuestions(selectedSeason)
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 30) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString("en-GB")
  }

  function updateOption(index: number, value: string) {
    const next = [...options]
    next[index] = value
    setOptions(next)
  }

  function addOption() {
    setOptions([...options, ""])
  }

  function removeOption(index: number) {
    if (options.length <= 2) return
    const next = options.filter((_, i) => i !== index)
    setOptions(next)
    if (correctAnswer === options[index]) setCorrectAnswer("")
  }

  async function addQuiz() {
    if (!matchId || !question.trim() || options.filter(o => o.trim()).length < 2 || !correctAnswer) return
    setAdding(true)
    const filteredOptions = options.filter(o => o.trim())
    await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        question: question.trim(),
        options: filteredOptions,
        correctAnswer,
        pointValue,
      }),
    })
    setMatchId("")
    setQuestion("")
    setOptions(["", "", "", ""])
    setCorrectAnswer("")
    setPointValue(10)
    setAdding(false)
    fetchData()
  }

  async function deleteQuiz(id: string) {
    if (!confirm("Delete this quiz and all its attempts?")) return
    await fetch(`/api/quiz?id=${id}`, { method: "DELETE" })
    fetchData()
  }

  async function toggleExpand(quizId: string) {
    if (expandedQuiz === quizId) {
      setExpandedQuiz(null)
      return
    }
    setExpandedQuiz(quizId)
    if (!attempts[quizId]) {
      const res = await fetch(`/api/quiz/leaderboard?quizId=${quizId}`)
      const data = await res.json()
      setAttempts(prev => ({ ...prev, [quizId]: Array.isArray(data) ? data : [] }))
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
        <Brain className="h-7 w-7 text-[var(--accent)]" />
        Match Quizzes
      </h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Create and manage match quizzes</p>

      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 font-semibold">Create Quiz</h2>
        <div className="space-y-3">
          <select
            value={matchId}
            onChange={e => setMatchId(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
          >
            <option value="">Select a match</option>
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                {m.team1?.shortName || "?"} vs {m.team2?.shortName || "?"} ({new Date(m.date).toLocaleDateString("en-GB")})
              </option>
            ))}
          </select>

          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Quiz question"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Options</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={opt}
                  onChange={e => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
                />
                <label className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswer === opt}
                    onChange={() => setCorrectAnswer(opt)}
                    className="accent-[var(--accent)]"
                  />
                  Correct
                </label>
                {options.length > 2 && (
                  <button onClick={() => removeOption(i)} className="p-1 text-red-500 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addOption}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              + Add option
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Point Value</label>
              <input
                type="number"
                value={pointValue}
                onChange={e => setPointValue(Number(e.target.value))}
                min={1}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
              />
            </div>
          </div>

          <button
            onClick={addQuiz}
            disabled={!matchId || !question.trim() || options.filter(o => o.trim()).length < 2 || !correctAnswer || adding}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Quiz
          </button>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-1 flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          Season Quiz (Auto-generated)
        </h2>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          Generates 30–40 questions from the season's data with 4 options each. Runs automatically when the season completes.
        </p>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <select
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
          >
            <option value="">Select a season</option>
            {seasons.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
            ))}
          </select>
          <button
            onClick={generateSeasonQuiz}
            disabled={!selectedSeason || sqGenerating}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
          >
            {sqGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Generate Season Quiz
          </button>
        </div>
        {sqMessage && <p className="mb-3 text-sm text-[var(--muted-foreground)]">{sqMessage}</p>}

        {sqLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : selectedSeason && seasonQuestions.length > 0 ? (
          <div className="space-y-2">
            {seasonQuestions.map((q: any, i: number) => (
              <div key={q.id} className="rounded-lg border border-[var(--border)] p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--muted-foreground)]">{q.position}.</span>
                  <p className="flex-1 text-sm font-medium">{q.question}</p>
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">Answer: {q.correctAnswer}</span>
                </div>
                <div className="mt-2 grid gap-1 sm:grid-cols-2">
                  {(() => {
                    let opts: string[] = []
                    try { opts = JSON.parse(q.options) } catch {}
                    return opts.map((opt: string, oi: number) => (
                      <div key={oi} className="flex items-center gap-1.5 text-xs">
                        <span className="text-[var(--muted-foreground)]">{String.fromCharCode(65 + oi)}.</span>
                        <span>{opt}</span>
                        {opt === q.correctAnswer && <Check className="h-3 w-3 text-green-500" />}
                      </div>
                    ))
                  })()}
                </div>
              </div>
            ))}
          </div>
        ) : selectedSeason ? (
          <div className="rounded-lg border border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            No season quiz yet — click Generate to create one
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted-foreground)]">No quizzes yet</div>
      ) : (
        <div className="space-y-3">
          {quizzes.map(q => (
            <div key={q.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center gap-4 p-4">
                <button
                  onClick={() => toggleExpand(q.id)}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  {expandedQuiz === q.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                <div className="flex-1">
                  <p className="font-medium">{q.question}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {q.match?.team1?.shortName || "?"} vs {q.match?.team2?.shortName || "?"}
                    {" · "}{q._count?.attempts || 0} attempts
                    {" · "}{q.pointValue} pts
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${q.active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                    {q.active ? "Active" : "Inactive"}
                  </span>
                  <button onClick={() => deleteQuiz(q.id)} className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expandedQuiz === q.id && (
                <div className="border-t border-[var(--border)] px-4 pb-4 pt-3">
                  <p className="mb-2 text-sm font-medium">Correct answer: <span className="text-green-500">{q.correctAnswer}</span></p>
                  <div className="space-y-1">
                    {(() => {
                      let opts: string[] = []
                      try { opts = JSON.parse(q.options) } catch {}
                      return opts.map((opt: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-[var(--muted-foreground)]">{i + 1}.</span>
                          <span>{opt}</span>
                          {opt === q.correctAnswer && <Check className="h-3.5 w-3.5 text-green-500" />}
                        </div>
                      ))
                    })()}
                  </div>

                  {attempts[q.id] && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium">Attempts ({attempts[q.id].length})</p>
                      {attempts[q.id].length === 0 ? (
                        <p className="text-sm text-[var(--muted-foreground)]">No attempts yet</p>
                      ) : (
                        <div className="space-y-1">
                          {attempts[q.id].map((a: any) => (
                            <div key={a.id} className="flex items-center gap-3 rounded-lg bg-[var(--muted)] px-3 py-2 text-sm">
                              <span className="font-medium">{a.name}</span>
                              <span className="text-[var(--muted-foreground)]">{a.email}</span>
                              {a.correct ? (
                                <Check className="ml-auto h-4 w-4 text-green-500" />
                              ) : (
                                <X className="ml-auto h-4 w-4 text-red-500" />
                              )}
                              <span className="text-xs text-[var(--muted-foreground)]">{timeAgo(a.createdAt)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
