const hits = new Map<string, { count: number; resetAt: number }>()

function cleanup() {
  const now = Date.now()
  for (const [key, val] of hits) {
    if (val.resetAt <= now) hits.delete(key)
  }
}

export interface RateLimitConfig {
  windowMs: number
  max: number
}

export function rateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetMs: number } {
  cleanup()
  const now = Date.now()
  const entry = hits.get(key)

  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.max - 1, resetMs: config.windowMs }
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, remaining: config.max - entry.count, resetMs: entry.resetAt - now }
}

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown"
}

export const RATE_LIMITS = {
  OTP_SEND: { windowMs: 5 * 60 * 1000, max: 3 },
  OTP_VERIFY: { windowMs: 15 * 60 * 1000, max: 5 },
  POTM_VOTE: { windowMs: 60 * 60 * 1000, max: 3 },
  PLAYER_OF_SEASON_VOTE: { windowMs: 60 * 60 * 1000, max: 3 },
  PREDICTION: { windowMs: 60 * 60 * 1000, max: 1 },
  QUIZ_ATTEMPT: { windowMs: 60 * 60 * 1000, max: 1 },
  CONTACT: { windowMs: 24 * 60 * 60 * 1000, max: 5 },
  REVIEW: { windowMs: 24 * 60 * 60 * 1000, max: 3 },
  BALL_SUBMIT: { windowMs: 60 * 1000, max: 120 },
  RATING: { windowMs: 24 * 60 * 60 * 1000, max: 5 },
  SQUAD: { windowMs: 60 * 1000, max: 30 },
  GENERAL_WRITE: { windowMs: 60 * 1000, max: 60 },
  AUTH_ATTEMPT: { windowMs: 15 * 60 * 1000, max: 10 },
} as const
