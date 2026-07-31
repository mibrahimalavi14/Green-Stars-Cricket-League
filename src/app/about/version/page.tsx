import fs from "fs"
import path from "path"
import { execSync } from "child_process"
import { prisma } from "@/lib/prisma"
import { MATCH_CONFIG } from "@/lib/config"
import { BadgeCheck, GitCommit, Server, Cpu, Database, Shield, Activity, Zap } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

function readVersion(pkgPath: string): string {
  try {
    return JSON.parse(fs.readFileSync(pkgPath, "utf8")).version || "—"
  } catch {
    return "—"
  }
}

async function VersionPage() {
  const root = process.cwd()

  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
  const nextVersion = readVersion(path.join(root, "node_modules", "next", "package.json"))
  const prismaVersion = readVersion(path.join(root, "node_modules", "@prisma", "client", "package.json"))
  const zodVersion = readVersion(path.join(root, "node_modules", "zod", "package.json"))

  let commitSha = process.env.VERCEL_GIT_COMMIT_SHA || ""
  let commitDate = process.env.VERCEL_GIT_COMMIT_AUTHOR_DATE || ""
  if (!commitSha) {
    try {
      commitSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim()
      commitDate = execSync("git show -s --format=%cI HEAD", { encoding: "utf8" }).trim()
    } catch { /* not a git checkout */ }
  }
  const shortSha = commitSha ? commitSha.slice(0, 7) : "—"

  let dbVersion = "—"
  let dbOk = false
  try {
    const rows = await prisma.$queryRawUnsafe<{ version: string }[]>("SELECT version() as version")
    dbVersion = rows?.[0]?.version || "—"
    dbOk = true
  } catch { /* db unreachable */ }

  const buildDate = commitDate ? new Date(commitDate).toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "long", timeStyle: "medium" }) + " UTC" : "—"
  const releaseDate = (() => {
    try {
      const md = fs.readFileSync(path.join(root, "VERSION.md"), "utf8")
      const m = md.match(/\| \*\*Release Date\*\* \| ([^|]+) \|/)
      return m?.[1]?.trim() || "—"
    } catch { return "—" }
  })()

  const rows: { label: string; value: string; icon: React.ReactNode }[] = [
    { label: "Version", value: pkg.version || "v1.0.1", icon: <BadgeCheck className="h-4 w-4 text-[var(--accent)]" /> },
    { label: "Commit SHA", value: shortSha, icon: <GitCommit className="h-4 w-4 text-[var(--accent)]" /> },
    { label: "Commit Date", value: buildDate, icon: <Server className="h-4 w-4 text-[var(--accent)]" /> },
    { label: "Release Date", value: releaseDate, icon: <Activity className="h-4 w-4 text-[var(--accent)]" /> },
    { label: "Node.js", value: process.version, icon: <Cpu className="h-4 w-4 text-[var(--accent)]" /> },
    { label: "Next.js", value: nextVersion, icon: <Zap className="h-4 w-4 text-[var(--accent)]" /> },
    { label: "Prisma", value: prismaVersion, icon: <Database className="h-4 w-4 text-[var(--accent)]" /> },
    { label: "Zod", value: zodVersion, icon: <Shield className="h-4 w-4 text-[var(--accent)]" /> },
    { label: "Database", value: dbOk ? "Connected" : "Unreachable", icon: <Database className="h-4 w-4 text-[var(--accent)]" /> },
    { label: "Season Format", value: `T${MATCH_CONFIG.oversPerInnings} — ${MATCH_CONFIG.oversPerInnings} overs / ${MATCH_CONFIG.totalBalls} balls per innings`, icon: <Activity className="h-4 w-4 text-[var(--accent)]" /> },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link href="/about" className="mb-4 inline-block text-sm text-[var(--accent)] hover:underline">&larr; Back to About</Link>
      <h1 className="mb-2 text-3xl font-bold">Version Information</h1>
      <p className="mb-10 text-[var(--muted-foreground)]">
        GSCL platform build &amp; runtime details — debugging ke liye.
      </p>

      <div className={`mb-8 flex items-center gap-3 rounded-xl border p-4 ${dbOk ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/10"}`}>
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${dbOk ? "bg-green-500" : "bg-red-500"}`} />
        <div>
          <p className="font-semibold">Health: {dbOk ? "OK" : "Database Unreachable"}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{dbOk ? "Database connected, API healthy" : "Check Neon status & DATABASE_URL"}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/40 text-xs text-[var(--muted-foreground)]">
              <th className="p-3 text-left font-medium">Field</th>
              <th className="p-3 text-left font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.label} className="border-b border-[var(--border)]/50 last:border-0">
                <td className="p-3">
                  <span className="flex items-center gap-2 font-medium">{r.icon} {r.label}</span>
                </td>
                <td className="p-3 font-mono text-xs text-[var(--muted-foreground)] break-all">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-[var(--muted-foreground)]">
        Database: <span className="font-mono break-all">{dbVersion}</span>
      </p>
    </div>
  )
}

export default VersionPage
