"use client"

import { useState, useEffect } from "react"
import { Brain, Trophy, Medal, Check, X, Loader2, Sparkles, RotateCcw, Lock, User, Timer, Sun, CalendarDays, Flame, LogIn, UserPlus, LogOut, KeyRound } from "lucide-react"
import { MATCH_CONFIG } from "@/lib/config"
import VoteVerification from "@/components/VoteVerification"
import { formatDateTime } from "@/lib/utils"

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

  const [progress, setProgress] = useState<any>(null)
  const [challenges, setChallenges] = useState<any>(null)
  const [challengeSubmitting, setChallengeSubmitting] = useState(false)
  const [challengeError, setChallengeError] = useState("")
  const [challengeStarting, setChallengeStarting] = useState(false)
  const [activeChallenge, setActiveChallenge] = useState<any>(null)
  const [activeChallengeIndex, setActiveChallengeIndex] = useState(0)
  const [activeChallengeTimeLeft, setActiveChallengeTimeLeft] = useState(0)
  const [activeChallengeAnswers, setActiveChallengeAnswers] = useState<Record<string, string>>({})
  const [activeChallengeResult, setActiveChallengeResult] = useState<any>(null)

  const [authUser, setAuthUser] = useState<any>(null)
  const [authMode, setAuthMode] = useState<"login" | "signup" | "otp">("login")
  const [authName, setAuthName] = useState("")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [authError, setAuthError] = useState("")

  const [chLb, setChLb] = useState<any[]>([])
  const [chLbPeriod, setChLbPeriod] = useState<"daily" | "weekly" | "overall">("daily")
  const [chLbLoading, setChLbLoading] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem("quiz_email")
    const savedName = localStorage.getItem("quiz_name")
    const savedToken = localStorage.getItem("quiz_verified")
    if (savedEmail) setSqEmail(savedEmail)
    if (savedName) setSqName(savedName)
    if (savedToken) setSqVerifiedToken(savedToken)
    fetchData()
    fetchSeasonQuiz()
    fetchChallengeLb("daily")
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const res = await fetch("/api/auth/me")
      const data = await res.json()
      if (data?.user) {
        applyLoggedIn(data.user)
      } else if (localStorage.getItem("quiz_verified") === "session") {
        localStorage.removeItem("quiz_verified")
        localStorage.removeItem("quiz_name")
        localStorage.removeItem("quiz_email")
        setSqVerifiedToken("")
        setSqName("")
        setSqEmail("")
        setProgress(null)
        setChallenges(null)
      }
    } catch {}
  }

  function applyLoggedIn(user: { name: string; email: string }) {
    setAuthUser(user)
    setSqName(user.name)
    setSqEmail(user.email)
    localStorage.setItem("quiz_name", user.name)
    localStorage.setItem("quiz_email", user.email)
    const token = "session"
    setSqVerifiedToken(token)
    localStorage.setItem("quiz_verified", token)
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    setAuthUser(null)
    setSqVerifiedToken("")
    localStorage.removeItem("quiz_verified")
    setSqResult(null)
    setSqStarted(false)
    setSqExpired(false)
    setSqAnswers({})
    setSqUid("")
    setAuthMode("login")
    setActiveChallenge(null)
    setActiveChallengeResult(null)
    setActiveChallengeAnswers({})
    setChallengeError("")
    fetchSeasonQuiz()
    fetchChallengeLb(chLbPeriod)
  }

  async function handleAuthSubmit() {
    if (authSubmitting) return
    setAuthSubmitting(true)
    setAuthError("")
    const endpoint = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login"
    const body = authMode === "signup"
      ? { name: authName.trim(), email: authEmail.trim(), password: authPassword }
      : { email: authEmail.trim(), password: authPassword }
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setAuthSubmitting(false)
    if (!res.ok) {
      setAuthError(data.error || "Something went wrong")
      return
    }
    applyLoggedIn(data.user)
    setAuthName("")
    setAuthEmail("")
    setAuthPassword("")
    await Promise.all([fetchSeasonQuiz(), fetchProgress(), fetchChallenges()])
    fetchChallengeLb(chLbPeriod)
  }

  useEffect(() => {
    if (seasonQuiz?.season?.id) fetchSeasonLeaderboard(seasonQuiz.season.id)
  }, [seasonQuiz])

  useEffect(() => {
    if (sqEmail.trim()) {
      const timer = setTimeout(() => {
        if (!sqResult) fetchSeasonQuiz()
        fetchProgress()
        fetchChallenges()
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

  async function fetchProgress() {
    const email = localStorage.getItem("quiz_email") || ""
    if (!email.trim()) {
      setProgress(null)
      return
    }
    const res = await fetch(`/api/quiz/progress?email=${encodeURIComponent(email.trim())}`)
    if (!res.ok) return
    const data = await res.json()
    setProgress(data)
  }

  async function fetchChallenges() {
    const email = localStorage.getItem("quiz_email") || ""
    if (!email.trim()) {
      setChallenges(null)
      return
    }
    const res = await fetch(`/api/challenges?email=${encodeURIComponent(email.trim())}`)
    if (!res.ok) return
    const data = await res.json()
    setChallenges(data)
  }

  async function fetchChallengeLb(period: string) {
    setChLbLoading(true)
    try {
      const email = localStorage.getItem("quiz_email") || ""
      const res = await fetch(`/api/challenges/leaderboard?period=${period}&email=${encodeURIComponent(email.trim())}`)
      const data = await res.json()
      setChLb(Array.isArray(data?.entries) ? data.entries : [])
    } catch {
      setChLb([])
    }
    setChLbLoading(false)
  }

  async function startChallenge(challengeId: string) {
    if (!sqName.trim() || !sqEmail.trim() || !sqVerifiedToken) return
    setChallengeStarting(true)
    setChallengeError("")
    const res = await fetch("/api/challenges/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeId,
        name: sqName.trim(),
        email: sqEmail.trim(),
        verifiedToken: sqVerifiedToken,
      }),
    })
    const data = await res.json()
    setChallengeStarting(false)
    if (!res.ok) {
      if (res.status === 401) {
        setSqVerifiedToken("")
        localStorage.removeItem("quiz_verified")
      }
      setChallengeError(data.error || "Failed to start challenge")
      return
    }
    setActiveChallenge(data)
    setActiveChallengeIndex(0)
    setActiveChallengeTimeLeft(data.timeLimitSeconds)
    setActiveChallengeAnswers({})
    setActiveChallengeResult(null)
  }

  function advanceChallenge() {
    if (!activeChallenge) return
    if (activeChallengeIndex + 1 >= activeChallenge.questionCount) {
      submitChallengeQuiz()
    } else {
      setActiveChallengeIndex(prev => prev + 1)
      setActiveChallengeTimeLeft(activeChallenge.timeLimitSeconds)
    }
  }

  function selectChallengeAnswer(qid: string, opt: string) {
    if (!activeChallenge || activeChallengeResult || challengeSubmitting) return
    setActiveChallengeAnswers(prev => ({ ...prev, [qid]: opt }))
    setTimeout(() => advanceChallenge(), 250)
  }

  async function submitChallengeQuiz() {
    if (!activeChallenge || challengeSubmitting) return
    setChallengeSubmitting(true)
    setChallengeError("")
    const answers = Object.entries(activeChallengeAnswers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer }))
    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeId: activeChallenge.id,
        name: sqName.trim(),
        email: sqEmail.trim(),
        answers,
        verifiedToken: sqVerifiedToken,
      }),
    })
    const data = await res.json()
    setChallengeSubmitting(false)
    if (!res.ok) {
      if (res.status === 401) {
        setSqVerifiedToken("")
        localStorage.removeItem("quiz_verified")
      }
      setChallengeError(data.error || "Failed to submit")
      return
    }
    setActiveChallengeResult(data)
    await Promise.all([fetchChallenges(), fetchProgress()])
    fetchChallengeLb(chLbPeriod)
  }

  useEffect(() => {
    if (!activeChallenge || activeChallengeResult || challengeSubmitting) return
    const interval = setInterval(() => {
      setActiveChallengeTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          advanceChallenge()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChallenge, activeChallengeIndex, activeChallengeResult, challengeSubmitting])

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
          <KeyRound className="h-4 w-4 text-[var(--accent)]" />
          Your Account
        </h2>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          Sign in or create a free account to play quizzes &amp; challenges and climb the leaderboard
        </p>

        {authUser ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--accent)]/10 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <User className="h-4 w-4 shrink-0 text-[var(--accent)]" />
              <span className="min-w-0">
                Logged in as <strong>{authUser.name}</strong> · <span className="break-all text-[var(--muted-foreground)]">{authUser.email}</span>
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm font-medium transition-colors hover:border-[var(--muted-foreground)]"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {(["login", "signup", "otp"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    setAuthMode(mode)
                    setAuthError("")
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    authMode === mode ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--muted)] hover:bg-[var(--muted)]/70"
                  }`}
                >
                  {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Email OTP"}
                </button>
              ))}
            </div>

            {authMode === "login" && (
              <form onSubmit={e => { e.preventDefault(); handleAuthSubmit() }} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="Email"
                  aria-label="Email"
                  autoComplete="email"
                  required
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
                />
                <input
                  type="password"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  placeholder="Password"
                  aria-label="Password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
                />
                {authError && <p className="text-sm text-red-500">{authError}</p>}
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {authSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="h-4 w-4" /> Sign In</>}
                </button>
                <p className="text-center text-sm text-[var(--muted-foreground)]">
                  New here?{" "}
                  <button type="button" onClick={() => setAuthMode("signup")} className="text-[var(--accent)] hover:underline">
                    Create an account
                  </button>
                </p>
              </form>
            )}

            {authMode === "signup" && (
              <form onSubmit={e => { e.preventDefault(); handleAuthSubmit() }} className="flex flex-col gap-3">
                <input
                  value={authName}
                  onChange={e => setAuthName(e.target.value)}
                  placeholder="Your name"
                  aria-label="Your name"
                  autoComplete="name"
                  required
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
                />
                <input
                  type="email"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="Email"
                  aria-label="Email"
                  autoComplete="email"
                  required
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
                />
                <input
                  type="password"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  placeholder="Password (min 8 characters)"
                  aria-label="Password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
                />
                {authError && <p className="text-sm text-red-500">{authError}</p>}
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {authSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /> Create Account</>}
                </button>
                <p className="text-center text-sm text-[var(--muted-foreground)]">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setAuthMode("login")} className="text-[var(--accent)] hover:underline">
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {authMode === "otp" && (
              <>
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
              </>
            )}
          </>
        )}
      </div>

      {progress && (
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Medal className="h-5 w-5 text-[var(--accent)]" />
              My Progress &amp; Rewards
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-orange-500" /> {progress.dailyStreak}-day streak</span>
              <span>{progress.correct}/{progress.totalAttempts} correct</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--accent)]/5 text-3xl" aria-label={`Level ${progress.level.current.level}: ${progress.level.current.title}`}>
              {progress.level.current.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-bold">
                  Level {progress.level.current.level}: <span className={progress.level.current.color}>{progress.level.current.title}</span>
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  <strong className="text-[var(--accent)]">{progress.totalPoints}</strong> total points
                  {progress.level.next && (
                    <span> · {progress.level.next.minPoints - progress.totalPoints} pts to <strong>{progress.level.next.title}</strong></span>
                  )}
                </p>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-yellow-500 transition-all"
                  style={{ width: `${progress.level.progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {progress.badges.map((b: any) => (
              <div
                key={b.id}
                title={b.desc}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs ${b.unlocked ? "border-[var(--accent)]/40 bg-[var(--accent)]/5" : "border-[var(--border)] opacity-40"}`}
              >
                <span className="text-xl" aria-hidden="true">{b.icon}</span>
                <div className="min-w-0">
                  <p className="font-medium">{b.title}</p>
                  <p className="truncate text-[10px] text-[var(--muted-foreground)]">{b.unlocked ? b.desc : "Locked"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {challenges && (challenges.daily || (challenges.weekly && challenges.weekly.length > 0)) && (
        <div className="mb-10 space-y-6">
          {activeChallenge && !activeChallengeResult && (
            <div className="rounded-xl border-2 border-[var(--accent)] bg-[var(--card)] p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Timer className="h-5 w-5 text-[var(--accent)]" />
                  {activeChallenge.title || (activeChallenge.type === "DAILY" ? "Daily Challenge" : "Weekly Challenge")}
                </h2>
                <span className="flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 px-3 py-1.5 text-sm font-bold text-[var(--accent)]">
                  <Timer className="h-4 w-4" /> {activeChallengeTimeLeft}s
                </span>
              </div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                Question {activeChallengeIndex + 1} / {activeChallenge.questionCount} · +{activeChallenge.pointValue} XP per correct answer
              </p>
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${((activeChallengeIndex + 1) / activeChallenge.questionCount) * 100}%` }} />
              </div>
              {activeChallenge.questions && activeChallenge.questions[activeChallengeIndex] && (
                <div className="rounded-lg border border-[var(--border)] p-4">
                  <p className="mb-3 text-sm font-medium">
                    <span className="mr-2 text-[var(--muted-foreground)]">{activeChallengeIndex + 1}.</span>
                    {activeChallenge.questions[activeChallengeIndex].question}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeChallenge.questions[activeChallengeIndex].options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => selectChallengeAnswer(activeChallenge.questions[activeChallengeIndex].id, opt)}
                        disabled={challengeSubmitting || !!activeChallengeAnswers[activeChallenge.questions[activeChallengeIndex].id]}
                        className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors disabled:opacity-50 ${
                          activeChallengeAnswers[activeChallenge.questions[activeChallengeIndex].id] === opt
                            ? "border-[var(--accent)] bg-[var(--accent)]/10"
                            : "border-[var(--border)] hover:border-[var(--accent)]"
                        }`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-xs">
                          {String.fromCharCode(65 + activeChallenge.questions[activeChallengeIndex].options.indexOf(opt))}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {challengeError && <p className="mt-3 text-sm text-red-500">{challengeError}</p>}
            </div>
          )}

          {activeChallengeResult && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              <div className="rounded-lg bg-[var(--muted)] p-4 text-center">
                <p className="text-3xl font-bold text-[var(--accent)]">
                  {activeChallengeResult.score} / {activeChallengeResult.total}
                </p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {activeChallengeResult.score === activeChallengeResult.total
                    ? "Perfect score — incredible!"
                    : activeChallengeResult.score >= 7
                      ? "Great cricket knowledge!"
                      : activeChallengeResult.score >= 5
                        ? "Not bad — keep playing!"
                        : "Time to watch more matches!"}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--accent)]">+{activeChallengeResult.pointsEarned} XP earned</p>
              </div>
              <div className="mt-4 space-y-2">
                {activeChallenge.questions.map((q: any, qi: number) => {
                  const result = activeChallengeResult.results?.find((r: any) => r.questionId === q.id)
                  return (
                    <div key={q.id} className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${result?.correct ? "border-green-500/30 bg-green-500/5" : "border-[var(--border)]"}`}>
                      {result?.correct ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
                      <div>
                        <p className="font-medium">{qi + 1}. {q.question}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Your answer: <strong>{activeChallengeAnswers[q.id] || "Skipped"}</strong>
                          {!result?.correct && <> · Correct: <strong className="text-green-500">{result?.correctAnswer}</strong></>}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={() => { setActiveChallenge(null); setActiveChallengeResult(null); setActiveChallengeAnswers({}) }}
                className="mt-4 min-h-11 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-[var(--muted-foreground)]"
              >
                Done
              </button>
            </div>
          )}

          {!activeChallenge && !activeChallengeResult && (
            <>
              {challenges.daily && (() => {
                const c = challenges.daily
                return (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <Sun className="h-5 w-5 text-orange-500" />
                        Daily Challenge
                      </h2>
                      <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                        {c.questionCount} Q · +{c.pointValue} XP/correct · {c.timeLimitSeconds}s each
                      </span>
                    </div>
                    {c.attempt && c.attempt.submittedAt ? (
                      <div className="rounded-lg bg-[var(--muted)] p-4 text-sm">
                        <p className="text-green-500">
                          <Check className="mr-1 inline h-4 w-4" />
                          You scored {c.attempt.score}/{c.attempt.total} · +{c.attempt.pointsEarned} XP
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">Try again tomorrow!</p>
                      </div>
                    ) : !sqVerifiedToken ? (
                      <p className="rounded-lg bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">
                        Sign in or verify your email to play the daily challenge.
                      </p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => startChallenge(c.id)}
                          disabled={challengeStarting}
                          className="flex min-h-11 items-center gap-2 rounded-lg bg-[var(--accent)] px-5 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {challengeStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Timer className="h-4 w-4" />}
                          Start Daily Challenge
                        </button>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {c.serving} random questions from a pool of {c.questionCount} — everyone gets different questions &amp; order.
                        </p>
                      </div>
                    )}
                  </div>
                )
              })()}

              {challenges.weekly && challenges.weekly.length > 0 && (
                <div className="space-y-3">
                  {challenges.weekly.map((c: any) => (
                    <div key={c.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                          <CalendarDays className="h-5 w-5 text-[var(--accent)]" />
                          {c.title || "Weekly Challenge"}
                        </h2>
                        <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                          {c.questionCount} Q · +{c.pointValue} XP/correct · {c.timeLimitSeconds}s each
                        </span>
                      </div>
                      {c.attempt && c.attempt.submittedAt ? (
                        <div className="rounded-lg bg-[var(--muted)] p-4 text-sm">
                          <p className="text-green-500">
                            <Check className="mr-1 inline h-4 w-4" />
                            You scored {c.attempt.score}/{c.attempt.total} · +{c.attempt.pointsEarned} XP
                          </p>
                        </div>
                      ) : !sqVerifiedToken ? (
                        <p className="rounded-lg bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">
                          Sign in or verify your email to play.
                        </p>
                      ) : (
                        <button
                          onClick={() => startChallenge(c.id)}
                          disabled={challengeStarting}
                          className="flex min-h-11 items-center gap-2 rounded-lg bg-[var(--accent)] px-5 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {challengeStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Timer className="h-4 w-4" />}
                          Start Weekly Challenge
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {challengeError && !activeChallenge && !activeChallengeResult && <p className="text-sm text-red-500">{challengeError}</p>}
        </div>
      )}

      <div className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-1 flex items-center gap-2 text-xl font-bold">
          <Trophy className="h-5 w-5 text-[var(--accent)]" /> Challenge Leaderboard
        </h2>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">Top 20 players for today, this week, and overall</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {(["daily", "weekly", "overall"] as const).map(p => (
            <button
              key={p}
              onClick={() => {
                setChLbPeriod(p)
                fetchChallengeLb(p)
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                chLbPeriod === p ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--muted)] hover:bg-[var(--muted)]/70"
              }`}
            >
              {p === "daily" ? "Today" : p === "weekly" ? "This Week" : "Overall"}
            </button>
          ))}
        </div>
        {chLbLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
          </div>
        ) : chLb.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">
            No entries yet — be the first to play!
          </p>
        ) : (
          <div className="space-y-1.5">
            {chLb.map((a: any) => (
              <div
                key={a.uid}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  a.isMe ? "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]" : "bg-[var(--muted)]"
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
                  {a.isMe && (
                    <span className="ml-2 rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">You</span>
                  )}
                </span>
                <span className="shrink-0 font-semibold text-[var(--accent)]">{a.points} pts</span>
              </div>
            ))}
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
                  {seasonQuiz.attempt.createdAt && (
                    <span className="block text-xs opacity-80">Attempted on {formatDateTime(seasonQuiz.attempt.createdAt)}</span>
                  )}
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
                  <p className="mt-3 text-sm text-[var(--muted-foreground)]">Sign in or enter your details above to start</p>
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
                {userAttempt.createdAt && (
                  <span className="mt-0.5 block text-xs opacity-80">Voted on {formatDateTime(userAttempt.createdAt)}</span>
                )}
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
