import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface BallEvent {
  runs: number
  extras: string | null
  wicket: string | null
  bowler: string
  striker: string
  nonStriker: string
  wicketBatsman: string | null
  wicketFielder: string | null
  isWide: boolean
  isNoBall: boolean
  byes: number
  legByes: number
}

export async function POST(req: Request) {
  const { matchId } = await req.json()
  if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 })

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { innings: true },
  })
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })

  const playerStats: Record<string, any> = {}

  function ensurePlayer(pid: string, teamId: string) {
    if (!playerStats[pid]) {
      playerStats[pid] = {
        playerId: pid,
        teamId,
        battingRuns: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        ones: 0,
        twos: 0,
        threes: 0,
        dotBalls: 0,
        isOut: false,
        dismissalType: "",
        dismissedByBowlerId: "",
        dismissedByFielderId: "",
        bowlingWickets: 0,
        bowlingRuns: 0,
        ballsBowled: 0,
        maidens: 0,
        wides: 0,
        noBalls: 0,
        catches: 0,
        stumpings: 0,
        runOuts: 0,
        hattricks: 0,
      }
    }
  }

  for (const inn of match.innings) {
    const balls: BallEvent[] = JSON.parse(inn.ballsData || "[]")
    const bowlingTeamId = inn.teamId === match.team1Id ? match.team2Id : match.team1Id

    let bowlerBallsInOver = 0
    let lastBowlerId = ""
    let overRuns = 0

    for (const ball of balls) {
      if (ball.bowler !== lastBowlerId) {
        lastBowlerId = ball.bowler
      }

      ensurePlayer(ball.striker, inn.teamId)
      ensurePlayer(ball.bowler, bowlingTeamId)
      if (ball.nonStriker) ensurePlayer(ball.nonStriker, inn.teamId)

      const ps = playerStats[ball.striker]
      ps.battingRuns += ball.runs
      if (!ball.isWide && !ball.isNoBall) {
        ps.ballsFaced++
      }
      if (ball.runs === 1) ps.ones++
      if (ball.runs === 2) ps.twos++
      if (ball.runs === 3) ps.threes++
      if (ball.runs === 4) ps.fours++
      if (ball.runs === 6) ps.sixes++
      if (ball.runs === 0 && !ball.isWide && !ball.isNoBall && !ball.wicket) ps.dotBalls++

      const bps = playerStats[ball.bowler]
      if (!ball.isWide && !ball.isNoBall) {
        bps.ballsBowled++
        bowlerBallsInOver++
      }
      bps.bowlingRuns += ball.runs + (ball.isWide ? 1 : 0) + (ball.isNoBall ? 1 : 0)
      overRuns += ball.runs + (ball.isWide ? 1 : 0) + (ball.isNoBall ? 1 : 0)
      if (ball.isWide) bps.wides++
      if (ball.isNoBall) bps.noBalls++

      if (ball.wicket) {
        bps.bowlingWickets++
        const dismissed = ball.wicketBatsman || ball.striker
        ensurePlayer(dismissed, inn.teamId)
        const dps = playerStats[dismissed]
        dps.isOut = true
        dps.dismissalType = ball.wicket
        if (ball.wicket !== "runout") {
          dps.dismissedByBowlerId = ball.bowler
        }
        if (ball.wicketFielder) {
          dps.dismissedByFielderId = ball.wicketFielder
          ensurePlayer(ball.wicketFielder, bowlingTeamId)
          const fps = playerStats[ball.wicketFielder]
          if (ball.wicket === "caught") fps.catches++
          if (ball.wicket === "stumped") fps.stumpings++
          if (ball.wicket === "runout") fps.runOuts++
        }
      }

      if (ball.bowler !== lastBowlerId || bowlerBallsInOver === 6) {
        if (bowlerBallsInOver === 6 && overRuns === 0) {
          playerStats[lastBowlerId].maidens++
        }
        bowlerBallsInOver = 0
        overRuns = 0
        lastBowlerId = ball.bowler
      }
    }
  }

  for (const pid of Object.keys(playerStats)) {
    const p = playerStats[pid]
    await prisma.playerMatch.upsert({
      where: { playerId_matchId: { playerId: pid, matchId } },
      update: {
        battingRuns: p.battingRuns,
        ballsFaced: p.ballsFaced,
        fours: p.fours,
        sixes: p.sixes,
        ones: p.ones,
        twos: p.twos,
        threes: p.threes,
        dotBalls: p.dotBalls,
        isOut: p.isOut,
        dismissalType: p.dismissalType,
        dismissedByBowlerId: p.dismissedByBowlerId,
        dismissedByFielderId: p.dismissedByFielderId,
        bowlingWickets: p.bowlingWickets,
        bowlingRuns: p.bowlingRuns,
        ballsBowled: p.ballsBowled,
        maidens: p.maidens,
        wides: p.wides,
        noBalls: p.noBalls,
        hattricks: p.hattricks,
        catches: p.catches,
        stumpings: p.stumpings,
        runOuts: p.runOuts,
      },
      create: {
        playerId: pid,
        matchId,
        teamId: p.teamId,
        battingRuns: p.battingRuns,
        ballsFaced: p.ballsFaced,
        fours: p.fours,
        sixes: p.sixes,
        ones: p.ones,
        twos: p.twos,
        threes: p.threes,
        dotBalls: p.dotBalls,
        isOut: p.isOut,
        dismissalType: p.dismissalType,
        dismissedByBowlerId: p.dismissedByBowlerId,
        dismissedByFielderId: p.dismissedByFielderId,
        bowlingWickets: p.bowlingWickets,
        bowlingRuns: p.bowlingRuns,
        ballsBowled: p.ballsBowled,
        maidens: p.maidens,
        wides: p.wides,
        noBalls: p.noBalls,
        hattricks: p.hattricks,
        catches: p.catches,
        stumpings: p.stumpings,
        runOuts: p.runOuts,
      },
    })
  }

  // Update career 4w/5w stats for bowlers in this match
  const bowlerIds = [...new Set(Object.keys(playerStats).filter(pid => playerStats[pid].bowlingWickets > 0))]
  for (const bowlerId of bowlerIds) {
    const fourPlus = await prisma.playerMatch.count({ where: { playerId: bowlerId, bowlingWickets: { gte: 4 } } })
    const fivePlus = await prisma.playerMatch.count({ where: { playerId: bowlerId, bowlingWickets: { gte: 5 } } })
    await prisma.player.update({ where: { id: bowlerId }, data: { fourWickets: fourPlus, fiveWickets: fivePlus } })
  }

  return NextResponse.json({ success: true, playersUpdated: Object.keys(playerStats).length })
}
