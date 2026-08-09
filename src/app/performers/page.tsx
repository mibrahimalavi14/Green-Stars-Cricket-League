"use client"

import { useState, useEffect } from "react"
import { Trophy, Award, Target, Loader2, Eye, Crosshair, UserCheck } from "lucide-react"

export default function PerformersPage() {
  const [data, setData] = useState<any>(null)
  const [tab, setTab] = useState<"batting" | "bowling" | "fielding">("batting")

  useEffect(() => {
    fetch("/api/performers").then(r => r.json()).then(setData)
  }, [])

  if (!data) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  const tabs = [
    { key: "batting", label: "Batting", icon: Award, list: data.batsmen, cols: ["Mat", "Runs", "HS", "Avg", "SR", "RPB", "4s", "6s", "Ducks", "Dot%", "Bdy%"] },
    { key: "bowling", label: "Bowling", icon: Target, list: data.bowlers, cols: ["Mat", "Wkts", "Ov", "Mdns", "Avg", "Econ", "RPB", "5w", "4w", "Wd", "Nb", "HT"] },
    { key: "fielding", label: "Fielding", icon: Trophy, list: data.fielders, cols: ["Ct", "St", "RO", "Bwd", "LBW", "Total"] },
  ]

  const active = tabs.find(t => t.key === tab)!

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Top Performers</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">All-time leading performers across the league</p>

      <div className="mb-6 flex gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "border border-[var(--border)] hover:bg-[var(--muted)]"
            }`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="bg-[var(--muted)] text-left">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Player</th>
              <th className="px-4 py-3 font-medium">Team</th>
              {active.cols.map(c => <th key={c} className="px-4 py-3 text-right font-medium">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {active.list.map((p: any, i: number) => (
              <tr key={p.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{p.team}</td>
                {tab === "batting" && (
                  <>
                    <td className="px-4 py-3 text-right">{p.matches}</td>
                    <td className="px-4 py-3 text-right font-bold">{p.runs}</td>
                    <td className="px-4 py-3 text-right">{p.highestScore}</td>
                    <td className="px-4 py-3 text-right">{p.average}</td>
                    <td className="px-4 py-3 text-right">{p.strikeRate}</td>
                    <td className="px-4 py-3 text-right font-mono">{p.rpb}</td>
                    <td className="px-4 py-3 text-right">{p.fours}</td>
                    <td className="px-4 py-3 text-right">{p.sixes}</td>
                    <td className="px-4 py-3 text-right">{p.ducks}</td>
                    <td className="px-4 py-3 text-right">{p.dotBallPct}</td>
                    <td className="px-4 py-3 text-right">{p.boundaryPct}</td>
                  </>
                )}
                {tab === "bowling" && (
                  <>
                    <td className="px-4 py-3 text-right">{p.matches}</td>
                    <td className="px-4 py-3 text-right font-bold">{p.wickets}</td>
                    <td className="px-4 py-3 text-right">{p.overs}</td>
                    <td className="px-4 py-3 text-right">{p.maidens}</td>
                    <td className="px-4 py-3 text-right">{p.average}</td>
                    <td className="px-4 py-3 text-right">{p.economy}</td>
                    <td className="px-4 py-3 text-right font-mono">{p.rpb}</td>
                    <td className="px-4 py-3 text-right">{p.fiveWickets}</td>
                    <td className="px-4 py-3 text-right">{p.fourWickets}</td>
                    <td className="px-4 py-3 text-right">{p.wides}</td>
                    <td className="px-4 py-3 text-right">{p.noBalls}</td>
                    <td className="px-4 py-3 text-right">{p.hattricks}</td>
                  </>
                )}
                {tab === "fielding" && (
                  <>
                    <td className="px-4 py-3 text-right">{p.catches}</td>
                    <td className="px-4 py-3 text-right">{p.stumpings}</td>
                    <td className="px-4 py-3 text-right">{p.runOuts}</td>
                    <td className="px-4 py-3 text-right">{p.timesBowled}</td>
                    <td className="px-4 py-3 text-right">{p.timesLbw}</td>
                    <td className="px-4 py-3 text-right font-bold">{p.total}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
