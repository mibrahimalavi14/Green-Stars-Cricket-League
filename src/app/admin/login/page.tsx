"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export default function AdminLoginPage() {
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      window.location.href = "/admin"
    } else {
      setError("Wrong password")
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
        <h1 className="mb-2 text-center text-2xl font-bold">Admin Login</h1>
        <p className="mb-6 text-center text-sm text-[var(--muted-foreground)]">Enter password to access admin panel</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 pr-10 text-sm"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              tabIndex={-1}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  )
}
