"use client"

import { useState, useEffect } from "react"
import { Map, Activity, Target, Zap, Crosshair, Shield } from "lucide-react"

interface RegionStat {
  region: string
  balls: number
  runs: number
  fours: number
  sixes: number
  wickets: number
  dotBalls: number
  sr: string
  avg: string
}

export default function FieldAnalysisPage() {
  const [data, setData] = useState<{ regions: RegionStat[]; totalBalls: number; totalRuns: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"runs" | "wickets" | "sr">("runs")

  useEffect(() => {
    fetch("/api/field-analysis")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const regionColors: Record<string, string> = {
    Straight: "bg-gray-500",
    Off: "bg-blue-500",
    Cover: "bg-cyan-500",
    "Mid Off": "bg-sky-500",
    "Mid On": "bg-indigo-500",
    Leg: "bg-green-500",
    "Fine Leg": "bg-lime-500",
    "Square Leg": "bg-emerald-500",
    "Mid Wkt": "bg-teal-500",
    "Long On": "bg-purple-500",
    "Long Off": "bg-violet-500",
    Third: "bg-orange-500",
    Point: "bg-amber-500",
    Gully: "bg-yellow-500",
    Slip: "bg-red-500",
  }

  const maxRuns = data ? Math.max(...data.regions.map((r) => r.runs), 1) : 1
  const maxWkts = data ? Math.max(...data.regions.map((r) => r.wickets), 1) : 1

  const fieldDiagram = (
    <div className="relative mx-auto aspect-square w-full max-w-xs">
      <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]" />
      <div className="absolute left-1/2 top-0 h-px w-px -translate-x-1/2 bg-[var(--border)]" />
      <div className="absolute bottom-0 left-1/2 h-px w-px -translate-x-1/2 bg-[var(--border)]" />
      <div className="absolute left-0 top-1/2 h-px w-px -translate-y-1/2 bg-[var(--border)]" />
      <div className="absolute right-0 top-1/2 h-px w-px -translate-y-1/2 bg-[var(--border)]" />
      {[
        { name: "Straight", x: 50, y: 5 },
        { name: "Long Off", x: 25, y: 10 },
        { name: "Long On", x: 75, y: 10 },
        { name: "Mid Off", x: 20, y: 22 },
        { name: "Mid On", x: 80, y: 22 },
        { name: "Cover", x: 12, y: 35 },
        { name: "Mid Wkt", x: 88, y: 35 },
        { name: "Off", x: 5, y: 50 },
        { name: "Leg", x: 95, y: 50 },
        { name: "Point", x: 10, y: 65 },
        { name: "Square Leg", x: 90, y: 65 },
        { name: "Gully", x: 18, y: 78 },
        { name: "Fine Leg", x: 82, y: 78 },
        { name: "Third", x: 25, y: 88 },
        { name: "Slip", x: 35, y: 92 },
      ].map((p) => {
        const stat = data?.regions.find((r) => r.region === p.name)
        const intensity = view === "runs" ? (stat ? stat.runs / maxRuns : 0) : view === "wickets" ? (stat ? stat.wickets / maxWkts : 0) : 0
        const size = view === "sr" ? 16 : 10 + intensity * 20
        return (
          <div
            key={p.name}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[8px] font-bold text-white shadow-lg transition-all"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${Math.max(size, 12)}px`,
              height: `${Math.max(size, 12)}px`,
              backgroundColor: stat ? regionColors[p.name] || "#666" : "#444",
              opacity: stat ? 0.9 : 0.3,
            }}
            title={`${p.name}: ${stat ? `${stat.runs} runs, ${stat.wickets} wkts, ${stat.sr} SR` : "No data"}`}
          >
            {p.name === "Straight" ? "ST" : p.name.slice(0, 2)}
          </div>
        )
      })}
    </div>
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--muted-foreground)]">Loading field analysis...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Map className="h-6 w-6 text-[var(--accent)]" /> Field Analysis
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Ball placement analysis across {data?.totalBalls || 0} balls and {data?.regions.length || 0} field regions
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-sm font-semibold">Field Diagram</span>
              </div>
              <div className="mb-3 flex gap-1">
                {(["runs", "wickets", "sr"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                      view === v
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
                    }`}
                  >
                    {v === "runs" ? "By Runs" : v === "wickets" ? "By Wickets" : "By SR"}
                  </button>
                ))}
              </div>
              {fieldDiagram}
              <div className="mt-3 grid grid-cols-2 gap-1 text-center text-[10px] text-[var(--muted-foreground)]">
                <div className="rounded bg-[var(--muted)] p-1">
                  Total Balls: <span className="font-bold text-[var(--foreground)]">{data?.totalBalls}</span>
                </div>
                <div className="rounded bg-[var(--muted)] p-1">
                  Total Runs: <span className="font-bold text-[var(--foreground)]">{data?.totalRuns}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <div className="border-b border-[var(--border)] p-3">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                  <Target className="h-4 w-4 text-[var(--accent)]" /> Region-wise Stats
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                      <th className="p-3 text-left font-medium">Region</th>
                      <th className="p-3 text-center font-medium">Balls</th>
                      <th className="p-3 text-center font-medium">Runs</th>
                      <th className="p-3 text-center font-medium">4s</th>
                      <th className="p-3 text-center font-medium">6s</th>
                      <th className="p-3 text-center font-medium">Wkts</th>
                      <th className="p-3 text-center font-medium">Dots</th>
                      <th className="p-3 text-center font-medium">SR</th>
                      <th className="p-3 text-center font-medium">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.regions.map((r, i) => {
                      const barWidth = (r.runs / maxRuns) * 100
                      return (
                        <tr key={r.region} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]/30">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block h-3 w-3 rounded-sm ${regionColors[r.region] || "bg-gray-500"}`} />
                              <span className="font-medium">{r.region}</span>
                              {i < 3 && <span className="text-[10px] text-[var(--accent)]">#{i + 1}</span>}
                            </div>
                          </td>
                          <td className="p-3 text-center">{r.balls}</td>
                          <td className="p-3 text-center font-bold">{r.runs}</td>
                          <td className="p-3 text-center text-pink-500">{r.fours}</td>
                          <td className="p-3 text-center text-red-500">{r.sixes}</td>
                          <td className="p-3 text-center text-purple-500">{r.wickets}</td>
                          <td className="p-3 text-center text-[var(--muted-foreground)]">{r.dotBalls}</td>
                          <td className="p-3 text-center">{r.sr}</td>
                          <td className="p-3 text-center">{r.avg}</td>
                        </tr>
                      )
                    })}
                    {(!data || data.regions.length === 0) && (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-sm text-[var(--muted-foreground)]">
                          No field data available yet. Start recording ball regions in live scoring!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {data && data.regions.length > 0 && (
                <div className="border-t border-[var(--border)] p-3">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    <Shield className="mr-1 inline-block h-3 w-3" />
                    Top scoring region: <span className="font-bold text-[var(--foreground)]">{data.regions[0]?.region}</span> ({data.regions[0]?.runs} runs) —
                    Most wickets region: <span className="font-bold text-[var(--foreground)]">{data.regions.reduce((a, b) => a.wickets > b.wickets ? a : b).region}</span> ({data.regions.reduce((a, b) => a.wickets > b.wickets ? a : b).wickets} wkts)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
