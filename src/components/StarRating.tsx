"use client"

import { useState, useEffect } from "react"

export function StarRating() {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [avg, setAvg] = useState(0)
  const [total, setTotal] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/ratings").then(r => r.json()).then(d => { setAvg(d.average); setTotal(d.total) })
  }, [])

  async function submit(v: number) {
    setLoading(true)
    await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: v }),
    })
    setRating(v)
    setSubmitted(true)
    setLoading(false)
    const res = await fetch("/api/ratings")
    const d = await res.json()
    setAvg(d.average)
    setTotal(d.total)
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            onClick={() => !submitted && submit(v)}
            onMouseEnter={() => !submitted && setHover(v)}
            onMouseLeave={() => !submitted && setHover(0)}
            disabled={submitted || loading}
            className={`text-2xl sm:text-3xl transition-colors ${submitted || loading ? "cursor-default" : "cursor-pointer"} ${
              v <= (hover || (submitted ? rating : avg))
                ? "text-yellow-400"
                : "text-gray-600"
            }`}
            title={submitted ? `You rated ${rating} stars` : `${v} star${v > 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
      </div>
      {avg > 0 && (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {submitted ? `You rated: ${rating}/5` : ""}
          {total > 0 && ` ${avg}/5 (${total} vote${total !== 1 ? "s" : ""})`}
        </p>
      )}
    </div>
  )
}
