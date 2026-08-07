"use client"

import { useState } from "react"
import VoteVerification from "@/components/VoteVerification"

const SPONSORSHIP_TYPES = [
  "Title Sponsor", "Official Partner", "Team Sponsor", "Match Sponsor",
  "Kit & Equipment", "Venue & Ground", "Media & Streaming", "Prize Money", "Other",
]

const BUDGET_RANGES = ["Up to 50K", "50K - 1 Lac", "1 Lac - 5 Lac", "5 Lac +", "Not decided / Flexible"]

function ContactPage() {
  const [form, setForm] = useState({
    name: "", email: "", subject: "", message: "",
    purpose: "general", phone: "", company: "", sponsorshipType: "", budgetRange: "",
  })
  const [website, setWebsite] = useState("")
  const [verifiedToken, setVerifiedToken] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isSponsorship = form.purpose === "sponsorship"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website, verifiedToken }),
      })
      const data = await res.json()
      if (res.ok) setSent(true)
      else setError(data.error || "Failed to send. Please try again later.")
    } catch { setError("Network error. Please check your connection.") }
    setLoading(false)
  }

  const inputCls = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
  const labelCls = "mb-1 block text-sm font-medium"

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Contact Us</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Get in touch with the GSCL team — general inquiry ya sponsorship ke liye</p>

      {sent ? (
        <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-8 text-center">
          <p className="text-xl font-semibold text-green-600 dark:text-green-400">Message sent!</p>
          <p className="text-sm text-[var(--muted-foreground)]">We&apos;ll get back to you soon.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Purpose *</label>
              <select value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} className={inputCls}>
                <option value="general">General Inquiry</option>
                <option value="sponsorship">Sponsorship</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Name *</label>
              <input
                required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input
              required type="email" value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setVerifiedToken("") }}
              className={inputCls}
            />
          </div>

          {isSponsorship && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>Company / Brand</label>
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone / WhatsApp</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+92..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Sponsorship Type</label>
                <select value={form.sponsorshipType} onChange={(e) => setForm({ ...form, sponsorshipType: e.target.value })} className={inputCls}>
                  <option value="">Select type</option>
                  {SPONSORSHIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Budget Range</label>
                <select value={form.budgetRange} onChange={(e) => setForm({ ...form, budgetRange: e.target.value })} className={inputCls}>
                  <option value="">Select budget</option>
                  {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Subject</label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Message *</label>
            <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              className={inputCls} />
          </div>

          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input id="website" value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
          </div>

          {!verifiedToken && (
            <VoteVerification
              email={form.email}
              name={form.name}
              purpose="contact"
              verifiedToken={verifiedToken}
              onVerified={setVerifiedToken}
              onReset={() => setVerifiedToken("")}
              verifiedLabel="Email verified &mdash; you can now send your message"
              noteLabel="Verified email only — spam nahi bhej paoge"
            />
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading || !verifiedToken}
            className="w-full rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50">
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      )}
    </div>
  )
}

export default ContactPage
