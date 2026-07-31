import type { TimelineEvent } from "@/lib/match-timeline"

const ICONS: Record<TimelineEvent["type"], string> = {
  toss: "🪙",
  start: "🏏",
  fifty: "🎉",
  century: "🌟",
  six: "💥",
  wicket: "❌",
  innings_break: "🏁",
  super_over: "🔥",
  result: "🏆",
  motm: "⭐",
}

const STYLES: Record<TimelineEvent["type"], { ring: string; badge: string; text: string }> = {
  toss: { ring: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400", badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400", text: "" },
  start: { ring: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400", badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400", text: "" },
  fifty: { ring: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400", badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400", text: "font-bold text-amber-600 dark:text-amber-400" },
  century: { ring: "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400", badge: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400", text: "font-bold text-yellow-600 dark:text-yellow-400" },
  six: { ring: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400", badge: "bg-red-500/15 text-red-600 dark:text-red-400", text: "" },
  wicket: { ring: "bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400", badge: "bg-purple-500/15 text-purple-600 dark:text-purple-400", text: "font-semibold" },
  innings_break: { ring: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400", badge: "bg-slate-500/15 text-slate-600 dark:text-slate-400", text: "" },
  super_over: { ring: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400", badge: "bg-orange-500/15 text-orange-600 dark:text-orange-400", text: "font-bold text-orange-600 dark:text-orange-400" },
  result: { ring: "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400", badge: "bg-green-500/15 text-green-600 dark:text-green-400", text: "font-bold text-green-600 dark:text-green-400" },
  motm: { ring: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400", badge: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400", text: "font-semibold" },
}

export function MatchTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return null

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="mb-4 text-sm font-semibold">Match Timeline</h3>
      <div className="relative space-y-0 pl-8">
        <div className="absolute bottom-2 left-[15px] top-2 w-px bg-[var(--border)]" />
        {events.map((e, i) => {
          const s = STYLES[e.type]
          return (
            <div key={i} className="relative pb-4 last:pb-0">
              <div className={`absolute -left-8 top-0 flex h-7 w-7 items-center justify-center rounded-full text-sm ${s.ring}`}>
                {ICONS[e.type]}
              </div>
              {e.over && (
                <span className={`mb-0.5 inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${s.badge}`}>
                  {e.over}
                </span>
              )}
              <p className={`text-sm ${s.text} ${e.type === "result" || e.type === "super_over" || e.type === "motm" || e.type === "toss" ? "font-medium" : ""}`}>
                {e.text}
              </p>
              {e.sub && <p className="text-xs text-[var(--muted-foreground)]">{e.sub}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
