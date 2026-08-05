# GSCL — Complete Website & Formulas Documentation

**Version:** v1.1.1-season1 · **Project:** Green Stars Cricket League (GSCL)
**Status:** Production — Season 1 · Feature freeze in effect

This document is the single reference for the **entire website** — every public page,
every admin page, every API, and **every formula** used for scoring, stats, awards,
records, quizzes and analytics.

---

## 1. Overview

GSCL is a cricket league web application for a **T4 format** (4-over) tournament. It
provides:

- **Public website** — live scoring view, fixtures, results, points table, player/team
  stats, records, awards, certificates, quizzes, predictions, polls (POTM), gallery,
  news, notifications, reviews and more.
- **Admin panel** — protected by a single admin password; manages the whole league:
  seasons, teams, players, matches, ball-by-ball live scoring, awards, penalties,
  fair play, quiz generation, practice center, system monitor and data restore.
- **Practice Center** — an isolated training workspace cloned from official data where
  scorers can practice scoring without touching official records.

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) — server components + route handlers |
| Language | TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Validation | Zod |
| Styling | Tailwind CSS |
| Deployment | Vercel (serverless functions) |
| Certificates | `next/og` ImageResponse as a **serverless function** (v1.1.1 fix) |
| Push notifications | Web Push (VAPID) + service worker |
| OTP / auth | Email OTP (predictions), single admin password cookie, NextAuth |
| Auth session | JWT cookies for admin |

## 3. Match Format & Core Rules (T4)

Config source of truth: `src/lib/config.ts` (`MATCH_CONFIG`).

| Rule | Value |
|------|-------|
| Overs per innings | 4 |
| Balls per over | 6 |
| Legal balls per innings (`totalBalls`) | 24 |
| Wickets per innings | 10 |
| Max overs per bowler | 1 (6 balls) |
| Super Over balls | 6 |
| Super Over wickets | 2 |
| Points: win / tie / no-result | 2 / 1 / 1 |

**GSCL-specific rules (PSL-style):**

1. **Super Over breaks ALL ties** — league, knockout and final. No match ends tied.
   If the Super Over itself is tied, another Super Over is played until a winner emerges.
2. **Auto-completion** — a match ends automatically when ANY of these occur:
   - all 4 overs (24 legal balls) completed, or
   - 10 wickets lost (all out), or
   - target achieved (2nd innings total > 1st innings total).
   The admin does not need to manually write the result or pick a winner.
3. **Bowling limit** — max 1 over (6 balls) per bowler per innings.
4. **All-out NRR** — ICC standard: a team that is bowled out is charged the full
   24 balls, otherwise actual balls are used.
5. **Two MOTM awards** — Official Man of the Match (automatic via Impact Score) and
   Fan Favourite (public POTM voting).

**Match stages:** `league`, `qualifier1`, `eliminator`, `qualifier2`, `final`.

### 3.1 Playoff Qualification (official rule)

```
qualifiedTeams = totalTeams <= 5 ? 3 : 4
```

- **5 or fewer teams** → Top 3 qualify:
  - Qualifier 1: #1 vs #2 → Winner → **Final**; Loser → Eliminator
  - Eliminator: #3 vs Qualifier 1 Loser → Winner → **Final**
  - Final: Qualifier 1 Winner vs Eliminator Winner
- **6 or more teams** → Top 4 qualify:
  - Qualifier 1: #1 vs #2 → Winner → **Final**; Loser → Qualifier 2
  - Eliminator: #3 vs #4 → Winner → Qualifier 2
  - Qualifier 2: Qualifier 1 Loser vs Eliminator Winner → Winner → **Final**
  - Final: Qualifier 1 Winner vs Qualifier 2 Winner

**Points Table UI:** rows are colored automatically — Qualified teams get a green
left border + light green background + `🏆 Qualified` badge; Eliminated teams get a
red left border + light red background + `❌ Eliminated` badge. A **🏆 Playoff
Qualification** card below the table shows the top-N rule and the full playoff format.


---

## 4. Formula Reference (Master)

