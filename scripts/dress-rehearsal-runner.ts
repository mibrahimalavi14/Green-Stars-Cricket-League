/**
 * Launcher for the dress rehearsal.
 *
 * Sets NODE_ENV=production so `@/lib/prisma` uses the Neon serverless adapter
 * with the pooled connection string (DATABASE_URL_POOLED), which is far more
 * reliable under the rehearsal's heavy sequential write load than the direct
 * Postgres endpoint (which exhausts its 9-connection pool during a cold start).
 *
 * Retries the whole run a few times with a hard per-attempt timeout, because
 * the Neon pooler occasionally stalls/throws mid-run; the rehearsal cleans up
 * its own data on startup so a retry is always safe.
 *
 * Usage: npm run dress:rehearsal
 */
(process.env as Record<string, string>).NODE_ENV = "production"

const ATTEMPT_TIMEOUT_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 3

function withTimeout<T>(p: Promise<T>, ms: number, attempt: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Attempt ${attempt} timed out after ${ms / 1000}s`)), ms)
    p.then(v => { clearTimeout(t); resolve(v) }, e => { clearTimeout(t); reject(e) })
  })
}

async function run() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await withTimeout(import("./dress-rehearsal"), ATTEMPT_TIMEOUT_MS, attempt)
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
