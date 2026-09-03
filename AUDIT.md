# GSCL Professional Audit Checklist
## Version: v1.1.0 — Feature Lock Target

This checklist covers all features an ICC/PSL-level cricket platform requires.
Each item is classified as ✅ (done), ⚠️ (partial), or ❌ (missing).

---

## A. SCORING ENGINE (14 items)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| A1 | Ball-by-ball scoring | ✅ | Full run buttons 0-6 |
| A2 | Extras: Wide | ✅ | |
| A3 | Extras: No Ball | ✅ | |
| A4 | Extras: Bye | ✅ | |
| A5 | Extras: Leg Bye | ✅ | |
| A6 | Wicket types (bowled, caught, lbw, stumped, run out, hit wicket) | ✅ | |
| A7 | Undo last ball | ✅ | |
| A8 | Innings break | ✅ | |
| A9 | Auto-match completion | ✅ | |
| A10 | Super Over (all match types, infinite retries) | ✅ | |
| A11 | Super Over history persistence | ✅ | |
| A12 | **Wides/No-balls with bat runs** | ✅ | Wide/No-ball support extra runs; wide extras never credited to batsman, no-ball bat runs credited to striker. |
| A13 | **Overthrow runs** | ✅ | Run tapped then "Overthrow +1..+4" appended to the last legal delivery; credited to striker + team, flagged in over-by-over. |
| A14 | **Dead ball** | ✅ | "Dead Ball" button records a non-delivery event (no over advance, no bowler ball, no batsman/bowler runs). |

---

## B. PLAYER MANAGEMENT (12 items)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| B1 | Player CRUD | ✅ | |
| B2 | Player roles (Batsman, Bowler, All-rounder, WK) | ✅ | |
| B3 | Batting stats (runs, balls, 4s, 6s, SR) | ✅ | |
| B4 | Bowling stats (wickets, economy, balls, maidens) | ✅ | |
| B5 | Fielding stats (catches, stumpings, run outs) | ✅ | |
| B6 | Not out tracking | ✅ | |
| B7 | Batting average (display layer) | ✅ | `runs / dismissals` |
| B8 | Bowling average (display layer) | ✅ | `runsConceded / wickets` |
| B9 | **Retired Hurt vs Retired Out distinction** | ✅ | `retired_hurt` = not a dismissal (avg unaffected); `retired_out` = a dismissal. |
| B10 | **Career average (not-out handling)** | ⚠️ | Works for players with dismissals. All not-outs shows "-". |
| B11 | Player comparison tool | ✅ | |
| B12 | Player photo upload | ✅ | Via admin |

---

## C. MATCH MANAGEMENT (14 items)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| C1 | Match CRUD | ✅ | |
| C2 | Toss winner + decision | ✅ | |
| C3 | Scorecard (batting, bowling, FOW) | ✅ | |
| C4 | Fall of wickets | ✅ | |
| C5 | Partnerships | ✅ | |
| C6 | Match result (auto-generated) | ✅ | |
| C7 | Man of the Match (auto + override) | ✅ | |
| C8 | **Umpire / Match officials** | ❌ | No fields in schema |
| C9 | **Match timeline / ball log** | ❌ | Only on live scoring page, not persisted as structured timeline |
| C10 | YouTube highlights embed | ✅ | |
| C11 | Custom highlights | ✅ | |
| C12 | Share buttons | ✅ | |
| C13 | **Penalty runs** | ✅ | "Penalty" button awards 1-6 (default 5) team runs to the innings total; never credited to a batsman or bowler, not a legal delivery. |
| C14 | **Abandoned / No Result** | ✅ | Via result string "no result" or "abandon" |

---

## D. LEAGUE SYSTEM (10 items)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| D1 | Points table | ✅ | |
| D2 | Net Run Rate (ICC all-out standard) | ✅ | |
| D3 | Season management | ✅ | |
| D4 | Knockout bracket / Playoffs | ✅ | Stage field on matches |
| D5 | Fixtures / Schedule | ✅ | |
| D6 | Standings page | ✅ | |
| D7 | **DLS method** | ❌ | Not applicable for T4 format |
| D8 | Multi-season support | ✅ | |
| D9 | Season winner | ✅ | |
| D10 | **Qualification rules (playoff cutoff)** | ❌ | No automatic playoff qualification |