> Single source of truth: `src/lib/config.ts`, `src/lib/stats.ts`, `src/lib/utils.ts`,
> `src/lib/season-awards.ts`, `src/lib/fair-play.ts`, `src/lib/records.ts`,
> `src/lib/partnerships.ts`, `src/lib/season-quiz.ts`, `src/lib/practice.ts`.
> All formulas below mirror the code exactly.

### 4.1 Innings Total

```
Innings total = batsman runs + extras
extras = wides + no-balls + byes + leg-byes
```

Every innings stores `runs`, `wickets`, `balls`, `extras`.

### 4.2 Match Complete (auto-detected)

Let `t1 = team1.runs + team1.extras`, `t2 = team2.runs + team2.extras`. The match is
complete when **ANY** of:
1. `innings2.balls >= 24`, or
2. `innings2.wickets >= 10`, or
3. `t2 > t1` (target chased).

Ball counts use **legal deliveries only** — wides and no-balls do not consume a ball.

### 4.3 Result

- `t1 > t2` → **"Team1 won by X runs"**, `X = t1 − t2`
- `t2 > t1` → **"Team2 won by X wickets"**, `X = 10 − wicketsLost(team2)`
- `t1 = t2` → **Tied** → Super Over decides the winner

### 4.4 Super Over

- Triggered when both innings totals are equal.
- Each team bats 1 over (6 balls), max 2 wickets.
- Higher Super Over score wins; tied Super Over → repeat, **unlimited** until a winner.
- Winner gets the win in the points table (not a tie).

### 4.5 Points Table

```
Base points  = Wins × 2 + Ties × 1 + No-Results × 1
Final points = max(0, basePoints − Σ leaguePenalty.points)
```

| Result | Points |
|--------|--------|
| Win | 2 |
| Tie (Super Over win counts as a win = 2) | 1 |
| No Result / Abandoned | 1 |
| Loss | 0 |

**Sorting:** `points desc`, tie-break `NRR desc`.

### 4.6 Net Run Rate (NRR)

```
NRR = (runsFor / oversFor) − (runsAgainst / oversAgainst)
overs = balls / 6
```

- **All-out rule (ICC):** if a team is all out, `oversFor = 24 / 6 = 4` regardless of
  actual balls faced; otherwise actual balls are used. Same for `oversAgainst`.
- Runs always include extras.
- If only one side has overs, NRR = that side's rate; otherwise 0.
- Displayed to 3 decimal places.

### 4.7 Batting Stats (per player, season aggregate)

| Stat | Formula |
|------|---------|
| Matches / Innings | count of player matches |
| Runs | Σ batting runs |
| Balls faced | Σ legal balls faced |
| Average | `runs / dismissals` (dash if 0 dismissals) |
| Strike Rate | `(runs / ballsFaced) × 100` (2 dp) |
| Highest Score | max single-innings runs; not-out innings preferred on tie |
| Fifties | innings with `50 ≤ runs < 100` |
| Hundreds | innings with `runs ≥ 100` |
| Not Outs | innings with `ballsFaced > 0` and not out |
| Ducks | innings with `runs = 0` and out |
| Fours / Sixes | Σ per-match fours / sixes |
| Threes, Dot balls, Maidens | Σ per-match values |
| Dismissal types | Σ (bowled, caught, lbw, stumped, run-out) |

### 4.8 Bowling Stats

| Stat | Formula |
|------|---------|
| Economy | `runsConceded / (ballsBowled / 6)` (2 dp) |
| Bowling Average | `runsConceded / wickets` |
| Bowling Strike Rate | `ballsBowled / wickets` (1 dp) |
| Best Bowling | max wickets → fewer runs → fewer balls |
| 4-for | innings with `wickets ≥ 4` |
| 5-for | innings with `wickets ≥ 5` |
| Hat-tricks, Wides, No-balls | Σ per-match values |

### 4.9 Fielding Stats

| Stat | Formula |
|------|---------|
| Catches / Run-outs / Stumpings | Σ per-match values |

### 4.10 Man of the Match — Impact Score (automatic)

```
Impact Score = Runs × 0.4 + Wickets × 8 + Catches × 5 + Run-Outs × 5 + Stumpings × 5
```

