import { prisma } from "./prisma"
import { calculatePartnerships, getHighestPartnership, type BallData } from "./partnerships"
import { WORKSPACE_OFFICIAL } from "./workspace"

export interface TeamRecord {
  type: string
  value: number
  teamName: string
  teamId: string
  matchId?: string
  matchLabel?: string
  details?: string
  date?: Date
  venue?: string
  opponent?: string
  seasonName?: string
}

export interface PlayerRecord {
  type: string
  value: number
  playerName: string
  playerId: string
  teamName?: string
  matchId?: string
  matchLabel?: string
  details?: string
  date?: Date
  venue?: string
  opponent?: string
  seasonName?: string
}

function makeMatchLabel(m: { matchNo: number; stage: string; team1: { name: string }; team2: { name: string }; season: { name: string } }) {
  if (m.stage !== "league") return `${m.stage} — ${m.team1.name} vs ${m.team2.name}`
  return `M${m.matchNo} — ${m.team1.name} vs ${m.team2.name}`
}

export async function computeAllRecords(workspaceId: string = WORKSPACE_OFFICIAL): Promise<{ teamRecords: TeamRecord[]; playerRecords: PlayerRecord[] }> {
  const matches = await prisma.match.findMany({
    where: { status: "completed", season: { workspaceId } },
    select: {
      id: true,
      matchNo: true,
      stage: true,
      date: true,
      venue: true,
      status: true,
      result: true,
      team1Id: true,
      team2Id: true,
      winnerTeamId: true,
      manOfMatch: true,
      team1: { select: { name: true } },
      team2: { select: { name: true } },
      season: { select: { name: true } },
      innings: { select: { teamId: true, runs: true, wickets: true, balls: true, extras: true, ballsData: true } },
      performances: {
        select: {
          playerId: true,
          teamId: true,
          battingRuns: true,
          ballsFaced: true,
          fours: true,
          sixes: true,
          bowlingWickets: true,
          bowlingRuns: true,
          catches: true,
          runOuts: true,
          stumpings: true,
          player: { select: { name: true } },
        },
      },
    },
    orderBy: { date: "asc" },
  })

  const rawTeamRecords: TeamRecord[] = []
  const fastest20: PlayerRecord[] = []
  const fastest30: PlayerRecord[] = []
  const fastest50: PlayerRecord[] = []
  const fastestTeam50: TeamRecord[] = []
  const mostSixesInnings: PlayerRecord[] = []
  const mostFoursInnings: PlayerRecord[] = []
  const mostRunsMatch: PlayerRecord[] = []
  const bestBowling: PlayerRecord[] = []
  const highestPartnerships: PlayerRecord[] = []
  const potmMap: Record<string, { count: number; name: string; teamName: string }> = {}
  const catchMap: Record<string, { count: number; name: string; teamName: string }> = {}
  const runOutMap: Record<string, { count: number; name: string; teamName: string }> = {}
  const stumpingMap: Record<string, { count: number; name: string; teamName: string }> = {}
  const seasonSixesMap: Record<string, { count: number; name: string; teamName: string }> = {}
  const dotBallsMap: Record<string, { count: number; name: string; teamName: string }> = {}
  const fastestFiftyAcc: PlayerRecord[] = []
  const fastestCentury: PlayerRecord[] = []

  const teamNameById = new Map<string, string>()
  for (const m of matches) {
    teamNameById.set(m.team1Id, m.team1.name)
    teamNameById.set(m.team2Id, m.team2.name)
  }

  for (const m of matches) {
    const ml = makeMatchLabel(m)

    const perfInfo = new Map<string, { name: string; teamName: string }>()
    for (const p of m.performances) {
      perfInfo.set(p.playerId, { name: p.player.name, teamName: m.team1Id === p.teamId ? m.team1.name : m.team2.name })
    }
    const accurateFiftyPlayers = new Set<string>()

    for (const inn of m.innings) {
      const teamName = inn.teamId === m.team1Id ? m.team1.name : m.team2.name
      const otherTeamName = inn.teamId === m.team1Id ? m.team2.name : m.team1.name
      const isTeam1 = inn.teamId === m.team1Id
      const otherInn = m.innings.find(i => i.teamId !== inn.teamId)
      const totalRuns = inn.runs + inn.extras
      const otherTotal = otherInn ? otherInn.runs + otherInn.extras : 0
      const totalBalls = inn.balls

      rawTeamRecords.push({ type: "highest_team_score", value: totalRuns, teamName, teamId: inn.teamId, matchId: m.id, matchLabel: ml, details: `${totalRuns}/${inn.wickets} (${Math.floor(totalBalls / 6)}.${totalBalls % 6} ov)`, date: m.date })

      if (totalBalls >= 12) {
        rawTeamRecords.push({ type: "lowest_team_score", value: totalRuns, teamName, teamId: inn.teamId, matchId: m.id, matchLabel: ml, details: `${totalRuns}/${inn.wickets} (${Math.floor(totalBalls / 6)}.${totalBalls % 6} ov)`, date: m.date })
      }

      if (otherInn) {
        const diff = totalRuns - otherTotal
        if (diff > 0 && m.winnerTeamId === inn.teamId) {
          rawTeamRecords.push({ type: "biggest_win_runs", value: diff, teamName, teamId: inn.teamId, matchId: m.id, matchLabel: ml, details: `Won by ${diff} runs`, date: m.date })
        }

        if (isTeam1 && m.winnerTeamId === m.team2Id && otherInn.balls > 0) {
          const wktsLeft = 10 - otherInn.wickets
          if (wktsLeft > 0) rawTeamRecords.push({ type: "biggest_win_wickets", value: wktsLeft, teamName: otherTeamName, teamId: m.team2Id, matchId: m.id, matchLabel: ml, details: `Won by ${wktsLeft} wickets`, date: m.date })
        }
        if (!isTeam1 && m.winnerTeamId === m.team1Id && otherInn.balls > 0) {
          const wktsLeft = 10 - otherInn.wickets
          if (wktsLeft > 0) rawTeamRecords.push({ type: "biggest_win_wickets", value: wktsLeft, teamName: otherTeamName, teamId: m.team1Id, matchId: m.id, matchLabel: ml, details: `Won by ${wktsLeft} wickets`, date: m.date })
        }

        if (m.winnerTeamId === inn.teamId && totalRuns > otherTotal) {
          rawTeamRecords.push({ type: "highest_successful_chase", value: totalRuns, teamName, teamId: inn.teamId, matchId: m.id, matchLabel: ml, details: `Chased ${otherTotal}`, date: m.date })
        }
        if (m.winnerTeamId === inn.teamId && totalRuns < otherTotal) {
          rawTeamRecords.push({ type: "lowest_successful_defence", value: otherTotal - totalRuns, teamName, teamId: inn.teamId, matchId: m.id, matchLabel: ml, details: `Defended ${totalRuns}`, date: m.date })
        }
      }

      const ballsData: BallData[] = JSON.parse(inn.ballsData || "[]")
      const partnerships = calculatePartnerships(ballsData)
      const highestP = getHighestPartnership(partnerships)
      if (highestP && highestP.runs > 0) {
        const wkLabels = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"]
        highestPartnerships.push({
          type: "highest_partnership", value: highestP.runs,
          playerName: `${highestP.batter1Id} & ${highestP.batter2Id}`, playerId: highestP.batter1Id,
          teamName, matchId: m.id, matchLabel: ml,
          details: `${highestP.runs} runs (${highestP.balls} balls) for ${wkLabels[highestP.wicketNumber] || "10th"} wicket`,
          date: m.date,
        })
      }

      let cumRuns = 0
      let legalCount = 0
      let fiftyAtBalls: number | null = null
      for (const b of ballsData) {
        cumRuns += b.runs + (b.isWide ? 1 : 0) + (b.isNoBall ? 1 : 0) + b.byes + b.legByes
        if (!b.isWide && !b.isNoBall) legalCount++
        if (fiftyAtBalls === null && cumRuns >= 50 && legalCount > 0) fiftyAtBalls = legalCount
      }
      if (fiftyAtBalls !== null && cumRuns >= 50) {
        fastestTeam50.push({
          type: "fastest_team_50", value: fiftyAtBalls,
          teamName, teamId: inn.teamId, matchId: m.id, matchLabel: ml,
          details: `Reached 50 in ${fiftyAtBalls} balls (finished ${totalRuns}/${inn.wickets})`, date: m.date,
        })
      }

      const perStriker = new Map<string, { runs: number; legal: number; dots: number; fifty: number | null; century: number | null }>()
      for (const b of ballsData) {
        const strikerRuns = b.isWide ? 0 : b.runs
        const isLegal = !b.isWide && !b.isNoBall
        if (!perStriker.has(b.striker)) perStriker.set(b.striker, { runs: 0, legal: 0, dots: 0, fifty: null, century: null })
        const st = perStriker.get(b.striker)!
        st.runs += strikerRuns
        if (isLegal) {
          st.legal++
          if (strikerRuns === 0) st.dots++
        }
        if (st.fifty === null && st.runs >= 50) st.fifty = st.legal
        if (st.century === null && st.runs >= 100) st.century = st.legal
      }
      for (const [pid, st] of perStriker) {
        const info = perfInfo.get(pid)
        if (!info) continue
        if (st.fifty !== null && st.fifty > 0) {
          accurateFiftyPlayers.add(pid)
          fastestFiftyAcc.push({
            type: "fastest_fifty", value: st.fifty, playerName: info.name, playerId: pid, teamName: info.teamName,
            matchId: m.id, matchLabel: ml, details: `Fifty in ${st.fifty} balls`, date: m.date,
          })
        }
        if (st.century !== null && st.century > 0) {
          fastestCentury.push({
            type: "fastest_century", value: st.century, playerName: info.name, playerId: pid, teamName: info.teamName,
            matchId: m.id, matchLabel: ml, details: `Century in ${st.century} balls`, date: m.date,
          })
        }
        if (st.dots > 0) {
          if (!dotBallsMap[pid]) dotBallsMap[pid] = { count: 0, name: info.name, teamName: info.teamName }
          dotBallsMap[pid].count += st.dots
        }
      }
    }

    for (const p of m.performances) {
      const tmName = m.team1Id === p.teamId ? m.team1.name : m.team2.name
      if (p.battingRuns >= 20 && p.ballsFaced > 0) fastest20.push({ type: "fastest_20", value: p.ballsFaced, playerName: p.player.name, playerId: p.playerId, teamName: tmName, matchId: m.id, matchLabel: ml, details: `${p.battingRuns} off ${p.ballsFaced} balls`, date: m.date })
      if (p.battingRuns >= 30 && p.ballsFaced > 0) fastest30.push({ type: "fastest_30", value: p.ballsFaced, playerName: p.player.name, playerId: p.playerId, teamName: tmName, matchId: m.id, matchLabel: ml, details: `${p.battingRuns} off ${p.ballsFaced} balls`, date: m.date })
      if (p.battingRuns >= 50 && p.ballsFaced > 0 && !accurateFiftyPlayers.has(p.playerId)) fastestFiftyAcc.push({ type: "fastest_fifty", value: p.ballsFaced, playerName: p.player.name, playerId: p.playerId, teamName: tmName, matchId: m.id, matchLabel: ml, details: `${p.battingRuns} off ${p.ballsFaced} balls`, date: m.date })
      if (p.sixes > 0) mostSixesInnings.push({ type: "most_sixes_innings", value: p.sixes, playerName: p.player.name, playerId: p.playerId, teamName: tmName, matchId: m.id, matchLabel: ml, details: `${p.sixes} sixes`, date: m.date })
      if (p.fours > 0) mostFoursInnings.push({ type: "most_fours_innings", value: p.fours, playerName: p.player.name, playerId: p.playerId, teamName: tmName, matchId: m.id, matchLabel: ml, details: `${p.fours} fours`, date: m.date })
      if (p.battingRuns > 0) mostRunsMatch.push({ type: "most_runs_match", value: p.battingRuns, playerName: p.player.name, playerId: p.playerId, teamName: tmName, matchId: m.id, matchLabel: ml, details: `${p.battingRuns} runs${p.ballsFaced > 0 ? ` off ${p.ballsFaced} balls` : ""}`, date: m.date })
      if (p.bowlingWickets > 0) bestBowling.push({ type: "best_bowling", value: p.bowlingWickets, playerName: p.player.name, playerId: p.playerId, teamName: tmName, matchId: m.id, matchLabel: ml, details: `${p.bowlingWickets}/${p.bowlingRuns}`, date: m.date })
      if (p.sixes > 0) { if (!seasonSixesMap[p.playerId]) seasonSixesMap[p.playerId] = { count: 0, name: p.player.name, teamName: tmName }; seasonSixesMap[p.playerId].count += p.sixes }
      if (p.catches > 0) { if (!catchMap[p.playerId]) catchMap[p.playerId] = { count: 0, name: p.player.name, teamName: tmName }; catchMap[p.playerId].count += p.catches }
      if (p.runOuts > 0) { if (!runOutMap[p.playerId]) runOutMap[p.playerId] = { count: 0, name: p.player.name, teamName: tmName }; runOutMap[p.playerId].count += p.runOuts }
      if (p.stumpings > 0) { if (!stumpingMap[p.playerId]) stumpingMap[p.playerId] = { count: 0, name: p.player.name, teamName: tmName }; stumpingMap[p.playerId].count += p.stumpings }
    }

    if (m.manOfMatch) {
      const motmPerf = m.performances.find(p => p.playerId === m.manOfMatch)
      if (motmPerf) {
        const tmName = m.team1Id === motmPerf.teamId ? m.team1.name : m.team2.name
        if (!potmMap[m.manOfMatch]) potmMap[m.manOfMatch] = { count: 0, name: motmPerf.player.name, teamName: tmName }
        potmMap[m.manOfMatch].count++
      }
    }
  }

  const teamResults: Record<string, (boolean | null)[]> = {}
  for (const m of matches) {
    for (const tid of [m.team1Id, m.team2Id]) {
      if (!teamResults[tid]) teamResults[tid] = []
      if (m.status !== "completed") continue
      const noResult = (m.result || "").toLowerCase().includes("no result")
      if (m.winnerTeamId === tid) teamResults[tid].push(true)
      else if (noResult) teamResults[tid].push(null)
      else if (m.winnerTeamId) teamResults[tid].push(false)
      else teamResults[tid].push(null)
    }
  }

  const consecutiveStreaks: TeamRecord[] = []
  const streakLabels: Record<string, { label: string; win: boolean }> = {
    most_consecutive_wins: { label: "Most Consecutive Wins", win: true },
    most_consecutive_losses: { label: "Most Consecutive Losses", win: false },
  }
  for (const [tid, results] of Object.entries(teamResults)) {
    const teamName = teamNameById.get(tid) || tid
    for (const [type, meta] of Object.entries(streakLabels)) {
      let best = 0
      let run = 0
      for (const r of results) {
        if (r === null) { run = 0; continue }
        run = r === meta.win ? run + 1 : 0
        if (run > best) best = run
      }
      if (best > 1) consecutiveStreaks.push({ type, value: best, teamName, teamId: tid, details: `${best} in a row` })
    }
  }

  fastest20.sort((a, b) => a.value - b.value)
  fastest30.sort((a, b) => a.value - b.value)
  fastestFiftyAcc.sort((a, b) => a.value - b.value)
  fastestCentury.sort((a, b) => a.value - b.value)
  mostSixesInnings.sort((a, b) => b.value - a.value)
  mostFoursInnings.sort((a, b) => b.value - a.value)
  highestPartnerships.sort((a, b) => b.value - a.value)

  function topN(arr: PlayerRecord[], n = 10) { return arr.slice(0, n) }

  function mapToRecords(map: Record<string, { count: number; name: string; teamName: string }>, type: string): PlayerRecord[] {
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count).slice(0, 10)
      .map(([id, d]) => ({ type, value: d.count, playerName: d.name, playerId: id, teamName: d.teamName }))
  }

  const teamRecordGroups: Record<string, TeamRecord[]> = {}
  for (const r of rawTeamRecords) {
    if (!teamRecordGroups[r.type]) teamRecordGroups[r.type] = []
    teamRecordGroups[r.type].push(r)
  }

  const sortedTeamRecords: TeamRecord[] = [
    ...teamRecordGroups["highest_team_score"]?.sort((a, b) => b.value - a.value).slice(0, 5) || [],
    ...teamRecordGroups["lowest_team_score"]?.sort((a, b) => a.value - b.value).slice(0, 5) || [],
    ...teamRecordGroups["biggest_win_runs"]?.sort((a, b) => b.value - a.value).slice(0, 5) || [],
    ...teamRecordGroups["biggest_win_wickets"]?.sort((a, b) => b.value - a.value).slice(0, 5) || [],
    ...teamRecordGroups["highest_successful_chase"]?.sort((a, b) => b.value - a.value).slice(0, 5) || [],
    ...teamRecordGroups["lowest_successful_defence"]?.sort((a, b) => b.value - a.value).slice(0, 5) || [],
    ...fastestTeam50.sort((a, b) => a.value - b.value).slice(0, 5),
    ...consecutiveStreaks.filter(r => r.type === "most_consecutive_wins").sort((a, b) => b.value - a.value).slice(0, 5),
    ...consecutiveStreaks.filter(r => r.type === "most_consecutive_losses").sort((a, b) => b.value - a.value).slice(0, 5),
  ]

  const sortedPlayerRecords: PlayerRecord[] = [
    ...topN(fastest20), ...topN(fastest30), ...topN(fastestFiftyAcc), ...topN(fastestCentury),
    ...topN(mostSixesInnings), ...topN(mostFoursInnings), ...topN(mostRunsMatch), ...topN(bestBowling), ...topN(highestPartnerships, 5),
    ...mapToRecords(seasonSixesMap, "most_sixes_season"), ...mapToRecords(potmMap, "most_potm"), ...mapToRecords(catchMap, "most_catches"),
    ...mapToRecords(runOutMap, "most_run_outs"), ...mapToRecords(stumpingMap, "most_stumpings"), ...mapToRecords(dotBallsMap, "most_dot_balls"),
  ]

  const matchCtxById = new Map<string, { venue: string; seasonName: string; opponentByTeam: Map<string, string>; teamIdByName: Map<string, string>; date: Date }>()
  for (const m of matches) {
    matchCtxById.set(m.id, {
      venue: m.venue || "",
      seasonName: m.season?.name || "",
      date: m.date,
      opponentByTeam: new Map([[m.team1Id, m.team2?.name || ""], [m.team2Id, m.team1?.name || ""]]),
      teamIdByName: new Map([[m.team1?.name || "", m.team1Id], [m.team2?.name || "", m.team2Id]]),
    })
  }

  const enrichTeam = (r: TeamRecord): TeamRecord => {
    const ctx = r.matchId ? matchCtxById.get(r.matchId) : undefined
    if (ctx) {
      r.venue = ctx.venue
      r.opponent = ctx.opponentByTeam.get(r.teamId) || ""
      r.seasonName = ctx.seasonName
      r.date = r.date || ctx.date
    }
    return r
  }
  const enrichPlayer = (r: PlayerRecord): PlayerRecord => {
    const ctx = r.matchId ? matchCtxById.get(r.matchId) : undefined
    if (ctx) {
      r.venue = ctx.venue
      r.seasonName = ctx.seasonName
      r.date = r.date || ctx.date
      const teamId = r.teamName ? ctx.teamIdByName.get(r.teamName) : undefined
      if (teamId) r.opponent = ctx.opponentByTeam.get(teamId) || ""
    }
    return r
  }

  return { teamRecords: sortedTeamRecords.map(enrichTeam), playerRecords: sortedPlayerRecords.map(enrichPlayer) }
}
