"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, Brain, ChevronDown, ChevronUp, Check, X, Sparkles, RotateCcw, Lock, LockOpen, Trophy, RefreshCw } from "lucide-react"

export default function AdminQuizPage() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [seasons, setSeasons] = useState<any[]>([])
  const [selectedSeason, setSelectedSeason] = useState("")
  const [seasonQuestions, setSeasonQuestions] = useState<any[]>([])
  const [sqLocked, setSqLocked] = useState(false)
  const [sqToggling, setSqToggling] = useState(false)
  const [sqLoading, setSqLoading] = useState(false)
  const [sqGenerating, setSqGenerating] = useState(false)
  const [sqMessage, setSqMessage] = useState("")

  const [standings, setStandings] = useState<any[]>([])
  const [standingsLoading, setStandingsLoading] = useState(false)
  const [standingsBusy, setStandingsBusy] = useState("")
  const [standingsMessage, setStandingsMessage] = useState("")

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
    if (!seasonId) { setSeasonQuestions([]); setSqLocked(false); return }
    setSqLoading(true)
    const res = await fetch(`/api/admin/season-quiz?seasonId=${seasonId}`)
    const data = await res.json()
    const arr = Array.isArray(data) ? data : []
    setSeasonQuestions(arr)
    setSqLocked(arr.length > 0 ? !!arr[0]?.season?.seasonQuizLocked : false)
    setSqLoading(false)
  }

  useEffect(() => {
    if (selectedSeason) {
      loadSeasonQuestions(selectedSeason)
      loadStandings(selectedSeason)
    }
  }, [selectedSeason])

  async function loadStandings(seasonId: string) {
    setStandingsLoading(true)
    try {
      const res = await fetch(`/api/admin/season-quiz/standings?seasonId=${seasonId}`)
      const data = await res.json()
      setStandings(Array.isArray(data?.entries) ? data.entries : [])
    } catch {
      setStandings([])
    }
    setStandingsLoading(false)
  }

  async function setStanding(name: string, action: "hide" | "show" | "auto") {
    if (!selectedSeason) return
    setStandingsBusy(name)
    setStandingsMessage("")
    const res = await fetch("/api/admin/season-quiz/standings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seasonId: selectedSeason, name, action }),
    })
    const data = await res.json()
    setStandingsBusy("")
    if (!res.ok) {
      setStandingsMessage(`Error: ${data.error || "Failed to update"}`)
    } else {
      loadStandings(selectedSeason)
    }
  }

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

  async function toggleSeasonQuizLock() {
    if (!selectedSeason) return
    const next = !sqLocked
    setSqToggling(true)
    setSqMessage("")
    const res = await fetch("/api/admin/season-quiz", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seasonId: selectedSeason, locked: next }),
    })
    const data = await res.json()
    setSqToggling(false)
    if (!res.ok) {
      setSqMessage(`Error: ${data.error || "Failed to update"}`)
    } else {
      setSqLocked(data.locked)
      setSqMessage(data.locked ? "Season quiz locked — users can no longer submit" : "Season quiz unlocked — submissions are open again")
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
          <button
            onClick={toggleSeasonQuizLock}
            disabled={!selectedSeason || sqToggling}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
              sqLocked
                ? "border-green-500/40 text-green-500 hover:bg-green-500/10"
                : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)]"
            }`}
          >
            {sqToggling ? <Loader2 className="h-4 w-4 animate-spin" /> : sqLocked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {sqLocked ? "Unlock" : "Lock"}
          </button>
        </div>
        {sqMessage && <p className="mb-3 text-sm text-[var(--muted-foreground)]">{sqMessage}</p>}

        {selectedSeason && seasonQuestions.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm">
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${seasonQuestions.length > 0 ? "bg-green-500" : "bg-[var(--muted-foreground)]"}`} />
              <span className="font-medium text-green-500">Generated</span>
            </span>
            <span className={`flex items-center gap-2 ${sqLocked ? "text-[var(--muted-foreground)]" : "text-green-500"}`}>
              {sqLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
              <span className="font-medium">{sqLocked ? "Locked" : "Open"}</span>
            </span>
            <span className="text-[var(--muted-foreground)]">Questions: <span className="font-medium text-[var(--foreground)]">{seasonQuestions.length}</span></span>
            <span className="text-[var(--muted-foreground)]">
              Generated On:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {new Date(seasonQuestions[0]?.createdAt).toLocaleString("en-GB")}
              </span>
            </span>
            <span className="text-[var(--muted-foreground)]">
              Attempts:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {seasonQuestions.reduce((sum, q) => sum + (q._count?.attempts || 0), 0)}
              </span>
            </span>
          </div>
        )}

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

        {selectedSeason && (
          <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-2 font-semibold">
                  <Trophy className="h-4 w-4 text-[var(--accent)]" /> Leaderboard Control
                </h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Top 10 show automatically · hide/show anyone manually · others stay hidden
                </p>
              </div>
              <button
                onClick={() => loadStandings(selectedSeason)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:border-[var(--accent)]"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
            {standingsMessage && <p className="mb-2 text-xs text-[var(--muted-foreground)]">{standingsMessage}</p>}

            {standingsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : standings.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">
                No participants yet
              </p>
            ) : (
              <div className="space-y-1.5">
                {standings.map((s: any) => (
                  <div
                    key={s.name}
                    className={`flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                      s.visible ? "bg-[var(--muted)]" : "bg-red-500/5"
                    }`}
                  >
                    <span className={`w-6 shrink-0 text-xs font-bold ${s.rank <= 3 ? "text-[var(--accent)]" : "text-[var(--muted-foreground)]"}`}>
                      {s.rank}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{s.name}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-[var(--accent)]">{s.score} pts</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        s.visible ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {s.visible ? "Visible" : "Hidden"}
                    </span>
                    {standingsBusy === s.name ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <div className="flex shrink-0 gap-1.5">
                        {s.autoVisible || s.isShown ? (
                          <button
                            onClick={() => setStanding(s.name, "hide")}
                            className="rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-500 hover:bg-red-500/20"
                          >
                            Hide
                          </button>
                        ) : (
                          <button
                            onClick={() => setStanding(s.name, "show")}
                            className="rounded-md bg-green-500/10 px-2 py-1 text-[10px] font-semibold text-green-500 hover:bg-green-500/20"
                          >
                            Show
                          </button>
                        )}
                        {(s.isHidden || s.isShown) && (
                          <button
                            onClick={() => setStanding(s.name, "auto")}
                            className="rounded-md bg-[var(--muted)] px-2 py-1 text-[10px] font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)]/60"
                          >
                            Auto
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
