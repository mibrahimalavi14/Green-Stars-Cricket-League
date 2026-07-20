"use client"

import { useEffect, useState, ReactNode } from "react"

export function PageTransition({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(timer)
  }, [])

  return (
    <div className={`transition-all duration-500 ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
      {children}
    </div>
  )
}
