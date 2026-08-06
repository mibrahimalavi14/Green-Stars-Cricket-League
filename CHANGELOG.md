# Changelog

## v1.3.3-season1

Added
- `/seasons` page now has an all-time **Titles leaderboard** (each team shown with its number of season titles and the names of the seasons it won) and a **Runner-ups leaderboard** (same view for runner-up finishes), ordered by count. Shown only when at least one season has a winner or runner-up recorded.
- Each season card now shows a summary line at the top: the season date range (first match date – last match date), the season winner, the runner-up, and the Player of the Tournament (from the season's `mvp` award). Teams/Matches counts and the Active badge remain unchanged.

No database schema changes.
No scoring engine changes.
No statistics changes.
No API changes.

## v1.3.2-season1

Fixed
- Mobile header menu scroll issue: when the hamburger (3-line) menu is opened, the page behind no longer scrolls first. Opening the menu now locks the page scroll and the menu itself scrolls independently (`max-h` + `overflow-y-auto`), so the menu items stay reachable without scrolling the background page to its bottom first.

No database schema changes.
No scoring engine changes.
No statistics changes.
No API changes.

## v1.3.1-season1

Fixed
- Season Quiz countdown no longer resets while answering. Previously every answer selection restarted the 1-second timer (the effect re-ran on every answer change), so the countdown could stall for users answering continuously. The timer now runs on a stable 1-second interval until it expires or the quiz is submitted.

No database schema changes.
No scoring engine changes.
No statistics changes.
No API changes.

## v1.3.0-season1

Added
- **Season Quiz now has a 3-minute countdown timer.** The participant clicks "Start Season Quiz", a timer appears, and when time runs out the quiz locks automatically — no further answers can be submitted — and the participant's name lands on the leaderboard via automatic submission of their answers.
- The leaderboard (public `/quiz` and admin `/admin/quiz`) now shows **names + points only**. Email was removed from all quiz flows.

Changed
- Email removed everywhere in the quiz module:
  - `QuizAttempt`, `SeasonQuizAttempt`, `SeasonQuizStanding` tables are now keyed by participant **name** instead of email (no email column anymore).
  - Public `/quiz` "Your Details" card now asks only for a name (shared by the Match Quiz and the Season Quiz).
  - Match Quiz no longer requires an email; name is the identity (first answer per name per quiz wins).
  - Season Quiz leaderboard `uid` is now derived from the name; admin standings control (Show / Hide / Auto) operates on names.
- Season Quiz no longer requires all questions to be answered — you may submit partial answers before the timer ends.
- Server-side time guard: the attempt API rejects submissions received after the 3-minute window (+10s grace), and anchors the clock to the participant's earliest attempt, so refreshing the page doesn't reset the timer.

Database: `QuizAttempt`, `SeasonQuizAttempt`, `SeasonQuizStanding` — email columns removed, unique keys now on name (applied via `prisma db push`). Database was empty (no quiz data), so no data was affected.
No scoring engine changes.
No statistics changes.
No API breaking changes (public endpoints same shape; identity field changed from email to name).

## v1.2.1-season1

Added
- `/quiz` page now shows an **always-visible "Your Details" card** (name + email inputs) at the top, matching the prediction page, so the fields are present even when no quizzes exist yet. The single card is shared by both the Season Quiz and the Match Quiz (name + email no longer duplicated in each quiz section).
- Submitting a Match Quiz still requires an email; name defaults to "Anonymous" when left blank.

No database schema changes.
No scoring engine changes.
No statistics changes.
No API breaking changes.

## v1.2.0-season1

Added
- **Season Quiz Leaderboard** with player names, live positions, and admin control:
  - New `SeasonQuizStanding` table — one row per participant per season for leaderboard visibility control.
  - Public `/quiz` page now shows the participant's name while taking the quiz ("Taking quiz as: …").
  - An always-visible leaderboard card lists the **top 10 players automatically by score**, with medal icons for the top 3 and live positions.
  - Anyone outside the top 10 stays hidden unless the admin manually shows them; the admin can also hide anyone inside the top 10. A "You" highlight marks the current user's own row after submitting.
  - Admin `/admin/quiz` page gained a **Leaderboard Control** panel: full ranked list (position, name, email, score) with Show / Hide / Auto toggle per participant.
  - New admin API `GET/PATCH /api/admin/season-quiz/standings`; public leaderboard endpoint now returns `{ entries, top }` with rank + uid per entry.

Database: adds `SeasonQuizStanding` table (applied via `prisma db push`). No existing table or field changed.
No scoring engine changes.
No statistics changes.
No API breaking changes (public leaderboard shape extended from array to `{ entries, top }` — consumers updated).

## v1.1.5-season1

Fixed
- Admin auth cookie was set with `path=/admin`, so browsers never attached it to `/api/*` requests. Every admin client-side API call (System Monitor, Analytics, fair-play, moments, quiz, awards, practice, workspace, season-lock) returned 401, and the System Monitor / Analytics pages crashed to the "Something went wrong" error page (`Cannot read properties of undefined (reading 'status' / 'matchScored')`).
  - Cookie path is now `/` so admin APIs authenticate correctly.
  - Logout now clears the cookie at both `/` and the legacy `/admin` path.
  - System Monitor and Analytics pages now treat non-2xx API responses as load failures ("Failed to load …") instead of crashing to the error boundary.

No database schema changes.
No scoring engine changes.
No statistics changes.
No API breaking changes.

## v1.1.4-season1

Fixed
- Updated stale hardcoded format text that still referenced the old 5-over format and wrong match counts:
  - Fixtures subtitle now reads "8 teams • 4-over format • Round Robin • 28 league matches".
  - About page now shows "4-Over Format" and describes the round-robin league stage correctly.
  - FAQ "What format does GSCL follow?" now says 4-over per side.
  - Match Center subtitle now says 4-over format.
  - Scoring guide: Balls Faced max is 24 (4 overs), not 30 (5 overs).

No database schema changes.
No scoring engine changes.
No statistics changes.
No API breaking changes.

## v1.1.3-season1

Fixed
- Fixed Live Scoring page crash (`/live`) when no live match and no recently completed match exists (empty database). The page threw `TypeError: Cannot read properties of null (reading 'team1Players')` in the match highlights memo, triggering the "Something went wrong" error page. Added a null-match guard; the page now correctly shows the "No live match at the moment." empty state.

No database schema changes.
No scoring engine changes.
No statistics changes.
No API breaking changes.

## v1.1.2-season1

Added
- Automatic Playoff Qualification based on total teams.
- Dynamic Top 3 / Top 4 qualification rules.
- Playoff Qualification information card.
- Automatic Qualified (green) and Eliminated (red) row highlighting.
- Dynamic playoff note on Fixtures page.

Changed
- Qualification rules now adapt automatically:
  - 4–5 Teams → Top 3 qualify
  - 6+ Teams → Top 4 qualify

No database schema changes.
No scoring engine changes.
No statistics changes.
No API breaking changes.

Final Rule (Official)
- 4–5 Teams — Top 3 qualify. Qualifier 1: Rank #1 vs Rank #2 → Winner → Final, Loser → Eliminator. Eliminator: Rank #3 vs Qualifier 1 Loser → Winner → Final.
- 6 or more Teams — Top 4 qualify. Standard PSL/IPL playoff format: Qualifier 1 (#1 vs #2), Eliminator (#3 vs #4), Qualifier 2, Final.

## v1.1.1-season1

Fixed
- Fixed certificate generation deployment issue caused by Edge Runtime bundle size exceeding Vercel limits.
- Certificate route now runs as a standard serverless function.
- No database, scoring, statistics, or UI behavior changed.

## v1.1.0 (Launch Polish)
- Practice Center: official/practice workspace isolation (Workspace table + Season.workspaceId)
- Admin Workspace Switcher (OFFICIAL / PRACTICE MODE)
- Clone Official → Practice, Reset Practice, Copy Setup → Official (setup-only), Practice Report
- Workspace-scoped public routes, APIs, records, and admin lists
- Season Quiz lock/unlock + status indicator
- Toss edit lock: live matches can no longer change toss result/decision without admin override
- Player jersey numbers + availability status (available/injured/suspended/unavailable)
- Injury tracker: status badges on team page, player page, match Playing XI, admin squad + warning banner
- Match attendance + DLS (rain-rule) flag recorded by admin, shown on match detail with crowd level
- Advanced search: match no., jersey number, captain, umpire, Player-of-the-Match-by-name
- Version info page at /about/version (commit SHA, build info, stack versions, DB health)
- Admin squad warnings for unavailable players in Playing XI

## v1.0.1 (T4 Edition)
- Migrated from T10 to T4 format (4 overs per innings)
- Added centralized MATCH_CONFIG (config-driven format, bowling, points)
- Derived totalBalls, config validation
- Added transaction safety (prisma.$transaction)
- Added audit logs (AuditLog model + API)
- Added 39 automated regression tests
- Security hardening (admin auth, proxy middleware)
- Bowling limit: 1 over per bowler
- NRR, remaining balls, points all config-driven
- Shared formatOvers utility (deduplicated)
- Build: zero errors, all tests passing

## v1.0.0
- Season 1 initial stable release
- Ball-by-ball live scoring
- Tournament brackets, points table, head-to-head
- Player stats, awards, dream team
- Wagon wheel, field diagram
- Admin panel with full CRUD
- Notifications, predictions, quiz
- Deployed to Vercel + Neon
