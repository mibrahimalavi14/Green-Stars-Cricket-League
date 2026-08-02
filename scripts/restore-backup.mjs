#!/usr/bin/env node
/**
 * GSCL database restore script.
 *
 * Restores a JSON backup produced by scripts/backup-db.mjs.
 *
 *   node scripts/restore-backup.mjs backups/daily/season1-....json
 *
 * WARNING: This DESTROYS all current data in the connected database first,
 * then re-inserts from the backup. It requires --yes to proceed.
 */
import { PrismaClient } from "@prisma/client"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))

const file = process.argv[2]
const force = process.argv.includes("--yes")
if (!file) {
  console.error("Usage: node scripts/restore-backup.mjs <backup.json> [--yes]")
  process.exit(1)
}
const abs = join(__dirname, "..", file)
const dump = JSON.parse(readFileSync(abs, "utf8"))

const url = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL
if (!url) {
  console.error("No DATABASE_URL / DATABASE_URL_POOLED found (run with --env-file=.env)")
  process.exit(1)
}

const prisma = new PrismaClient({ datasources: { db: { url } } })

async function main() {
  const modelNames = Object.keys(dump)
  const total = modelNames.reduce((n, m) => n + dump[m].length, 0)
  console.log(`Restoring ${total} rows across ${modelNames.length} models from ${file}`)

  if (!force) {
    console.error("This will DELETE all current data. Rerun with --yes to confirm.")
    process.exit(1)
  }

  // Clear tables in reverse (child-first) order to satisfy FK constraints.
  const reverse = [...modelNames].reverse()
  for (const name of reverse) {
    const key = name.charAt(0).toLowerCase() + name.slice(1)
    if (!prisma[key]) continue
    await prisma[key].deleteMany()
    console.log(`  cleared ${name}`)
  }

  // Re-insert rows in forward (parent-first) order.
  for (const name of modelNames) {
    const key = name.charAt(0).toLowerCase() + name.slice(1)
    if (!prisma[key]) continue
    for (const row of dump[name]) {
      await prisma[key].create({ data: row })
    }
    console.log(`  restored ${name} (${dump[name].length} rows)`)
  }
  console.log("\nRestore complete.")
}

main()
  .catch((e) => {
    console.error("Restore failed:", e.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
