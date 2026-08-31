export type Role = "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper"

export interface TeamData {
  id: string
  name: string
  shortName: string
  logo: string
  color: string
  seasonId: string
  captainName?: string
  headCoach?: string
  location?: string
  players?: PlayerData[]
}

export interface PlayerData {
  id: string
  name: string
  role: Role
  battingStyle: string
  bowlingStyle: string
  photo: string
  teamId: string
  runs: number
  ballsFaced: number
  fours: number
  sixes: number
  wickets: number
  ballsBowled: number
  runsConceded: number
  matchesPlayed: number
  notOuts: number
  ducks: number

  fifties: number
  hundreds: number
  team?: TeamData
}

export interface MatchData {
  id: string
  matchNo: number
  stage: string
  seasonId: string
  team1Id: string
  team2Id: string
  team1: TeamData
  team2: TeamData
  date: string
  venue: string
  status: "upcoming" | "live" | "completed"
  result: string
  team1Score: string
  team2Score: string
  tossWinner: string
  tossDecision: string
  manOfMatch: string
  winnerTeamId: string | null
  youtubeUrl: string
  season?: SeasonData
  innings?: InningData[]
}

export interface InningData {
  id: string
  matchId: string
  teamId: string
  runs: number
  wickets: number
  balls: number
  extras: number
  ballsData: string
}

export interface SeasonData {
  id: string
  name: string
  year: number
  logo: string
  isActive: boolean
  scheduleAnnounced: boolean
  winnerId?: string
}

export interface NewsData {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  image: string
  author: string
  type: string
  published: boolean
  createdAt: string
}

export interface ContactData {
  id: string
  name: string
  email: string
  subject: string
  message: string
  purpose: string
  phone: string
  company: string
  sponsorshipType: string
  budgetRange: string
}

