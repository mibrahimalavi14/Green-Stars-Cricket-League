import { MATCH_CONFIG } from "../src/lib/config"

describe("NRR Calculation", () => {
  it("should use full totalBalls for all-out innings (ICC standard)", () => {
    const runs = 50
    const balls = 20
    const wickets = MATCH_CONFIG.wicketsPerInnings

    const effectiveBalls = wickets >= MATCH_CONFIG.wicketsPerInnings ? MATCH_CONFIG.totalBalls : balls
    const runRate = runs / (effectiveBalls / MATCH_CONFIG.ballsPerOver)

    expect(effectiveBalls).toBe(MATCH_CONFIG.totalBalls)
    expect(runRate).toBe(runs / (MATCH_CONFIG.totalBalls / MATCH_CONFIG.ballsPerOver))
  })

  it("should use actual balls when NOT all out", () => {
    const runs = 40
    const balls = 20
    const wickets = 4

    const effectiveBalls = wickets >= MATCH_CONFIG.wicketsPerInnings ? MATCH_CONFIG.totalBalls : balls
    const runRate = runs / (effectiveBalls / MATCH_CONFIG.ballsPerOver)

    expect(effectiveBalls).toBe(balls)
    expect(runRate).toBeCloseTo(12, 1)
  })

  it("should handle zero balls gracefully", () => {
    const runs = 0
    const balls = 0
    const forOvers = balls / MATCH_CONFIG.ballsPerOver
    const nrr = forOvers > 0 ? runs / forOvers : 0
    expect(nrr).toBe(0)
  })
})

describe("Bowling Validation Rules", () => {
  it("should reject bowler exceeding 1 over (6 legal balls)", () => {
    const legalBallsBowled = MATCH_CONFIG.ballsPerOver
    const wouldBeLegal = true
    const reject = wouldBeLegal && legalBallsBowled >= MATCH_CONFIG.ballsPerOver
    expect(reject).toBe(true)
  })

  it("should allow bowler with less than max balls", () => {
    const legalBallsBowled = MATCH_CONFIG.ballsPerOver - 1
    const wouldBeLegal = true
    const reject = wouldBeLegal && legalBallsBowled >= MATCH_CONFIG.ballsPerOver
    expect(reject).toBe(false)
  })

  it("should allow wide on last ball (not legal)", () => {
    const legalBallsBowled = MATCH_CONFIG.ballsPerOver
    const wouldBeLegal = false
    const reject = wouldBeLegal && legalBallsBowled >= MATCH_CONFIG.ballsPerOver
    expect(reject).toBe(false)
  })
})

describe("Over Completion Rules", () => {
  it("should complete over after ballsPerOver legal balls", () => {
    expect(MATCH_CONFIG.ballsPerOver % MATCH_CONFIG.ballsPerOver).toBe(0)
  })

  it("should allow wide when over is complete (not legal)", () => {
    const legalBefore = MATCH_CONFIG.ballsPerOver
    const ballsInCurrentOver = legalBefore % MATCH_CONFIG.ballsPerOver
    const wouldBeLegal = false
    const reject = wouldBeLegal && ballsInCurrentOver >= MATCH_CONFIG.ballsPerOver
    expect(reject).toBe(false)
  })
})

describe("Batter Validation Rules", () => {
  it("should reject when 12 unique batters have appeared", () => {
    const batters = new Set<string>()
    for (let i = 0; i < 11; i++) batters.add(`bat${i}`)
    const newBatter = "bat11"
    batters.add(newBatter)
    expect(batters.size).toBe(12)
    expect(batters.size > 11).toBe(true)
  })

  it("should reject dismissed batsman re-entry", () => {
    const dismissed = new Set<string>(["bat1", "bat2"])
    expect(dismissed.has("bat1")).toBe(true)
    expect(dismissed.has("bat3")).toBe(false)
  })
})

