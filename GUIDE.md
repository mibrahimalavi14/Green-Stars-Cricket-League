# GSCL v1.0.1 — Complete Admin & Operations Guide

## Admin Panel Access

**Production URL**: https://green-stars-cricket-league.vercel.app/admin

Login with admin password → full access to all management tools.

---

## Admin Panel — All Pages

| Page | URL | What It Does |
|---|---|---|
| Dashboard | `/admin` | Overview — all counts, quick links |
| Teams | `/admin/teams` | Add/edit/delete teams |
| Players | `/admin/players` | Add/edit/delete players per team |
| Seasons | `/admin/seasons` | Create seasons, lock predictions |
| **Matches** | `/admin/matches` | Create/schedule matches, set live/completed |
| **Live Scoring** | `/admin/live-scoring/{MATCH_ID}` | Ball-by-ball scoring panel |
| Performances | `/admin/performances` | Enter player performances after matches |
| News | `/admin/news` | Publish/edit news articles |
| Gallery | `/admin/gallery` | Upload/manage photos |
| Sponsors | `/admin/sponsors` | Manage league sponsors |
| Quiz | `/admin/quiz` | Create match quizzes |
| Squad | `/admin/squad` | Set match squads |
| POTM | `/admin/potm` | Manage Man of the Match voting |
| Predictions | `/admin/predictions` | View/lock season predictions |
| Moments | `/admin/moments` | Moment of the Day highlights |
| Notifications | `/admin/notifications` | Send push notifications |
| Reviews | `/admin/reviews` | Approve/reject user reviews |
| Contact | `/admin/contact` | View contact form messages |
| **Analytics** | `/admin/analytics` | Usage metrics & trends |

---

## Match Day Workflow

### Before Match
1. Go to `/admin/matches` → Create new match (set teams, venue, date)
2. Go to `/admin/squad` → Set playing XI for both teams
3. Open `/admin/live-scoring/{MATCH_ID}`
4. Select toss winner + decision (bat/bowl)
5. Select batting team, striker, non-striker, bowler
6. Click **Start Match**

### During Match (Live Scoring)
The scoring panel has:

**Batting Section:**
- Runs: 0, 1, 2, 3, 4, 6 buttons
- Extras: Wide, No Ball, Bye, Leg Bye
- Wicket: Select type (bowled, caught, lbw, runout, stumped, hit wicket)
- Region: Click field diagram to mark shot direction

**Key Rules (T4 Format):**
- 4 overs per innings (24 balls total)
- Max 1 over (6 legal balls) per bowler
- 10 wickets per innings
- Strike rotates on odd runs, end of over

**Undo Button:**
- Reverses last ball (runs, wickets, extras)
- Cannot undo after match is completed

**Auto-calculations:**
- Score updates live
- Run rate, required run rate
- Partnership tracker
- Current over display

### After Match
1. Click **End Match** in scoring panel
2. Select winner (or tie)
3. Enter result text
4. Select Man of the Match
5. Match auto-saves as completed
6. Points table auto-updates
7. Player stats auto-recalculate

---

## Scoring Panel Features

### Live Display (Admin View)
- Score with run rate
- Striker/Non-stiker/Bowler cards
- Current over balls
- Last 6 balls
- Ball-by-ball timeline
- Batting & bowling scorecards
- Partnership tracker
- Field diagram with shot regions

### Public Live View (`/live`)
- Auto-refreshes every 5 seconds
- Score, overs, wickets
- Target (2nd innings)
- Powerplay indicator
- Estimated win probability
- Required per ball
- Boundary count (4s/6s)
- Fielding summary
- Over-by-over bar chart
- Worm graph (cumulative comparison)
- Match highlights
- Team form (last 5 results)
- Full scorecards
- Ball-by-ball timeline with regions

### Custom Highlights
Admin can add custom match highlights during scoring:
1. Go to scoring panel → "Custom Highlights" section
2. Select icon, enter text + label
3. Saves instantly → appears on public view above auto-generated highlights

---

## Analytics Dashboard

**URL**: `/admin/analytics` (admin only)

**Tracked events:**
- Match scored (each ball submission)
- Match completed
- Undo usage
- Search queries
- Predictions submitted
- Quiz attempts
- POTM votes

**Dashboard shows:**
- 8 all-time counters
- 30-day period counters
- Trend charts (matches, page views, undo, searches)
- Top search terms
- Most visited pages
- Recent events feed

---

## API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/health` | GET | Public | DB status, version, commit SHA |
| `/api/teams` | GET | Public | All teams |
| `/api/players` | GET | Public | All players |
| `/api/matches` | GET | Public | All matches |
| `/api/matches/live` | GET | Public | Current live match |
| `/api/search?q=` | GET | Public | Search players/teams/matches/news |
| `/api/head-to-head` | GET | Public | H2H stats |
| `/api/live/summary` | GET | Public | Live match full summary |
| `/api/live/balls` | POST | Admin | Submit ball event |
| `/api/live/balls/undo` | POST | Admin | Undo last ball |
| `/api/admin/analytics` | GET | Admin | Analytics data |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Auth encryption key |
| `NEXTAUTH_URL` | Yes | Production URL |
| `ADMIN_PASSWORD` | Yes | Admin panel login password |
| `AUTH_GOOGLE_ID` | No | Google OAuth (for predictions) |
| `AUTH_GOOGLE_SECRET` | No | Google OAuth (for predictions) |

---

## Database Management

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to DB
npx prisma db push

# Deploy migrations (production)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

---

## Deployment (Vercel)

```bash
# Push code
git add .
git commit -m "update"
git push

# Vercel auto-deploys from main branch
# Manual deploy:
npx vercel --prod
```

---

## Health Check

```
GET /api/health
```
Returns: `{ status, database, version, commit, config, timestamp }`

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Build fails | Run `npx prisma generate` first |
| DB connection error | Check `DATABASE_URL` in `.env.local` |
| Admin login fails | Check `ADMIN_PASSWORD` env var |
| Scoring not saving | Check network, try refresh |
| Stats wrong | Run `/api/live/sync-stats?matchId=X` |
| Migration pending | Run `npx prisma migrate deploy` |
