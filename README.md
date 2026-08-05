# Green Stars Cricket League (GSCL)

A T4-format (4-over) cricket league web application — public website + admin scoring
panel + practice center. Built with Next.js (App Router), TypeScript, Prisma +
PostgreSQL, deployed on Vercel.

**Production:** `https://green-stars-cricket-league.vercel.app`

## Docs

| Document | Contents |
|----------|----------|
| `WEBSITE.md` | **Complete website + formulas** — every public page, admin page, API and all scoring/stat/award formulas |
| `FORMULAS.md` | Scoring & formulas quick reference (synced with `MATCH_CONFIG`) |
| `GUIDE.md` | User guide (matchday, scoring, extras, wickets) |
| `RUNBOOK.md` | Release & deployment runbook |
| `SEASON_1_CHECKLIST.md` | Launch checklist |
| `CHANGELOG.md` | Release notes |
| `VERSION.md` | Version state + versioning policy |
| `BACKUP_POLICY.md` / `DISASTER_RECOVERY.md` | Backup & DR procedures |
| `AUDIT.md` | Security/verification audit |

## Quick Start

```bash
npm install
npx prisma db push        # sync schema (local Postgres)
npm run dev               # http://localhost:3000
npm run build             # production build
npm start                 # serve production build
```

Admin login uses a single admin password (see `.env` → `ADMIN_PASSWORD`).

## Testing

```bash
npm run lint
npx tsc --noEmit
```

## Version

Current release: **v1.1.1-season1** (see `VERSION.md` for the versioning policy).
