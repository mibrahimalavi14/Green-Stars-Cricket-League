import { ImageResponse } from "next/og"

export const dynamic = "force-dynamic"

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          background: "linear-gradient(135deg, #1a3a2a 0%, #0d6b3e 50%, #1a3a2a 100%)",
          fontFamily: "Inter, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 80, fontWeight: 900, color: "white" }}>GSCL</span>
        </div>
        <h1
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: "white",
            margin: 0,
            letterSpacing: 2,
          }}
        >
          Green Stars Cricket League
        </h1>
        <p
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.8)",
            marginTop: 8,
          }}
        >
          Season 1 — Live Scores, Fixtures & Points Table
        </p>
        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 30,
          }}
        >
          {["AW", "DK", "ER", "FS", "LX", "PP"].map((s) => (
            <span
              key={s}
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "rgba(255,255,255,0.6)",
                background: "rgba(255,255,255,0.08)",
                padding: "4px 12px",
                borderRadius: 6,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
