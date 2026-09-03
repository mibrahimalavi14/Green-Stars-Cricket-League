import { z } from "zod"

export const createMatchSchema = z.object({
  seasonId: z.string().min(1),
  team1Id: z.string().min(1),
  team2Id: z.string().min(1),
  matchNo: z.number().int().min(1).optional(),
  stage: z.string().min(1).max(50).optional(),
  date: z.string().min(1),
  venue: z.string().min(1).max(200),
  tossWinner: z.string().max(100).optional(),
  tossDecision: z.enum(["bat", "bowl", ""]).optional(),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  umpire1: z.string().max(100).optional(),
  umpire2: z.string().max(100).optional(),
  thirdUmpire: z.string().max(100).optional(),
  matchReferee: z.string().max(100).optional(),
  officialScorer: z.string().max(100).optional(),
  tossTime: z.string().optional(),
  matchStartTime: z.string().optional(),
  delayReason: z.string().max(500).optional(),
  attendance: z.number().int().min(0).optional(),
  dls: z.boolean().optional(),
})

export const updateMatchSchema = z.object({
  id: z.string().min(1),
  seasonId: z.string().min(1).optional(),
  team1Id: z.string().min(1).optional(),
  team2Id: z.string().min(1).optional(),
  matchNo: z.number().int().min(1).optional(),
  stage: z.string().min(1).max(50).optional(),
  date: z.string().min(1).optional(),
  venue: z.string().min(1).max(200).optional(),
  status: z.enum(["upcoming", "live", "completed", "super_over"]).optional(),
  result: z.string().max(500).optional(),
  tossWinner: z.string().max(100).optional(),
  tossDecision: z.enum(["bat", "bowl", ""]).optional(),
  winnerTeamId: z.string().nullable().optional(),
  manOfMatch: z.string().optional(),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  customHighlights: z.string().max(2000).optional(),
  inningsBreak: z.boolean().optional(),
  superOverT1Runs: z.number().int().min(0).optional(),
  superOverT1Wkts: z.number().int().min(0).optional(),
  superOverT2Runs: z.number().int().min(0).optional(),
  superOverT2Wkts: z.number().int().min(0).optional(),
  umpire1: z.string().max(100).optional(),
  umpire2: z.string().max(100).optional(),
  thirdUmpire: z.string().max(100).optional(),
  matchReferee: z.string().max(100).optional(),
  officialScorer: z.string().max(100).optional(),
  tossTime: z.string().optional(),
  matchStartTime: z.string().optional(),
  matchEndTime: z.string().optional(),
  delayReason: z.string().max(500).optional(),
  attendance: z.number().int().min(0).optional(),
  dls: z.boolean().optional(),
  override: z.boolean().optional(),
})

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  shortName: z.string().min(1).max(10),
  logo: z.string().optional(),
  captain: z.string().max(100).optional(),
  coach: z.string().max(100).optional(),
  homeVenue: z.string().max(200).optional(),
  seasonId: z.string().min(1),
})

export const createPlayerSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(50),
  battingStyle: z.string().max(50).optional(),
  bowlingStyle: z.string().max(50).optional(),
  teamId: z.string().min(1),
  image: z.string().optional(),
  country: z.string().max(50).optional(),
  jerseyNumber: z.number().int().min(0).max(999).nullable().optional(),
  status: z.enum(["available", "injured", "suspended", "unavailable"]).optional(),
})

export const createSeasonSchema = z.object({
  name: z.string().min(1).max(100),
  year: z.number().int().min(2020).max(2100),
  logo: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const squadMemberSchema = z.object({
  matchId: z.string().min(1),
  playerId: z.string().min(1),
  teamId: z.string().min(1),
  role: z.string().max(50).optional(),
})

export const ballEventSchema = z.object({
  runs: z.number().int().min(0).max(6),
  extras: z.string().nullable().optional(),
  wicket: z.string().nullable().optional(),
  bowler: z.string().min(1),
  striker: z.string().min(1),
  nonStriker: z.string().min(1),
  wicketBatsman: z.string().nullable().optional(),
  wicketFielder: z.string().nullable().optional(),
  isWide: z.boolean(),
  isNoBall: z.boolean(),
  byes: z.number().int().min(0).max(6),
  legByes: z.number().int().min(0).max(6),
  region: z.string().nullable().optional(),
  deadBall: z.boolean().optional(),
  overthrows: z.number().int().min(0).max(6).optional(),
  penaltyRuns: z.number().int().min(0).max(10).optional(),
})

export const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  subject: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(2000),
  purpose: z.enum(["general", "sponsorship"]).default("general"),
  phone: z.string().max(30).optional(),
  company: z.string().max(100).optional(),
  sponsorshipType: z.string().max(50).optional(),
  budgetRange: z.string().max(50).optional(),
  recaptchaToken: z.string().optional(),
})

