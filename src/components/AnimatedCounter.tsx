"use client"

import { useEffect, useRef, useState } from "react"

export function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || started.current) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        obs.disconnect()
        const duration = 1500
        const start = performance.now()
        function frame(now: number) {
          const elapsed = now - start
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setDisplay(Math.floor(eased * value))
          if (progress < 1) requestAnimationFrame(frame)
        }
        requestAnimationFrame(frame)
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [value])

  return <div ref={ref}>{display}{suffix}</div>
}
