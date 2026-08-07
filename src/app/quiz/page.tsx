"use client"

import { useState, useEffect } from "react"
import { Brain, Trophy, Medal, Check, X, Loader2, Sparkles, RotateCcw, Lock, User, Timer } from "lucide-react"
import { MATCH_CONFIG } from "@/lib/config"
import VoteVerification from "@/components/VoteVerification"

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
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ correct: boolean; correctAnswer: string; points: number } | null>(null)
  const [userAttempt, setUserAttempt] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [showLb, setShowLb] = useState(false)
  const [error, setError] = useState("")

  const [seasonQuiz, setSeasonQuiz] = useState<any>(null)
  const [sqLoading, setSqLoading] = useState(true)
  const [sqName, setSqName] = useState("")
  const [sqEmail, setSqEmail] = useState("")
  const [sqVerifiedToken, setSqVerifiedToken] = useState("")
  const [sqAnswers, setSqAnswers] = useState<Record<string, string>>({})
  const [sqSubmitting, setSqSubmitting] = useState(false)
  const [sqResult, setSqResult] = useState<any>(null)
  const [sqError, setSqError] = useState("")
  const [sqLb, setSqLb] = useState<any[]>([])
  const [sqUid, setSqUid] = useState("")
  const [sqLbLoading, setSqLbLoading] = useState(false)
  const [sqStarted, setSqStarted] = useState(false)
  const [sqStartedAt, setSqStartedAt] = useState(0)
  const [sqTimeLeft, setSqTimeLeft] = useState<number>(MATCH_CONFIG.seasonQuizTimeLimitSeconds)
  const [sqExpired, setSqExpired] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem("quiz_email")
    const savedName = localStorage.getItem("quiz_name")
    const savedToken = localStorage.getItem("quiz_verified")
    if (savedEmail) setSqEmail(savedEmail)
    if (savedName) setSqName(savedName)
    if (savedToken) setSqVerifiedToken(savedToken)
    fetchData()
    fetchSeasonQuiz()
  }, [])

  useEffect(() => {
    if (seasonQuiz?.season?.id) fetchSeasonLeaderboard(seasonQuiz.season.id)
  }, [seasonQuiz])

  useEffect(() => {
    if (sqEmail.trim()) {
      const timer = setTimeout(() => {
        if (!sqResult) fetchSeasonQuiz()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [sqEmail])

  async function fetchSeasonQuiz() {
    setSqLoading(true)
    try {
      const savedEmail = localStorage.getItem("quiz_email") || ""
      const res = await fetch(`/api/season-quiz?email=${encodeURIComponent(savedEmail.trim())}`)
      const data = await res.json()
      setSeasonQuiz(data)
      setSqLoading(false)
    } catch {
      setSqLoading(false)
    }
  }

  async function submitSeasonQuiz() {
    if (!sqName.trim() || !sqEmail.trim() || !sqVerifiedToken || !seasonQuiz) return
    const answers = Object.entries(sqAnswers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer }))
    if (answers.length === 0) {
      setSqError("Please answer at least one question")
      return
    }
    setSqSubmitting(true)
    setSqError("")
    const res = await fetch("/api/season-quiz/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seasonId: seasonQuiz.season.id,
        name: sqName.trim(),
        email: sqEmail.trim(),
        answers,
        startedAt: sqStartedAt,
        verifiedToken: sqVerifiedToken,
      }),
    })
    const data = await res.json()
    setSqSubmitting(false)
    if (!res.ok) {
      setSqError(data.error || "Failed to submit")
      if (res.status === 401) {
        setSqVerifiedToken("")
        localStorage.removeItem("quiz_verified")
        setSqStarted(false)
        setSqExpired(false)
      } else if (res.status === 409) {
        setSqExpired(false)
        setSqStarted(false)
        fetchSeasonQuiz()
      }
    } else {
      setSqUid(data.uid || "")
      setSqResult(data)
      fetchSeasonLeaderboard(seasonQuiz.season.id)
    }
  }

  function startSeasonQuiz() {
    if (!sqName.trim() || !sqEmail.trim() || !sqVerifiedToken || !seasonQuiz) return
    setSqStarted(true)
    setSqStartedAt(Date.now())
    setSqTimeLeft(MATCH_CONFIG.seasonQuizTimeLimitSeconds)
    setSqExpired(false)
    setSqError("")
  }

  useEffect(() => {
    if (!sqStarted || sqResult || sqExpired) return
    const interval = setInterval(() => setSqTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(interval)
  }, [sqStarted, sqResult, sqExpired])

  useEffect(() => {
    if (sqStarted && !sqResult && !sqExpired && sqTimeLeft <= 0) {
      setSqExpired(true)
    }
  }, [sqTimeLeft, sqStarted, sqResult, sqExpired])

  useEffect(() => {
    if (sqExpired && !sqResult && Object.keys(sqAnswers).length > 0) {
      submitSeasonQuiz()
    }
  }, [sqExpired])

  async function fetchSeasonLeaderboard(seasonId: string) {
    setSqLbLoading(true)
    try {
      const res = await fetch(`/api/season-quiz/leaderboard?seasonId=${seasonId}`)
      const data = await res.json()
      setSqLb(Array.isArray(data?.entries) ? data.entries : [])
    } catch {
      setSqLb([])
    }
    setSqLbLoading(false)
  }

  function resetSeasonQuiz() {
    setSqAnswers({})
    setSqResult(null)
    setSqError("")
    setSqUid("")
    setSqLb([])
    setSqStarted(false)
    setSqExpired(false)
    setSqTimeLeft(MATCH_CONFIG.seasonQuizTimeLimitSeconds)
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
    if (!sqEmail.trim() || !activeQuizId) return
    const res = await fetch(`/api/quiz/my-score?email=${encodeURIComponent(sqEmail.trim())}&quizId=${activeQuizId}`)
    const data = await res.json()
    if (data.attempt) {
      setUserAttempt(data.attempt)
    } else {
      setUserAttempt(null)
    }
  }

  useEffect(() => {
    if (sqEmail.trim() && activeQuizId) {
      const timer = setTimeout(checkExisting, 500)
      return () => clearTimeout(timer)
    }
  }, [sqEmail, activeQuizId])

  async function handleSubmit() {
    if (!sqName.trim() || !sqEmail.trim() || !sqVerifiedToken || !selectedAnswer || !activeQuizId) return
    setSubmitting(true)
    setError("")

    const res = await fetch("/api/quiz/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId: activeQuizId,
        name: sqName.trim(),
        email: sqEmail.trim(),
        selectedAnswer,
        verifiedToken: sqVerifiedToken,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      if (res.status === 401) {
        setSqVerifiedToken("")
        localStorage.removeItem("quiz_verified")
      }
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

      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-1 flex items-center gap-2 font-semibold">
          <User className="h-4 w-4 text-[var(--accent)]" />
          Your Details
        </h2>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          One attempt per email &mdash; enter your name &amp; email to participate. The Season Quiz gives you {MATCH_CONFIG.seasonQuizTimeLimitSeconds / 60} minutes on the clock
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={sqName}
            onChange={e => {
              setSqName(e.target.value)
              localStorage.setItem("quiz_name", e.target.value)
            }}
            placeholder="Your name"
            aria-label="Your name"
            required
            className="w-full flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
          />
          <input
            type="email"
            value={sqEmail}
            onChange={e => {
              setSqEmail(e.target.value)
              setSqVerifiedToken("")
              localStorage.setItem("quiz_email", e.target.value)
              localStorage.removeItem("quiz_verified")
            }}
            placeholder="Your email (required)"
            aria-label="Your email"
            required
            className="w-full flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
          />
        </div>
        <div className="mt-3">
          <VoteVerification
            email={sqEmail}
            name={sqName}
            purpose="quiz"
            verifiedToken={sqVerifiedToken}
            onVerified={token => {
              setSqVerifiedToken(token)
              localStorage.setItem("quiz_verified", token)
            }}
            onReset={() => {
              setSqVerifiedToken("")
              localStorage.removeItem("quiz_verified")
            }}
          />
        </div>
        {sqName.trim() && sqEmail.trim() && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--accent)]/10 px-3 py-2 text-sm">
            <User className="h-4 w-4 text-[var(--accent)]" />
            Playing as: <strong>{sqName.trim()}</strong> · one attempt per email
          </div>
        )}
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
                {seasonQuiz.questions.length} questions · {seasonQuiz.questions[0]?.pointValue || 10} points each · {MATCH_CONFIG.seasonQuizTimeLimitSeconds / 60} minute{MATCH_CONFIG.seasonQuizTimeLimitSeconds / 60 > 1 ? "s" : ""} on the clock
              </p>
            </div>
            {sqStarted && !sqResult && (
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${sqTimeLeft <= 30 ? "bg-red-500/10 text-red-500" : "bg-[var(--accent)]/10 text-[var(--accent)]"}`}>
                <Timer className="h-4 w-4" />
                {sqExpired ? "Time's up!" : `Time left: ${Math.floor(sqTimeLeft / 60)}:${String(sqTimeLeft % 60).padStart(2, "0")}`}
              </div>
            )}
          </div>

          {!sqResult ? (
            seasonQuiz.attempt ? (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 p-6 text-center">
                <Check className="mx-auto mb-2 h-6 w-6 text-green-500" />
                <p className="mb-1 font-semibold">You've already attempted this season quiz</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  One attempt per email. You scored <strong className="text-[var(--accent)]">{seasonQuiz.attempt.score}</strong> / {seasonQuiz.attempt.total}
                </p>
              </div>
            ) : sqStarted ? (
            <>
              {sqExpired && (
                <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-500">
                  Time's up! Your answers were submitted automatically.
                </div>
              )}
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
                            onChange={() => { if (!sqExpired && !sqSubmitting) setSqAnswers(prev => ({ ...prev, [q.id]: opt })) }}
                            disabled={sqExpired || sqSubmitting}
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
                  disabled={!sqName.trim() || !sqEmail.trim() || !sqVerifiedToken || sqExpired || sqSubmitting}
                  className="mt-6 w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                {sqSubmitting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : sqExpired ? "Time's up" : "Submit Season Quiz"}
              </button>
            </>
            ) : (
              <div className="py-8 text-center">
                <p className="mb-2 text-lg font-semibold">Ready to test your knowledge?</p>
                <p className="mb-6 text-sm text-[var(--muted-foreground)]">
                  {seasonQuiz.questions.length} questions · {MATCH_CONFIG.seasonQuizTimeLimitSeconds / 60} minute{MATCH_CONFIG.seasonQuizTimeLimitSeconds / 60 > 1 ? "s" : ""} total · your name &amp; score go straight to the leaderboard
                </p>
                <button
                  onClick={startSeasonQuiz}
                  disabled={!sqName.trim() || !sqEmail.trim() || !sqVerifiedToken || sqSubmitting}
                  className="rounded-lg bg-[var(--accent)] px-8 py-3 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {sqSubmitting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Start Season Quiz"}
                </button>
                {(!sqName.trim() || !sqEmail.trim()) && (
                  <p className="mt-3 text-sm text-[var(--muted-foreground)]">Enter your name &amp; email above to start</p>
                )}
              </div>
            )
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
            </>
          )}
        </div>
      ) : null}

      {seasonQuiz?.questions?.length > 0 && (
        <div className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-1 flex items-center gap-2 text-xl font-bold">
            <Trophy className="h-5 w-5 text-[var(--accent)]" /> Season Quiz Leaderboard
          </h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Top 10 players shown automatically · positions update live
          </p>
          {sqLbLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
            </div>
          ) : sqLb.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">
              No entries yet — be the first to take the quiz!
            </p>
          ) : (
            <div className="space-y-1.5">
              {sqLb.map((a: any) => (
                <div
                  key={a.uid}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    a.uid === sqUid ? "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]" : "bg-[var(--muted)]"
                  }`}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                    {a.rank === 1 ? (
                      <Medal className="h-5 w-5 text-yellow-500" />
                    ) : a.rank === 2 ? (
                      <Medal className="h-5 w-5 text-gray-400" />
                    ) : a.rank === 3 ? (
                      <Medal className="h-5 w-5 text-amber-600" />
                    ) : (
                      <span className="text-xs font-bold text-[var(--muted-foreground)]">{a.rank}</span>
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {a.name}
                    {a.uid === sqUid && (
                      <span className="ml-2 rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">You</span>
                    )}
                  </span>
                  <span className="shrink-0 font-semibold text-[var(--accent)]">{a.score} pts</span>
                </div>
              ))}
            </div>
          )}
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
            disabled={!sqName.trim() || !sqEmail.trim() || !sqVerifiedToken || !selectedAnswer || submitting}
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
