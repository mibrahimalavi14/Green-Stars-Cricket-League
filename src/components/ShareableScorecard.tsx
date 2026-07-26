"use client"

import { Star } from "lucide-react"

interface Props {
  matchNo: number
  team1: { name: string; shortName: string; color: string }
  team2: { name: string; shortName: string; color: string }
  t1Score: string
  t2Score: string
  result: string
  winner?: string
  motm?: string
  date?: string
  venue?: string
}

export function ShareableScorecard({ matchNo, team1, team2, t1Score, t2Score, result, winner, motm, date, venue }: Props) {
  const t1Won = winner === team1.name
  const t2Won = winner === team2.name

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-1 shadow-2xl" id="scorecard-share">
      <div className="rounded-xl bg-slate-900/95 p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-xs font-bold tracking-widest text-amber-400 mb-1">GSCL</div>
          <div className="text-sm font-medium text-slate-400">Match {matchNo}</div>
          {date && <div className="text-xs text-slate-500 mt-1">{date}</div>}
        </div>

        {/* Teams & Scores */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center mb-6">
          {/* Team 1 */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-xl font-bold mb-2 border-4" style={{ backgroundColor: team1.color, borderColor: t1Won ? "#22c55e" : team1.color }}>
              {team1.shortName}
            </div>
            <div className="text-white font-bold text-sm">{team1.name}</div>
            <div className="text-2xl md:text-3xl font-black text-white mt-2 font-mono">{t1Score}</div>
            {t1Won && <div className="mt-1 text-xs font-bold text-green-400">WINNER</div>}
          </div>

          {/* VS */}
          <div className="text-center px-2">
            <div className="text-xs text-slate-500 font-bold tracking-widest">VS</div>
          </div>

          {/* Team 2 */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-xl font-bold mb-2 border-4" style={{ backgroundColor: team2.color, borderColor: t2Won ? "#22c55e" : team2.color }}>
              {team2.shortName}
            </div>
            <div className="text-white font-bold text-sm">{team2.name}</div>
            <div className="text-2xl md:text-3xl font-black text-white mt-2 font-mono">{t2Score}</div>
            {t2Won && <div className="mt-1 text-xs font-bold text-green-400">WINNER</div>}
          </div>
        </div>

        {/* Result */}
        <div className="text-center mb-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="text-amber-400 font-bold text-sm">{result}</div>
        </div>

        {/* MOTM */}
        {motm && (
          <div className="text-center flex items-center justify-center gap-2 text-sm">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Man of the Match:</span>
            <span className="text-white font-bold">{motm}</span>
          </div>
        )}

        {venue && <div className="text-center text-xs text-slate-500 mt-3">{venue}</div>}

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-slate-700/50">
          <div className="text-xs text-slate-600">greenstarscricketleague.vercel.app</div>
        </div>
      </div>
    </div>
  )
}