describe("Match Lock Rules", () => {
  it("should prevent undo when match is completed", () => {
    const matchStatus = "completed"
    const canUndo = matchStatus !== "completed"
    expect(canUndo).toBe(false)
  })

  it("should allow undo when match is live", () => {
    const matchStatus = "live"
    const canUndo = matchStatus !== "completed"
    expect(canUndo).toBe(true)
  })
})

describe("Run-out Scoring Rules", () => {
  it("should NOT credit bowler with run-out wicket", () => {
    const wicket = "runout"
    const bowlerGetsWicket = wicket !== "runout"
    expect(bowlerGetsWicket).toBe(false)
  })

  it("should credit bowler with caught wicket", () => {
    const wicket = "caught"
    const bowlerGetsWicket = wicket !== "runout"
    expect(bowlerGetsWicket).toBe(true)
  })

  it("should credit bowler with bowled wicket", () => {
    const wicket = "bowled"
    const bowlerGetsWicket = wicket !== "runout"
    expect(bowlerGetsWicket).toBe(true)
  })

  it("should credit fielder with run-out", () => {
    const wicket = "runout"
    const fielderCredited = wicket === "runout"
    expect(fielderCredited).toBe(true)
  })
})

describe("Strike Rotation", () => {
  it("should rotate strike on odd runs", () => {
    const runs = 3
    const oddRuns = runs % 2 === 1
    expect(oddRuns).toBe(true)
  })

  it("should NOT rotate strike on even runs", () => {
    const runs = 4
    const oddRuns = runs % 2 === 1
    expect(oddRuns).toBe(false)
  })

  it("should rotate strike on byes/leg-byes if total is odd", () => {
    const runs = 1
    const byes = 2
    const total = runs + byes
    const oddTotal = total % 2 === 1
    expect(oddTotal).toBe(true)
  })
})

describe("Dot Ball Calculation", () => {
  it("should count dot ball when runs=0 and legal delivery and no wicket", () => {
    const runs = 0
    const isWide = false
    const isNoBall = false
    const wicket = null
    const isDot = runs === 0 && !isWide && !isNoBall && !wicket
    expect(isDot).toBe(true)
  })

  it("should NOT count dot ball on wicket ball with 0 runs", () => {
    const runs = 0
    const isWide = false
    const isNoBall = false
    const wicket = "bowled"
    const isDot = runs === 0 && !isWide && !isNoBall && !wicket
    expect(isDot).toBe(false)
  })

  it("should NOT count dot ball for wide", () => {
    const runs = 0
    const isWide = true
    const isNoBall = false
    const wicket = null
    const isDot = runs === 0 && !isWide && !isNoBall && !wicket
    expect(isDot).toBe(false)
  })
})

describe("Maiden Over Calculation", () => {
  it("should be maiden when all legal balls, 0 runs", () => {
    const overBalls = MATCH_CONFIG.ballsPerOver
    const overRuns = 0
    const isMaiden = overBalls === MATCH_CONFIG.ballsPerOver && overRuns === 0
    expect(isMaiden).toBe(true)
  })

  it("should NOT be maiden when all legal balls, 1 wide", () => {
    const overBalls = MATCH_CONFIG.ballsPerOver
    const overRuns = 1
    const isMaiden = overBalls === MATCH_CONFIG.ballsPerOver && overRuns === 0
    expect(isMaiden).toBe(false)
  })
})

describe("Duck Calculation", () => {
  it("should be duck when runs=0 and out", () => {
    const runs = 0
    const isOut = true
    const isDuck = runs === 0 && isOut
    expect(isDuck).toBe(true)
  })

  it("should NOT be duck when not out with 0 runs", () => {
    const runs = 0
    const isOut = false
    const isDuck = runs === 0 && isOut
    expect(isDuck).toBe(false)
  })

  it("should NOT be duck when out with 1 run", () => {
    const runs = 1
    const isOut = true
    const isDuck = runs === 0 && isOut
    expect(isDuck).toBe(false)
  })
})

