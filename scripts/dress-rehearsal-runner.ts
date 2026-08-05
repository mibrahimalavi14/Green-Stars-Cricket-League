/**
 * Launcher for the dress rehearsal.
 *
 * Sets NODE_ENV=production so `@/lib/prisma` uses the Neon serverless adapter
 * with the pooled connection string (DATABASE_URL_POOLED), which is far more
 * reliable under the rehearsal's heavy sequential write load than the direct
 * Postgres endpoint (which exhausts its 9-connection pool during a cold start).
 *
 * Spawns a fresh child process for every attempt: a plain dynamic import of
 * `dress-rehearsal.ts` would only ever execute the module top-level once (the
 * module is cached and `main()` runs at import time), so retries would no-op.
 * The rehearsal cleans up its own data on startup, so a retry is always safe.
 *
 * Usage: npm run dress:rehearsal
 */
import { spawn, exec } from "child_process"

const ATTEMPT_TIMEOUT_MS = 25 * 60 * 1000
const MAX_ATTEMPTS = 3

function killTree(child: ReturnType<typeof spawn>) {
  if (process.platform === "win32") {
    exec(`taskkill /pid ${child.pid} /T /F`, () => {})
  } else {
    child.kill("SIGTERM")
  }
}

function runOnce(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", "scripts/dress-rehearsal.ts"], {
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production" },
    })

    const timer = setTimeout(() => {
      console.error(`  [runner] attempt timed out after ${ATTEMPT_TIMEOUT_MS / 1000}s, killing...`)
      killTree(child)
    }, ATTEMPT_TIMEOUT_MS)

    child.on("error", (err) => {
      clearTimeout(timer)
      reject(err)
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      if (code === 0) resolve()
      else reject(new Error(`dress-rehearsal exited with code ${code}`))
    })
  })
}

async function run() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await runOnce()
      console.log("\n  [runner] rehearsal passed.")
      return
    } catch (err) {
      console.error(`  [runner] attempt ${attempt}/${MAX_ATTEMPTS} failed: ${(err as Error).message}`)
      if (attempt < MAX_ATTEMPTS) {
        const delay = 8000 * attempt
        console.error(`  [runner] retrying in ${delay / 1000}s...`)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  process.exitCode = 1
}

void run()
