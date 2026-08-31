export interface BallData {
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

export interface Partnership {
  batter1Id: string
  batter2Id: string
  runs: number
  balls: number
  wicketNumber: number
  isCurrent: boolean
  extras: number
  batsman1Runs: number
  batsman2Runs: number
  batsman1Balls: number
  batsman2Balls: number
}

function isLegalDelivery(ball: BallData): boolean {
  return !ball.isWide && !ball.isNoBall
}

export function calculatePartnerships(balls: BallData[]): Partnership[] {
  if (balls.length === 0) return []

  const pendingPartnerships: Partnership[] = []
  let currentPartnership: Partnership | null = null
  let currentStriker = ""
  let currentNonStriker = ""
  let wicketNumber = 0
  let batsman1Runs = 0
  let batsman2Runs = 0
  let batsman1Balls = 0
  let batsman2Balls = 0
  let strikerIsFirst = true

  function flushPartnership() {
    if (currentPartnership) {
      currentPartnership.isCurrent = false
      currentPartnership.batsman1Runs = batsman1Runs
      currentPartnership.batsman2Runs = batsman2Runs
      currentPartnership.batsman1Balls = batsman1Balls
      currentPartnership.batsman2Balls = batsman2Balls
      pendingPartnerships.push(currentPartnership)
      currentPartnership = null
    }
  }

  function startNewPartnership(batter1: string, batter2: string) {
    flushPartnership()
    batsman1Runs = 0
    batsman2Runs = 0
    batsman1Balls = 0
    batsman2Balls = 0
    strikerIsFirst = true
    currentPartnership = {
      batter1Id: batter1,
      batter2Id: batter2,
      runs: 0,
      balls: 0,
      wicketNumber: wicketNumber,
      isCurrent: true,
      extras: 0,
      batsman1Runs: 0,
      batsman2Runs: 0,
      batsman1Balls: 0,
      batsman2Balls: 0,
    }
    currentStriker = batter1
    currentNonStriker = batter2
  }

  for (const ball of balls) {
    if (!currentPartnership) {
      startNewPartnership(ball.striker, ball.nonStriker)
    }

    const totalRuns = ball.runs + (ball.isWide ? 1 : 0) + (ball.isNoBall ? 1 : 0) + (ball.byes || 0) + (ball.legByes || 0)

    if (isLegalDelivery(ball)) {
      currentPartnership!.balls++
    }
    currentPartnership!.runs += totalRuns

    if (ball.isWide || ball.isNoBall) {
      currentPartnership!.extras += ball.isWide ? 1 : 1
    }

    if (ball.runs > 0 && ball.striker === currentStriker) {
      if (strikerIsFirst) batsman1Runs += ball.runs
      else batsman2Runs += ball.runs
    }

    if (isLegalDelivery(ball)) {
      if (ball.striker === currentStriker) {
        if (strikerIsFirst) batsman1Balls++
        else batsman2Balls++
      }
    }

    const completedRuns = ball.runs + (ball.isWide ? 1 : 0) + (ball.isNoBall ? 1 : 0) + (ball.byes || 0) + (ball.legByes || 0)
    if (completedRuns % 2 === 1) {
      const temp = currentStriker
      currentStriker = currentNonStriker
      currentNonStriker = temp
      strikerIsFirst = !strikerIsFirst
    }

    if (ball.wicket) {
      wicketNumber++
      flushPartnership()

      const dismissed = ball.wicketBatsman || currentStriker
      const surviving = dismissed === currentStriker ? currentNonStriker : currentStriker

      if (wicketNumber < 10) {
        const nextBatter = `batter_${wicketNumber + 1}`
        startNewPartnership(surviving, nextBatter)
      }
    }
  }

  flushPartnership()

  return pendingPartnerships
}

export function getHighestPartnership(partnerships: Partnership[]): Partnership | null {
  if (partnerships.length === 0) return null
  return partnerships.reduce((best, p) => p.runs > best.runs ? p : best)
}

export function getPartnershipByWicket(partnerships: Partnership[]): Map<number, Partnership> {
  const map = new Map<number, Partnership>()
  for (const p of partnerships) {
    if (!map.has(p.wicketNumber) || p.runs > map.get(p.wicketNumber)!.runs) {
      map.set(p.wicketNumber, p)
    }
  }
  return map
}

export function getPartnershipSummary(balls: BallData[]) {
  const partnerships = calculatePartnerships(balls)
  const current = partnerships.find(p => p.isCurrent)
  const highest = getHighestPartnership(partnerships)
  const byWicket = getPartnershipByWicket(partnerships)

  return {
    partnerships,
    current,
    highest,
    byWicket: Array.from(byWicket.entries()).sort((a, b) => a[0] - b[0]),
    totalPartnerships: partnerships.length,
  }
}