Highest score wins. **Tie-breakers** (in order): more wickets → more runs → higher
strike rate → more catches. Admin override only if all tie-breakers are equal.

### 4.11 Season Awards (auto-generated from completed matches)

Helper: `SR = runs/balls × 100`; `Econ = runsConceded / (ballsBowled/6)`.
Half-season boundary = `totalMatches / 2` by `matchNo`.

| Category | Rule |
|----------|------|
| Champion | `season.winnerId`, else points table rank 1 |
| Runner-up | `season.runnerUpId`, else points table rank 2 |
| Orange Cap | max runs (tie-break: fewer balls); requires `runs > 0` |
| Purple Cap | max wickets (tie-break: fewer runs conceded); requires `wickets > 0` |
| MVP | `impact = runs + wickets×20 + catches×10 + runOuts×10 + stumpings×10`; min 3 innings |
| Best Batter | `runs ≥ 50` (season minimum); highest SR |
| Best Bowler | `ballsBowled ≥ 36` (6 overs minimum); lowest economy |
| Best Fielder | `score = catches×2 + stumpings×3 + runOuts`; highest (score > 0) |
| Most Improved | `innings ≥ 4`, second-half > first-half, delta ≥ 20 impact points |
| Fair Play | highest fair-play points team |
| Emerging Player | **manual only** — no auto-generation logic |

Auto-generation triggers only when: no champion award exists yet AND total matches > 0
AND all matches completed. Auto-fill also sets `winnerId`/`runnerUpId` when not set.

### 4.12 Fair Play Points

```
FairPlay = max(0, 100 − warnings×5 − slowOverRate×10 − behavior×15 − penaltyPoints + sportsmanship×2)
```

- `slowOverRate` = count of penalties of type `over_rate` for the team.
- `penaltyPoints` = Σ all penalty points for the team.
- Default `sportsmanship = 10`.
- Sort: `fairPlayPoints desc`, tie-break `sportsmanship desc`.

### 4.13 Records (auto-computed, official workspace only)

**Team records:** highest team score, lowest team score (min 12 balls), biggest win by
runs, biggest win by wickets (`10 − chasing wickets`), highest successful chase,
lowest successful defence, fastest team 50, highest partnership, most consecutive
wins / losses (streaks reset on no-result).

**Player records:** fastest 20/30/fifty/century (fewest legal balls), most fours/sixes
in an innings, most runs in a match, best bowling, and season tops: sixes, POTM,
catches, run-outs, stumpings, dot balls.

Fastest milestones are computed from ball-by-ball data when available, with a
`ballsFaced` fallback for older matches.

### 4.14 Partnerships

- Legal delivery = not wide and not no-ball.
- Partnership runs = `ball.runs + byes + legByes`; balls count only on legal deliveries.
- Strike swaps after every odd-scoring ball (including byes/leg-byes).
- On a wicket, the partnership closes and a new one starts with the surviving batter.
- Tracks `highest`, `byWicket`, and the running `current` partnership.

### 4.15 Match Timeline

Ordered event stream per match: **toss → innings start → over labels (legal balls
only) → fifties/centuries → sixes → wickets (bowled/caught/lbw/stumped/run-out/hit
wicket/retired) → innings break → Super Over → result → MOTM**.

Wicket dismissal text formats: `b {bowler}`, `c {fielder} b {bowler}`,
`lbw b {bowler}`, `st {fielder} b {bowler}`, `run out ({fielder||bowler})`,
`hit wicket b {bowler}`, literal for `retired_hurt`/`retired_out`.

### 4.16 Quizzes (match quiz + season quiz)

**Season quiz generation** (up to 40 questions, 10 points each): facts are computed
from season data — champion, runner-up, highest/lowest team totals, biggest wins,
fastest fifty, top run/bowl scorers, POTM counts, Super Over matches, streaks.
Distractors are generated with fixed offsets (e.g. `n−1, n+1, n+2, n−2`) filtered to
non-negative values. Regeneration deletes prior questions/attempts.

