# GSCL v1.0.2 — BACKUP POLICY

Production backup strategy for Season 1. Do **not** rely on Neon's auto-backup
alone — a second, portable copy must exist in case the project/database is ever
lost.

## Backup tiers

| Tier | Cadence | Command | Location | Retention |
|------|---------|---------|----------|-----------|
| **Daily** | Every day (after last match) | `npm run backup:db` | `backups/daily/` | 7 files |
| **Weekly** | Every Monday | `npm run backup:weekly` | `backups/weekly/` | 8 files |
| **Monthly** | 1st of every month | `npm run backup:monthly` | `backups/monthly/` | Forever (archive) |

Each backup is a full JSON snapshot of every table (all models, all rows),
written to `backups/` (gitignored). It uses the pooled Neon connection
(`DATABASE_URL_POOLED`) for reliability.

## Restore

```
npm run restore:db -- backups/daily/season1-<timestamp>.json --yes
```

> WARNING: restore **deletes all current data first**, then re-inserts from the
> backup. Always test against a staging DB before using in production.

## Scheduling

- **Daily:** run manually after the last match of the day, or schedule the npm
  command via any external scheduler (Windows Task Scheduler, GitHub Actions
  cron, Vercel Cron + a script, etc.).
- **Weekly/Monthly:** same command with `weekly` / `monthly` tier.

## Fidelity notes

- The JSON snapshot is Prisma-based and portable (restorable anywhere with the
  same schema).
- For a byte-exact SQL restore at the Neon level, additionally export a
  `pg_dump` from the **Neon console → Branch → Export** (or `pg_dump
  "$DATABASE_URL" > backup.sql`) on a weekly cadence and store it off-platform
  (GitHub secret-backed release asset, Google Drive, etc.).

## 3-2-1 rule

1. **3** copies: Neon primary + weekly pg_dump + daily JSON.
2. **2** media: Neon cloud + local `backups/` + off-platform archive.
3. **1** off-site: keep the monthly archive somewhere outside this machine.
