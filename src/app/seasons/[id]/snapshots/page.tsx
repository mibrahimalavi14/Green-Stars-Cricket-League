"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Trophy, ChevronLeft, ChevronRight, Clock, TrendingUp } from "lucide-react"

interface Snapshot {
  id: string
  seasonId: string
  matchId: string
  matchNo: number
  pointsTable: { id: string; name: string; shortName: string; logo: string; color: string; played: number; won: number; lost: number; tied: number; nr: number; points: number; nrr: number }[]
  orangeCap: { playerId: string; playerName: string; teamName: string; runs: number; matches: number }[]
  purpleCap: { playerId: string; playerName: string; teamName: string; wickets: number; matches: number }[]
  records: any
  createdAt: string
}

export default function SeasonSnapshotsPage() {
  const params = useParams()
  const seasonId = params.id as string
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSnapshots()
  }, [seasonId])

  async function fetchSnapshots() {
    setLoading(true)
    try {
      const res = await fetch(`/api/snapshots?seasonId=${seasonId}`)
      const data = await res.json()
      setSnapshots(data)
      setCurrentIndex(data.length - 1)
    } catch {
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading snapshots...</p>
      </div>
    </div>
  )

  if (snapshots.length === 0) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">No Snapshots Yet</h1>
        <p className="text-slate-400">Snapshots are saved automatically after each match is completed.</p>
      </div>
    </div>
  )

  const snap = snapshots[currentIndex]

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href={`/seasons/${seasonId}`} className="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-1 mb-3">
            <ChevronLeft className="w-4 h-4" /> Back to Season
          </Link>
          <h1 className="text-2xl font-bold text-white">Season Timeline</h1>
          <p className="text-slate-400 text-sm mt-1">Track how the season evolved match by match</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        {/* Navigation */}
        <div className="flex items-center justify-between bg-slate-900/50 border border-slate-700/30 rounded-xl p-4 mb-6">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-600/30 text-white disabled:opacity-30 hover:bg-slate-700 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <div className="text-center">
            <div className="text-lg font-bold text-white">After Match {snap.matchNo}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1 justify-center">
              <Clock className="w-3 h-3" />
              {new Date(snap.createdAt).toLocaleDateString()}
            </div>
          </div>
          <button
            onClick={() => setCurrentIndex(Math.min(snapshots.length - 1, currentIndex + 1))}
            disabled={currentIndex === snapshots.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-600/30 text-white disabled:opacity-30 hover:bg-slate-700 transition"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline dots */}
        <div className="flex items-center gap-1 justify-center mb-6 overflow-x-auto px-4">
          {snapshots.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-3 h-3 rounded-full transition-all flex-shrink-0 ${
                i === currentIndex ? "bg-amber-500 scale-150" : i < currentIndex ? "bg-amber-500/40" : "bg-slate-700"
              }`}
              title={`After Match ${s.matchNo}`}
            />
          ))}
        </div>

        {/* Points Table */}
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-700/30">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Points Table
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="px-3 py-2 text-left text-slate-400 font-medium">#</th>
                  <th className="px-3 py-2 text-left text-slate-400 font-medium">Team</th>
                  <th className="px-3 py-2 text-center text-slate-400 font-medium">P</th>
                  <th className="px-3 py-2 text-center text-slate-400 font-medium">W</th>
                  <th className="px-3 py-2 text-center text-slate-400 font-medium">L</th>
                  <th className="px-3 py-2 text-center text-slate-400 font-medium">Pts</th>
                  <th className="px-3 py-2 text-center text-slate-400 font-medium">NRR</th>
                </tr>
              </thead>
              <tbody>
                {snap.pointsTable.map((t, i) => (
                  <tr key={t.id} className={`border-t border-slate-700/20 ${i < 4 ? "bg-amber-500/5" : ""}`}>
                    <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: t.color || "#f59e0b" }}>
                          {t.shortName[0]}
                        </div>
                        <span className="text-white font-medium">{t.shortName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-slate-300">{t.played}</td>
                    <td className="px-3 py-2 text-center text-green-400">{t.won}</td>
                    <td className="px-3 py-2 text-center text-red-400">{t.lost}</td>
                    <td className="px-3 py-2 text-center text-white font-bold">{t.points}</td>
                    <td className="px-3 py-2 text-center text-slate-300 font-mono text-xs">
                      {t.nrr > 0 ? "+" : ""}{t.nrr.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orange & Purple Cap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700/30">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" /> Orange Cap
              </h2>
            </div>
            <div className="divide-y divide-slate-700/20">
              {snap.orangeCap.slice(0, 5).map((p, i) => (
                <div key={p.playerId} className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-sm w-4">{i + 1}.</span>
                    <div>
                      <div className="text-white text-sm font-medium">{p.playerName}</div>
                      <div className="text-slate-400 text-xs">{p.teamName}</div>
                    </div>
                  </div>
                  <div className="text-orange-400 font-bold">{p.runs}</div>
                </div>
              ))}
              {snap.orangeCap.length === 0 && <div className="px-4 py-3 text-slate-500 text-sm">No data yet</div>}
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700/30">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" /> Purple Cap
              </h2>
            </div>
            <div className="divide-y divide-slate-700/20">
              {snap.purpleCap.slice(0, 5).map((p, i) => (
                <div key={p.playerId} className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-sm w-4">{i + 1}.</span>
                    <div>
                      <div className="text-white text-sm font-medium">{p.playerName}</div>
                      <div className="text-slate-400 text-xs">{p.teamName}</div>
                    </div>
                  </div>
                  <div className="text-purple-400 font-bold">{p.wickets}</div>
                </div>
              ))}
              {snap.purpleCap.length === 0 && <div className="px-4 py-3 text-slate-500 text-sm">No data yet</div>}
            </div>
          </div>
        </div>

        {/* Summary row */}
        <div className="text-center text-slate-400 text-sm">
          Showing state after Match {snap.matchNo} of {snapshots.length} total snapshots
        </div>
      </div>
    </div>
  )
}
