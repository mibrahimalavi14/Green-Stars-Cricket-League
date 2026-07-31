"use client"

import { useEffect, useMemo } from "react"

const CONFETTI_COLORS = ["#f59e0b", "#22c55e", "#ef4444", "#3b82f6", "#a855f7", "#ec4899", "#eab308", "#14b8a6"]

interface Props {
  type: "fifty" | "hundred"
  playerName: string
  runs: number
  onClose: () => void
}

export function MilestoneCelebration({ type, playerName, runs, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  const isHundred = type === "hundred"

  const confetti = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        left: (i * 2.2 + Math.random() * 1.8) % 100,
        delay: Math.random() * 2.5,
        duration: 3 + Math.random() * 2.5,
        size: 6 + Math.random() * 9,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.random() * 360,
      })),
    []
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/75 backdrop-blur-sm" style={{ pointerEvents: "none" }}>
      {/* Confetti */}
      <div className="absolute inset-0">
        {confetti.map((c, i) => (
          <span
            key={i}
            className="absolute top-0"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size * 0.45,
              backgroundColor: c.color,
              borderRadius: 2,
              transform: `rotate(${c.rotate}deg)`,
              animation: `gscl-confetti-fall ${c.duration}s linear ${c.delay}s forwards`,
            }}
          />
        ))}
      </div>

      {/* Center message */}
      <div className="relative px-4 text-center" style={{ animation: "gscl-celebrate-pop 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.4)" }}>
        <div
          className={`text-6xl font-black tracking-tight sm:text-8xl ${isHundred ? "text-yellow-300" : "text-amber-400"}`}
          style={{ textShadow: "0 0 45px rgba(251,191,36,0.85), 0 5px 0 rgba(0,0,0,0.35)" }}
        >
          {isHundred ? "CENTURY!" : "FIFTY!"}
        </div>
        <div className="mt-4 text-2xl font-bold text-white sm:text-3xl">{playerName}</div>
        <div className="mt-2 text-lg text-slate-300">{runs} runs scored</div>
        <div className="mt-5 flex items-center justify-center gap-3 text-3xl">
          <span style={{ animation: "gscl-emoji-bounce 0.9s ease-in-out infinite" }}>🎉</span>
          <span style={{ animation: "gscl-emoji-bounce 0.9s ease-in-out 0.3s infinite" }}>🎊</span>
          <span style={{ animation: "gscl-emoji-bounce 0.9s ease-in-out 0.6s infinite" }}>🎉</span>
        </div>
      </div>

      <style>{`
        @keyframes gscl-confetti-fall {
          0% { transform: translateY(-15vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(115vh) rotate(720deg); opacity: 0.5; }
        }
        @keyframes gscl-celebrate-pop {
          0% { transform: scale(0.2); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes gscl-emoji-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
      `}</style>
    </div>
  )
}
