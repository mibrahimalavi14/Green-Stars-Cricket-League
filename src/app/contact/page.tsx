"use client"

import { useState } from "react"

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) setSent(true)
      else setError(data.error || "Failed to send. Please try again later.")
    } catch { setError("Network error. Please check your connection.") }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Contact Us</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Get in touch with the GSCL team</p>

      {sent ? (
        <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-8 text-center">
          <p className="text-xl font-semibold text-green-600 dark:text-green-400">Message sent!</p>
          <p className="text-sm text-[var(--muted-foreground)]">We&apos;ll get back to you soon.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                required type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Subject</label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Message</label>
            <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50">
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      )}
    </div>
  )
}

export default ContactPage
