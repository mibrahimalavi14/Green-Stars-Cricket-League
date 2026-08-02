#!/usr/bin/env node
/**
 * GSCL database backup script.
 *
 * Takes a full snapshot of every model (all rows) as JSON and writes it to
 * `backups/`. Three tiers matching the backup policy:
 *
 *   node scripts/backup-db.mjs daily     -> backups/daily/    (retain 7)
 *   node scripts/backup-db.mjs weekly    -> backups/weekly/   (retain 8)
 *   node scripts/backup-db.mjs monthly   -> backups/monthly/  (retain forever)
 *
 * Uses the pooled connection (DATABASE_URL_POOLED) when present for reliability.
 * Restore with: node scripts/restore-backup.mjs <file>
 */
import { PrismaClient } from "@prisma/client"
import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const tier = process.argv[2] || "daily"
if (!["daily", "weekly", "monthly"].includes(tier)) {
  console.error(`Unknown tier "${tier}" (expected daily | weekly | monthly)`)
  process.exit(1)
}

const url = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL
if (!url) {
  console.error("No DATABASE_URL / DATABASE_URL_POOLED found (run with --env-file=.env)")
  process.exit(1)
}

const prisma = new PrismaClient({ datasources: { db: { url } } })

const root = join(__dirname, "..", "backups", tier)
mkdirSync(root, { recursive: true })

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
const outFile = join(root, `season1-${stamp}.json`)

// Model names come from the Prisma schema (source of truth).
const schema = readFileSync(join(__dirname, "..", "prisma", "schema.prisma"), "utf8")
const modelNames = [...schema.matchAll(/^model (\w+) \{/gm)].map((m) => m[1])

async function main() {
  const dump = {}
  for (const name of modelNames) {
    const key = name.charAt(0).toLowerCase() + name.slice(1)
    if (!prisma[key]) continue
    const rows = await prisma[key].findMany()
    dump[name] = rows
    console.log(`  ${name.padEnd(20)} ${rows.length} rows`)
  }
  writeFileSync(outFile, JSON.stringify(dump, null, 2))
  console.log(`\nBackup written: ${outFile}`)

  const retain = tier === "daily" ? 7 : tier === "weekly" ? 8 : Infinity
  if (Number.isFinite(retain)) {
    const files = readdirSync(root).filter((f) => f.endsWith(".json")).sort()
    const remove = files.slice(0, Math.max(0, files.length - retain))
    for (const f of remove) {
      unlinkSync(join(root, f))
      console.log(`  pruned: ${f}`)
    }
  }
}

main()
  .catch((e) => {
    console.error("Backup failed:", e.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