---

## E. RECORDS & STATS (10 items)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| E1 | Most runs | ✅ | |
| E2 | Most wickets | ✅ | |
| E3 | Highest individual score | ✅ | |
| E4 | Best bowling figures | ✅ | |
| E5 | Most fours / sixes | ✅ | |
| E6 | Most catches / fielding | ✅ | |
| E7 | Super Over records | ❌ | Data saved but no records page |
| E8 | **Venue-specific records** | ❌ | Venue is a string, no structured queries |
| E9 | Team records | ✅ | Via team stats page |
| E10 | Season records | ✅ | Via season page |

---

## F. VENUE (5 items)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| F1 | Venue listing page | ✅ | |
| F2 | Venue stats (matches played, batting first wins %) | ✅ | |
| F3 | **Venue model (capacity, pitch type, location)** | ❌ | Only a string field on Match |
| F4 | **Venue-specific bowling/batting records** | ❌ | |
| F5 | Venue coordinates / map | ⚠️ | Client-side only |

---

## G. DATA EXPORT (6 items)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| G1 | Export matches CSV | ✅ | |
| G2 | Export players CSV | ✅ | |
| G3 | **Export teams CSV** | ❌ | |
| G4 | **Export season report PDF** | ❌ | |
| G5 | **Match scorecard image (share)** | ❌ | |
| G6 | **Export points table CSV** | ❌ | |

---

## H. NOTIFICATIONS & COMMUNICATION (6 items)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| H1 | Push notifications (web) | ✅ | |
| H2 | In-app notifications | ✅ | |
| H3 | **Email notifications** | ❌ | |
| H4 | Contact form | ✅ | |
| H5 | News / Blog | ✅ | |
| H6 | **SMS notifications** | ❌ | Out of scope |

---

## I. FAN ENGAGEMENT (8 items)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| I1 | POTM voting | ✅ | |
| I2 | Match predictions | ✅ | |
| I3 | Quiz | ✅ | |
| I4 | Dream team | ✅ | |
| I5 | H2H comparison | ✅ | |
| I6 | Player comparison | ✅ | |
| I7 | Toss analysis | ✅ | |
| I8 | Gallery / Photos | ✅ | |

---

## J. ADMIN (15 items)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| J1 | Admin auth (password) | ✅ | |
| J2 | Dashboard | ✅ | |
| J3 | Match management | ✅ | |
| J4 | Player management | ✅ | |
| J5 | Team management | ✅ | |
| J6 | Season management | ✅ | |
| J7 | News management | ✅ | |
| J8 | Gallery management | ✅ | |
| J9 | Sponsor management | ✅ | |
| J10 | Analytics dashboard | ✅ | |
| J11 | Audit logs | ✅ | |
| J12 | Squad management | ✅ | |
| J13 | Review approval | ✅ | |
| J14 | Notification send | ✅ | |
| J15 | **Bulk operations (mass player update)** | ❌ | |

---

## K. SECURITY (6 items)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| K1 | Admin auth | ✅ | |
| K2 | SQL injection protection (Prisma) | ✅ | |
| K3 | **Rate limiting** | ❌ | No rate limiting on API routes |
| K4 | **Input validation (zod/joi)** | ❌ | Minimal validation |
| K5 | **CSRF protection** | ❌ | Relying on Next.js defaults |
| K6 | Environment variable security | ✅ | |

---

## L. SEO & PERFORMANCE (8 items)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| L1 | Sitemap | ✅ | |
| L2 | Robots.txt | ✅ | |
| L3 | OG images | ✅ | |
| L4 | Meta tags (title, description) | ⚠️ | Some pages missing |
| L5 | Image optimization (WebP) | ✅ | |
| L6 | ISR / caching | ✅ | revalidate on pages |
| L7 | **Structured data (JSON-LD)** | ❌ | No schema.org markup |
| L8 | **Lighthouse score > 90** | ❓ | Not tested |

---

## M. MOBILE & PWA (4 items)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| M1 | Responsive design | ✅ | |
| M2 | PWA manifest | ✅ | |
| M3 | Service worker | ✅ | |
| M4 | **Touch-optimized scoring buttons** | ⚠️ | Works but small buttons |

---

