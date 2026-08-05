export function getQualifiedTeams(totalTeams: number): number {
  return totalTeams <= 5 ? 3 : 4
}

interface PlayoffMatchProps {
  stage: string
  matchup: string
  winner: string
  loser?: string
  isFinal?: boolean
}

function PlayoffMatch({ stage, matchup, winner, loser, isFinal }: PlayoffMatchProps) {
  return (
    <div className={`rounded-lg border p-3 ${isFinal ? "border-amber-500/40 bg-amber-500/10" : "border-[var(--border)] bg-[var(--card)]"}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${isFinal ? "text-amber-600 dark:text-amber-400" : "text-[var(--accent)]"}`}>{stage}</span>
        <span className="text-sm font-semibold">{matchup}</span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[var(--muted-foreground)]">Winner</span>
          <span className={`font-medium ${isFinal ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}>→ {winner}</span>
        </div>
        {loser && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--muted-foreground)]">Loser</span>
            <span className="font-medium text-red-500">→ {loser}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlayoffQualification({ totalTeams }: { totalTeams: number }) {
  const qualified = getQualifiedTeams(totalTeams)
  const isTop3 = totalTeams <= 5

  return (
    <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
      <div className="mb-1 flex items-center gap-2 text-base font-bold">
        <span aria-hidden>🏆</span>
        <span>Playoff Qualification</span>
      </div>
      <p className="mb-4 text-sm font-semibold text-amber-600 dark:text-amber-400">
        Top {qualified} Teams Qualify for Playoffs
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {isTop3 ? (
          <>
            <PlayoffMatch stage="Qualifier 1" matchup="#1 vs #2" winner="Final" loser="Eliminator" />
            <PlayoffMatch stage="Eliminator" matchup="#3 vs Qualifier 1 Loser" winner="Final" />
            <div className="sm:col-span-2">
              <PlayoffMatch stage="Final" matchup="Qualifier 1 Winner vs Eliminator Winner" winner="Champion 🏆" isFinal />
            </div>
          </>
        ) : (
          <>
            <PlayoffMatch stage="Qualifier 1" matchup="#1 vs #2" winner="Final" loser="Qualifier 2" />
            <PlayoffMatch stage="Eliminator" matchup="#3 vs #4" winner="Qualifier 2" />
            <PlayoffMatch stage="Qualifier 2" matchup="Qualifier 1 Loser vs Eliminator Winner" winner="Final" />
            <PlayoffMatch stage="Final" matchup="Qualifier 1 Winner vs Qualifier 2 Winner" winner="Champion 🏆" isFinal />
          </>
        )}
      </div>
    </div>
  )
}
