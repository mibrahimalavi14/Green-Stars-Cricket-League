# GSCL — VERSION

| Field | Value |
|-------|-------|
| **Current Version** | v1.3.3 |
| **Release Date** | August 2026 |
| **Status** | Production �?" Season 1 |
| **Feature Freeze** | Yes (v1.3.0 exception: quiz timer + email removal, explicitly requested) |
| **Stable Production Tag** | `v1.1.0-season1` (initial production release) |
| **Current Release Tag** | `v1.3.3-season1` (seasons titles leaderboard + season card summary)

## Runtime

| Dependency | Version |
|-----------|---------|
| Node.js | v26.3.1 |
| Next.js | 16.2.9 |
| React | 19.x |
| Prisma | 6.19.3 |
| PostgreSQL | Neon (managed) |
| Zod | 3.x |
| Deployment | Vercel |

## Breaking Changes

| Version | Date | Change |
|---------|------|--------|
| v1.0.1 | Jul 2026 | Initial production release |
| v1.0.2 | Aug 2026 | Dress rehearsal (55 checks), System Monitor dashboard, backup policy scripts, Season 1 feedback template. |
| v1.1.0 | Aug 2026 | **Initial Season 1 production release** — Season Quiz auto-generation (`SeasonQuiz`/`SeasonQuizAttempt` tables, public play UI on `/quiz`, admin generate/review UI, lock/status), **Practice Center** (official/practice workspace isolation, admin Workspace Switcher, Clone Official → Practice, Reset Practice, Copy Setup → Official, Practice Report), workspace-scoped public routes/APIs/records. |
| v1.1.1 | Aug 2026 | **Patch release** — certificate deployment fix. `next/og` certificate route moved off Edge runtime (exceeds 1 MB Vercel edge limit) to a standard serverless function; Satori `display: flex` fix for multi-child divs. No database, scoring, statistics, or UI behavior changed. |
| v1.1.2 | Aug 2026 | **Patch release** — automatic playoff qualification. Dynamic Top 3 / Top 4 qualification based on total teams (`qualifiedTeams = totalTeams <= 5 ? 3 : 4`), Playoff Qualification info card, green/red Qualified/Eliminated row highlighting, dynamic playoff note on Fixtures. No DB schema, scoring engine, statistics, or API changes. |
| v1.1.3 | Aug 2026 | **Patch release** — Live Scoring crash fix. `/live` page crashed with "Something went wrong" (`TypeError: Cannot read properties of null (reading 'team1Players')`) when no live match and no recently completed match existed. Added null-match guard in the match highlights memo. No DB schema, scoring engine, statistics, or API changes. |
| v1.1.4 | Aug 2026 | **Patch release** — format text correction. Removed stale hardcoded "5-over" references that contradicted the actual T4 (4-over) config: fixtures subtitle, About page (4-Over Format card + round-robin wording), FAQ, Match Center, and the scoring guide (Balls Faced max 24, not 30). No DB schema, scoring engine, statistics, or API changes. |
| v1.1.5 | Aug 2026 | **Patch release** — admin auth cookie fix. The `admin_auth` cookie was set with `path=/admin`, so browsers never sent it to `/api/*` requests; every admin client-side API call (`/api/admin/system`, `/api/admin/analytics`, fair-play, moments, quiz, awards, practice, workspace, etc.) returned 401 and the System Monitor / Analytics pages crashed to "Something went wrong". Cookie path is now `/`; admin pages also handle non-2xx responses gracefully instead of crashing. No DB schema, scoring engine, statistics, or API changes. |
| v1.2.0 | Aug 2026 | **Minor feature release (freeze exception, explicitly requested)** — Season Quiz Leaderboard. New `SeasonQuizStanding` table; `/quiz` shows the participant's name during the quiz and an always-visible top-10 leaderboard (auto by score, live positions, top-3 medals, "You" highlight). Non-top-10 players stay hidden unless the admin shows them; admin can also hide anyone in the top 10. Admin `/admin/quiz` gained a Leaderboard Control panel with per-participant Show / Hide / Auto. New admin API `GET/PATCH /api/admin/season-quiz/standings`. |
| v1.2.1 | Aug 2026 | **Patch release** — `/quiz` page now has an always-visible "Your Details" card (name + email) at the top like the prediction page, shared by both the Season Quiz and the Match Quiz, so the inputs appear even when no quizzes exist yet. No DB schema, scoring engine, statistics, or API changes. |
| v1.3.0 | Aug 2026 | **Minor feature release (freeze exception, explicitly requested)** — Quiz timer + email removal. Season Quiz gets a 3-minute countdown: quiz locks automatically when time runs out and the participant's name lands on the leaderboard (server-side time guard too). Email removed from all quiz flows — `QuizAttempt`, `SeasonQuizAttempt`, `SeasonQuizStanding` are now keyed by name; the `/quiz` details card asks only for a name; admin standings control operates on names. |
| v1.3.1 | Aug 2026 | **Patch release** — Season Quiz countdown fix: the timer no longer resets on every answer selection (it now runs on a stable 1-second interval until expiry or submit). No DB schema, scoring engine, statistics, or API changes. |
| v1.3.2 | Aug 2026 | **Patch release** — Mobile header menu scroll fix: opening the hamburger menu now locks the page scroll and the menu scrolls independently instead of the background page scrolling first. No DB schema, scoring engine, statistics, or API changes. |
| v1.3.3 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — `/seasons` page: all-time Titles leaderboard (team → number of titles + which seasons) and a Runner-ups leaderboard, plus a summary line on each season card showing the season date range, season winner, runner-up, and Player of the Tournament (MVP award). No DB schema changes. |

## Versioning Policy (Semantic)

| Version | Purpose |
|---------|---------|
| v1.1.0-season1 | Initial production release (immutable) |
| v1.1.1-season1 | Bug fix #1 — certificate deployment fix |
| v1.1.2-season1 | Patch — automatic playoff qualification rules |
| v1.1.3-season1 | Patch — live scoring crash fix |
| v1.1.4-season1 | Patch — format text correction |
| v1.1.5-season1 | Patch — admin auth cookie fix |
| v1.2.0-season1 | Feature — season quiz leaderboard (freeze exception) |
| v1.2.1-season1 | Patch — always-visible quiz details card |
| v1.3.0-season1 | Feature — season quiz timer + email removal (freeze exception) |
| v1.3.1-season1 | Patch — quiz countdown timer fix |
| v1.3.2-season1 | Patch — mobile header menu scroll fix |
| v1.3.3-season1 | Feature — seasons titles/runner-up leaderboards + season card summary |
| v1.3.4+ | Future bug/security fixes for v1.3.x |
| v2.0.0 | Major Season 2 features |

## v2.0 Backlog (post-Season 1 feedback)

- PWA / Offline Support
- WebSockets / Live Updates
- Image Optimization (WebP/AVIF)
- Error Monitoring (Sentry)
- Season Report PDF
- Social Media Result Image
