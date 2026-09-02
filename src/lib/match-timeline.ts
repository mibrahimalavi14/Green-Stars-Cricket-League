export interface BallEvent {
  runs?: number
  extras?: string | null
  wicket?: string | null
  bowler?: string
  striker?: string
  nonStriker?: string
  wicketBatsman?: string | null
  wicketFielder?: string | null
  isWide?: boolean
  isNoBall?: boolean
  byes?: number
  legByes?: number
  region?: string
}

export interface TimelineEvent {
  type: "toss" | "start" | "fifty" | "century" | "six" | "wicket" | "innings_break" | "super_over" | "result" | "motm"
  over: string
  text: string
  sub?: string
}

export interface TimelineMatchData {
  tossWinner?: string | null
  tossDecision?: string | null
  result?: string | null
  manOfMatch?: string | null
  winnerTeamId?: string | null
  team1: { id: string; name: string; shortName: string }
  team2: { id: string; name: string; shortName: string }
  innings: {
    teamId: string
    runs: number
    wickets: number
    extras: number
    balls: number
    ballsData: string
    isWinner?: boolean
  }[]
  playerNames: Record<string, string>
  hasSuperOver: boolean
}

function parseBallsData(raw: string): BallEvent[] {
  try {
    return JSON.parse(raw || "[]") || []
  } catch {
    return []
  }
}

function getDismissalText(ball: BallEvent, names: Record<string, string>): string {
  const bowlerName = ball.bowler ? names[ball.bowler] || "" : ""
  const fielderName = ball.wicketFielder ? names[ball.wicketFielder] || "" : ""
  switch (ball.wicket) {
    case "bowled": return `b ${bowlerName}`
    case "caught": return `c ${fielderName} b ${bowlerName}`
    case "lbw": return `lbw b ${bowlerName}`
    case "stumped": return `st ${fielderName} b ${bowlerName}`
    case "runout": return `run out (${fielderName || bowlerName})`
    case "hit wicket": return `hit wicket b ${bowlerName}`
    case "retired_hurt": return "retired hurt"
    case "retired_out": return "retired out"
    default: return ball.wicket || ""
  }
}

function overLabel(legalCount: number): string {
  return `${Math.floor(legalCount / 6)}.${legalCount % 6}`
}

export function generateMatchTimeline(data: TimelineMatchData): TimelineEvent[] {
  const events: TimelineEvent[] = []
  const names = data.playerNames

  // Toss
  if (data.tossWinner && data.tossDecision) {
    const tossName = data.tossWinner === data.team1.id ? data.team1.name : data.team2.name
    events.push({
      type: "toss",
      over: "",
      text: `${tossName} won the toss and elected to ${data.tossDecision} first`,
    })
  }

  data.innings.forEach((inning, innIdx) => {
    const battingTeam = inning.teamId === data.team1.id ? data.team1 : data.team2
    const balls = parseBallsData(inning.ballsData)
    const strikerRuns: Record<string, number> = {}

    // Match / innings started
    events.push({
      type: "start",
      over: "0.1",
      text: `${battingTeam.name} innings started`,
    })

    let legalCount = 0
    for (const ball of balls) {
      const isLegal = !ball.isWide && !ball.isNoBall
      if (isLegal) legalCount++

      const over = overLabel(legalCount)

      // Striker runs for milestones
      const sid = ball.striker
      if (sid) {
        const before = strikerRuns[sid] || 0
        strikerRuns[sid] = before + (ball.isWide ? 0 : ball.runs || 0)
        const after = strikerRuns[sid]
        const name = names[sid] || "Batsman"
        if (before < 50 && after >= 50) {
          events.push({
            type: "fifty",
            over,
            text: `${name} reaches Fifty`,
            sub: `${after} runs off ${inning.balls} balls`,
          })
        }
        if (before < 100 && after >= 100) {
          events.push({
            type: "century",
            over,
            text: `${name} reaches Century`,
            sub: `${after} runs off ${inning.balls} balls`,
          })
        }
      }

      // Six
      if (ball.runs === 6 && !ball.isWide) {
        const name = sid ? names[sid] || "Batsman" : "Batsman"
        events.push({
          type: "six",
          over,
          text: `Six! ${name} smashes it ${ball.region ? `to ${ball.region}` : "out of the park"}`,
        })
      }

      // Wicket
      if (ball.wicket) {
        const dismissed = ball.wicketBatsman || ball.striker || ""
        const name = names[dismissed] || "Batsman"
        const dismissal = getDismissalText(ball, names)
        events.push({
          type: "wicket",
          over,
          text: `Wicket! ${name} ${dismissal}`,
        })
      }
    }

    // Innings end / break
    const total = (inning.runs || 0) + (inning.extras || 0)
    const oversText = `${Math.floor((inning.balls || 0) / 6)}.${(inning.balls || 0) % 6}`
    events.push({
      type: innIdx === 0 ? "innings_break" : "innings_break",
      over: oversText,
      text: innIdx === 0
        ? `${battingTeam.name} innings complete: ${total}/${inning.wickets} (${oversText} ov)`
        : `${battingTeam.name} innings complete: ${total}/${inning.wickets} (${oversText} ov)`,
    })
  })

  // Super Over
  if (data.hasSuperOver) {
    events.push({
      type: "super_over",
      over: "",
      text: "Super Over started — the match is tied!",
    })
  }

  // Result
  if (data.result) {
    events.push({
      type: "result",
      over: "",
      text: data.result,
    })
  }

  // Man of the Match
  if (data.manOfMatch) {
    const motmName = names[data.manOfMatch] || data.manOfMatch
    events.push({
      type: "motm",
      over: "",
      text: `Man of the Match: ${motmName}`,
    })
  }

  return events
}