**Attempt scoring:** `correct = selectedAnswer === question.correctAnswer`; each
correct answer scores the question's point value (default 10). Leaderboard = Σ score
per email. Lock/unlock blocks submissions.

### 4.17 Practice Center Accuracy

```
Scoring accuracy = max(0, min(100, round((1 − undoCount / totalBalls) × 100))))
```

- `undoCount` = analytics events `undo_used` on practice innings.
- `totalBalls` = legal balls in completed practice innings.
- Accuracy = 100 when no balls yet.
- Practice data **never** feeds official stats, records, awards or snapshots.
- **Promote** copies setup only (teams, XI, captain/VC, officials, venue, toss) —
  no runs or stats.

### 4.18 Analytics Events

Tracked events: `match_scored`, `match_completed`, `undo_used`, `page_view`,
`search_query`, `prediction_submitted`, `quiz_attempted`, `potm_vote`,
`notification_sent`, `feature_feedback`. Available as all-time totals, 30-day buckets,
top metadata values, and a recent-events feed.

---

## 5. Public Website — Every Page

### Home & Info

| Route | What it does |
|-------|--------------|
| `/` | Home dashboard: active-season team cards, upcoming matches (6), latest news (3), past champions, match/player counts, YouTube, match countdown, reviews + submit form (pending approval), sponsors |
| `/about` | GSCL story, chairman photo (Muhammad Ibrahim Alavi), mission stats |
| `/about/version` | System info: app version, Next/Prisma/Zod versions, git commit + date, PostgreSQL version, DB health |
| `/faq` | Accordion of static GSCL Q&As |
| `/contact` | Contact form (name, email, subject, message) → `/api/contact` |
| `/guide` | 13-section usage guide (access, setup, pages, matchday, scoring, extras, wickets, end match, after match, analytics, API, env, troubleshooting) |
| `/standings` | Redirect to `/points-table` |
| `/notifications` | In-app notifications list with mark-as-read |

### Cricket Data

| Route | What it does |
|-------|--------------|
| `/seasons` | Grid of all seasons with team/match counts, Active badge |
| `/seasons/[id]` | Season detail: standings, match list with scores, per-player season stats, champion/runner-up |
| `/seasons/[id]/snapshots` | Match-by-match snapshots: points table, orange/purple cap, records |
| `/points-table` | Active season standings + fair-play table (live computed) |
| `/records` | Team + player record groups (top 5/10), workspace-scoped |
| `/awards` | Season awards in ceremony order + downloadable certificates |
| `/hall-of-fame` | Champion seasons list, active season highlighted |

### Matches

| Route | What it does |
|-------|--------------|
| `/matches` | Match Center: Live / Upcoming / Completed tabs with counts |
| `/matches/[id]` | Full scorecard: innings, partnerships, timeline, over-by-over, worm chart, H2H, share buttons, shareable scorecard image, YouTube embed, match notes |
| `/matches/potm` | Last 20 completed matches linking to voting pages |
| `/matches/[id]/potm` | Fan-vote page: player cards with live vote counts, voter name/email form |
| `/live` | Live match (LiveScoreClient) or most recent completed match + upcoming |
| `/fixtures` | Live/completed/upcoming grouped by date, venue links, 30s auto-refresh |
| `/head-to-head` | Team pickers, match list, wins/losses, highest scores |

### Teams & Players

| Route | What it does |
|-------|--------------|
| `/teams` | Team cards with logo, player count, top performer; 30s auto-refresh |
| `/teams/stats` | Per-team W/L/Tie, runs/wickets, top batter/bowler, win rate |
| `/teams/[id]` | Squad, captain/VC, honors, captaincy history, form, match history, venue stats |
| `/players` | All players by runs desc with team filter; 30s auto-refresh |
| `/players/stats` | Batting / bowling / all-rounder tables with CSV download |
| `/players/[id]` | Badges, All-Time/Current/Per-Season stat tabs, Form Guide, Match Log, Transfer History, Career Milestones |

### Analytics

