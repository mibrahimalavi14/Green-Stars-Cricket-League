"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getOfflineQueueCount, syncOfflineQueue } from "@/lib/offline-queue"

export function useOfflineQueue(onSynced?: () => void) {
  const [online, setOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [lastSynced, setLastSynced] = useState(0)

  const onSyncedRef = useRef(onSynced)
  onSyncedRef.current = onSynced
  const syncingRef = useRef(false)

  const refreshCount = useCallback(() => {
    if (typeof window === "undefined") return
    setPendingCount(getOfflineQueueCount())
  }, [])

  const syncNow = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) return
    if (syncingRef.current) return
    syncingRef.current = true
    setSyncing(true)
    const total = getOfflineQueueCount()
    setProgress(total > 0 ? { done: 0, total } : null)
    const result = await syncOfflineQueue((done, total) => setProgress({ done, total }))
    syncingRef.current = false
    setSyncing(false)
    setProgress(null)
    setLastSynced(result.synced)
    refreshCount()
    if (result.synced > 0 || result.dropped > 0) onSyncedRef.current?.()
  }, [refreshCount])

  useEffect(() => {
    if (typeof window === "undefined") return
    setOnline(navigator.onLine)
    refreshCount()
    const handleOnline = () => {
      setOnline(true)
      syncNow()
    }
    const handleOffline = () => setOnline(false)
    const timer = setInterval(() => {
      if (navigator.onLine && getOfflineQueueCount() > 0) syncNow()
    }, 5000)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(timer)
    }
  }, [syncNow, refreshCount])

  return { online, pendingCount, syncing, progress, lastSynced, refreshCount }
}
