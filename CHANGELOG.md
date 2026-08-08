# Changelog

## v1.3.31-season1

Home stats show latest season.

Changed
- Home page ke **Teams / Players / Matches / Season Runs** cards ab **latest season** ka data dikhate hain (`orderBy year desc`) — pehle sirf `isActive: true` season dikhta tha. Agar koi season active mark na bhi ho, latest season ke numbers dikhenge.

Verified
- `npx tsc --noEmit` + `npm run build` pass.

## v1.3.30-season1

Auto-popup in-app notification toast.

Added
- Admin se nayi in-app notification banate he wo **forun website par ek toast/banner** ke roop me dikhti hai — visitor ko **bell kholne ki zaroorat nahi**. Header ke neche slide-down hota hai, bell icon + title + body ke saath.
- Toast par **X (cross)** button — close karne par notification **notifications history (bell) me saved** rehti hai.
- Agar notification me link hai to toast par click karne se page khulta hai (aur read mark hoti hai).
- Har user apni device par dismissed notifications yaad rakhta hai (localStorage) — wo again nahi dikhti. 7 din tak purani nayi notifications toast hoti hain.
- Toast **60s me refresh** hota hai + tab focus par — jo visitor pehle se site par hai uske samne bhi forun aa jaati hai. Admin pages par toast nahi dikhta.
- Notification bell me bhi pehle ki tarah unread + history dikhti hai.

Verified
- `npx tsc --noEmit` + `npm run build` pass.

## v1.3.29-season1

Push subscriber list + cleanup.

Added
- Admin **Notifications** page par ab **har subscriber ki list** dikhti hai — device info (browser · OS · Mobile/Desktop), subscribe date, aur **Remove** button.
- Subscribe hone par ab `userAgent` save hota hai (new column) taake device ka pata chale.
- Naya admin-only `DELETE /api/notifications/subscribe/[id]` endpoint.
- Subscriber list API sirf admin (cookie) ko list deti hai; public ko sirf count milta hai.
- Purane 4 test subscriptions DB se delete kar diye — count ab **0** se naya shuru hoga.

Verified
- `npx tsc --noEmit` + `npm run build` pass.

## v1.3.28-season1

Redesigned admin header More dropdown.

Changed
- Admin header ka **More** dropdown ab website ke More jaisa design hai: **grouped sections** (Content / Manage / League / Tools / System) har link ke **icons** ke saath, aur **~aadhi page width** ka panel (`w-[min(92vw,42rem)]`) — full page nahi, chevron hover par rotate hota hai, `max-h-[70vh]` ke andar scroll.
- Missing admin pages ab More me hain: **Match Notes** (Manage me), aur naya **Tools** group — **Practice Center, Analytics, System Monitor, Restore**.
- Mobile admin menu me bhi same groups + icons aur missing links add kiye.

Verified
- `npx tsc --noEmit` + `npm run build` pass.

## v1.3.27-season1

Admin management for Chairman's Message + Management members.