| Route | What it does |
|-------|--------------|
| `/performers` | Batting / bowling / fielding leaderboards |
| `/field-analysis` | Field diagram heatmap (runs/wickets/SR views), regional stats |
| `/toss-analysis` | Toss winners, bat-first vs chase analysis |
| `/compare` | Player-vs-player comparator + radar chart |
| `/venues` | Per-venue stats: matches, highest/lowest, innings averages, toss impact |
| `/potm-gallery` | Completed matches with MOTM + all-time POTM leaderboard |

### Participation

| Route | What it does |
|-------|--------------|
| `/predictions` | Email + OTP sign-in, predict champion, live vote counts, confetti |
| `/quiz` | Per-match quizzes + season quiz, email/name gate, leaderboard |

### Content

| Route | What it does |
|-------|--------------|
| `/news` | Published news grid |
| `/news/[id]` | Full article |
| `/gallery` | Masonry photo grid + lightbox |
| `/dream-team` | Best XI (1 WK, 4 bats, 2 AR, 4 bowlers) computed from season stats |

### Image Generators

| Route | What it does |
|-------|--------------|
| `/awards/certificate/[seasonId]/[category]` | PNG certificate for all 11 award categories (serverless function, v1.1.1) |
| `/og` | Social/OG image generator |

### System Pages

- `/` 404 → `src/app/not-found.tsx` (global "Page Not Found" + Go Home)
- Error boundary → `src/app/error.tsx` (Try Again reset)

---

## 6. Admin Website — Every Page

All admin pages require the admin login (single password). Workspace scoping applies
throughout (Official vs Practice).

| Route | What it does |
|-------|--------------|
| `/admin` | Dashboard hub: live counts (teams, players, matches, news, contacts) + quick add |
| `/admin/analytics` | Usage analytics: all-time totals, 30-day charts, top searches/pages, recent events |
| `/admin/awards` | Assign/delete awards per season; **Auto-generate awards** from match data |
| `/admin/captaincy` | Set captain + vice-captain per season/team |
| `/admin/contact` | Read-only visitor contact messages (Asia/Karachi timestamps) |
| `/admin/fair-play` | Edit warnings, behavior, sportsmanship per team; auto over-rate/penalty; change history |
| `/admin/gallery` | Add/delete public gallery images |
| `/admin/honors` | Team honors registry (Championship, Runner-up, Fair Play, Best Fielding, Most Improved) |
| `/admin/live-scoring/[id]` | **Ball-by-ball scorer**: bowler/striker/non-striker, runs 0-6, extras (wide, no-ball, bye, leg-bye), all wicket types, field regions + diagram, strike rotation, innings break, **Override Toss**, **Undo Last Ball**, **End Match** (auto performances + MOTM), **Super Over** scoring (repeat on tie), CRR/RRR/win-probability, custom highlights |
| `/admin/match-notes` | Per-match notes: weather, temperature, pitch, ground, delays, injuries, subs, fines, referee notes |
| `/admin/matches` | Fixture manager: create/edit/delete matches, Set Live, Abandon (→ No Result), officials panel, CSV export |
| `/admin/moments` | Moment of the Day: create/activate/deactivate/delete |
| `/admin/news` | News + Schedule articles, publish immediately |
| `/admin/notifications` | In-app notifications + web-push subscribe admin |
| `/admin/penalties` | League penalties (over-rate, fine, points deduction, forfeit); auto-applied to points table |
| `/admin/performances` | Completed match scorecards; **Generate Stats** (sync + mark completed); partnerships |
| `/admin/players` | Player management by team; Edit / Reset Stats / Delete; CSV export |
| `/admin/potm` | Vote counts per match + **Set Official MOTM** |
| `/admin/practice` | **Practice Center**: workspace switcher, Clone Official → Practice, Reset Practice, Practice Report (accuracy %), **Promote** completed practice match to official |
| `/admin/predictions` | Read-only champion predictions breakdown |
| `/admin/quiz` | Match quiz CRUD + leaderboard; **Generate Season Quiz** (30–40 auto questions), Lock/Unlock |
| `/admin/restore` | **Recalculate All Seasons / Recalculate Season / Restore Match Stats** |
| `/admin/reviews` | Review moderation: approve/unapprove/delete |
| `/admin/seasons` | Create seasons; **Lock/Unlock Predictions**, **Lock/Unlock Season** (audit-logged) |
| `/admin/sponsors` | Homepage sponsors (tier: platinum/gold/silver) |
| `/admin/squad` | Playing XI per match (XI/Substitute/Reserve); unavailable-player warning |
| `/admin/system` | System monitor: health banner (version, commit, DB), metrics, DB row counts, analytics, errors, audit activity |
| `/admin/teams` | Team CRUD (name, short name ≤5, color, season) |
| `/admin/transfers` | Player transfers across seasons; auto-moves player to new team |

