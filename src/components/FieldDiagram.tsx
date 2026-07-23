"use client"

import { memo } from "react"

interface FieldDiagramProps {
  selected: string
  onSelect: (region: string) => void
}

const positions: { label: string; x: number; y: number; short?: string }[] = [
  { label: "Third Man", x: 68, y: 18, short: "Third" },
  { label: "Fine Leg", x: 32, y: 18 },
  { label: "Slip", x: 75, y: 30 },
  { label: "Gully", x: 68, y: 35 },
  { label: "Point", x: 80, y: 42 },
  { label: "Square Leg", x: 20, y: 42 },
  { label: "Cover", x: 78, y: 55 },
  { label: "Mid Wkt", x: 22, y: 55 },
  { label: "Mid Off", x: 62, y: 62 },
  { label: "Mid On", x: 38, y: 62 },
  { label: "Long Off", x: 85, y: 82, short: "Long Off" },
  { label: "Long On", x: 15, y: 82, short: "Long On" },
  { label: "Straight", x: 50, y: 72 },
  { label: "Off", x: 55, y: 48 },
  { label: "Leg", x: 45, y: 48 },
]

export const FieldDiagram = memo(function FieldDiagram({ selected, onSelect }: FieldDiagramProps) {
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <svg viewBox="0 0 100 100" className="w-full" style={{ aspectRatio: "1" }}>
        <defs>
          <radialGradient id="groundGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2d5a1e" />
            <stop offset="70%" stopColor="#1a4a10" />
            <stop offset="100%" stopColor="#0f3508" />
          </radialGradient>
        </defs>

        {/* Ground */}
        <ellipse cx="50" cy="50" rx="48" ry="48" fill="url(#groundGrad)" stroke="#3a7a28" strokeWidth="0.8" />

        {/* Pitch */}
        <rect x="48" y="40" width="4" height="20" rx="0.5" fill="#c4a265" opacity="0.7" />
        <line x1="50" y1="43" x2="50" y2="43.5" stroke="white" strokeWidth="0.4" />
        <line x1="50" y1="56.5" x2="50" y2="57" stroke="white" strokeWidth="0.4" />

        {/* Batsman dot */}
        <circle cx="50" cy="57" r="1.5" fill="white" />

        {/* Bowler dot */}
        <circle cx="50" cy="43" r="1" fill="white" opacity="0.7" />

        {/* Position markers */}
        {positions.map((pos) => {
          const isSelected = selected === pos.label
          const isShortSelected = selected === (pos.short || pos.label)
          const active = isSelected || isShortSelected

          return (
            <g key={pos.label} onClick={() => onSelect(pos.short || pos.label)} className="cursor-pointer">
              {/* Highlight circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={active ? 6 : 4}
                fill={active ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.12)"}
                stroke={active ? "#22c55e" : "rgba(255,255,255,0.3)"}
                strokeWidth={active ? 0.8 : 0.4}
              />
              {/* Label */}
              <text
                x={pos.x}
                y={pos.y + 0.3}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={active ? "2.8" : "2.4"}
                fontWeight={active ? "bold" : "normal"}
                fill={active ? "#22c55e" : "rgba(255,255,255,0.85)"}
                style={{ pointerEvents: "none" }}
              >
                {pos.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
})