Added
- **Chairman's Message** admin page (`/admin/chairman-message`): name, title, photo, full message, signature on/off, active on/off, and delete.
- **Management** admin page (`/admin/management`): add, edit (name/role/photo/quote/sort order/active), and delete management members.
- New DB tables: `ChairmanMessage` + `ManagementMember` (seeded with the chairman row).
- Home page **Chairman's Message** section + **Management** page (`/management`) are now DB-driven (with fallbacks so they never break).
- Admin nav links (Content → Chairman's Message, Manage → Management) + dashboard cards.
- Content seed script `scripts/seed-content.ts` (upserts the default chairman rows).

Verified
- `npx tsc --noEmit` + `npm run build` pass.
- Seed rows confirmed in production DB.

## v1.3.26-season1

Realistic AI-style smooth pen signature.

Changed
- Signature ab **bilkul real pen signature** jaisi lagti hai — photo ke strokes se **skeleton (centerline)** extract karke (Zhang-Suen thinning) us par **smooth anti-aliased pen-brush strokes** render kiye.
- Thin, elegant, **continuous strokes** with **natural pen-pressure variation** (flourish mota, letter detail patla).
- Pure white background, crisp navy ink, full "I" intact.
- `signature.png` (620x150, ~13 KB) — pehle photo-crop blotchy lagti thi, ab clean professional.

Verified
- `npx tsc --noEmit` + `npm run build` pass.

## v1.3.25-season1

Signature crop fix — full "I".

Fixed
- Signature ke **pehle "I" (Ibrahim) ka hissa crop me kat** gaya tha — signature ki ink `x=322` (original px) se start hoti hai lekin purani crop `x=379` se, isliye first letter ka start missing tha. Ab signature **poori** width se crop hoti hai (full "I" + proper breathing margin).
- Background ab **pure white** (corners 255,255,255), ink **crisp navy blue**, aur speckle noise removed.
- `signature.png` (560x136, ~14 KB).

Changed
- Home page display unchanged (rounded corners + subtle shadow).

Verified
- `npx tsc --noEmit` + `npm run build` pass.

## v1.3.24-season1

Professional white-background signature.

Changed
- `signature.png` ab **clean white background** par hai (pehle transparent thi) — 548x159, ~35 KB.
- Blue ink ko contrast-enhance karke **crisp** banaya gaya.
- Home page par signature ab **rounded corners + subtle shadow** ke saath professional presentation me dikhti hai.

Verified
- `npx tsc --noEmit` + `npm run build` pass.

## v1.3.23-season1

Chairman signature image added.

Added
- Chairman ki **asli signature** ab Chairman's Message section me naam ke neche dikhti hai.
- Source photo (`Chairman's Signature.jpg` — OneDrive/Documents) me se sirf signature crop kar ke **transparent background wali** `public/images/optimized/signature.png` (500x111, ~50 KB) banayi gayi — pehle cursive italic naam placeholder tha.

Verified
- `npx tsc --noEmit` + `npm run build` pass.

## v1.3.22-season1

Chairman full photo + Chairman's Message + FAQ fix.

Changed
- Chairman ki **poori picture** ab har jagah dikhti hai — Management page aur About page (pehle circular crop me photo kat rahi thi). Photo portrait hai, ab bina crop ke full dikhta hai.
- FAQ: "Who manages the league?" me **"Chairman Muhammad Ibrahim Alavi"** → **"Muhammad Ibrahim Alavi"** (Chairman word remove).

Added
- Home page par naya **Chairman's Message** section: chairman ki full photo + lamba message + neche naam **Hafiz Muhammad Ibrahim Alavi** + signature.
- Signature: abhi cursive italic naam placeholder hai; asli signature image `/images/optimized/signature.webp` par rakhne se khud automatically aajayegi.

Unchanged
- No DB schema, scoring engine, statistics formula changes.

Verified
- `npx tsc --noEmit` + `npm run build` pass.

## v1.3.21-season1

Management page + smaller chairman image.

Added
- Naya **Management** page (`/management`): GSCL management members ke naam, roles aur pictures wale cards (abhi Chairman included; mazeed members jald add honge).
- Header "More → Explore" me **Management** link (desktop + mobile) aur Footer Quick Links me bhi.

Changed
- About page par chairman ki picture **choti** kar di gayi — pehle poori width bari (600px square) thi, ab medium circular avatar (~192px) `ring` ke saath.

Unchanged
- No DB schema, scoring engine, statistics formula changes.

Verified
- `npx tsc --noEmit` + `npm run build` pass.

## v1.3.20-season1

All-Time Stats page + latest-season home sections.

Added
- Naya **All-Time Stats** page (`/stats`, header "More → Stats & Analysis" + footer me link):
  - **All-Time Totals** — saare seasons combined: player appearances, runs, balls faced, fours, sixes, fifties, hundreds, average, strike rate, balls per boundary, not outs, ducks, dismissals, wickets, balls bowled, runs conceded, maidens, economy, 5w/4w hauls, hattricks, catches, stumpings, run outs, wides, no balls, boundaries.
  - **Season-Wise Totals** — har season ka alag table (runs, balls, fours, sixes, 50s/100s, avg, SR, wickets, BB, RC, econ, catches, stumpings, run outs); ACTIVE season highlighted.
  - Aggregate `Player` stats se banti hain (official workspace only), 60s revalidate.

Changed
- Home page stats row (`Teams / Players / Matches / Season / Founded`) ab **latest season** ka data dikhaati hai (teams/players/matches counts season-specific) + naya **Season Runs** card.
- Home **Upcoming Matches** ab sirf **latest season** ke matches dikhaata hai (`where: { status, seasonId }`).
- Home **Teams** section ab sirf **latest season** ke teams dikhaata hai; dono sections ke headings me season ka naam.
- Page `revalidate = 60` (records page jaisa pattern).

Unchanged
- No DB schema, scoring engine, statistics formula changes.

Verified
- `npx tsc --noEmit` + `npm run build` pass.

## v1.3.19-season1

Reviews — cards form ke neche.

Changed
- Home page `ReviewsSection`: review cards ab **"Leave a Review" form ke neche** dikhte hain (pehle upar the).
- Review submission par admin email notification (`New Review (Awaiting Approval)`) me **poora comment/message** Details section me aata hai — sirf rating nahi.

Verified
- `npx tsc --noEmit` + `npm run build` pass.

## v1.3.18-season1

Home sponsors link + admin delete buttons.

Added
- Home page "Our Partners" section ka **"Contact us"** link ab `/contact?purpose=sponsorship` khulta hai — seedha Sponsorship form (OTP wala).
- Admin delete buttons (Trash2, confirm ke saath):
  - **Contact Messages** (`/admin/contact`) → `DELETE /api/contact`
  - **News** (`/admin/news`) → `DELETE /api/news`
  - **Seasons** (`/admin/seasons`) → `DELETE /api/seasons`
  - **Predictions** (`/admin/predictions`) → `DELETE /api/predictions`
  - **Match Notes** (`/admin/match-notes`) → "Clear Notes" button → `DELETE /api/matches/notes`

Security
- Saari nayi delete APIs `isAdminAuthenticated()` se protected hain.
- Seasons delete workspace-scoped hai (official workspace se bahar delete nahi ho sakta).

Verified
- `npx tsc --noEmit` + `npm run build` pass.

## v1.3.17-season1

Contact form — OTP ab sirf Sponsorship ke liye.

Changed
- **General Inquiry** messages ab bina OTP ke submit ho jaati hain — sirf reCAPTCHA kaafi hai.
- **Sponsorship** submissions pehle ki tarah email OTP (verification) maangte hain.
- `contactSchema`: `verifiedToken` optional hai; sirf `purpose === "sponsorship"` par required (zod `superRefine`).
- `/api/contact`: sponsorship → `verifiedToken` verify hota hai; general → `recaptchaToken` verify hota hai.
- Contact page: purpose general ho to reCAPTCHA widget dikhta hai, sponsorship ho to OTP flow.

Verified
- `npx tsc --noEmit` + `npm run build` pass.

## v1.3.16-season1

Fix — admin email notifications ab production par reliably deliver hoti hain.

Problem
- v1.3.15 me notifications fire-and-forget (promise bina await) bheji gayi thin. Vercel serverless function response return hote hi terminate ho jaata hai, isliye SMTP email ka kaam adhoora reh kar notification **silently drop** ho jaati thin.
- OTP emails theek jaati thin kyunki unhe response se pehle await kiya jaata hai.

Fix
- `src/lib/email.ts` me naya `notifyAdmin()` helper — Next.js **`after()`** use karta hai, jo function ko email complete hone tak alive rakhta hai (aur error sirf log karta hai).
- Saare API routes (`/api/contact`, `/api/potm`, `/api/player-of-season`, `/api/predictions`, `/api/quiz/attempt`, `/api/season-quiz/attempt`, `/api/reviews`) ab `notifyAdmin()` use karte hain.

Verified
- `npx tsc --noEmit` + `npm run build` pass.
- Production E2E: OTP send → verify → contact submit → admin email deliver.

## v1.3.15-season1

Admin email alerts — har user submission par site owner ke email par turant notification.

Added
- **Contact / Sponsorship** messages → owner email par full details (type, name, email, company, phone, sponsorship type, budget, subject + message).
- **Player of the Match vote** → naam, email, player, match.
- **Player of the Season vote** → naam, email, player, season.
- **Season Prediction** → naam, email, predicted champion team, season.
- **Match Quiz attempt** → naam, email, quiz question, correct/incorrect, points.
- **Season Quiz attempt** → naam, email, score.
- **Review** → naam, email, city, rating + comment (approval pending ke saath).

Changed
- `src/lib/email.ts` me generic `sendAdminNotification` helper — saare alerts isi se jaate hain (koi duplicate email helper nahi).
- Recipient: `ADMIN_NOTIFY_EMAIL` env var; default `mibrahimalavi14@gmail.com`. Local `.env` aur Vercel Production dono me set kiya gaya.
- Sab notifications **fire-and-forget** hain — SMTP fail ho to sirf log hota hai, user ka submit/response kabhi block nahi hota.

Unchanged
- OTP emails visitors ko hi jaate hain (owner ko nahi).
- No scoring engine changes.

## v1.3.14-season1

Fix
- Sponsorship budget options ab 5K se shuru hote hain: `5K - 50K`, `50K - 1 Lac`, `1 Lac - 5 Lac`, `5 Lac +`, `Not decided / Flexible`.
- Anti-spam flow end-to-end verify kiya gaya (reCAPTCHA gate, email OTP, honeypot silent-drop, no-token/garbage-token 401 rejection, sponsorship payload DB persistence).

## v1.3.13-season1

Anti-spam contact & sponsorship form. Bots aur fake emails ab message nahi bhej sakte.

Added
- **Purpose selector** on the contact page — General Inquiry ya Sponsorship.
- **Sponsorship fields** (dikhte hain sirf jab Sponsorship choose karo): Company / Brand, Phone / WhatsApp, Sponsorship Type (Title, Official Partner, Team, Match, Kit, Venue, Media, Prize Money, Other), Budget Range (Up to 50K to 5 Lac+ / flexible).
- **reCAPTCHA** on the OTP step (same trusted flow as votes).
- **Email OTP verification** — message sirf verified email se hi accept hota hai; verified token 30 min valid.
- **Honeypot field** — bots ke liye hidden trap; bharne par submission silently ignore ho jaata hai.
- **Per-email rate limit** (5/day) IP limit ke saath.

Changed
- `/api/contact` POST now requires a verified email token (matching the submitted email) before saving.
- `Contact` table me 5 naye columns: `purpose`, `phone`, `company`, `sponsorshipType`, `budgetRange`.
- Admin **Messages** page shows a Sponsorship badge aur sponsorship details chips (company, phone, type, budget).

Unchanged
- General inquiry flow same hai — sirf email verify ab lazmi hai.
- No scoring engine changes.

## v1.3.12-season1

Offline live-scoring fallback. The scorer can keep scoring even when the ground has no internet — no ball is lost, and everything syncs automatically the moment the connection returns.

Added
- **Offline queue** (`src/lib/offline-queue.ts`) — ball-by-ball entries are saved to the device's localStorage when offline; the queue survives page refresh and laptop restart.
- **Offline live scoring UI** — while offline, the scoring screen keeps updating (scorecard, current over, batting/bowling lists) and shows an "OFFLINE MODE" badge plus a "Pending Sync: N" counter.
- **Auto-sync** (`src/hooks/useOfflineQueue.ts`) — on reconnect and every 5 seconds, queued balls replay to the server in exact FIFO order with a live "Syncing... X/Y" progress badge and a success flash when done; the public live score updates as soon as the last ball lands.
- **Offline undo** — undo of the most recent offline ball removes it from the local queue immediately.

Changed
- `/api/live/balls` now accepts a client-generated `ballId`, stores it on the ball record, and returns success (idempotent) if that ball already exists — replays after a dropped connection or lost response never duplicate a ball.
- `/api/live/balls/undo` now accepts an optional `ballId` and is idempotent (undoing an already-removed ball is a no-op), keeping the undo/redo balance exact across sync.
- The live-scoring page derives its displayed innings from server data merged with still-queued offline balls (deduped by `ballId`), so the screen and the final synced state never disagree.

Unchanged
- Online scoring behaves exactly as before — each ball posts instantly and viewers see it live.
- No database schema changes, no scoring formula changes.

## v1.3.11-season1

In-site notification permission prompt. First-time visitors no longer have to scroll to the footer to find the enable button — a bottom banner asks for push permission automatically when the site opens.

Added
- **Auto prompt on first visit** — ~1.5s after the page loads, a bottom banner ("Get notified from GSCL") appears with "Allow notifications" and "Not now" buttons, styled with the site's theme and visible on all pages.
- **One-step subscribe** — "Allow notifications" requests the browser permission and registers the subscription in a single click; a success/failure message shows briefly, then the banner hides.
- **Smart re-prompting** — already-subscribed visitors and visitors who blocked notifications at the browser level are never asked again; "Not now" dismisses the banner and re-prompts after 7 days.

Changed
- Shared client-side push helper (`src/lib/push-client.ts`) — `subscribeToPush` / `unsubscribeFromPush` / `getPushSubscription` now power both the footer toggle and the new prompt, with a shared event so the footer button updates as soon as the prompt subscribes.

Unchanged
- The footer "Enable Push Notifications" toggle works exactly as before.
- No database schema changes, no scoring engine changes.

## v1.3.10-season1

Automatic push notifications. Subscribers now get notified automatically on key events instead of only when an admin manually broadcasts from `/admin/notifications`.

Added
- **Match completion** — when a match is completed via Live Scoring, subscribers get a "Match Complete!" push with the result and a link to that match's POTM voting page.
- **Season Quiz live** — when the Season Quiz auto-generates after the season's last match, subscribers get a push with a link to `/quiz`.
- **News publish** — when admin publishes a news item (`POST /api/news`), subscribers get a "New News" push linking to the article.
- **Shared `sendPushNotification` helper** (`src/lib/push.ts`) — single implementation for the manual admin broadcast and the automatic triggers; cleans up dead subscriptions (404/410) on every send.

Changed
- `/api/notifications/send` refactored onto the shared helper (still admin-auth protected).

Unchanged
- Notification enabling/disabling UX and the footer toggle are untouched.
- No database schema changes, no scoring engine changes.

## v1.3.9-season1

Auto-ranked Player of the Match candidates. POTM candidates are still 100% automatic (built from the completed match's real `playerMatch` stats — no manual selection), but now the best performers surface first.

Changed
- **Performance-ranked candidates** — completed-match players are sorted by a POTM score: `runs + wickets×20 + (catches + stumpings + run-outs)×10 + strike-rate bonus` (bonus ≈ 10 pts per 100 SR).
- **Top performance badge** — the highest-scoring player gets a "Top performance" badge on their card.
- **Zero-contribution players hidden** — players with no runs, no balls bowled, and no fielding stats no longer clutter the voting list (e.g., a batter who didn't face a ball).
- **Strike rate shown** — the batting stat chip now includes `SR n` alongside runs/balls.

Unchanged
- Player of the Season already auto-ranks by votes + impact and is untouched.
- No database schema changes, no scoring engine changes, no OTP/voting security changes from v1.3.8.

## v1.3.8-season1

OTP email verification + reCAPTCHA on all public voting. This release makes the "one email = one vote" rule provable: every public submission (Player of the Match, Player of the Season, Match Quiz, Season Quiz) now requires the voter to prove they own the email address via a 6-digit OTP emailed to them, and OTP requests are guarded by a Google reCAPTCHA v2 challenge.

Added
- **`POST /api/vote/send-otp`** — sends a 6-digit OTP (5-minute expiry) for a purpose (`potm` / `pos` / `quiz` / `seasonQuiz`); reCAPTCHA v2 verified server-side against Google's `siteverify`, then IP rate-limited (3 / 5 min). Reuses the existing `EmailOtp` table.
- **`POST /api/vote/verify-otp`** — marks the OTP used and returns a short-lived (30-minute) server-signed `verifiedToken` (HMAC-SHA256 over `AUTH_SECRET`); IP rate-limited (5 / 15 min).
- **Shared `VoteVerification` component** — reCAPTCHA widget + "Send OTP" → 6-digit input → "Verify & Continue" flow, with a verified state that persists to `localStorage` (`potm_verified`, `pos_verified`, `quiz_verified`) and a "Change email" reset.
- **Token-enforced submissions** — POTM, Player of the Season, Match Quiz, and Season Quiz POST routes now reject submissions without a valid `verifiedToken` (401 "Email not verified"), and the token's embedded email must match the submitted email. Stale/expired tokens automatically require re-verification on the UI.
- **Shared `sendOtpEmail` mailer** — the predictions OTP route was refactored onto it (same Gmail SMTP, same subject/message) so there's a single email implementation.

Changed
- `potmVoteSchema`, `playerOfSeasonVoteSchema`, and `quizAttemptSchema` now require `verifiedToken`.
- Vote / quiz modals gate their submit buttons on a completed verification step.

Database schema change: none (reuses the existing `EmailOtp` table).

No scoring engine changes.
No statistics changes.

## v1.3.7-season1

One-email-one-vote across all public voting. This release extends the existing one-vote-per-email rule (already enforced for POTM and Player of the Season) to the Match Quiz and the Season Quiz.

Added
- **Match Quiz and Season Quiz now require an email** — one attempt per email per quiz. `QuizAttempt` and `SeasonQuizAttempt` are keyed by email (`@@unique([quizId, email])`, `@@unique([seasonQuizId, email])`), mirroring `PotmVote` / `PlayerOfSeasonVote`.
- Public `/quiz` "Your Details" card now has a **name + email** input (persisted to `localStorage`), shared by the Match Quiz and the Season Quiz.
- A returning Season Quiz participant is shown an **"already attempted"** state (their score restored via `/api/season-quiz?email=`) instead of being able to re-submit.
- Season Quiz leaderboard and `uid` are now **de-duplicated and derived by email** (names still displayed), and the match-quiz leaderboard no longer exposes emails in its payload.
- The season-quiz attempt API rejects duplicate email submissions with a clear "already attempted" message (409).

Database schema change:
- `QuizAttempt.email` + `@@unique([quizId, email])`; `SeasonQuizAttempt.email` + `@@unique([seasonQuizId, email])`. Tables were empty, so no data backfill was needed (applied via `prisma db push`).

No scoring engine changes.
No statistics changes.

## v1.3.6-season1

Performance & Mobile optimization. No DB schema, scoring engine, statistics, feature, or UI behavior changes.

Optimized
- **Lazy-loaded heavy components** with `next/dynamic` + loading skeletons: Over-by-Over scorecard, Worm chart, and Shareable Scorecard on `/matches/[id]`; Live Score widget on `/live` (kept `force-dynamic`).
- **Route loading skeletons** (`loading.tsx`) added for major public and admin routes.
- **Database query optimization**: `/api/matches/live` and `/api/matches/count` scoped to the official workspace; `/api/player-of-season`, `/api/records`, and the Awards page now batch independent queries with `Promise.all` and use `select` projections; removed dead hall-of-fame query.
- **Debounced search** (300ms) on the Compare page.
- **Mobile responsiveness**: super-over + wicket-entry grids on live-scoring admin stack on small screens (`grid-cols-1 sm:grid-cols-3` / `grid-cols-1 sm:grid-cols-2`); guide drawer width capped for small screens.
- **Touch targets + accessibility**: modal/overlay close buttons enlarged to 44px with `aria-label`s (gallery lightbox, search overlay, notification bell, POTM, player-of-season); icon-only buttons given accessible labels.
- **Image optimization**: header logo and guide image now use the optimized WebP asset; large below-the-fold images lazy-load.
- **Bundle size**: unused lucide-react imports removed (header, compare, admin analytics); dead component deleted.
- **Engineering standards**: `AGENTS.md` documents the future-proof performance, mobile, DB, caching, and accessibility rules for all new work.

No scoring engine changes.
No statistics changes.
No database schema changes.

## v1.3.5-season1

Added
- **Player of the Season public voting.** Visitors can vote for the standout performer of a season. New `PlayerOfSeasonVote` table with a per-season email uniqueness constraint (one vote per email per season, name defaults to "Anonymous"), mirroring the existing POTM voting pattern.
- New API `GET /api/player-of-season?seasonId=&email=` returns the season's nominees (top performers by impact with their season runs/wickets/catches/innings), live vote counts, total votes, and the user's existing vote. `POST /api/player-of-season` validates the season/player, enforces the one-vote-per-email rule, and is rate-limited (3 per hour per IP).
- Public `/player-of-season` page: season selector, nominee cards with team + season stats and live vote progress bars, a vote modal (email + optional name), and the "You voted for ..." confirmation state.
- Admin `/admin/player-of-season` page: per-season vote breakdowns and an "Announce Player of the Season" action that writes a `player_of_season` `SeasonAward` for the chosen player. Also linked from the admin header and dashboard.
- New `player_of_season` award category wired through the awards API labels, the public Awards page ceremony order, season detail page, and award certificates.
- Public header "More → Games & Features" now links to `/player-of-season` on both desktop and mobile.

Database schema change:
- `PlayerOfSeasonVote` (seasonId, playerId, email, name; `@@unique([seasonId, email])`, `@@index([seasonId])`, cascade deletes on Season/Player).

No scoring engine changes.
No statistics changes.

## v1.3.4-season1

Added
- Admin can now show or hide the all-time **Titles** and **Runner-ups** leaderboards on the public `/seasons` page. New `titlesLeaderboardVisible` flag on the `Workspace` model (default `true`), a Show/Hide toggle on `/admin/seasons`, and a new admin API `GET/PATCH /api/admin/leaderboard-visibility`. When hidden, the leaderboard section no longer renders.

Database schema change:
- `Workspace.titlesLeaderboardVisible` (Boolean, default `true`).

No scoring engine changes.
No statistics changes.
No other API changes.

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