---

## 7. API Reference

### 7.1 Public APIs

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/health` | GET | Status, DB connection, version, commit, config |
| `/api/seasons` | GET, POST, PATCH | List/create/update seasons (workspace-scoped) |
| `/api/teams` | GET, POST, DELETE | List/create/delete teams |
| `/api/players` | GET, POST, PATCH, DELETE | List/create/update/delete players |
| `/api/matches` | GET, POST, PATCH, DELETE | List/create/update/delete matches |
| `/api/matches/count` | GET | Match counts |
| `/api/matches/live` | GET | Live match list |
| `/api/matches/notes` | GET, POST | Match notes |
| `/api/matches/abandon` | POST | Abandon match → No Result |
| `/api/innings` | POST | Create innings |
| `/api/live/balls` | POST | Submit a scored ball |
| `/api/live/balls/undo` | POST | Undo last ball |
| `/api/live/innings-break` | PATCH | Mark innings break |
| `/api/live/complete-match` | POST | Complete match + auto stats |
| `/api/live/summary` | GET | Live match summary |
| `/api/live/sync-stats` | POST | Re-sync stats for a match |
| `/api/records` | GET | League records |
| `/api/awards` | GET, POST, DELETE | Awards |
| `/api/performers` | GET | Batting/bowling/fielding leaderboards |
| `/api/performances` | POST | Match performances |
| `/api/fair-play` | GET | Fair-play table |
| `/api/penalties` | GET, POST, DELETE | Penalties |
| `/api/captaincy` | GET, POST, DELETE | Captain/vice-captain records |
| `/api/honors` | GET, POST, DELETE | Team honors |
| `/api/transfers` | GET, POST, DELETE | Player transfers |
| `/api/squad` | GET, POST, DELETE | Playing XI |
| `/api/snapshots` | GET | Season snapshots |
| `/api/hall-of-fame` | GET | Champion seasons |
| `/api/head-to-head` | GET | Team head-to-head |
| `/api/compare` | GET | Player comparison data |
| `/api/field-analysis` | GET | Field analysis heatmap |
| `/api/search` | GET | Global search |
| `/api/export` | GET | Data export |
| `/api/export/players` | GET | Players CSV |
| `/api/export/matches` | GET | Matches CSV |
| `/api/footer-stats` | GET | Footer stat snippets |
| `/api/contact` | GET, POST | Contact messages |
| `/api/reviews` | GET, POST | Reviews (POST requires approval) |
| `/api/reviews/[id]` | PATCH, DELETE | Review moderation |
| `/api/ratings` | GET, POST | Ratings |
| `/api/news` | GET, POST | News |
| `/api/gallery` | GET, POST, DELETE | Gallery |
| `/api/moment` | GET, POST | Moment of the day |
| `/api/sponsors` | GET, POST, DELETE | Sponsors |
| `/api/notifications` | GET, POST | Notifications |
| `/api/notifications/[id]` | PATCH, DELETE | Mark read / delete |
| `/api/notifications/subscribe` | POST | Web-push subscribe |
| `/api/notifications/unsubscribe` | POST | Web-push unsubscribe |
| `/api/notifications/subscribe-count` | GET | Subscriber count |
| `/api/notifications/vapid-public-key` | GET | VAPID public key |
| `/api/notifications/send` | POST | Send push |
| `/api/potm` | GET, POST | POTM voting |
| `/api/predictions` | GET, POST | Champion predictions |
| `/api/predictions/send-otp` | POST | Email OTP send |
| `/api/predictions/verify-otp` | POST | Email OTP verify |
| `/api/quiz` | GET, POST, DELETE | Match quizzes |
| `/api/quiz/attempt` | POST | Submit quiz attempt |
| `/api/quiz/leaderboard` | GET | Quiz leaderboard |
| `/api/quiz/my-score` | GET | My quiz score |
| `/api/season-quiz` | GET | Season quiz |
| `/api/season-quiz/attempt` | POST | Submit season quiz attempt |
| `/api/season-quiz/leaderboard` | GET | Season quiz leaderboard |

### 7.2 Admin APIs (password protected)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/auth` | POST, DELETE | Admin login / logout (cookie) |
| `/api/admin/system` | GET | System health + metrics |
| `/api/admin/analytics` | GET | Usage analytics |
| `/api/admin/audit` | GET | Audit log |
| `/api/admin/awards/generate` | POST | Auto-generate season awards |
| `/api/admin/fair-play` | PATCH | Update fair-play records |
| `/api/admin/season-lock` | PATCH | Lock/unlock season (audit-logged) |
| `/api/admin/recalculate` | POST | Recalculate all / one season |
| `/api/admin/season-quiz` | GET, POST, PATCH | Generate / lock season quiz |
| `/api/admin/workspace` | POST | Switch workspace (Official/Practice) |
| `/api/admin/practice/clone` | POST | Clone Official → Practice |
| `/api/admin/practice/reset` | POST | Reset practice data |
| `/api/admin/practice/promote` | POST | Promote practice match → official |
| `/api/admin/practice/report` | GET | Practice report + accuracy |
| `/api/admin/moment` | PATCH, DELETE | Moment of the day admin |
| `/api/admin/moment/list` | GET | Moment list |

