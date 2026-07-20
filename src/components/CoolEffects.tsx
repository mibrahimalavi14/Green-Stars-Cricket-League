"use client"

import { useEffect, useRef, useState, ReactNode } from "react"

export function Confetti({ trigger }: { trigger: boolean }) {
  useEffect(() => {
    if (!trigger) return
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"],
      })
      setTimeout(() => confetti({
        particleCount: 50, spread: 100, origin: { y: 0.5 },
      }), 200)
    })
  }, [trigger])
  return null
}

export function ScrollReveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`}>
      {children}
    </div>
  )
}

export function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const counted = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || counted.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || counted.current) return
      counted.current = true
      let current = 0
      const step = Math.ceil(value / 30)
      const interval = setInterval(() => {
        current += step
        if (current >= value) { current = value; clearInterval(interval) }
        el.textContent = current.toLocaleString()
      }, 40)
      observer.disconnect()
    }, { threshold: 0.5 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return <span ref={ref}>0</span>
}

export function LivePulse() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
    </span>
  )
}

export function CricketBallLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[var(--accent)]" />
        <div className="absolute inset-2 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full border-2 border-[var(--accent)]" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-[var(--muted)] ${className}`}>
      <div className="h-full w-full rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer" />
    </div>
  )
}

export function GlowCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      el.style.setProperty("--mx", `${x}px`)
      el.style.setProperty("--my", `${y}px`)
    }
    el.addEventListener("mousemove", handler)
    return () => el.removeEventListener("mousemove", handler)
  }, [])

  return (
    <div ref={ref} className={`relative overflow-hidden before:pointer-events-none before:absolute before:-inset-px before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-300 before:bg-[radial-gradient(600px_circle_at_var(--mx)_var(--my),var(--accent)_0%,transparent_40%)] hover:before:opacity-100 ${className}`}>
      {children}
    </div>
  )
}
