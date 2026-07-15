"use client"

import { useState, useEffect } from "react"

export function StarRating() {
  const [hover, setHover] = useState(0)
  const [avg, setAvg] = useState(0)
  const [total, setTotal] = useState(0)
  const [userVote, setUserVote] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/ratings").then(r => r.json()).then(d => { setAvg(d.average); setTotal(d.total); setUserVote(d.userVote) })
  }, [])

  async function submit(v: number) {
    setLoading(true)
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: v }),
    })
    const d = await res.json()
    setAvg(d.average)
    setTotal(d.total)
    setUserVote(d.userVote)
    setLoading(false)
  }

  const display = userVote || hover || avg

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            onClick={() => { if (!userVote && !loading) submit(v) }}
            onMouseEnter={() => { if (!userVote && !loading) setHover(v) }}
            onMouseLeave={() => { if (!userVote) setHover(0) }}
            disabled={loading}
            className={`text-2xl sm:text-3xl transition-colors ${loading ? "cursor-default" : userVote ? "cursor-default" : "cursor-pointer"} ${
              v <= (userVote ? userVote : hover || avg)
                ? "text-yellow-400"
                : "text-gray-600"
            }`}
            title={userVote ? `You rated ${userVote} stars` : `${v} star${v > 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        {userVote ? `You rated: ${userVote}/5 · ` : ""}{avg > 0 ? `${avg}/5 (${total} vote${total !== 1 ? "s" : ""})` : "No votes yet"}
      </p>
    </div>
  )
}
