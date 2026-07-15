"use client"

import { useState, useEffect } from "react"

export function StarRating() {
  const [hover, setHover] = useState(0)
  const [avg, setAvg] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/ratings").then(r => r.json()).then(d => { setAvg(d.average); setTotal(d.total) })
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
    setLoading(false)
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            onClick={() => !loading && submit(v)}
            onMouseEnter={() => !loading && setHover(v)}
            onMouseLeave={() => !loading && setHover(0)}
            disabled={loading}
            className={`text-2xl sm:text-3xl transition-colors ${loading ? "cursor-default" : "cursor-pointer"} ${
              v <= (hover || avg)
                ? "text-yellow-400"
                : "text-gray-600"
            }`}
            title={`${v} star${v > 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
      </div>
      {total > 0 && (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{avg}/5 ({total} vote{total !== 1 ? "s" : ""})</p>
      )}
    </div>
  )
}
