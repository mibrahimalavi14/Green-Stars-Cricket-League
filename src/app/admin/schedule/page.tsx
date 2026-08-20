"use client"

import { useState, useEffect } from "react"
import { Loader2, Save, Image, Trash2, FileText, Check } from "lucide-react"

export default function AdminSchedulePage() {
  const [seasonName, setSeasonName] = useState("")
  const [scheduleAnnounced, setScheduleAnnounced] = useState(false)
  const [scheduleText, setScheduleText] = useState("")
  const [formatText, setFormatText] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ocrLoading, setOcrLoading] = useState<"" | "schedule" | "format">("")
  const [ocrDone, setOcrDone] = useState<"" | "schedule" | "format">("")

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const res = await fetch("/api/admin/schedule")
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    setSeasonName(data.season?.name || "")
    setScheduleAnnounced(data.season?.scheduleAnnounced || false)
    setScheduleText(data.scheduleText || "")
    setFormatText(data.formatText || "")
    setLoading(false)
  }

  async function extractText(file: File, target: "schedule" | "format") {
    setOcrLoading(target)
    setOcrDone("")
    const Tesseract = (await import("tesseract.js")).default
    const { data: { text } } = await Tesseract.recognize(file, "eng", {})
    if (target === "schedule") setScheduleText(text.trim())
    else setFormatText(text.trim())
    setOcrLoading("")
    setOcrDone(target)
    setTimeout(() => setOcrDone(""), 2000)
  }

  function handleImageChange(target: "schedule" | "format") {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2 MB"); return }
      extractText(file, target)
    }
  }

  async function save() {
    setSaving(true)
    await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleText, formatText }),
    })
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-center text-[var(--muted-foreground)]"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Schedule & Format</h1>
      <p className="text-[var(--muted-foreground)]">
        {seasonName}
        <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${scheduleAnnounced ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"}`}>
          {scheduleAnnounced ? "Visible to public" : "Hidden — toggle in Seasons to publish"}
        </span>
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">

        {/* Schedule */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <Image className="h-5 w-5 text-[var(--accent)]" /> Schedule
          </h2>
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">Upload schedule image — text will be extracted automatically</p>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-medium transition-colors hover:bg-[var(--muted)]">
            {ocrLoading === "schedule" ? <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" /> : ocrDone === "schedule" ? <Check className="h-4 w-4 text-green-600" /> : <Image className="h-4 w-4 text-[var(--accent)]" />}
            {ocrLoading === "schedule" ? "Extracting text..." : "Upload Schedule Image"}
            <input type="file" accept="image/*" onChange={handleImageChange("schedule")} className="hidden" disabled={!!ocrLoading} />
          </label>
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium">Extracted Text (editable)</label>
            <textarea
              rows={10}
              value={scheduleText}
              onChange={e => setScheduleText(e.target.value)}
              placeholder="Schedule text will appear here after image upload..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>

        {/* Format */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-[var(--accent)]" /> Tournament Format
          </h2>
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">Upload format/rules image — text will be extracted automatically</p>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-medium transition-colors hover:bg-[var(--muted)]">
            {ocrLoading === "format" ? <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" /> : ocrDone === "format" ? <Check className="h-4 w-4 text-green-600" /> : <FileText className="h-4 w-4 text-[var(--accent)]" />}
            {ocrLoading === "format" ? "Extracting text..." : "Upload Format Image"}
            <input type="file" accept="image/*" onChange={handleImageChange("format")} className="hidden" disabled={!!ocrLoading} />
          </label>
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium">Extracted Text (editable)</label>
            <textarea
              rows={10}
              value={formatText}
              onChange={e => setFormatText(e.target.value)}
              placeholder="Format text will appear here after image upload..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>

      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>
    </div>
  )
}
