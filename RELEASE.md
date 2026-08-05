# GSCL v1.1.0 — RELEASE NOTES

**Version:** v1.1.0
**Tag:** `v1.1.0-season1`
**Type:** Minor (feature) release
**Status:** Season 1 — Production

## What's in this release

### Season Quiz (auto-generation)
- New `SeasonQuiz` / `SeasonQuizAttempt` tables.
- Auto-generates 30–40 questions (4 options each) when the last match of a season completes.
- Public play UI on `/quiz` (one attempt per email) with per-season leaderboard.
- Admin generate/review UI under **Admin → Quizzes → Season Quiz**.
- Lock/Unlock toggle — locking blocks new submissions server-side.
- Status indicator (Generated / Open·Locked / Questions / Generated On / Attempts).

### Practice Center
- **Practice Workspace**: an isolated, admin-only workspace for scoring drills and
  rehearsals. Public pages and public APIs never read practice data.
- **Workspace Switcher**: OFFICIAL SEASON / PRACTICE MODE toggle on every admin page
  (admin-cookie backed, invisible to visitors).
- **Clone Official → Practice**: copies teams, players, squads, venues, sponsors and
  jerseys into practice with all stats zeroed.
- **Reset Practice**: wipes practice matches, stats, awards, records, snapshots and
  related data. Official data is never touched.
- **Copy Setup → Official**: promotes a completed practice match to an official
  **upcoming** match — teams, Playing XI, toss, officials and venue copied and mapped to
  official originals. **Setup-only: no runs, no stats.**
- **Practice Report**: matches completed, runs, balls, wickets, extras, undo count,
  scoring accuracy and total time spent.

### Workspace isolation & hardening
- `Workspace` table + `Season.workspaceId` (`official` / `practice`).
- Every public route, API, record computation and admin list is scoped to a workspace.
- `computeAllRecords(workspaceId)` and `recalcPlayerStats(seasonId?)` are workspace/season
  aware.
- `api/squad` is cookie-aware (official for visitors, practice for admins in practice mode).
- Reset and Copy Setup require admin auth **and** the practice workspace cookie.

## Verification (final regression — before release)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ Clean |
| `npm run build` | ✅ Clean |
| Dress rehearsal (`npm run dress:rehearsal`) | ✅ `55/55 checks passed` |
| verify-phase-a (awards, fair-play, records, season lock) | ✅ ALL PASS |
| Practice Center unit test | ✅ 32/32 passed |
| Schema pushed (Workspace, Season.workspaceId, PracticeCloneMapping) | ✅ Applied |
| Seed creates `official` + `practice` workspaces | ✅ |

## Deployment order
1. `prisma db push` (schema already applied on the target DB).
2. Deploy dev environment → verify `/api/health` reports v1.1.0.
3. Deploy production (Vercel).
4. Confirm `GET /admin/system` shows healthy counts and health = OK.

## Backout
- Revert deploy to `v1.0.2-season1` tag if a blocking defect is found.
- Practice workspace data is disposable; official workspace is never altered by practice
  features — no data migration needed on backout.

---

**Released by:** _______________
**Date:** _______________
