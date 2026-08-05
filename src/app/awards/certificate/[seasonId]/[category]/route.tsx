import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"

const CATEGORY_LABELS: Record<string, string> = {
  champion: "Season Champion",
  runner_up: "Runners-up",
  orange_cap: "Orange Cap",
  purple_cap: "Purple Cap",
  mvp: "Most Valuable Player",
  best_batter: "Best Batter",
  best_bowler: "Best Bowler",
  best_fielder: "Best Fielder",
  most_improved: "Most Improved Player",
  emerging_player: "Emerging Player",
  fair_play: "Fair Play Award",
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ seasonId: string; category: string }> },
) {
  const { seasonId, category } = await params

  const [award, season] = await Promise.all([
    prisma.seasonAward.findUnique({
      where: { seasonId_category: { seasonId, category } },
    }),
    prisma.season.findUnique({ where: { id: seasonId } }),
  ])

  if (!award || !season) {
    return new Response("Not found", { status: 404 })
  }

  let subject = "—"
  let detail = award.value || ""
  if (award.playerId) {
    const player = await prisma.player.findUnique({ where: { id: award.playerId } })
    if (player) {
      subject = player.name
      if (player.teamId) {
        const team = await prisma.team.findUnique({ where: { id: player.teamId } })
        if (team) detail = detail || `${team.name}`
      }
    }
  } else if (award.teamId) {
    const team = await prisma.team.findUnique({ where: { id: award.teamId } })
    if (team) subject = team.name
  }

  const gold = "#c9a227"
  const dark = "#1c1917"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, #1c1917 0%, #292524 60%, #1c1917 100%)`,
          color: "#f5f5f4",
          fontFamily: "sans-serif",
          padding: 48,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 24,
            border: `3px solid ${gold}`,
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 40, letterSpacing: 12, color: gold, textTransform: "uppercase", fontWeight: 600 }}>
            Green Stars Cricket League
          </div>
          <div style={{ marginTop: 16, fontSize: 22, letterSpacing: 4, color: "#a8a29e", textTransform: "uppercase" }}>
            Season {season.year}
          </div>
          <div style={{ marginTop: 48, fontSize: 26, letterSpacing: 6, color: "#d6d3d1", textTransform: "uppercase" }}>
            Award Winner
          </div>
          <div style={{ marginTop: 12, fontSize: 72, fontWeight: 800, color: "#fafaf9" }}>{subject}</div>
          <div
            style={{
              marginTop: 28,
              padding: "12px 40px",
              background: gold,
              color: dark,
              borderRadius: 999,
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            {CATEGORY_LABELS[category] || category.replace(/_/g, " ")}
          </div>
          {detail ? <div style={{ marginTop: 24, fontSize: 24, color: "#a8a29e" }}>{detail}</div> : null}
          <div style={{ position: "absolute", bottom: 40, fontSize: 18, color: "#78716c", letterSpacing: 2 }}>
            GSCL · Season {season.name}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
