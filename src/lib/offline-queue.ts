"use client"

export interface QueuedOfflineBall {
  id: string
  matchId: string
  battingTeamId: string
  ball: Record<string, unknown>
  createdAt: number
}

const QUEUE_KEY = "gscl_offline_queue"
const SYNC_DELAY_MS = 250

export function createBallId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `ball-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function loadOfflineQueue(): QueuedOfflineBall[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveOfflineQueue(queue: QueuedOfflineBall[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function getOfflineQueueCount(): number {
  return loadOfflineQueue().length
}

export function addToOfflineQueue(item: Omit<QueuedOfflineBall, "createdAt">): number {
  const queue = loadOfflineQueue()
  queue.push({ ...item, createdAt: Date.now() })
  saveOfflineQueue(queue)
  return queue.length
}

export function removeFromOfflineQueue(id: string): number {
  const queue = loadOfflineQueue()
  const next = queue.filter((item) => item.id !== id)
  if (next.length !== queue.length) saveOfflineQueue(next)
  return next.length
}

export async function syncOfflineQueue(
  onProgress?: (done: number, total: number) => void
): Promise<{ synced: number; dropped: number; remaining: number }> {
  const initial = loadOfflineQueue()
  const total = initial.length
  if (total === 0) return { synced: 0, dropped: 0, remaining: 0 }

  let synced = 0
  let dropped = 0
  const pending: QueuedOfflineBall[] = []

  for (let i = 0; i < initial.length; i++) {
    const item = initial[i]
    let keep = false
    try {
      const res = await fetch("/api/live/balls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: item.matchId,
          battingTeamId: item.battingTeamId,
          ball: item.ball,
          ballId: item.id,
        }),
      })
      if (res.ok) {
        synced++
      } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        dropped++
      } else {
        keep = true
      }
    } catch {
      pending.push(...initial.slice(i))
      break
    }
    if (keep) pending.push(item)
    saveOfflineQueue(pending.concat(initial.slice(i + 1)))
    if (onProgress) onProgress(synced + dropped, total)
    await new Promise((r) => setTimeout(r, SYNC_DELAY_MS))
  }

  saveOfflineQueue(pending)
  if (onProgress) onProgress(synced + dropped, total)
  return { synced, dropped, remaining: pending.length }
}
