"use client"

import { useState, useEffect } from "react"
import { Brain, Trophy, Medal, Check, X, Loader2, Sparkles, RotateCcw, Lock } from "lucide-react"

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

export default function QuizPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [quizMap, setQuizMap] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ correct: boolean; correctAnswer: string; points: number } | null>(null)
  const [userAttempt, setUserAttempt] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [showLb, setShowLb] = useState(false)
  const [error, setError] = useState("")

  const [seasonQuiz, setSeasonQuiz] = useState<any>(null)
  const [sqLoading, setSqLoading] = useState(true)
  const [sqEmail, setSqEmail] = useState("")
  const [sqName, setSqName] = useState("")
  const [sqAnswers, setSqAnswers] = useState<Record<string, string>>({})
  const [sqSubmitting, setSqSubmitting] = useState(false)
  const [sqResult, setSqResult] = useState<any>(null)
  const [sqError, setSqError] = useState("")
  const [sqLb, setSqLb] = useState<any[]>([])

  useEffect(() => {
    fetchData()
    fetchSeasonQuiz()
  }, [])

  async function fetchSeasonQuiz() {
    setSqLoading(true)
    try {
      const res = await fetch("/api/season-quiz")
      const data = await res.json()
      setSeasonQuiz(data)
      setSqLoading(false)
    } catch {
      setSqLoading(false)
    }
  }

  async function submitSeasonQuiz() {
    if (!sqEmail.trim() || !seasonQuiz) return
    const answered = Object.keys(sqAnswers).length
    if (answered < seasonQuiz.questions.length) {
      setSqError(`Please answer all ${seasonQuiz.questions.length} questions (${answered} answered so far)`)
      return
    }
    setSqSubmitting(true)
    setSqError("")
    const res = await fetch("/api/season-quiz/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seasonId: seasonQuiz.season.id,
        email: sqEmail.trim(),
        name: sqName.trim() || "Anonymous",
        answers: Object.entries(sqAnswers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer })),
      }),
    })
    const data = await res.json()
    setSqSubmitting(false)
    if (!res.ok) {
      setSqError(data.error || "Failed to submit")
    } else {
      setSqResult(data)
      fetchSeasonLeaderboard()
    }
  }

  async function fetchSeasonLeaderboard() {
    if (!seasonQuiz) return
    const res = await fetch(`/api/season-quiz/leaderboard?seasonId=${seasonQuiz.season.id}`)
    const data = await res.json()
    setSqLb(Array.isArray(data) ? data : [])
  }

  function resetSeasonQuiz() {
    setSqAnswers({})
    setSqResult(null)
    setSqError("")
    setSqLb([])
    fetchSeasonQuiz()
  }

  async function fetchData() {
    const [matchesRes, quizzesRes] = await Promise.all([
      fetch("/api/matches"),
      fetch("/api/quiz"),
    ])
    const matchesData = await matchesRes.json()
    const quizzesData = await quizzesRes.json()

    const completed = (Array.isArray(matchesData) ? matchesData : []).filter(
      (m: any) => m.status === "completed"
    ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const qm: Record<string, any> = {}
    const quizzesArr = Array.isArray(quizzesData) ? quizzesData : []
    quizzesArr.forEach((q: any) => {
      qm[q.matchId] = q
    })

    setMatches(completed)
    setQuizMap(qm)
    setLoading(false)
  }

  async function startQuiz(quizId: string) {
    setActiveQuizId(quizId)
    setResult(null)
    setUserAttempt(null)
    setSelectedAnswer("")
    setError("")
  }

  async function fetchLeaderboard(quizId: string) {
    const res = await fetch(`/api/quiz/leaderboard?quizId=${quizId}`)
    const data = await res.json()
    setLeaderboard(Array.isArray(data) ? data : [])
    setShowLb(true)
  }

  async function checkExisting() {
    if (!email.trim() || !activeQuizId) return
    const res = await fetch(`/api/quiz/my-score?email=${encodeURIComponent(email.trim())}&quizId=${activeQuizId}`)
    const data = await res.json()
    if (data.attempt) {
      setUserAttempt(data.attempt)
    } else {
      setUserAttempt(null)
    }
  }

  useEffect(() => {
    if (email.trim() && activeQuizId) {
      const timer = setTimeout(checkExisting, 500)
      return () => clearTimeout(timer)
    }
  }, [email, activeQuizId])

  async function handleSubmit() {
    if (!email.trim() || !selectedAnswer || !activeQuizId) return
    setSubmitting(true)
    setError("")

    const res = await fetch("/api/quiz/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId: activeQuizId,
        email: email.trim(),
        name: name.trim() || "Anonymous",
        selectedAnswer,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Failed to submit")
    } else {
      setResult(data)
      setUserAttempt({ correct: data.correct, selectedAnswer })
      fetchLeaderboard(activeQuizId)
    }
    setSubmitting(false)
  }

  function reset() {
    setActiveQuizId(null)
    setResult(null)
    setUserAttempt(null)
    setEmail("")
    setName("")
    setSelectedAnswer("")
    setError("")
    setShowLb(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  const activeQuiz = activeQuizId ? quizMap[Object.keys(quizMap).find(k => quizMap[k].id === activeQuizId) || ""] : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Brain className="h-7 w-7 text-[var(--accent)]" />
          Match Quiz
        </h1>
        <p className="text-[var(--muted-foreground)]">Test your cricket knowledge after each match</p>
      </div>

      {sqLoading ? (
        <div className="mb-8 flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
        </div>
      ) : seasonQuiz?.locked && seasonQuiz.questions.length > 0 ? (
        <div className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <h2 className="mb-2 flex items-center justify-center gap-2 text-xl font-bold">
            <Lock className="h-5 w-5 text-[var(--muted-foreground)]" />
            Season Quiz — {seasonQuiz.season.name}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            This season quiz has closed. Thanks for playing!
          </p>
        </div>
      ) : seasonQuiz?.ready && seasonQuiz.questions.length > 0 ? (
        <div className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Sparkles className="h-5 w-5 text-[var(--accent)]" />
                Season Quiz — {seasonQuiz.season.name}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {seasonQuiz.questions.length} questions · {seasonQuiz.questions[0]?.pointValue || 10} points each · one attempt per email
              </p>
            </div>
          </div>

          {!sqResult ? (
            <>
              <div className="mb-6 flex flex-col gap-3 rounded-lg bg-[var(--muted)] p-4 sm:flex-row">
                <input
                  value={sqName}
                  onChange={e => setSqName(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
                />
                <input
                  value={sqEmail}
                  onChange={e => setSqEmail(e.target.value)}
                  placeholder="Your email"
                  type="email"
                  required
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
                />
              </div>

              <div className="space-y-5">
                {seasonQuiz.questions.map((q: any, qi: number) => (
                  <div key={q.id} className="rounded-lg border border-[var(--border)] p-4">
                    <p className="mb-3 text-sm font-medium">
                      <span className="mr-2 text-[var(--muted-foreground)]">{qi + 1}.</span>
                      {q.question}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt: string) => (
                        <label
                          key={opt}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-all ${
                            sqAnswers[q.id] === opt
                              ? "border-[var(--accent)] bg-[var(--accent)]/10"
                              : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`sq-${q.id}`}
                            value={opt}
                            checked={sqAnswers[q.id] === opt}
                            onChange={() => setSqAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            className="accent-[var(--accent)]"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {sqError && <p className="mt-4 text-sm text-red-500">{sqError}</p>}
              <button
                onClick={submitSeasonQuiz}
                disabled={!sqEmail.trim() || sqSubmitting}
                className="mt-6 w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {sqSubmitting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Submit Season Quiz"}
              </button>
            </>
          ) : (
            <>
              <div className="mb-6 rounded-lg bg-[var(--muted)] p-4 text-center">
                <p className="text-3xl font-bold text-[var(--accent)]">
                  {sqResult.score} / {sqResult.total}
                </p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {sqResult.score === sqResult.total
                    ? "Perfect score — you're a GSCL legend!"
                    : sqResult.score >= sqResult.total * 0.7
                      ? "Great cricket knowledge!"
                      : sqResult.score >= sqResult.total * 0.4
                        ? "Not bad — keep watching!"
                        : "Time to watch more matches!"}
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <button onClick={resetSeasonQuiz} className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-[var(--muted-foreground)]">
                    <RotateCcw className="h-4 w-4" /> Retry
                  </button>
                  <button onClick={fetchSeasonLeaderboard} className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-[var(--muted-foreground)]">
                    <Trophy className="h-4 w-4" /> View Leaderboard
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {seasonQuiz.questions.map((q: any, qi: number) => {
                  const result = sqResult.results?.find((r: any) => r.questionId === q.id)
                  return (
                    <div key={q.id} className="flex items-start gap-2 rounded-lg border border-[var(--border)] p-3 text-sm">
                      {result?.correct ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
                      <div>
                        <p className="font-medium">{q.question}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Your answer: <strong>{sqAnswers[q.id]}</strong>
                          {!result?.correct && <> · Correct: <strong className="text-green-500">{result?.correctAnswer}</strong></>}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {sqLb.length > 0 && (
                <div className="mt-6 rounded-lg border border-[var(--border)] p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <Trophy className="h-4 w-4 text-[var(--accent)]" /> Leaderboard
                  </h3>
                  <div className="space-y-1.5">
                    {sqLb.map((a: any, i: number) => (
                      <div key={a.email} className="flex items-center gap-3 rounded-lg bg-[var(--muted)] px-3 py-2 text-sm">
                        <span className="w-6 text-xs font-bold text-[var(--muted-foreground)]">{i + 1}</span>
                        <span className="font-medium">{a.name}</span>
                        <span className="ml-auto font-semibold text-[var(--accent)]">{a.score} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : null}

      {activeQuiz && !result && !userAttempt && (
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-2 font-semibold">Your Details</h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">Enter your details to take the quiz</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
            />
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email"
              type="email"
              required
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {activeQuiz && (result || userAttempt) && (
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="mb-4 flex items-center gap-2">
            <button onClick={reset} className="text-sm text-[var(--accent)] hover:underline">&larr; Back to quizzes</button>
          </div>
          {result && (
            <div className={`rounded-lg p-4 ${result.correct ? "bg-green-500/10" : "bg-red-500/10"}`}>
              <div className="mb-2 flex items-center gap-2">
                {result.correct ? (
                  <Check className="h-6 w-6 text-green-500" />
                ) : (
                  <X className="h-6 w-6 text-red-500" />
                )}
                <span className="text-lg font-bold">
                  {result.correct ? "Correct!" : "Incorrect"}
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                {!result.correct && <>Correct answer: <strong>{result.correctAnswer}</strong></>}
                {result.correct && <>You earned <strong>{result.points} points</strong></>}
              </p>
            </div>
          )}
          {userAttempt && !result && (
            <div className="rounded-lg bg-[var(--muted)] p-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                You already attempted this quiz. {userAttempt.correct ? "You got it right!" : "Your answer was incorrect."}
              </p>
            </div>
          )}
        </div>
      )}

      {activeQuiz && !result && !userAttempt && (
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="mb-1 text-xs text-[var(--muted-foreground)]">
            {activeQuiz.match.team1.shortName} vs {activeQuiz.match.team2.shortName}
          </div>
          <h3 className="mb-4 text-lg font-semibold">{activeQuiz.question}</h3>
          <div className="space-y-2">
            {(() => {
              let opts: string[] = []
              try { opts = JSON.parse(activeQuiz.options) } catch {}
              return opts.map((opt: string, i: number) => (
                <label
                  key={i}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                    selectedAnswer === opt
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={opt}
                    checked={selectedAnswer === opt}
                    onChange={() => setSelectedAnswer(opt)}
                    className="accent-[var(--accent)]"
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))
            })()}
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={!email.trim() || !selectedAnswer || submitting}
            className="mt-4 w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Submit Answer"}
          </button>
        </div>
      )}

      <div className="mb-6">
        <h2 className="mb-4 text-xl font-bold">Completed Matches</h2>
        {matches.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted-foreground)]">
            No completed matches yet
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map(m => {
              const quiz = quizMap[m.id]
              return (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-medium">{m.team1.shortName}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">vs</span>
                      <span className="font-medium">{m.team2.shortName}</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      {m.venue && ` · ${m.venue}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {quiz ? (
                      <button
                        onClick={() => startQuiz(quiz.id)}
                        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
                      >
                        Take Quiz
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {activeQuizId && showLb && leaderboard.length > 0 && (
        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-[var(--accent)]" />
            Leaderboard
          </h3>
          <div className="space-y-2">
            {leaderboard.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg bg-[var(--muted)] px-4 py-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold">
                  {i === 0 ? <Medal className="h-5 w-5 text-yellow-500" /> : i === 1 ? <Medal className="h-5 w-5 text-gray-400" /> : i === 2 ? <Medal className="h-5 w-5 text-amber-600" /> : <span className="text-[var(--muted-foreground)]">{i + 1}</span>}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium">{a.name}</span>
                  <span className="ml-2 text-xs text-[var(--muted-foreground)]">{timeAgo(a.createdAt)}</span>
                </div>
                {a.correct ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
