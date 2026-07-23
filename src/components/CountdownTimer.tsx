"use client"

import { useState, useEffect, useRef } from "react"

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [remaining, setRemaining] = useState("")
  const doneRef = useRef(false)

  useEffect(() => {
    const target = new Date(targetDate).getTime()
    function tick() {
      const diff = target - Date.now()
      if (diff <= 0) {
        if (!doneRef.current) {
          doneRef.current = true
          setRemaining("Match starts!")
        }
        return true
      }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${d}d ${h}h ${m}m ${s}s`)
      return false
    }
    if (tick()) return
    const id = setInterval(() => { if (tick()) clearInterval(id) }, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return (
    <span className="tabular-nums">{remaining}</span>
  )
}
