"use client"

import { useState, useEffect } from "react"
import { Cloud, Thermometer, MapPin, AlertTriangle, FileText, Save, CheckCircle } from "lucide-react"

interface MatchNotes {
  weather: string
  temperature: string
  pitchType: string
  groundCondition: string
  delayReason: string
  delayDuration: string
  refereeNotes: string
  injuryNotes: string
  replacements: string
  fines: string
  incidents: string
}

interface Match { id: string; matchNo: number; team1: { name: string }; team2: { name: string }; date: string }

const emptyNotes: MatchNotes = { weather: "", temperature: "", pitchType: "", groundCondition: "", delayReason: "", delayDuration: "", refereeNotes: "", injuryNotes: "", replacements: "", fines: "", incidents: "" }

export default function AdminMatchNotesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState("")
  const [notes, setNotes] = useState<MatchNotes>(emptyNotes)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/matches").then(r => r.json()).then(d => setMatches(d.matches || d)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedMatch) { setNotes(emptyNotes); return }
    setLoading(true)
    fetch(`/api/matches/notes?matchId=${selectedMatch}`)
      .then(r => r.json())
      .then(d => { if (d && d.matchId) setNotes({ weather: d.weather || "", temperature: d.temperature || "", pitchType: d.pitchType || "", groundCondition: d.groundCondition || "", delayReason: d.delayReason || "", delayDuration: d.delayDuration || "", refereeNotes: d.refereeNotes || "", injuryNotes: d.injuryNotes || "", replacements: d.replacements || "", fines: d.fines || "", incidents: d.incidents || "" }); else setNotes(emptyNotes) })
      .catch(() => setNotes(emptyNotes))
      .finally(() => setLoading(false))
  }, [selectedMatch])

  async function handleSave() {
    if (!selectedMatch) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/matches/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matchId: selectedMatch, ...notes }) })
      if (res.ok) setSaved(true)
    } catch {}
    setSaving(false)
  }

  function update(field: keyof MatchNotes, value: string) { setNotes(p => ({ ...p, [field]: value })); setSaved(false) }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold flex items-center gap-2">
        <FileText className="w-8 h-8 text-amber-500" /> Match Notes & Conditions
      </h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Record weather, pitch conditions, delays, injuries, fines, and referee notes</p>

      {/* Match selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Select Match</label>
        <select value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]">
          <option value="">Choose match...</option>
          {matches.map(m => (
            <option key={m.id} value={m.id}>M{m.matchNo}: {m.team1.name} vs {m.team2.name} ({new Date(m.date).toLocaleDateString()})</option>
          ))}
        </select>
      </div>

      {selectedMatch && (
        <div className="space-y-6">
          {loading && <div className="text-center py-8 text-[var(--muted-foreground)]">Loading...</div>}

          {/* Weather & Ground */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Cloud className="w-5 h-5 text-blue-400" /> Weather & Ground</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Weather</label>
                <select value={notes.weather} onChange={e => update("weather", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                  <option value="">Select...</option>
                  {["Sunny", "Cloudy", "Overcast", "Rainy", "Drizzle", "Hazy", "Clear", "Windy"].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Temperature</label>
                <input type="text" value={notes.temperature} onChange={e => update("temperature", e.target.value)} placeholder="e.g. 32°C" className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pitch Type</label>
                <select value={notes.pitchType} onChange={e => update("pitchType", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                  <option value="">Select...</option>
                  {["Green Top", "Flat Track", "Turning Track", "Dusty", "Bouncy", "Slow", "Wet"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ground Condition</label>
                <select value={notes.groundCondition} onChange={e => update("groundCondition", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                  <option value="">Select...</option>
                  {["Dry", "Moist", "Wet", "Damp", "Well-maintained", "Under Repair"].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Delay */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-400" /> Delay / Disruption</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Delay Reason</label>
                <select value={notes.delayReason} onChange={e => update("delayReason", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                  <option value="">No delay</option>
                  {["Rain", "Bad Light", " wet outfield", "Floodlight Failure", "Pitch Damage", "Security", "Other"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Delay Duration</label>
                <input type="text" value={notes.delayDuration} onChange={e => update("delayDuration", e.target.value)} placeholder="e.g. 45 minutes" className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)]" />
              </div>
            </div>
          </div>

          {/* Injuries & Replacements */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Thermometer className="w-5 h-5 text-red-400" /> Injuries & Replacements</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Injury Notes</label>
                <textarea value={notes.injuryNotes} onChange={e => update("injuryNotes", e.target.value)} placeholder="Any injuries during the match..." rows={3} className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Player Replacements / Substitutes</label>
                <textarea value={notes.replacements} onChange={e => update("replacements", e.target.value)} placeholder="e.g. Player X replaced by Player Y ( concussion substitute )" rows={2} className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)]" />
              </div>
            </div>
          </div>

          {/* Fines & Discipline */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-orange-400" /> Discipline & Fines</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fines / Warnings</label>
                <textarea value={notes.fines} onChange={e => update("fines", e.target.value)} placeholder="Any fines or warnings issued during the match..." rows={2} className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Referee Notes</label>
                <textarea value={notes.refereeNotes} onChange={e => update("refereeNotes", e.target.value)} placeholder="Match referee notes..." rows={2} className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)]" />
              </div>
            </div>
          </div>

          {/* Incidents */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-purple-400" /> Match Incidents</h2>
            <textarea value={notes.incidents} onChange={e => update("incidents", e.target.value)} placeholder="Notable incidents, controversies, crowd issues, etc." rows={4} className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)]" />
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50 transition">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Notes"}
            </button>
            {saved && <span className="text-green-400 flex items-center gap-1 text-sm"><CheckCircle className="w-4 h-4" /> Saved!</span>}
          </div>
        </div>
      )}
    </div>
  )
}