Auth route: `/api/auth/[...nextauth]` (GET, POST) — NextAuth handlers.

---

## 8. Key Workflows

### 8.1 Live Scoring (ball-by-ball)

1. Create season → teams → players → match (`/admin/matches`, then **Set Live**).
2. Set Playing XI (`/admin/squad`).
3. Open `/admin/live-scoring/[id]`: set toss, then score each ball:
   - runs 0/1/2/3/4/6, extras (wide, no-ball, bye, leg-bye, no-ball+byes),
   - wicket types (bowled, caught, lbw, stumped, run-out, hit wicket, retired, obstructing),
   - field region picker + live field diagram,
   - auto strike rotation (odd runs/bye/leg-bye swap striker; wicket ends partnership).
4. Bowler restrictions: max 1 over (6 balls) — previous-over and max-over bowlers blocked.
5. Innings break → 2nd innings → target shown → auto-complete detection.
6. **Undo Last Ball** re-syncs all stats (logged as `undo_used`).
7. **End Match** auto-computes player performances + MOTM Impact Score, writes the
   result and winner, marks the match completed.
8. Tied scores → **Super Over** scoring (repeat Super Overs until a winner).

### 8.2 Completion Cascade (automatic)

```
Match Complete → Winner/Result → Super Over (if tied) → Points Table → Player Stats
→ Team Stats → Awards → Records → Hall of Fame → Dream Team → MOTM (auto)
→ Analytics → Audit → Notification
```

### 8.3 Season Lifecycle

1. **Create** season (`/admin/seasons`).
2. **Lock Predictions** (announce schedule) when the schedule is ready.
3. Play the league + playoffs (knockout stages: Q1, Eliminator, Q2, Final).
4. **Generate Stats / End Match** after each match; stats, points table, snapshots,
   records and awards auto-update.
5. **Auto-generate awards** once all matches are completed.
6. **Lock Season** (audit-logged reason) to freeze scoring/edits.
7. Snapshots saved at each match milestone → viewable on `/seasons/[id]/snapshots`.

### 8.4 Practice Center

1. **Clone Official → Practice** — copies teams, players, jerseys, roles, captains
   into the isolated `practice` workspace (new season named "*Source* Practice").
