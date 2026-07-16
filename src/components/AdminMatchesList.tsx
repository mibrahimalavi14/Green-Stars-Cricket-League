"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Match {
  id: string; matchNo: number; date: string; status: string; result: string; team1Score: string; team2Score: string
  tossWinner: string; tossDecision: string; manOfMatch: string; venue: string
  team1: { id: string; shortName: string; name: string; color: string; logo: string }
  team2: { id: string; shortName: string; name: string; color: string; logo: string }
  season: { name: string }
  innings: { teamId: string; runs: number; wickets: number; balls: number; extras: number }[]
}

interface Player {
  id: string; name: string; role: string; teamId: string
}

export function AdminMatchesList({ matches }: { matches: Match[] }) {
  const router = useRouter()
  const [scoring, setScoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [form, setForm] = useState({
    team1Score: "", team2Score: "", result: "",
    tossWinner: "", tossDecision: "", venue: "",
    inn1Wides: "", inn1NoBalls: "", inn1Byes: "", inn1LegByes: "",
    inn2Wides: "", inn2NoBalls: "", inn2Byes: "", inn2LegByes: "",
  })
  const [stats, setStats] = useState<Record<string, Record<string, string>>>({})
  const [neutralFielders, setNeutralFielders] = useState<{ playerId: string; ct: string; st: string; ro: string; wk: boolean }[]>([])
  const [savedInnings, setSavedInnings] = useState<{ teamId: string; runs: number; wickets: number; balls: number; extras: number }[]>([])
  const [superOver, setSuperOver] = useState({ t1Runs: "", t1Wkts: "", t2Runs: "", t2Wkts: "" })

  useEffect(() => {
    fetch("/api/players").then(r => r.json()).then(setAllPlayers)
  }, [])

  function openScoring(id: string, m: Match) {
    const inn1 = m.innings?.find(i => i.teamId === m.team1.id)
    const inn2 = m.innings?.find(i => i.teamId === m.team2.id)
    setScoring(id)
    setForm({
      team1Score: m.team1Score || "", team2Score: m.team2Score || "", result: m.result || "",
      tossWinner: m.tossWinner || "", tossDecision: m.tossDecision || "",
      venue: m.venue || "",
      inn1Wides: inn1?.extras?.toString() || "", inn1NoBalls: "", inn1Byes: "", inn1LegByes: "",
      inn2Wides: inn2?.extras?.toString() || "", inn2NoBalls: "", inn2Byes: "", inn2LegByes: "",
    })
    setStats({})
    setSavedInnings(m.innings || [])
    setSuperOver({ t1Runs: "", t1Wkts: "", t2Runs: "", t2Wkts: "" })
    const others = allPlayers.filter(p => p.teamId !== m.team1.id && p.teamId !== m.team2.id)
    setNeutralFielders(others.map((p, i) => ({ playerId: p.id, ct: "", st: "", ro: "", wk: i === 0 })))
  }

  function calcTeamStats(teamId: string) {
    const players = allPlayers.filter(p => p.teamId === teamId)
    const runs = players.reduce((sum, p) => sum + (parseInt(s(p.id, "runs")) || 0), 0)
    const wickets = players.reduce((sum, p) => sum + (s(p.id, "out") === "1" ? 1 : 0), 0)
    const ballsFaced = players.reduce((sum, p) => sum + (parseInt(s(p.id, "bf")) || 0), 0)
    const ballsBowled = players.reduce((sum, p) => sum + (parseInt(s(p.id, "bb")) || 0), 0)
    const liveBalls = Math.max(ballsFaced, ballsBowled)
    if (liveBalls === 0 && savedInnings.length > 0) {
      const saved = savedInnings.find(i => i.teamId === teamId)
      if (saved) return { runs: saved.runs, wickets: saved.wickets, balls: saved.balls }
    }
    return { runs, wickets, balls: liveBalls }
  }

  function calcFieldExtras(prefix: string) {
    return (parseInt(form[`${prefix}Wides` as keyof typeof form] as string) || 0) +
      (parseInt(form[`${prefix}NoBalls` as keyof typeof form] as string) || 0) +
      (parseInt(form[`${prefix}Byes` as keyof typeof form] as string) || 0) +
      (parseInt(form[`${prefix}LegByes` as keyof typeof form] as string) || 0)
  }

  function s(playerId: string, field: string) {
    return stats[playerId]?.[field] ?? ""
  }

  function set(playerId: string, field: string, value: string) {
    setStats(prev => ({
      ...prev,
      [playerId]: { ...(prev[playerId] || {}), [field]: value },
    }))
  }

  function toggleOut(playerId: string) {
    setStats(prev => ({
      ...prev,
      [playerId]: { ...(prev[playerId] || {}), out: prev[playerId]?.out === "1" ? "" : "1" },
    }))
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    router.refresh()
  }

  async function submitScore(id: string, m: Match) {
    const playersData = allPlayers
      .filter(p => p.teamId === m.team1.id || p.teamId === m.team2.id)
      .map(p => ({
        playerId: p.id,
        teamId: p.teamId,
        battingRuns: parseInt(s(p.id, "runs")) || 0,
        ballsFaced: parseInt(s(p.id, "bf")) || 0,
        fours: parseInt(s(p.id, "4s")) || 0,
        sixes: parseInt(s(p.id, "6s")) || 0,
        ones: parseInt(s(p.id, "1s")) || 0,
        twos: parseInt(s(p.id, "2s")) || 0,
        isOut: s(p.id, "out") === "1",
        dismissalType: s(p.id, "dismissal") || "",
        bowlingWickets: parseInt(s(p.id, "wkts")) || 0,
        bowlingRuns: parseInt(s(p.id, "br")) || 0,
        ballsBowled: parseInt(s(p.id, "bb")) || 0,
        maidens: parseInt(s(p.id, "mdns")) || 0,
        catches: parseInt(s(p.id, "ct")) || 0,
        stumpings: parseInt(s(p.id, "st")) || 0,
        runOuts: parseInt(s(p.id, "ro")) || 0,
      }))
    const neutralData = neutralFielders
      .filter(n => n.playerId && (n.ct || n.st || n.ro))
      .map(n => ({
        playerId: n.playerId,
        teamId: m.team1.id,
        battingRuns: 0, ballsFaced: 0, fours: 0, sixes: 0, ones: 0, twos: 0,
        isOut: false, dismissalType: "",
        bowlingWickets: 0, bowlingRuns: 0, ballsBowled: 0, maidens: 0,
        catches: parseInt(n.ct) || 0,
        stumpings: parseInt(n.st) || 0,
        runOuts: parseInt(n.ro) || 0,
      }))
    playersData.push(...neutralData)

    let mom = ""
    if (playersData.length > 0) {
      let bestScore = -Infinity
      for (const p of playersData) {
        const player = allPlayers.find(x => x.id === p.playerId)
        const battingImpact = p.battingRuns + p.fours * 2 + p.sixes * 4 - (p.isOut ? 5 : 0)
        const bowlingImpact = p.bowlingWickets * 25 - p.bowlingRuns
        const fieldingImpact = p.catches * 10 + p.stumpings * 15 + p.runOuts * 15
        const total = battingImpact + bowlingImpact + fieldingImpact
        if (total > bestScore) { bestScore = total; mom = p.playerId }
      }
    }

    let result = ""
    const team1Stats = calcTeamStats(m.team1.id)
    const team2Stats = calcTeamStats(m.team2.id)
    const s1Runs = team1Stats.runs
    const s2Runs = team2Stats.runs
    const s1Extras = calcFieldExtras("inn1")
    const s2Extras = calcFieldExtras("inn2")
    const s1Total = s1Runs + s1Extras
    const s2Total = s2Runs + s2Extras
    const s1Wkts = team1Stats.wickets
    const s2Wkts = team2Stats.wickets
    if ((s1Runs || s2Runs || s1Extras || s2Extras) && form.tossWinner && form.tossDecision) {
      const t1BattingFirst = form.tossDecision === "bat" ? form.tossWinner === m.team1.id : form.tossWinner === m.team2.id
      const t2BattingFirst = !t1BattingFirst
      if (s1Total === s2Total) {
        const so1Runs = parseInt(superOver.t1Runs) || 0
        const so2Runs = parseInt(superOver.t2Runs) || 0
        if (so1Runs || so2Runs) {
          if (so1Runs > so2Runs) result = `${m.team1.name} won the Super Over`
          else if (so2Runs > so1Runs) result = `${m.team2.name} won the Super Over`
          else result = "Super Over tied again"
        } else {
          result = "Match Tied"
        }
      } else if (s1Total > s2Total) {
        if (t1BattingFirst) {
          const diff = s1Total - s2Total
          result = `${m.team1.name} won by ${diff} run${diff !== 1 ? "s" : ""}`
        } else {
          const wktsLeft = 2 - s1Wkts
          result = `${m.team1.name} won by ${wktsLeft} wicket${wktsLeft !== 1 ? "s" : ""}`
        }
      } else {
        if (t2BattingFirst) {
          const diff = s2Total - s1Total
          result = `${m.team2.name} won by ${diff} run${diff !== 1 ? "s" : ""}`
        } else {
          const wktsLeft = 2 - s2Wkts
          result = `${m.team2.name} won by ${wktsLeft} wicket${wktsLeft !== 1 ? "s" : ""}`
        }
      }
    }
    const t1Balls = team1Stats.balls
    const t2Balls = team2Stats.balls
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id, status: "completed",
        team1Score: `${s1Total}/${s1Wkts}${t1Balls ? ` (${Math.floor(t1Balls / 6)}.${t1Balls % 6})` : ""}`,
        team2Score: `${s2Total}/${s2Wkts}${t2Balls ? ` (${Math.floor(t2Balls / 6)}.${t2Balls % 6})` : ""}`,
        result,
        tossWinner: form.tossWinner, tossDecision: form.tossDecision,
        manOfMatch: mom, venue: form.venue,
      }),
    })

    if (playersData.length > 0) {
      await fetch("/api/performances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: id, players: playersData }),
      })
    }

    if (s1Runs || s2Runs) {
      await fetch("/api/innings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: id,
          innings: [
            { teamId: m.team1.id, runs: s1Runs, wickets: s1Wkts, balls: t1Balls, extras: s1Extras },
            { teamId: m.team2.id, runs: s2Runs, wickets: s2Wkts, balls: t2Balls, extras: s2Extras },
          ],
        }),
      })
    }

    setScoring(null)
    setForm({
      team1Score: "", team2Score: "", result: "",
      tossWinner: "", tossDecision: "", venue: "",
      inn1Wides: "", inn1NoBalls: "", inn1Byes: "", inn1LegByes: "",
      inn2Wides: "", inn2NoBalls: "", inn2Byes: "", inn2LegByes: "",
    })
    setSuperOver({ t1Runs: "", t1Wkts: "", t2Runs: "", t2Wkts: "" })
    router.refresh()
  }

  async function deleteMatch(id: string) {
    setDeleting(id)
    await fetch("/api/matches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    router.refresh()
  }

  function PlayerTable(players: Player[], teamName: string) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
              <th className="py-1 pr-2 text-left font-medium">Player</th>
              <th className="py-1 px-1 text-center font-medium" title="Batting Runs">Runs</th>
              <th className="py-1 px-1 text-center font-medium" title="Balls Faced">Balls</th>
              <th className="py-1 px-1 text-center font-medium" title="Fours">4s</th>
              <th className="py-1 px-1 text-center font-medium" title="Sixes">6s</th>
              <th className="py-1 px-1 text-center font-medium" title="Ones (1 run)">1s</th>
              <th className="py-1 px-1 text-center font-medium" title="Twos (2 runs)">2s</th>
              <th className="py-1 px-1 text-center font-medium">Out</th>
              <th className="py-1 px-1 text-center font-medium">Dismissal</th>
              <th className="py-1 px-1 text-center font-medium" title="Bowling Wickets">Wkts</th>
              <th className="py-1 px-1 text-center font-medium" title="Runs Conceded">Runs</th>
              <th className="py-1 px-1 text-center font-medium" title="Balls Bowled">Balls</th>
              <th className="py-1 px-1 text-center font-medium" title="Maidens">Mdns</th>
              <th className="py-1 px-1 text-center font-medium" title="Catches">Ct</th>
              <th className="py-1 px-1 text-center font-medium" title="Stumpings">St</th>
              <th className="py-1 px-1 text-center font-medium" title="Run Outs">RO</th>
            </tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--background)]">
                <td className="py-1 pr-2 text-left font-medium">{p.name}</td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "runs")} onChange={e => set(p.id, "runs", e.target.value)} className="w-10 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" max="30" value={s(p.id, "bf")} onChange={e => set(p.id, "bf", e.target.value)} className="w-10 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" title="Max 30 (5 overs)" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "4s")} onChange={e => set(p.id, "4s", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "6s")} onChange={e => set(p.id, "6s", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "1s")} onChange={e => set(p.id, "1s", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "2s")} onChange={e => set(p.id, "2s", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1 text-center"><input type="checkbox" checked={s(p.id, "out") === "1"} onChange={() => toggleOut(p.id)} className="h-3 w-3" /></td>
                <td className="py-1 px-1">
                  <select value={s(p.id, "dismissal")} onChange={e => set(p.id, "dismissal", e.target.value)} className="w-16 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center text-[10px]">
                    <option value="">-</option>
                    <option value="bowled">Bowled</option>
                    <option value="caught">Caught</option>
                    <option value="lbw">LBW</option>
                    <option value="stumped">Stumped</option>
                    <option value="run out">Run Out</option>
                    <option value="retired">Retired</option>
                    <option value="hit wicket">Hit Wkt</option>
                  </select>
                </td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "wkts")} onChange={e => set(p.id, "wkts", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "br")} onChange={e => set(p.id, "br", e.target.value)} className="w-10 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" title="Runs Conceded" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "bb")} onChange={e => set(p.id, "bb", e.target.value)} className="w-10 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" title="Legal deliveries only (exclude wides/no-balls)" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "mdns")} onChange={e => set(p.id, "mdns", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "ct")} onChange={e => set(p.id, "ct", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "st")} onChange={e => set(p.id, "st", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "ro")} onChange={e => set(p.id, "ro", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => {
        const playoffCutoff = new Date("2026-08-16T00:00:00.000Z")
        const md = new Date(m.date)
        const isPlayoff = md >= playoffCutoff
        function playoffLabel(d: Date) {
          const iso = d.toISOString()
          if (iso.startsWith("2026-08-16T11:")) return "Qualifier 1"
          if (iso.startsWith("2026-08-16T12:")) return "Eliminator"
          if (iso.startsWith("2026-08-16T13:")) return "Qualifier 2"
          if (iso.startsWith("2026-08-23T")) return "Final"
          return ""
        }
        const team1Players = allPlayers.filter(p => p.teamId === m.team1.id)
        const team2Players = allPlayers.filter(p => p.teamId === m.team2.id)
        function autoResult() {
          const t1Stats = calcTeamStats(m.team1.id)
          const t2Stats = calcTeamStats(m.team2.id)
          const t1Runs = t1Stats.runs
          const t2Runs = t2Stats.runs
          const t1Extras = calcFieldExtras("inn1")
          const t2Extras = calcFieldExtras("inn2")
          const t1Total = t1Runs + t1Extras
          const t2Total = t2Runs + t2Extras
          const t1Wkts = t1Stats.wickets
          const t2Wkts = t2Stats.wickets
          if (!t1Runs && !t2Runs && !t1Extras && !t2Extras) return ""
          if (!form.tossWinner || !form.tossDecision) return ""
          const t1BattingFirst = form.tossDecision === "bat" ? form.tossWinner === m.team1.id : form.tossWinner === m.team2.id
          const t2BattingFirst = !t1BattingFirst
          if (t1Total === t2Total) {
            const so1Runs = parseInt(superOver.t1Runs) || 0
            const so2Runs = parseInt(superOver.t2Runs) || 0
            if (so1Runs || so2Runs) {
              const soWinner = so1Runs > so2Runs ? m.team1.name : so2Runs > so1Runs ? m.team2.name : ""
              if (soWinner) return `Match Tied (${soWinner} won the Super Over${so1Runs === so2Runs ? " (tied again)" : ""})`
              return "Match Tied (Super Over tied again - add another)"
            }
            return "Match Tied"
          }
          if (t1Total > t2Total) {
            if (t1BattingFirst) {
              const diff = t1Total - t2Total
              return `${m.team1.name} won by ${diff} run${diff !== 1 ? "s" : ""}`
            } else {
              const wktsLeft = 2 - t1Wkts
              return `${m.team1.name} won by ${wktsLeft} wicket${wktsLeft !== 1 ? "s" : ""}`
            }
          } else {
            if (t2BattingFirst) {
              const diff = t2Total - t1Total
              return `${m.team2.name} won by ${diff} run${diff !== 1 ? "s" : ""}`
            } else {
              const wktsLeft = 2 - t2Wkts
              return `${m.team2.name} won by ${wktsLeft} wicket${wktsLeft !== 1 ? "s" : ""}`
            }
          }
          return ""
        }
        return (
        <div key={m.id} className={`rounded-lg border p-3 sm:p-4 ${isPlayoff ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10' : 'border-[var(--border)] bg-[var(--card)]'}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">{isPlayoff ? 'Playoffs' : `${m.season.name} \u00b7 Match ${m.matchNo}`} &middot; {new Date(m.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric" })} &middot; {new Date(m.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })}</p>
              {isPlayoff ? (
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{playoffLabel(md)}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">&middot;</span>
                  <p className="font-bold text-amber-600 dark:text-amber-400">TBD</p>
                  <span className="text-xs text-amber-600 dark:text-amber-400">vs</span>
                  <p className="font-bold text-amber-600 dark:text-amber-400">TBD</p>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  {m.team1.logo && <img src={m.team1.logo} alt="" className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover" />}
                  <p className="font-medium text-sm">{m.team1.name}</p>
                  <span className="text-xs text-[var(--muted-foreground)]">vs</span>
                  <p className="font-medium text-sm">{m.team2.name}</p>
                  {m.team2.logo && <img src={m.team2.logo} alt="" className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover" />}
                </div>
              )}
              {!isPlayoff && m.team1Score && <p className="text-sm">{m.team1Score} - {m.team2Score}</p>}
              {!isPlayoff && m.result && <p className="text-xs text-[var(--muted-foreground)]">{m.result}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
              <span className={`rounded px-2 py-1 text-xs font-medium ${
                m.status === "live" ? "bg-red-500/20 text-red-500" :
                m.status === "completed" ? "bg-green-500/20 text-green-500" :
                "bg-blue-500/20 text-blue-500"
              }`}>{m.status}</span>
              {m.status === "upcoming" && (
                <button onClick={() => updateStatus(m.id, "live")} className="rounded bg-red-500 px-2 py-1 text-xs text-white whitespace-nowrap">Set Live</button>
              )}
              {!scoring && (
                <button onClick={() => openScoring(m.id, m)} className="rounded bg-green-500 px-2 py-1 text-xs text-white whitespace-nowrap">
                  {m.status === "completed" ? (m.team1Score ? "Edit Result" : "Add Result") : m.status === "live" ? "Add Score" : "Set Result"}
                </button>
              )}
              <button onClick={() => deleteMatch(m.id)} disabled={deleting === m.id}
                className="rounded bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50 whitespace-nowrap">Delete</button>
            </div>
          </div>

          {scoring === m.id && (
            <div className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs">Toss Winner</label>
                  <select value={form.tossWinner} onChange={e => setForm({...form, tossWinner: e.target.value})}
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm">
                    <option value="">Select</option>
                    <option value={m.team1.id}>{m.team1.name}</option>
                    <option value={m.team2.id}>{m.team2.name}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs">Toss Decision</label>
                  <select value={form.tossDecision} onChange={e => setForm({...form, tossDecision: e.target.value})}
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm">
                    <option value="">Select</option>
                    <option value="bat">Bat</option>
                    <option value="bowl">Bowl</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs">Venue</label>
                  <input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})}
                    placeholder="Main Stadium"
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs">Result</label>
                <p className="rounded border border-[var(--border)] bg-[var(--muted)] px-2 py-1 text-sm text-[var(--muted-foreground)]">{autoResult() || "\u00a0"}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {[m.team1, m.team2].map(t => {
                  const st = calcTeamStats(t.id)
                  const extras = calcFieldExtras(t.id === m.team1.id ? "inn1" : "inn2")
                  const total = st.runs + extras
                  return (
                    <div key={t.id} className="rounded border border-[var(--border)] bg-[var(--muted)] p-2">
                      <p className="mb-1 font-semibold text-sm">{t.name}</p>
                      <div className="grid grid-cols-5 gap-1 text-xs text-center">
                        <div><p className="text-[var(--muted-foreground)]">Runs</p><p className="font-medium">{st.runs}</p></div>
                        <div><p className="text-[var(--muted-foreground)]">Wkts</p><p className="font-medium">{st.wickets}</p></div>
                        <div><p className="text-[var(--muted-foreground)]">Overs</p><p className="font-medium">{st.balls ? `${Math.floor(st.balls / 6)}.${st.balls % 6}` : "0.0"}</p></div>
                        <div><p className="text-[var(--muted-foreground)]">Extras</p><p className="font-medium">{extras}</p></div>
                        <div><p className="text-[var(--muted-foreground)]">Total</p><p className="font-medium">{total}</p></div>
                      </div>
                    </div>
                  )
                })}
                {form.tossWinner && form.tossDecision && (() => {
                  const t1BattingFirst = form.tossDecision === "bat" ? form.tossWinner === m.team1.id : form.tossWinner === m.team2.id
                  const firstTeam = t1BattingFirst ? m.team1 : m.team2
                  const firstTotal = calcTeamStats(firstTeam.id).runs + calcFieldExtras(firstTeam.id === m.team1.id ? "inn1" : "inn2")
                  const secondTeam = t1BattingFirst ? m.team2 : m.team1
                  return (
                    <div className="col-span-2 text-xs text-center">
                      <span className="font-medium">{secondTeam.name} need <strong>{firstTotal + 1}</strong> runs to win</span>
                    </div>
                  )
                })()}
                {autoResult() === "Match Tied" && (
                  <div className="col-span-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-700/40 dark:bg-amber-900/10">
                    <p className="mb-2 text-xs font-semibold text-amber-700 dark:text-amber-400">Super Over</p>
                    <div className="grid gap-2 md:grid-cols-4">
                      <div>
                        <label className="mb-1 block text-xs">{m.team1.name} Runs</label>
                        <input type="number" min="0" value={superOver.t1Runs} onChange={e => setSuperOver({...superOver, t1Runs: e.target.value})}
                          className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs">Wickets</label>
                        <input type="number" min="0" max="2" value={superOver.t1Wkts} onChange={e => setSuperOver({...superOver, t1Wkts: e.target.value})}
                          className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs">{m.team2.name} Runs</label>
                        <input type="number" min="0" value={superOver.t2Runs} onChange={e => setSuperOver({...superOver, t2Runs: e.target.value})}
                          className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs">Wickets</label>
                        <input type="number" min="0" max="2" value={superOver.t2Wkts} onChange={e => setSuperOver({...superOver, t2Wkts: e.target.value})}
                          className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
                      </div>
                    </div>
                  </div>
                )}
                <fieldset className="rounded border border-[var(--border)] p-3">
                  <legend className="px-2 text-sm font-semibold">Extras</legend>
                  <div className="grid grid-cols-4 gap-1 text-center text-xs">
                    <div className="font-semibold text-[var(--foreground)]">Wides</div>
                    <div className="font-semibold text-[var(--foreground)]">No Balls</div>
                    <div className="font-semibold text-[var(--foreground)]">Byes</div>
                    <div className="font-semibold text-[var(--foreground)]">Leg Byes</div>
                    <input type="number" min="0" value={form.inn1Wides} onChange={e => setForm({...form, inn1Wides: e.target.value})} className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-1 py-1 text-center text-sm" />
                    <input type="number" min="0" value={form.inn1NoBalls} onChange={e => setForm({...form, inn1NoBalls: e.target.value})} className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-1 py-1 text-center text-sm" />
                    <input type="number" min="0" value={form.inn1Byes} onChange={e => setForm({...form, inn1Byes: e.target.value})} className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-1 py-1 text-center text-sm" />
                    <input type="number" min="0" value={form.inn1LegByes} onChange={e => setForm({...form, inn1LegByes: e.target.value})} className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-1 py-1 text-center text-sm" />
                  </div>
                  <div className="mt-1 text-center text-xs font-semibold text-[var(--foreground)]">{m.team1.name}</div>
                </fieldset>
                <fieldset className="rounded border border-[var(--border)] p-3">
                  <legend className="px-2 text-sm font-semibold">Extras</legend>
                  <div className="grid grid-cols-4 gap-1 text-center text-xs">
                    <div className="font-semibold text-[var(--foreground)]">Wides</div>
                    <div className="font-semibold text-[var(--foreground)]">No Balls</div>
                    <div className="font-semibold text-[var(--foreground)]">Byes</div>
                    <div className="font-semibold text-[var(--foreground)]">Leg Byes</div>
                    <input type="number" min="0" value={form.inn2Wides} onChange={e => setForm({...form, inn2Wides: e.target.value})} className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-1 py-1 text-center text-sm" />
                    <input type="number" min="0" value={form.inn2NoBalls} onChange={e => setForm({...form, inn2NoBalls: e.target.value})} className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-1 py-1 text-center text-sm" />
                    <input type="number" min="0" value={form.inn2Byes} onChange={e => setForm({...form, inn2Byes: e.target.value})} className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-1 py-1 text-center text-sm" />
                    <input type="number" min="0" value={form.inn2LegByes} onChange={e => setForm({...form, inn2LegByes: e.target.value})} className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-1 py-1 text-center text-sm" />
                  </div>
                  <div className="mt-1 text-center text-xs font-semibold text-[var(--foreground)]">{m.team2.name}</div>
                </fieldset>
              </div>

              {team1Players.length > 0 && (
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    {m.team1.logo && <img src={m.team1.logo} alt="" className="h-6 w-6 rounded-full object-cover" />}
                    <p className="text-sm font-semibold">{m.team1.name} — Batting & Bowling</p>
                  </div>
                  {PlayerTable(team1Players, m.team1.name)}
                </div>
              )}
              {team2Players.length > 0 && (
                <div>
                  <div className="mb-1 mt-3 flex items-center gap-2">
                    {m.team2.logo && <img src={m.team2.logo} alt="" className="h-6 w-6 rounded-full object-cover" />}
                    <p className="text-sm font-semibold">{m.team2.name} — Batting & Bowling</p>
                  </div>
                  {PlayerTable(team2Players, m.team2.name)}
                </div>
              )}

              {allPlayers.length > 0 && (
                <div className="mt-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3 dark:border-amber-700/40 dark:bg-amber-900/10">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Starter Phase — Neutral Fielders</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">(fielding only, no batting/bowling)</span>
                  </div>
                  <p className="mb-2 text-[10px] text-[var(--muted-foreground)]">Select players from other teams who fielded in this match.</p>
                  {neutralFielders.map((nf, idx) => (
                    <div key={idx} className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <select value={nf.playerId} onChange={e => { const n = [...neutralFielders]; n[idx].playerId = e.target.value; setNeutralFielders(n) }}
                        className="w-full sm:w-40 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-xs">
                        <option value="">Select</option>
                        {allPlayers.filter(p => p.teamId !== m.team1.id && p.teamId !== m.team2.id).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <label className="flex items-center gap-0.5 text-[10px]">
                          <input type="checkbox" checked={nf.wk} onChange={e => {
                            const n = [...neutralFielders]; n[idx].wk = e.target.checked;
                            if (e.target.checked) n.forEach((x, j) => { if (j !== idx) x.wk = false })
                            setNeutralFielders(n)
                          }} className="h-3 w-3" title="Wicket Keeper" /> WK
                        </label>
                        <label className="text-[10px]" title="Catches">Ct</label>
                        <input type="number" min="0" value={nf.ct} onChange={e => { const n = [...neutralFielders]; n[idx].ct = e.target.value; setNeutralFielders(n) }}
                          className="w-10 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center text-xs" />
                        <label className="text-[10px]" title="Stumpings">St</label>
                        <input type="number" min="0" value={nf.st} onChange={e => { const n = [...neutralFielders]; n[idx].st = e.target.value; setNeutralFielders(n) }}
                          className="w-10 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center text-xs" />
                        <label className="text-[10px]" title="Run Outs">RO</label>
                        <input type="number" min="0" value={nf.ro} onChange={e => { const n = [...neutralFielders]; n[idx].ro = e.target.value; setNeutralFielders(n) }}
                          className="w-10 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center text-xs" />
                        <button onClick={() => setNeutralFielders(neutralFielders.filter((_, j) => j !== idx))} className="text-red-500 text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setNeutralFielders([...neutralFielders, { playerId: "", ct: "", st: "", ro: "", wk: false }])}
                    className="mt-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700">+ Add Neutral Fielder</button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={() => submitScore(m.id, m)} className="rounded bg-green-600 px-4 py-1.5 text-sm text-white">Save Result & Performances</button>
                <button onClick={() => setScoring(null)} className="rounded bg-gray-500 px-4 py-1.5 text-sm text-white">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )})}
      {matches.length === 0 && <p className="text-center text-[var(--muted-foreground)] py-8">No matches yet.</p>}
    </div>
  )
}