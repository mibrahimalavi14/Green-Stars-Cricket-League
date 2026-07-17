"use client"

import { useState, useEffect } from "react"
import ReCAPTCHA from "react-google-recaptcha"

type Review = { id: string; name: string; rating: number; comment: string; createdAt: string }

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [average, setAverage] = useState(0)
  const [total, setTotal] = useState(0)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [hover, setHover] = useState(0)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [recaptchaRef, setRecaptchaRef] = useState<ReCAPTCHA | null>(null)

  useEffect(() => {
    fetch("/api/reviews").then(r => r.json()).then(d => {
      setReviews(d.reviews)
      setAverage(d.average)
      setTotal(d.total)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) { setError("Please select a rating"); return }
    setSending(true)
    setError("")

    let captchaToken = ""
    if (recaptchaRef) {
      captchaToken = recaptchaRef.getValue() || ""
    }

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, rating, comment, captchaToken }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || "Failed to submit"); setSending(false); return }
    setSent(true)
    setSending(false)
  }

  function renderStars(v: number, interactive = false) {
    return (
      <div className="flex items-center gap-0.5" dir="ltr">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            type={interactive ? "button" : "button"}
            disabled={!interactive}
            onClick={() => { if (interactive) setRating(s) }}
            onMouseEnter={() => { if (interactive) setHover(s) }}
            onMouseLeave={() => { if (interactive) setHover(0) }}
            className={`text-lg ${interactive ? "cursor-pointer" : "cursor-default"} ${s <= (interactive ? (hover || rating) : v) ? "text-yellow-400" : "text-gray-600"}`}
          >
            ★
          </button>
        ))}
      </div>
    )
  }

  return (
    <section className="border-t border-[var(--border)] py-12">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="mb-2 text-center text-2xl font-bold">Reviews</h2>
        <p className="mb-8 text-center text-sm text-[var(--muted-foreground)]">
          {total > 0 ? `${average}/5 from ${total} review${total !== 1 ? "s" : ""}` : "Be the first to leave a review"}
        </p>

        {reviews.length > 0 && (
          <div className="mb-10 grid gap-4 md:grid-cols-2">
            {reviews.map(r => (
              <div key={r.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold">{r.name}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{new Date(r.createdAt).toLocaleDateString("en-PK")}</span>
                </div>
                {renderStars(r.rating)}
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">{r.comment}</p>
              </div>
            ))}
          </div>
        )}

        {sent ? (
          <div className="mx-auto max-w-md rounded-xl border border-green-500/50 bg-green-500/10 p-8 text-center">
            <p className="text-xl font-semibold text-green-600 dark:text-green-400">Review submitted!</p>
            <p className="text-sm text-[var(--muted-foreground)]">It will appear after approval.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="text-center font-semibold">Leave a Review</h3>

            <div>
              <label className="mb-1 block text-xs font-medium">Rating</label>
              {renderStars(rating, true)}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} maxLength={100}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">Email (optional)</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">Comment</label>
              <textarea required rows={3} value={comment} onChange={e => setComment(e.target.value)} maxLength={1000}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            </div>

            {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
              <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                ref={(ref) => setRecaptchaRef(ref)}
              />
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button type="submit" disabled={sending}
              className="w-full rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50">
              {sending ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
