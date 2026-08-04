# GSCL v1.0.2 — RUNBOOK

Match day operations guide for scorers and admins.

## Release Workflow (Post-Launch Updates)

Feature development is frozen post-launch. Only bug fixes and the approved season-quiz
auto-generation feature ship during Season 1. Follow this strict workflow for any change:

1. **Patch versioning**: Bump the minor version for new features, patch for bug fixes
   (e.g. `v1.0.2` → `v1.0.3` bugfix → `v1.0.4` feature). Update all three places:
   `package.json`, `VERSION.md`, and the version strings in `src/app/api/health/route.ts`
   and `src/app/api/admin/system/route.ts`.
2. **Never hot-edit the live branch.** All work happens on a dev branch / local `main`,
   is validated locally, then pushed.
3. **Validate before deploy**, in this order:
   - `npm run typecheck` (or `npx tsc --noEmit`) → clean
   - `npm run build` → all pages green
   - `npm run dress:rehearsal` → expect `55/55 checks passed`
   - Review the diff (`git diff`) before committing
4. **Deploy order**: dev environment first → verify → then production via Vercel.
5. After a successful deploy, confirm `/api/health` reports the new version and
   `GET /admin/system` shows healthy counts.
6. If a bug ships to production, fix forward with a new patch commit — never amend or
   force-push a release commit.

### Season Quiz Auto-Generation (v1.0.2)
- Runs automatically when the last match of a season is completed.
- Admin can also regenerate manually at **Admin → Quizzes → Season Quiz (Auto-generated)**.
- Generates 30–40 questions (4 options each) from season data. Regenerating deletes
  existing questions and all attempts — only regenerate before the quiz is live to users.
- Users answer once per email on `/quiz`; scores and leaderboard are per season.

## Pre-Match (30 minutes before)

### 1. Verify System Health
```
GET /api/health
```
Expected: `{"status":"ok","database":"connected"}`

### 2. Verify Match Setup
- Match exists with correct teams, date, venue
- Squad (Playing XI) is set for both teams
- Toss result recorded
- Match officials recorded (umpires, scorer, referee)

### 3. Go Live
- Admin opens `/admin/live-scoring/[matchId]`
- Match status should change to `live`
- Playing XI locks automatically

## During Match — Scoring

### Ball-by-Ball Entry
1. Select **striker** (batsman on strike)
2. Select **non-striker**
3. Select **bowler**
4. Enter result:
   - **Runs**: Click 0, 1, 2, 3, 4, 6
   - **Wide**: Click "Wide" → extras = 1 + any bat runs
   - **No-ball**: Click "No-ball" → extras = 1 + select bat runs (0-6) + optional byes/leg byes
   - **Wicket**: Click wicket type → select batsman out → select bowler/fielder

### Wicket Types Available
| Type | Bowler Credit? | Wicket Count? |
|------|---------------|---------------|
| bowled | Yes | Yes |
| caught | Yes | Yes |
| lbw | Yes | Yes |
| stumped | Yes | Yes |
| run out | No (fielder) | Yes |
| hit wicket | Yes | Yes |
| retired_hurt | No | No (batsman returns) |
| retired_out | No | Yes (batsman out) |

### Undo
- Click **Undo** to reverse the last ball
- Can undo multiple balls
- Stats recalculate automatically

### Extras Summary
| Extra | Added Value |
|-------|-------------|
| Wide | +1 (minimum) + bat runs if any |
| No-ball | +1 + bat runs (0-6) + byes/leg byes if any |
| Byes | +N runs (added to extras) |
| Leg Byes | +N runs (added to extras) |

## Innings Break
- After 4 overs or 10 wickets, innings ends
- System prompts for innings break
- Enter toss decision context if needed
- Start second innings

## Match Completion
- System auto-detects when match is complete:
  - Target chased
  - 4 overs completed
  - 10 wickets lost
- Result generated automatically
- Winner identified automatically
- Man of the Match auto-calculated (Impact Score)
- Points table recalculated
- Season snapshot saved
- Player stats updated

## Super Over (if tied)
1. Match tied → system prompts Super Over
2. Select 3 batsmen and 1 bowler per team
3. Score Super Over ball-by-ball (6 balls, 2 wickets max)
4. If Super Over also tied → another Super Over
5. Unlimited Super Overs until winner

## Post-Match
1. Verify result is correct
2. Verify MOTM is correct
3. Check orange/purple cap standings
4. Verify season snapshot was created
5. Share scorecard if needed

## Emergency: Undo Multiple Balls
If scorer entered wrong data:
1. Use **Undo** button repeatedly
2. Or use **Data Restore** from Admin → Restore
3. Or use **Recalculate** from Admin → Restore

## Emergency: Match Stuck
If live scoring stops responding:
1. Refresh the page
2. Check `/api/health` for database status
3. If database is down, check Neon dashboard
4. If match status is wrong, admin can manually update via Admin → Matches

## Daily Monitoring (Post-Launch)

Use **Admin → System Monitor** (`/admin/system`) for a single-pane view of the whole
platform. It auto-refreshes every 60 seconds and shows:

| Indicator | What to look for |
|-----------|------------------|
| Health banner | `OK` (green) = API + DB connected. `DEGRADED` (amber) = DB unreachable. |
| API Requests | Total analytics events. Spikes = traffic; near-zero = something may be broken. |
| Error Count | Should be `0`. Any entry means investigate via Vercel logs + `AuditLog`. |
| Last Backup | Snapshot timestamp. Should be "just now" after every match. If old, snapshots stopped. |
| Last Restore | Only appears after a manual restore/recalc. Not expected in normal operation. |
| Active Season | Teams/players/matches counts should look sane. |
| Active Match | Live match shown; queue shows live + scheduled + unread notifications. |
| Storage | DB row counts. Check no table grew unexpectedly (e.g., AuditLog ballooning). |
| Analytics Summary | Matches scored/completed should match what you know happened. |

### Daily checklist
1. Open `/admin/system` → verify health is `OK`, errors = 0.
2. Confirm the latest match has a fresh snapshot (Last Backup = "just now").
3. Check `AuditLog` via Admin → Restore/Audit if any restore/error action appears.
4. Spot-check `/api/health` returns `{"status":"ok","database":"connected"}`.
5. Review Neon dashboard (console.neon.tech) for connection/storage usage trend.
6. Check Vercel dashboard → Deployments (build green) and Functions (no 500s/timeouts).

### Weekly
1. Review analytics trends in **Admin → Analytics** (page views, searches, predictions).
2. Verify `DISASTER_RECOVERY.md` steps still match current data model.
3. Confirm the dress rehearsal still passes: `npm run dress:rehearsal` → expect `55/55 checks passed`.
4. If the season is complete, confirm the Season Quiz generated (Admin → Quizzes → Season Quiz) and is playable at `/quiz`.
