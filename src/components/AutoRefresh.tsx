"use client"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function AutoRefresh({ interval = 30000 }: { interval?: number }) {
  const router = useRouter()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    function start() {
      intervalRef.current = setInterval(() => {
        if (!document.hidden) router.refresh()
      }, interval)
    }
    start()

    function onVisChange() {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current)
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current)
        start()
      }
    }

    document.addEventListener("visibilitychange", onVisChange)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener("visibilitychange", onVisChange)
    }
  }, [router, interval])

  return null
}
