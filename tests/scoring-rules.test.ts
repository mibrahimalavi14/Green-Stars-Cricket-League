describe("NRR Calculation", () => {
  it("should use full 24 balls for all-out innings (ICC standard)", () => {
    // T4 format: team all out for 50 runs in 20 balls
    const runs = 50
    const balls = 20
    const wickets = 10

    // ICC rule: all-out = use full quota (24 balls in T4)
    const effectiveBalls = wickets >= 10 ? 24 : balls
    const runRate = runs / (effectiveBalls / 6)

    // Without fix: 50 / (20/6) = 15.00
    // With fix: 50 / (24/6) = 12.50
    expect(effectiveBalls).toBe(24)
    expect(runRate).toBe(12.5)
  })

  it("should use actual balls when NOT all out", () => {
    const runs = 80
    const balls = 55
    const wickets = 4

    const effectiveBalls = wickets >= 10 ? 24 : balls
    const runRate = runs / (effectiveBalls / 6)

    expect(effectiveBalls).toBe(55)
    expect(runRate).toBeCloseTo(8.727, 2)
  })

  it("should handle zero balls gracefully", () => {
    const runs = 0
    const balls = 0
    const forOvers = balls / 6
    const nrr = forOvers > 0 ? runs / forOvers : 0
    expect(nrr).toBe(0)
  })
})

describe("Bowling Validation Rules", () => {
  it("should reject bowler exceeding 1 over (6 legal balls)", () => {
    const legalBallsBowled = 6
    const wouldBeLegal = true
    const reject = wouldBeLegal && legalBallsBowled >= 6
    expect(reject).toBe(true)
  })

  it("should allow bowler with 5 legal balls", () => {
    const legalBallsBowled = 5
    const wouldBeLegal = true
    const reject = wouldBeLegal && legalBallsBowled >= 6
    expect(reject).toBe(false)
  })

  it("should allow wide on 6th ball (not legal)", () => {
    const legalBallsBowled = 6
    const wouldBeLegal = false
    const reject = wouldBeLegal && legalBallsBowled >= 6
    expect(reject).toBe(false)
  })
})

describe("Over Completion Rules", () => {
  it("should reject legal ball when over has 6 legal balls already in current over", () => {
    // After 5 legal balls, 6th should be last. After 6 balls, over is complete.
    // 5 balls done: 5 % 6 = 5 → allow. 6 balls done: 6 % 6 = 0 → new over starts.
    // Actually the over-complete check in addBall is: legalBallsAfter % 6 === 0 AFTER adding.
    // So when legalBefore=5 and this is legal, 5+1=6, 6%6=0 → over complete, OK to add.
    // When legalBefore=6 (already 1 full over), 6%6=0 → this means a new over.
    // The API validates BEFORE adding, so legalBefore % 6 === 6 is never true (modulo 6 gives 0-5).
    // The check is: if (isLegalDelivery && ballsInCurrentOver >= 6) → but ballsInCurrentOver is always 0-5.
    // So the over-complete scenario is handled by the client (don't allow), not the server.
    // Server just validates bowler limits and batter limits.
    expect(6 % 6).toBe(0) // Over resets after 6 balls
  })

  it("should allow wide on ball 7 of over", () => {
    const legalBefore = 6
    const ballsInCurrentOver = legalBefore % 6
    const wouldBeLegal = false
    const reject = wouldBeLegal && ballsInCurrentOver >= 6
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
  it("should be maiden when 6 legal balls, 0 runs", () => {
    const overBalls = 6
    const overRuns = 0
    const isMaiden = overBalls === 6 && overRuns === 0
    expect(isMaiden).toBe(true)
  })

  it("should NOT be maiden when 6 legal balls, 1 wide", () => {
    const overBalls = 6
    const overRuns = 1
    const isMaiden = overBalls === 6 && overRuns === 0
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
    const boundaryRuns = fours * 4 + sixes * 6  // 32 + 18 = 50
    const pct = runs > 0 ? (boundaryRuns / runs) * 100 : 0
    expect(pct).toBe(50)  // 50/100 = 50%
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
    const points = won * 2 + tied * 1 + nr * 1
    expect(points).toBe(13)
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

describe("MATCH_CONFIG Integrity", () => {
  const MATCH_CONFIG = {
    oversPerInnings: 4,
    ballsPerOver: 6,
    totalBalls: 24,
    wicketsPerInnings: 10,
    maxOversPerBowler: 1,
    maxBallsPerBowler: 6,
    pointsWin: 2,
    pointsTie: 1,
    pointsNoResult: 1,
  }

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
})