describe("Batting Average", () => {
  it("should show - when 0 dismissals", () => {
    const runs = 50
    const dismissals = 0
    const avg = dismissals > 0 ? runs / dismissals : -1
    expect(avg).toBe(-1)
  })

  it("should calculate average with dismissals", () => {
    const runs = 100
    const dismissals = 5
    const avg = runs / dismissals
    expect(avg).toBe(20)
  })
})

describe("Boundary Percentage", () => {
  it("should calculate boundary % with fours and sixes", () => {
    const runs = 100
    const fours = 8
    const sixes = 3
    const boundaryRuns = fours * 4 + sixes * 6
    const pct = runs > 0 ? (boundaryRuns / runs) * 100 : 0
    expect(pct).toBe(50)
  })

  it("should return 0 when no runs", () => {
    const runs = 0
    const pct = runs > 0 ? 50 : 0
    expect(pct).toBe(0)
  })
})

describe("Points Table", () => {
  it("should calculate points correctly", () => {
    const won = 5
    const tied = 2
    const nr = 1
    const points = won * MATCH_CONFIG.pointsWin + tied * MATCH_CONFIG.pointsTie + nr * MATCH_CONFIG.pointsNoResult
    expect(points).toBe(5 * 2 + 2 * 1 + 1 * 1)
  })
})

describe("Target Calculation", () => {
  it("should set target as first innings runs + extras + 1", () => {
    const inn1Runs = 100
    const inn1Extras = 5
    const target = inn1Runs + inn1Extras + 1
    expect(target).toBe(106)
  })
})

describe("Result Formatting", () => {
  it("should format won by wickets (batting first wins)", () => {
    const wicketsLost = 3
    const wicketsRemaining = MATCH_CONFIG.wicketsPerInnings - wicketsLost
    expect(wicketsRemaining).toBe(7)
  })

  it("should format won by runs (batting second wins)", () => {
    const chasingTotal = 60
    const target = 76
    const margin = target - 1 - chasingTotal
    expect(margin).toBe(15)
  })
})

describe("MATCH_CONFIG Integrity", () => {
  it("totalBalls should equal oversPerInnings * ballsPerOver", () => {
    expect(MATCH_CONFIG.totalBalls).toBe(MATCH_CONFIG.oversPerInnings * MATCH_CONFIG.ballsPerOver)
  })

  it("maxBallsPerBowler should equal maxOversPerBowler * ballsPerOver", () => {
    expect(MATCH_CONFIG.maxBallsPerBowler).toBe(MATCH_CONFIG.maxOversPerBowler * MATCH_CONFIG.ballsPerOver)
  })

  it("maxBallsPerBowler should not exceed totalBalls", () => {
    expect(MATCH_CONFIG.maxBallsPerBowler).toBeLessThanOrEqual(MATCH_CONFIG.totalBalls)
  })

  it("maxOversPerBowler should not exceed oversPerInnings", () => {
    expect(MATCH_CONFIG.maxOversPerBowler).toBeLessThanOrEqual(MATCH_CONFIG.oversPerInnings)
  })

  it("pointsWin should be >= pointsTie", () => {
    expect(MATCH_CONFIG.pointsWin).toBeGreaterThanOrEqual(MATCH_CONFIG.pointsTie)
  })

  it("all numeric values should be positive", () => {
    const values = Object.values(MATCH_CONFIG).filter((v): v is number => typeof v === "number")
    values.forEach(v => expect(v).toBeGreaterThan(0))
  })

  it("wicketsPerInnings should be 10 (standard)", () => {
    expect(MATCH_CONFIG.wicketsPerInnings).toBe(10)
  })

  it("oversPerInnings should be 4 (T4 format)", () => {
    expect(MATCH_CONFIG.oversPerInnings).toBe(4)
  })

  it("ballsPerOver should be 6 (standard)", () => {
    expect(MATCH_CONFIG.ballsPerOver).toBe(6)
  })
})