export const reviewSchema = z.object({
  name: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
})

export const otpRequestSchema = z.object({
  email: z.string().email().max(200),
})

export const otpVerifySchema = z.object({
  email: z.string().email().max(200),
  otp: z.string().length(6),
})

export const challengeStartSchema = z.object({
  challengeId: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  email: z.string().email().max(200),
  verifiedToken: z.string().min(1),
})

export const challengeAttemptSchema = z.object({
  challengeId: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  email: z.string().email().max(200),
  verifiedToken: z.string().min(1),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedAnswer: z.string().min(1),
    })
  ).max(10),
})

export const challengeSchema = z.object({
  type: z.enum(["DAILY", "WEEKLY"]),
  title: z.string().max(120).optional().default(""),
  pointValue: z.number().int().min(1).max(50).optional().default(5),
  timeLimitSeconds: z.number().int().min(5).max(60).optional().default(10),
  active: z.boolean().optional().default(true),
  questions: z.array(
    z.object({
      question: z.string().min(1).max(300),
      options: z.array(z.string().min(1)).min(2).max(6),
      correctAnswer: z.string().min(1),
    })
  ).min(12).max(20),
})

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
})

export const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
})

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(1000).optional(),
})

export const newsSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  image: z.string().optional(),
  author: z.string().max(100).optional(),
})

export const sponsorSchema = z.object({
  name: z.string().min(1).max(100),
  logo: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  tier: z.string().max(50).optional(),
})

export const notificationSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  url: z.string().optional(),
})

export const momentSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.string().min(1),
  image: z.string().optional(),
  caption: z.string().max(500).optional(),
})

export const gallerySchema = z.object({
  imageUrl: z.string().min(1),
  caption: z.string().max(500).optional(),
  matchId: z.string().optional(),
})

export const playerTransferSchema = z.object({
  playerId: z.string().min(1),
  seasonId: z.string().min(1),
  fromTeamId: z.string().optional(),
  toTeamId: z.string().min(1),
  transferDate: z.string().optional(),
  reason: z.string().max(500).optional(),
})

export const teamCaptaincySchema = z.object({
  seasonId: z.string().min(1),
  teamId: z.string().min(1),
  captainId: z.string().min(1),
  viceCaptainId: z.string().optional(),
})

export const leaguePenaltySchema = z.object({
  seasonId: z.string().min(1),
  teamId: z.string().min(1),
  matchId: z.string().optional(),
  type: z.enum(["over_rate", "fine", "points_deduction", "forfeit"]).default("fine"),
  points: z.number().int().min(0).max(1000).default(0),
  description: z.string().max(500).optional(),
})

export const seasonAwardSchema = z.object({
  seasonId: z.string().min(1),
  category: z.enum([
    "champion",
    "runner_up",
    "orange_cap",
    "purple_cap",
    "mvp",
    "player_of_season",
    "best_batter",
    "best_bowler",
    "best_fielder",
    "most_improved",
    "emerging_player",
    "fair_play",
  ]),
  playerId: z.string().optional(),
  teamId: z.string().optional(),
  value: z.string().optional(),
  note: z.string().max(500).optional(),
})

export const teamHonorSchema = z.object({
  seasonId: z.string().min(1),
  teamId: z.string().min(1),
  title: z.string().min(1).max(100),
  note: z.string().max(500).optional(),
})

export const abandonMatchSchema = z.object({
  matchId: z.string().min(1),
  reason: z.enum(["rain", "bad_light", "ground_issue", "walkover", "technical_issue"]),
  description: z.string().max(500).optional(),
})
