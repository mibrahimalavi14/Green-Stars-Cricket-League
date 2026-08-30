import { prisma } from "@/lib/prisma"
import { DownloadCSVButton } from "@/components/DownloadCSVButton"

export const dynamic = "force-dynamic"

async function PlayerStatsPage() {
  const players = await prisma.player.findMany({
    include: { team: true },
    orderBy: { runs: "desc" },
  })

  const batting = [...players].filter(p => p.runs > 0).sort((a, b) => b.runs - a.runs)
  const bowling = [...players].filter(p => p.wickets > 0).sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)
  const allrounders = players.filter(p => p.runs > 0 && p.wickets > 0).sort((a, b) => (b.runs + b.wickets * 20) - (a.runs + a.wickets * 20))

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Player Stats</h1>
          <p className="text-[var(--muted-foreground)]">Batting and bowling statistics</p>
        </div>
        <div className="flex gap-2">
          <DownloadCSVButton data={batting.map(p => ({ name: p.name, team: p.team?.shortName, runs: p.runs, balls: p.ballsFaced, fours: p.fours, sixes: p.sixes, fifties: p.fifties, hundreds: p.hundreds, sr: p.ballsFaced > 0 ? ((p.runs / p.ballsFaced) * 100).toFixed(1) : "-", rpb: p.ballsFaced > 0 ? (p.runs / p.ballsFaced).toFixed(2) : "-" }))} filename="gscl-batting-stats.csv" columns={[{ key: "name", label: "Player" }, { key: "team", label: "Team" }, { key: "runs", label: "Runs" }, { key: "balls", label: "Balls" }, { key: "fours", label: "4s" }, { key: "sixes", label: "6s" }, { key: "fifties", label: "50s" }, { key: "hundreds", label: "100s" }, { key: "sr", label: "SR" }, { key: "rpb", label: "RPB" }]} />
          <DownloadCSVButton data={bowling.map(p => ({ name: p.name, team: p.team?.shortName, wickets: p.wickets, runs: p.runsConceded, balls: p.ballsBowled, maidens: p.maidens, sr: p.wickets > 0 ? (p.ballsBowled / p.wickets).toFixed(1) : "-", econ: p.ballsBowled > 0 ? (p.runsConceded / (p.ballsBowled / 6)).toFixed(2) : "-", rpb: p.ballsBowled > 0 ? (p.runsConceded / p.ballsBowled).toFixed(2) : "-" }))} filename="gscl-bowling-stats.csv" columns={[{ key: "name", label: "Player" }, { key: "team", label: "Team" }, { key: "wickets", label: "Wkts" }, { key: "runs", label: "Runs" }, { key: "balls", label: "Balls" }, { key: "maidens", label: "Mdns" }, { key: "sr", label: "SR" }, { key: "econ", label: "Econ" }, { key: "rpb", label: "RPB" }]} />
        </div>
      </div>

      <div className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">Most Runs (Batting)</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Player</th>
                <th className="p-3 text-left">Team</th>
                <th className="p-3 text-center">M</th>
                <th className="p-3 text-center">Runs</th>
                <th className="p-3 text-center" title="Balls Faced">BF</th>
                <th className="p-3 text-center" title="Fours">4s</th>
                <th className="p-3 text-center" title="Sixes">6s</th>
                <th className="p-3 text-center">50</th>
                <th className="p-3 text-center">100</th>
                <th className="p-3 text-center" title="Not Outs">NO</th>
                <th className="p-3 text-center" title="Ducks (0 runs)">Duck</th>
                <th className="p-3 text-center" title="Balls per Boundary">B/B</th>
                <th className="p-3 text-center" title="Runs per Ball">RPB</th>
                <th className="p-3 text-center" title="Strike Rate">SR</th>
              </tr>
            </thead>
            <tbody>
              {batting.length === 0 ? (
                <tr><td colSpan={15} className="p-6 text-center text-[var(--muted-foreground)]">No batting data yet.</td></tr>
              ) : batting.map((p, i) => (
                <tr key={p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                  <td className="p-3 font-medium">{i + 1}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {p.photo && p.photo !== "/placeholder-player.svg" ? (
                        <img src={p.photo} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <img src="/placeholder-player.svg" alt="" className="h-6 w-6 rounded-full bg-[var(--muted)] p-1" />
                      )}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {p.team?.logo && <img src={p.team.logo} alt="" className="h-5 w-5 rounded-full object-cover" />}
                      <span className="text-[var(--muted-foreground)]">{p.team?.shortName}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">{p.matchesPlayed}</td>
                  <td className="p-3 text-center font-bold">{p.runs}</td>
                  <td className="p-3 text-center">{p.ballsFaced}</td>
                  <td className="p-3 text-center text-blue-600 dark:text-blue-400">{p.fours}</td>
                  <td className="p-3 text-center text-purple-600 dark:text-purple-400">{p.sixes}</td>
                  <td className="p-3 text-center text-yellow-600 dark:text-yellow-400">{p.fifties}</td>
                  <td className="p-3 text-center text-green-600 dark:text-green-400">{p.hundreds}</td>
                  <td className="p-3 text-center">{p.notOuts}</td>
                  <td className="p-3 text-center">{p.ducks}</td>
                  <td className="p-3 text-center font-mono">{(p.fours + p.sixes) > 0 ? (p.ballsFaced / (p.fours + p.sixes)).toFixed(1) : "-"}</td>
                  <td className="p-3 text-center font-mono">{p.ballsFaced > 0 ? (p.runs / p.ballsFaced).toFixed(2) : "-"}</td>
                  <td className="p-3 text-center font-mono">{p.ballsFaced > 0 ? ((p.runs / p.ballsFaced) * 100).toFixed(1) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">Most Wickets (Bowling)</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="min-w-[600px] w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Player</th>
                <th className="p-3 text-left">Team</th>
                <th className="p-3 text-center">M</th>
                <th className="p-3 text-center" title="Wickets">Wkts</th>
                <th className="p-3 text-center">Runs</th>
                <th className="p-3 text-center">Balls</th>
                <th className="p-3 text-center" title="Maidens">Mdns</th>
                <th className="p-3 text-center" title="Strike Rate">SR</th>
                <th className="p-3 text-center" title="Economy Rate">Econ</th>
                <th className="p-3 text-center" title="Runs Conceded per Ball">RPB</th>
              </tr>
            </thead>
            <tbody>
              {bowling.length === 0 ? (
                <tr><td colSpan={11} className="p-6 text-center text-[var(--muted-foreground)]">No bowling data yet.</td></tr>
              ) : bowling.map((p, i) => (
                <tr key={p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                  <td className="p-3 font-medium">{i + 1}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {p.photo && p.photo !== "/placeholder-player.svg" ? (
                        <img src={p.photo} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <img src="/placeholder-player.svg" alt="" className="h-6 w-6 rounded-full bg-[var(--muted)] p-1" />
                      )}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {p.team?.logo && <img src={p.team.logo} alt="" className="h-5 w-5 rounded-full object-cover" />}
                      <span className="text-[var(--muted-foreground)]">{p.team?.shortName}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">{p.matchesPlayed}</td>
                  <td className="p-3 text-center font-bold text-green-600 dark:text-green-400">{p.wickets}</td>
                  <td className="p-3 text-center">{p.runsConceded}</td>
                  <td className="p-3 text-center">{p.ballsBowled}</td>
                  <td className="p-3 text-center">{p.maidens}</td>
                  <td className="p-3 text-center font-mono">{p.wickets > 0 ? (p.ballsBowled / p.wickets).toFixed(1) : "-"}</td>
                  <td className="p-3 text-center font-mono">{p.ballsBowled > 0 ? (p.runsConceded / (p.ballsBowled / 6)).toFixed(2) : "-"}</td>
                  <td className="p-3 text-center font-mono">{p.ballsBowled > 0 ? (p.runsConceded / p.ballsBowled).toFixed(2) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {allrounders.length > 0 && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">All-Rounders</h2>
            <DownloadCSVButton data={allrounders.map(p => ({ name: p.name, team: p.team?.shortName, matches: p.matchesPlayed, runs: p.runs, wickets: p.wickets }))} filename="gscl-all-rounders.csv" columns={[{ key: "name", label: "Player" }, { key: "team", label: "Team" }, { key: "matches", label: "M" }, { key: "runs", label: "Runs" }, { key: "wickets", label: "Wkts" }]} />
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="min-w-[700px] w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Player</th>
                  <th className="p-3 text-left">Team</th>
                  <th className="p-3 text-center">M</th>
                  <th className="p-3 text-center">Runs</th>
                  <th className="p-3 text-center" title="Wickets">Wkts</th>
                </tr>
              </thead>
              <tbody>
                {allrounders.map((p, i) => (
                  <tr key={p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                    <td className="p-3 font-medium">{i + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {p.photo && p.photo !== "/placeholder-player.svg" ? (
                          <img src={p.photo} alt="" className="h-6 w-6 rounded-full object-cover" />
                        ) : (
                          <img src="/placeholder-player.svg" alt="" className="h-6 w-6 rounded-full bg-[var(--muted)] p-1" />
                        )}
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {p.team?.logo && <img src={p.team.logo} alt="" className="h-5 w-5 rounded-full object-cover" />}
                        <span className="text-[var(--muted-foreground)]">{p.team?.shortName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">{p.matchesPlayed}</td>
                    <td className="p-3 text-center font-bold">{p.runs}</td>
                    <td className="p-3 text-center font-bold text-green-600 dark:text-green-400">{p.wickets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlayerStatsPage
