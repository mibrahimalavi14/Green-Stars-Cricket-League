import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"
import { trackEvent } from "@/lib/analytics"
import {
  MATCH_CONFIG,
  formatOvers,
  isMatchComplete,
  calculateResult,
  calculateMotm,
  type InningsState,
} from "@/lib/config"

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

interface PlayerStats {
  playerId: string
  teamId: string
  battingRuns: number
  ballsFaced: number
  fours: number
  sixes: number
  ones: number
  twos: number
  isOut: boolean
  wicketsLost: number
  dismissalType: string
  dismissedByBowlerId: string
  dismissedByFielderId: string
  bowlingWickets: number
  bowlingRuns: number
  ballsBowled: number
  maidens: number
  wides: number
  noBalls: number
  catches: number
  stumpings: number
  runOuts: number
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || ""
  const {
    matchId,
    superOverT1Runs,
    superOverT1Wkts,
    superOverT2Runs,
    superOverT2Wkts,
    superOverInningsData,
  } = await req.json()

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 })
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { innings: true, team1: true, team2: true },
  })

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })
  if (match.status === "completed") {
    return NextResponse.json({ error: "Match already completed" }, { status: 400 })
  }

  try {
    const allInnings = match.innings
    const team1Inn = allInnings.find((i) => i.teamId === match.team1Id)
    const team2Inn = allInnings.find((i) => i.teamId === match.team2Id)

    const t1Runs = team1Inn?.runs || 0
    const t1Wkts = team1Inn?.wickets || 0
    const t1Balls = team1Inn?.balls || 0
    const t1Extras = team1Inn?.extras || 0
    const t2Runs = team2Inn?.runs || 0
    const t2Wkts = team2Inn?.wickets || 0
    const t2Balls = team2Inn?.balls || 0
    const t2Extras = team2Inn?.extras || 0

    const innings1: InningsState = { runs: t1Runs, wickets: t1Wkts, balls: t1Balls, extras: t1Extras }
    const innings2: InningsState = { runs: t2Runs, wickets: t2Wkts, balls: t2Balls, extras: t2Extras }

    // Check if match should be complete
    if (!isMatchComplete(innings1, innings2) && match.status !== "super_over") {
      return NextResponse.json({
        complete: false,
        message: "Match not yet complete — overs/wickets/target not reached",
      })
    }

    // Calculate result
    const { result: baseResult } = calculateResult(innings1, innings2, match.team1.name, match.team2.name)
    let result = baseResult
    let winnerTeamId: string | null = null

    // Handle Super Over
    const isTied = (t1Runs + t1Extras) === (t2Runs + t2Extras)

    if (isTied) {
      // Super Over scores provided → use them
      const so1Runs = superOverT1Runs || 0
      const so2Runs = superOverT2Runs || 0
      const so1Wkts = superOverT1Wkts || 0
      const so2Wkts = superOverT2Wkts || 0

      if (so1Runs || so2Runs) {
        if (so1Runs > so2Runs) {
          result = `${match.team1.name} won the Super Over (${so1Runs}/${so1Wkts} - ${so2Runs}/${so2Wkts})`
          winnerTeamId = match.team1Id
        } else if (so2Runs > so1Runs) {
          result = `${match.team2.name} won the Super Over (${so2Runs}/${so2Wkts} - ${so1Runs}/${so1Wkts})`
          winnerTeamId = match.team2Id
        } else {
          result = "Match Tied (Super Over tied)"
          // Super Over tied — admin needs to enter new Super Over scores
          return NextResponse.json({
            complete: false,
            superOverTie: true,
            message: "Super Over is tied! Enter new Super Over scores.",
          })
        }
      } else {
        // No Super Over scores yet — prompt admin to enter them
        return NextResponse.json({
          complete: false,
          superOverRequired: true,
          message: "Match is tied! Enter Super Over scores.",
        })
      }
    } else {
      // Normal result — determine winner
      if (t1Runs + t1Extras > t2Runs + t2Extras) {
        winnerTeamId = match.team1Id
      } else if (t2Runs + t2Extras > t1Runs + t1Extras) {
        winnerTeamId = match.team2Id
      }
    }

    // Calculate player stats (same logic as handleEndMatch)
    const playerStats: Record<string, PlayerStats> = {}

    function ensurePlayer(pid: string, teamId: string) {
      if (!playerStats[pid]) {
        playerStats[pid] = {
          playerId: pid, teamId,
          battingRuns: 0, ballsFaced: 0, fours: 0, sixes: 0, ones: 0, twos: 0,
          isOut: false, wicketsLost: 0, dismissalType: "", dismissedByBowlerId: "", dismissedByFielderId: "",
          bowlingWickets: 0, bowlingRuns: 0, ballsBowled: 0, maidens: 0, wides: 0, noBalls: 0,
          catches: 0, stumpings: 0, runOuts: 0,
        }
      }
    }

    for (const inn of allInnings) {
      const bowlingTeamId = inn.teamId === match.team1Id ? match.team2Id : match.team1Id
      const balls: BallEvent[] = JSON.parse(inn.ballsData || "[]")

      for (const ball of balls) {
        ensurePlayer(ball.striker, inn.teamId)
        ensurePlayer(ball.bowler, bowlingTeamId)
        if (ball.nonStriker) ensurePlayer(ball.nonStriker, inn.teamId)

        const ps = playerStats[ball.striker]
        if (!ball.isWide && !ball.isNoBall) ps.ballsFaced++
        ps.battingRuns += ball.runs
        if (ball.runs === 1) ps.ones++
        if (ball.runs === 2) ps.twos++
        if (ball.runs === 4) ps.fours++
        if (ball.runs === 6) ps.sixes++

        const bps = playerStats[ball.bowler]
        if (!ball.isWide && !ball.isNoBall) bps.ballsBowled++
        bps.bowlingRuns += ball.runs + (ball.isWide ? 1 : 0) + (ball.isNoBall ? 1 : 0)
        if (ball.isWide) bps.wides++
        if (ball.isNoBall) bps.noBalls++

        if (ball.wicket && ball.wicket !== "runout" && ball.wicket !== "retired_out" && ball.wicket !== "retired_hurt") bps.bowlingWickets++
        if (ball.wicket) {
          const dismissed = ball.wicketBatsman || ball.striker
          ensurePlayer(dismissed, inn.teamId)
          const dps = playerStats[dismissed]
          dps.isOut = ball.wicket !== "retired_hurt"
          dps.wicketsLost = ball.wicket !== "retired_hurt" ? 1 : 0
          dps.dismissalType = ball.wicket
          if (ball.wicket !== "runout") dps.dismissedByBowlerId = ball.bowler
          if (ball.wicketFielder) {
            dps.dismissedByFielderId = ball.wicketFielder
            ensurePlayer(ball.wicketFielder, bowlingTeamId)
            const fps = playerStats[ball.wicketFielder]
            if (ball.wicket === "caught") fps.catches++
            if (ball.wicket === "stumped") fps.stumpings++
            if (ball.wicket === "runout") fps.runOuts++
          }
        }
      }
    }

    // Auto MOTM via Impact Score
    const playersData = Object.values(playerStats)
    const momPlayerId = calculateMotm(playersData)

    // Save performances
    if (playersData.length > 0) {
      for (const p of playersData) {
        await prisma.playerMatch.upsert({
          where: { playerId_matchId: { playerId: p.playerId, matchId } },
          update: {
            battingRuns: p.battingRuns, ballsFaced: p.ballsFaced, fours: p.fours, sixes: p.sixes,
            ones: p.ones, twos: p.twos, isOut: p.isOut, wicketsLost: p.wicketsLost,
            dismissalType: p.dismissalType, dismissedByBowlerId: p.dismissedByBowlerId,
            dismissedByFielderId: p.dismissedByFielderId,
            bowlingWickets: p.bowlingWickets, bowlingRuns: p.bowlingRuns, ballsBowled: p.ballsBowled,
            maidens: p.maidens, wides: p.wides, noBalls: p.noBalls,
            catches: p.catches, stumpings: p.stumpings, runOuts: p.runOuts,
          },
          create: {
            playerId: p.playerId, matchId, teamId: p.teamId,
            battingRuns: p.battingRuns, ballsFaced: p.ballsFaced, fours: p.fours, sixes: p.sixes,
            ones: p.ones, twos: p.twos, isOut: p.isOut, wicketsLost: p.wicketsLost,
            dismissalType: p.dismissalType, dismissedByBowlerId: p.dismissedByBowlerId,
            dismissedByFielderId: p.dismissedByFielderId,
            bowlingWickets: p.bowlingWickets, bowlingRuns: p.bowlingRuns, ballsBowled: p.ballsBowled,
            maidens: p.maidens, wides: p.wides, noBalls: p.noBalls,
            catches: p.catches, stumpings: p.stumpings, runOuts: p.runOuts,
          },
        })
      }
    }

    // Save innings
    for (const inn of allInnings) {
      await prisma.inning.upsert({
        where: { matchId_teamId: { matchId, teamId: inn.teamId } },
        update: { runs: inn.runs, wickets: inn.wickets, balls: inn.balls, extras: inn.extras },
        create: { matchId, teamId: inn.teamId, runs: inn.runs, wickets: inn.wickets, balls: inn.balls, extras: inn.extras },
      })
    }

    // Update match as completed
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "completed",
        result,
        winnerTeamId,
        manOfMatch: momPlayerId,
        tossWinner: match.tossWinner || "",
        tossDecision: match.tossDecision || "",
        team1Score: `${t1Runs + t1Extras}/${t1Wkts}${t1Balls ? ` (${formatOvers(t1Balls)} ov)` : ""}`,
        team2Score: `${t2Runs + t2Extras}/${t2Wkts}${t2Balls ? ` (${formatOvers(t2Balls)} ov)` : ""}`,
        superOverT1Runs: superOverT1Runs || 0,
        superOverT1Wkts: superOverT1Wkts || 0,
        superOverT2Runs: superOverT2Runs || 0,
        superOverT2Wkts: superOverT2Wkts || 0,
      },
    })

    // Save Super Over innings history
    if (superOverInningsData && Array.isArray(superOverInningsData) && superOverInningsData.length > 0) {
      for (const soInn of superOverInningsData) {
        await prisma.superOverInnings.upsert({
          where: {
            matchId_superOverNumber_teamId: {
              matchId,
              superOverNumber: soInn.superOverNumber,
              teamId: soInn.teamId,
            },
          },
          update: {
            battingTeamId: soInn.battingTeamId,
            bowlingTeamId: soInn.bowlingTeamId,
            runs: soInn.runs,
            wickets: soInn.wickets,
            balls: soInn.balls,
            extras: soInn.extras || 0,
            ballsData: JSON.stringify(soInn.ballsData || []),
            isCompleted: soInn.isCompleted || false,
            isWinner: soInn.isWinner || false,
            result: soInn.result || "",
          },
          create: {
            matchId,
            superOverNumber: soInn.superOverNumber,
            teamId: soInn.teamId,
            battingTeamId: soInn.battingTeamId,
            bowlingTeamId: soInn.bowlingTeamId,
            runs: soInn.runs,
            wickets: soInn.wickets,
            balls: soInn.balls,
            extras: soInn.extras || 0,
            ballsData: JSON.stringify(soInn.ballsData || []),
            isCompleted: soInn.isCompleted || false,
            isWinner: soInn.isWinner || false,
            result: soInn.result || "",
          },
        })
      }
    }

    // Audit log
    logAudit({
      action: "match_completed_auto",
      entity: "match",
      entityId: matchId,
      details: JSON.stringify({
        result,
        winnerTeamId,
        manOfMatch: momPlayerId,
        auto: true,
        t1Score: `${t1Runs + t1Extras}/${t1Wkts}`,
        t2Score: `${t2Runs + t2Extras}/${t2Wkts}`,
      }),
      ip,
    })

    // Analytics event
    trackEvent("match_completed", {
      matchId,
      result,
      auto: "true",
      manOfMatch: momPlayerId,
    }, ip)

    // Recalculate points table and player stats
    const { recalcPointsTable, recalcPlayerStats } = await import("@/lib/stats")
    await recalcPointsTable(match.seasonId)
    await recalcPlayerStats()

    // Get mom player name for notification
    let momName = ""
    if (momPlayerId) {
      const momPlayer = await prisma.player.findUnique({ where: { id: momPlayerId }, select: { name: true } })
      momName = momPlayer?.name || ""
    }

    return NextResponse.json({
      complete: true,
      result,
      winnerTeamId,
      manOfMatch: momPlayerId,
      manOfMatchName: momName,
      t1Score: `${t1Runs + t1Extras}/${t1Wkts}`,
      t2Score: `${t2Runs + t2Extras}/${t2Wkts}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to complete match" }, { status: 500 })
  }
}
