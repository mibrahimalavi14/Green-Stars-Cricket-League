# GSCL — VERSION

| Field | Value |
|-------|-------|
| **Current Version** | v1.3.35 |
| **Release Date** | August 2026 |
| **Status** | Production — Season 1 |
| **Feature Freeze** | Yes (v1.3.0+ exceptions, explicitly requested) |
| **Stable Production Tag** | `v1.1.0-season1` (initial production release) |
| **Current Release Tag** | `v1.3.35-season1` (RPB stat added to performers, player stats, player profiles & compare) |

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
| v1.3.4 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — Admin show/hide control for the all-time Titles/Runner-ups leaderboards: new `titlesLeaderboardVisible` flag on the `Workspace` model (default `true`), admin toggle on `/admin/seasons`, new `GET/PATCH /api/admin/leaderboard-visibility`. DB schema change: new column on `Workspace`. |
| v1.3.6 | Aug 2026 | **Performance & Mobile optimization release (freeze exception, explicitly requested)** — non-feature-only: lazy-loaded heavy components via `next/dynamic` + skeletons, `loading.tsx` skeletons for major routes, DB query optimization (scoped APIs to official workspace, `Promise.all` batching, `select` projections, removed dead queries), debounced search (300ms), responsive grids/dialogs/touch targets (44px) for mobile, optimized logo/banner WebP assets, unused lucide imports removed, `AGENTS.md` future-proof engineering standards. No DB schema, scoring engine, statistics, feature, or UI behavior changes. |
| v1.3.7 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — One-email-one-vote across all public voting. Match Quiz and Season Quiz now require an email; `QuizAttempt` and `SeasonQuizAttempt` are keyed by email (one attempt per email per quiz), matching the already-shipped POTM and Player of the Season rules. Public `/quiz` details card now has a name + email input (persisted to localStorage), season quiz shows "already attempted" state on reload, leaderboards de-dupe by email, and the match-quiz leaderboard no longer leaks emails. DB schema change: `email` column + unique `[quizId, email]` / `[seasonQuizId, email]` on the quiz attempt tables (tables were empty; applied via `prisma db push`). |
| v1.3.5 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — Player of the Season public voting. New `PlayerOfSeasonVote` table (unique `[seasonId, email]`), `GET/POST /api/player-of-season` (nominees = top performers of the season by impact with live vote counts, email-keyed user vote, rate-limited), public `/player-of-season` page (season selector, nominee cards, vote modal), admin `/admin/player-of-season` page (per-season vote breakdowns + announce winner → writes a `player_of_season` `SeasonAward`), header links on public + admin nav, new award category wired through awards pages/certificates. DB schema change: new `PlayerOfSeasonVote` table. |
| v1.3.8 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — OTP email verification + reCAPTCHA on all public voting. Every vote/quiz submission (POTM, Player of the Season, Match Quiz, Season Quiz) now requires a 6-digit one-time passcode emailed to the voter's address, proven by a short-lived server-signed `verifiedToken` (30-min HMAC) on the submission itself, plus a Google reCAPTCHA v2 challenge on OTP send. New `GET`-less `POST /api/vote/send-otp` + `POST /api/vote/verify-otp`, shared `VoteVerification` component, and a shared `sendOtpEmail` mailer (predictions OTP route refactored onto it). No DB schema or scoring engine changes. |
| v1.3.9 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — Auto-ranked POTM candidates. Completed-match players are now sorted by a performance score (runs + wickets×20 + catches/stumpings/run-outs×10 + strike-rate bonus) so the best performers appear first, the top performer gets a "Top performance" badge, zero-contribution players (no runs, no balls bowled, no fielding) are hidden from the voting list, and the batting chip shows strike rate. POS already auto-ranks by votes + impact and is unchanged. No DB schema or scoring engine changes. |
| v1.3.10 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — Automatic push notifications. Notifications now send themselves on key events — match completion (result + link to POTM voting), the auto-generated Season Quiz going live, and news publishing — instead of only via the manual admin broadcast. New shared `sendPushNotification` helper (`src/lib/push.ts`); the admin "Send to All Subscribers" panel was refactored onto it (still admin-only). No DB schema or scoring engine changes. |
| v1.3.11 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — In-site notification permission prompt. First-time visitors see a bottom banner (after ~1.5s) asking to allow GSCL push notifications, so subscribing no longer requires finding the footer toggle; clicking "Allow notifications" requests the browser permission and subscribes in one step, "Not now" dismisses and re-prompts after 7 days, already-subscribed/denied visitors are never nagged. Shared client-side push helper (`src/lib/push-client.ts`) extracted so the footer toggle and the prompt use one implementation and stay in sync. No DB schema or scoring engine changes. |
| v1.3.12 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — Offline live-scoring fallback. When the admin loses internet at the ground, ball-by-ball entries are saved to an on-device queue (localStorage, survives refresh/restart) and the scoring screen keeps working with an "OFFLINE MODE" badge and a "Pending Sync" count. When internet returns, the queue auto-syncs in exact FIFO order (every 5s + on reconnect) with a live progress counter, then the public live score updates. Every ball gets a unique `ballId`; the submit API stores it on the ball and ignores replays, and the undo API accepts a `ballId` for idempotent undo — so no duplicates, no lost balls, correct order. Offline undo removes the last queued ball locally. No DB schema changes; scoring engine logic unchanged (only idempotency added). |
| v1.3.13 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — Anti-spam contact & sponsorship form. Contact page now has a Purpose selector (General Inquiry / Sponsorship); sponsorship reveals structured fields (Company/Brand, Phone/WhatsApp, Sponsorship Type, Budget Range). Submissions are protected by three layers: reCAPTCHA on the OTP step, email OTP verification (same trusted flow as votes — the message is only accepted for a verified email), and a honeypot field, plus per-IP and per-email rate limits. Admin Messages page now shows the purpose badge and sponsorship details. Contact table gains `purpose`, `phone`, `company`, `sponsorshipType`, `budgetRange` columns. No scoring engine changes. |
| v1.3.14 | Aug 2026 | **Fix** — Sponsorship budget options now start at 5K (was "Up to 50K"). Options: `5K - 50K`, `50K - 1 Lac`, `1 Lac - 5 Lac`, `5 Lac +`, `Not decided / Flexible`. Verified end-to-end: reCAPTCHA gate, email OTP, honeypot silent-drop, no-token/garbage-token rejection (401), and full sponsorship payload persistence. |
| v1.3.15 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — Admin email alerts. Har user submission par site owner ke email (`ADMIN_NOTIFY_EMAIL`, default `mibrahimalavi14@gmail.com`) par turant notification jaati hai — contact/sponsorship messages, Player of the Match votes, Player of the Season votes, Season Predictions, Match Quiz attempts, Season Quiz attempts, aur Reviews (approval pending). Sab fire-and-forget hain — user response kabhi block nahi hoti. |
| v1.3.16 | Aug 2026 | **Fix** — v1.3.15 me notifications Vercel serverless par silently drop ho rahi thin: fire-and-forget promise response ke baad function terminate hone par khatam ho jaata tha. Ab sab notifications Next.js `after()` se bheji jaati hain — function email complete hone tak zinda rehta hai. Fix `notifyAdmin()` helper me. |
| v1.3.17 | Aug 2026 | **Change** — Contact form me OTP ab sirf **Sponsorship** ke liye required hai. General Inquiry messages bina OTP ke turant submit ho jaati hain (sirf reCAPTCHA). OTP flow (email verification) sponsorship submissions ke liye hamesha ki tarah raha. |
| v1.3.18 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — Home page "Our Partners" ke "Contact us" link par click karne se seedha **Sponsorship contact form** khulta hai (`/contact?purpose=sponsorship`). Admin me **delete buttons** add: Contact Messages, News, Seasons, Predictions, Match Notes (clear). Saari delete APIs `isAdminAuthenticated()` se protected hain. |
| v1.3.19 | Aug 2026 | **Change** — Home page Reviews section me ab review cards **form ke neche** dikhte hain (pehle upar the). Review submission par admin ko email me **poora message** (comment) detail ke saath milta hai. |
| v1.3.20 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — Naya **All-Time Stats** page (`/stats`): saare seasons mila kar total runs, balls faced, fours, sixes, fifties, hundreds, wickets, balls bowled, runs conceded, catches, stumpings, run outs, wides, no balls, averages/rates — aur **har season ka alag alag** wahi totals (season-wise table). Home page par Teams/Players/Matches counts aur Upcoming Matches/Teams sections ab **latest (running) season** ki cheezein dikhaate hain, aur stats row me naya **Season Runs** card. |
| v1.3.21 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — Naya **Management** page (`/management`): GSCL ke management members ke naam, roles aur pictures wale cards (abhi Chairman included; mazeed members jald add honge). Header "More → Explore" + Footer me links. About page par chairman ki picture **choti (medium circular)** kar di gayi — pehle poori width bari thi. |
| v1.3.22 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — Chairman ki **poori picture** ab har jagah dikhti hai (Management page, About page — pehle circular crop me kat rahi thi). Home page par naya **Chairman's Message** section: lamba message + neche naam **Hafiz Muhammad Ibrahim Alavi** + signature (abhi cursive naam; asli signature image `/images/optimized/signature.webp` daalte hi khud lag jayega). FAQ me "Chairman Muhammad Ibrahim Alavi" → **"Muhammad Ibrahim Alavi"** kar diya (Chairman remove). |
| v1.3.23 | Aug 2026 | **Feature release (freeze exception, explicitly requested)** — Chairman ki **asli signature image** dhoond kar website par lagayi gayi. Photo (`Chairman's Signature.jpg`) me se sirf signature crop karke transparent background wali `public/images/optimized/signature.png` (500x111) banayi gayi — Chairman's Message section me naam ke neche ab asli signature dikhta hai. |
| v1.3.24 | Aug 2026 | **Change (freeze exception, explicitly requested)** — Signature ab **clean white background** par hai, crisp blue ink ke saath (professional look). Image se transparent ki jagah white bg banayi gayi, contrast enhance kiya, aur page par rounded corners + subtle shadow se display hoti hai. |
| v1.3.25 | Aug 2026 | **Fix** — Signature crop me **pehla "I" (Ibrahim) kata** hua tha — crop left margin se zyada tight tha (ink `x=322` se start hoti thi lekin crop `x=379` se). Ab signature **poori** li gayi hai (full "I" + zaroori breathing margin), white background pure hai, ink crisp navy blue me hai, aur speckle noise hataya gaya. `signature.png` (560x136, ~14 KB). |
| v1.3.26 | Aug 2026 | **Change (freeze exception, explicitly requested)** — Signature ko **AI-style realistic pen signature** banaya gaya. Original photo ke strokes se **skeleton (centerline)** extract hua (Zhang-Suen thinning), phir us par **smooth anti-aliased pen-brush strokes** render kiye — thin, elegant, continuous strokes with natural pen-pressure variation. Result: bilkul clean, professional signature jo kisi bhi document par sign ki hui jaisi lagti hai. Pure white background, crisp navy ink. `signature.png` (620x150, ~13 KB). |
| v1.3.32 | Aug 2026 | **Change (freeze exception, explicitly requested)** — **Vote timestamps sab jagah dikhte hain.** POTM, Player of the Season, Match Quiz, Season Quiz aur Predictions — har jagah jab user vote/attempt karta hai to ab **time bhi nazar aata hai**: `You voted for X · date/time`, `Attempted on date/time`, Predictions par success screen par relative `· 2m ago`, aur "This email has already voted" error ke neche `Voted 3h ago`. Admin panels (POTM, Player of the Season) me har match/season ka **Recent votes** list (naam + time), Predictions admin table me date ke sath time, aur saari admin **email notifications** me Time row (PKT). Naye shared `formatDateTime()` / `formatDateTimePKT()` utils; POTM/POS APIs me `createdAt` + `recentVotes`, Season Quiz API me `_max.createdAt`. No DB schema, scoring engine, statistics, or feature behavior changes. |

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
| v1.3.4-season1 | Feature — admin show/hide control for titles leaderboard |
| v1.3.5-season1 | Feature — Player of the Season public voting + admin winner announcement |
| v1.3.6-season1 | Performance & Mobile optimization (non-feature) |
| v1.3.7-season1 | Feature — one-email-one-vote across all public voting (quiz now email-keyed) |
| v1.3.8-season1 | Feature — OTP email verification + reCAPTCHA on all public voting |
| v1.3.9-season1 | Feature — auto-ranked POTM candidates by performance |
| v1.3.10-season1 | Feature — automatic push notifications on match/quiz/news events |
| v1.3.11-season1 | Feature — in-site notification permission prompt on first visit |
| v1.3.12-season1 | Feature — offline live-scoring fallback with auto-sync queue |
| v1.3.13-season1 | Feature — anti-spam contact & sponsorship form |
| v1.3.14-season1 | Fix — sponsorship budget options start at 5K |
| v1.3.15-season1 | Feature — admin email alerts for all votes & messages |
| v1.3.16-season1 | Fix — notifications reliably delivered via Next.js after() |
| v1.3.17-season1 | Change — contact OTP only for sponsorship |
| v1.3.18-season1 | Feature — home sponsors link + admin delete buttons |
| v1.3.19-season1 | Change — reviews shown below the form |
| v1.3.20-season1 | Feature — all-time & season-wise totals page + latest-season home sections |
| v1.3.21-season1 | Feature — Management page (members + photos) + smaller chairman image on About |
| v1.3.22-season1 | Feature — chairman full photo everywhere + Chairman's Message on home + FAQ fix |
| v1.3.23-season1 | Feature — chairman signature image (transparent) added under the message |
| v1.3.24-season1 | Change — signature now on clean white background, crisp + professional |
| v1.3.25-season1 | Fix — signature crop fixed (first "I" no longer cut off) |
| v1.3.26-season1 | Change — realistic AI-style smooth pen-brush signature |
| v1.3.27-season1 | Feature — admin management for chairman message + management members |
| v1.3.28-season1 | Change — redesigned admin header More dropdown (icons + grouped sections, ~half-page panel) + added missing admin pages |
| v1.3.29-season1 | Feature — push subscriber list in admin (device + date + remove button) + test subscriptions cleaned, device info tracked on subscribe |
| v1.3.30-season1 | Feature — new in-app notifications auto-popup as a dismissible toast on the site (no bell needed); stays in notification history |
| v1.3.31-season1 | Fix — home page Teams/Players/Matches/Season Runs cards now use the latest season (by year) instead of only the active-season flag |
| v1.3.32-season1 | Change — vote timestamps shown everywhere (public + admin + email): POTM, Player of the Season, Match Quiz, Season Quiz and Predictions now display when the user voted/attempted. |
| v1.3.10+ | Future bug/security fixes for v1.3.x |
| v2.0.0 | Major Season 2 features |

## v2.0 Backlog (post-Season 1 feedback)

- PWA / Offline Support
- WebSockets / Live Updates
- Image Optimization (WebP/AVIF)
- Error Monitoring (Sentry)
- Season Report PDF
- Social Media Result Image
