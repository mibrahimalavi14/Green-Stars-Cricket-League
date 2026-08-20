"use client"

import { useState, useEffect } from "react"
import { Loader2, Save, Image, Trash2 } from "lucide-react"

export default function AdminSchedulePage() {
  const [seasonName, setSeasonName] = useState("")
  const [scheduleAnnounced, setScheduleAnnounced] = useState(false)
  const [scheduleImage, setScheduleImage] = useState("")
  const [formatImage, setFormatImage] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const res = await fetch("/api/admin/schedule")
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    setSeasonName(data.season?.name || "")
    setScheduleAnnounced(data.season?.scheduleAnnounced || false)
    setScheduleImage(data.scheduleImage || "")
    setFormatImage(data.formatImage || "")
    setLoading(false)
  }

  function handleImageUpload(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2 MB"); return }
      const reader = new FileReader()
      reader.onload = () => setter(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  async function save() {
    setSaving(true)
    await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "format", scheduleImage, formatImage }),
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

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Image className="h-5 w-5 text-[var(--accent)]" /> Schedule Poster
          </h2>
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">Upload the match schedule image (poster/flyer)</p>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-medium transition-colors hover:bg-[var(--muted)]">
            <Image className="h-4 w-4 text-[var(--accent)]" />
            {scheduleImage ? "Change Image" : "Choose Image"}
            <input type="file" accept="image/*" onChange={handleImageUpload(setScheduleImage)} className="hidden" />
          </label>
          {scheduleImage && (
            <div className="mt-3 relative">
              <img src={scheduleImage} alt="Schedule preview" className="w-full rounded-lg border border-[var(--border)] object-contain" />
              <button onClick={() => setScheduleImage("")} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500 text-xs text-white flex items-center justify-center hover:bg-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Image className="h-5 w-5 text-[var(--accent)]" /> Match Format Poster
          </h2>
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">Upload the tournament format/rules image</p>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-medium transition-colors hover:bg-[var(--muted)]">
            <Image className="h-4 w-4 text-[var(--accent)]" />
            {formatImage ? "Change Image" : "Choose Image"}
            <input type="file" accept="image/*" onChange={handleImageUpload(setFormatImage)} className="hidden" />
          </label>
          {formatImage && (
            <div className="mt-3 relative">
              <img src={formatImage} alt="Format preview" className="w-full rounded-lg border border-[var(--border)] object-contain" />
              <button onClick={() => setFormatImage("")} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500 text-xs text-white flex items-center justify-center hover:bg-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          )}
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