2. Switch workspace (`/admin/practice`) → score practice matches freely.
3. **Practice Report** — matches, runs, balls, extras, undo count, **scoring accuracy %**, time.
4. **Reset Practice Data** — wipes all practice matches/stats/awards/records/snapshots
   (keeps teams/players/season).
5. **Promote** a completed practice match to official — copies setup only
   (teams, XI, captain/VC, officials, venue, toss). No stats.

### 8.5 Restore / Recalculate

`/admin/restore` rebuilds points tables (W/L/T/NR, points, NRR), player stats, season
snapshots, and league records. Use after manual data fixes.

---

## 9. Participation & Engagement

| Feature | Flow |
|---------|------|
| **Predictions** | Email + 6-digit OTP → pick predicted champion → live counts (1 prediction/hr/IP) |
| **Match Quiz** | Pick answer per question, name/email gate, leaderboard (1 attempt/hr/IP) |
| **Season Quiz** | Up to 40 auto questions (10 pts each), lockable, leaderboard |
| **POTM voting** | Vote for Fan Favourite on `/matches/[id]/potm` (3 votes/hr/IP) |
| **Reviews** | 5-star + comment on homepage; requires moderation approval (3/day/IP) |
| **Contact** | `/contact` form (5/day/IP) |
| **Notifications** | In-app + web push (VAPID); mark-read; subscribe/unsubscribe |
| **Ratings** | 1–5 ratings (5/day/IP) |

---

## 10. Security & Validation

### 10.1 Rate Limits (in-memory, keyed by IP)

| Key | Window | Max |
|-----|--------|-----|
| OTP_SEND | 5 min | 3 |
| OTP_VERIFY | 15 min | 5 |
| POTM_VOTE | 60 min | 3 |
| PREDICTION | 60 min | 1 |
| QUIZ_ATTEMPT | 60 min | 1 |
| CONTACT | 24 h | 5 |
| REVIEW | 24 h | 3 |
| BALL_SUBMIT | 1 min | 120 |
| RATING | 24 h | 5 |
| SQUAD | 1 min | 30 |
| GENERAL_WRITE | 1 min | 60 |

IP detection: `x-forwarded-for` → `x-real-ip` → `unknown`.

### 10.2 Key Validation Rules (Zod)

- **Ball event:** `runs` 0–6, byes/leg-byes 0–6, bowler/striker/nonStriker required.
- **Match:** valid season/team IDs, stage 1–50, status `upcoming|live|completed|super_over`,
  `tossDecision ∈ bat|bowl|""`, result ≤500 chars, officials ≤100, DLS flag.
- **Team:** name 1–100, shortName 1–10, coach/captain ≤100, homeVenue ≤200.
- **Player:** name 1–100, role 1–50, jerseyNumber 0–999, status
  `available|injured|suspended|unavailable`.
- **Season:** name 1–100, year 2020–2100.
- **Award category enum:** champion, runner_up, orange_cap, purple_cap, mvp,
  best_batter, best_bowler, best_fielder, most_improved, emerging_player, fair_play.
- **Penalty type:** over_rate, fine, points_deduction, forfeit (points 0–1000).
- **Abandon reason:** rain, bad_light, ground_issue, walkover, technical_issue.
- **News content ≤10,000; notification body ≤500; moment caption ≤500;**
  contact message 1–2000; OTP exactly 6 chars.

---

## 11. Versioning & Releases

| Version | Meaning |
|---------|---------|
| `v1.1.0-season1` | **Initial Season 1 release (immutable)** |
| `v1.1.1-season1` | **Patch:** certificate deployment fix (edge → serverless) |
| `v1.1.2+` | Future bug/security/performance fixes only |
| `v2.0.0` | Season 2 / major features |

**Feature freeze:** no new features during Season 1. Bugs → `v1.1.x` patches.
Deployment is tag-driven; release notes in `CHANGELOG.md`, state in `VERSION.md`,
runbook in `RUNBOOK.md`, formulas in `FORMULAS.md` (kept in sync with `MATCH_CONFIG`).

---

*Generated from source. Keep in sync with `src/lib/config.ts` — the single source of
truth for all match rules.*