## N. SUPER OVER (8 items)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| N1 | Super Over trigger (all match types) | ✅ | |
| N2 | Ball-by-ball SO scoring | ✅ | |
| N3 | SO live banner | ✅ | |
| N4 | SO infinite retries | ✅ | |
| N5 | SO history DB storage | ✅ | |
| N6 | SO history on match detail | ✅ | |
| N7 | SO ball-by-ball view on match detail | ✅ | |
| N8 | **SO records page** | ❌ | Data saved but no dedicated records |

---

## SUMMARY

| Category | Total | Done | Partial | Missing |
|----------|-------|------|---------|---------|
| A. Scoring Engine | 14 | 11 | 0 | 3 |
| B. Player Mgmt | 12 | 10 | 2 | 0 |
| C. Match Mgmt | 14 | 11 | 0 | 3 |
| D. League System | 10 | 8 | 0 | 2 |
| E. Records & Stats | 10 | 8 | 0 | 2 |
| F. Venue | 5 | 2 | 1 | 2 |
| G. Data Export | 6 | 2 | 0 | 4 |
| H. Notifications | 6 | 4 | 0 | 2 |
| I. Fan Engagement | 8 | 8 | 0 | 0 |
| J. Admin | 15 | 14 | 0 | 1 |
| K. Security | 6 | 3 | 0 | 3 |
| L. SEO & Perf | 8 | 5 | 1 | 2 |
| M. Mobile & PWA | 4 | 3 | 1 | 0 |
| N. Super Over | 8 | 7 | 0 | 1 |
| **TOTAL** | **126** | **96** | **5** | **25** |

### Score: 96/126 = 76% complete

---

## PRIORITY: Season 1 Must-Haves (Before Feature Lock)

### HIGH PRIORITY (blocks scoring accuracy)

| # | Feature | Effort | Why |
|---|---------|--------|-----|
| H-1 | **Wides/No-balls with bat runs** | ✅ Done | Wide/no-ball extra runs record correctly; batsman attribution cricket-accurate. |
| H-2 | **Retired Hurt vs Retired Out** | ✅ Done | Retirement types separated; affects batting average only when retired out. |

### MEDIUM PRIORITY (completes professional look)

| # | Feature | Effort | Why |
|---|---------|--------|-----|
| M-1 | **Umpire / Match officials** | Small | Standard for professional cricket. Simple fields. |
| M-2 | **Export points table CSV** | Small | Admin convenience. |
| M-3 | **Export teams CSV** | Small | Admin convenience. |
| M-4 | **Super Over records page** | Medium | Data already saved. Just need display. |
| M-5 | **Rate limiting on API** | Medium | Security. Prevents abuse. |

### LOW PRIORITY (nice to have for Season 1)

| # | Feature | Effort | Why |
|---|---------|--------|-----|
| L-1 | Venue model (structured) | Medium | Better than string field. |
| L-2 | Match scorecard share image | Large | Social media virality. |
| L-3 | Structured data (JSON-LD) | Small | SEO. |
| L-4 | Penalty runs | Small | Rarely used in T4. |
| L-5 | Dead ball | Small | Rarely used in T4. |

### DEFER TO SEASON 2

| # | Feature | Why |
|---|---------|-----|
| S-1 | Email notifications | Requires email service setup |
| S-2 | DLS method | Not applicable for T4 format |
| S-3 | Bulk admin operations | Quality of life only |
| S-4 | PDF export | Nice to have |
| S-5 | Match timeline persistence | Nice to have |
| S-6 | SMS notifications | Out of scope |

---

## RECOMMENDED ACTION PLAN

### Phase 1: HIGH PRIORITY (Done)
1. Wides/no-balls with bat runs — ✅ committed
2. Retired hurt vs retired out distinction — ✅ committed

### Phase 2: MEDIUM PRIORITY (Do before Season 1)
3. Add umpire fields to Match model
4. Add CSV export for teams + points table
5. Build Super Over records page
6. Add basic rate limiting

### Phase 3: LOW PRIORITY (Optional before Season 1)
7. Structured venue model
8. Share image for scorecard
9. JSON-LD structured data

### Feature Lock
After Phase 1 + 2: **Core Platform = Complete**
Score: ~108/126 = 86%

After Phase 3: **Professional Platform = Complete**
Score: ~114/126 = 90%
