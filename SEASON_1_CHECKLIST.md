# GSCL v1.0.1 — SEASON 1 LAUNCH CHECKLIST

Complete this checklist before Season 1 goes live.

## Infrastructure

- [ ] Vercel deployment successful
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate valid
- [ ] Environment variables set in Vercel:
  - [ ] `DATABASE_URL` (Neon connection string)
  - [ ] `ADMIN_PASSWORD`
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `NEXTAUTH_URL`
  - [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  - [ ] `VAPID_PRIVATE_KEY`
- [ ] Neon database accessible
- [ ] Health endpoint returns `{"status":"ok","database":"connected"}`

## Database

- [ ] `prisma db push` completed successfully
- [ ] All tables exist (Match, Player, Team, Season, Inning, etc.)
- [ ] SeasonSnapshot table exists
- [ ] MatchNotes table exists
- [ ] SuperOverInnings table exists
- [ ] BallEvent table exists
- [ ] No orphaned records
- [ ] Backup verified (manual pg_dump completed)

## Authentication & Security

- [ ] Admin login works
- [ ] Rate limiting active (test: rapid OTP requests)
- [ ] Input validation working (test: invalid data submission)
- [ ] DB constraints enforced (test: duplicate team+player name)
- [ ] Audit logs recording actions

## Scoring Engine

- [ ] Ball-by-ball scoring works
- [ ] Wide balls (+1 + bat runs)
- [ ] No-ball (+1 + bat runs + byes/leg byes)
- [ ] Byes
- [ ] Leg Byes
- [ ] Wickets: bowled, caught, lbw, stumped, run out, hit wicket
- [ ] Retired Hurt (no wicket credit)
- [ ] Retired Out (wicket credit)
- [ ] Undo works (multiple undos)
- [ ] Innings break after 4 overs
- [ ] Innings break after 10 wickets
- [ ] Auto-match completion
- [ ] Result auto-generation
- [ ] Winner identification correct
- [ ] NRR calculation correct

## Super Over

- [ ] Super Over triggers on tie
- [ ] Super Over scoring (6 balls, 2 wickets)
- [ ] Super Over result determined
- [ ] Super Over tie → second Super Over
- [ ] Unlimited Super Overs work
- [ ] Super Over history persisted

## Statistics

- [ ] Batting stats correct (runs, avg, SR)
- [ ] Bowling stats correct (wickets, econ, avg)
- [ ] Fielding stats correct (catches, stumpings, run outs)
- [ ] Points table correct
- [ ] Orange Cap standings correct
- [ ] Purple Cap standings correct
- [ ] Records page shows data
- [ ] Partnership engine working

## Administration

- [ ] Create/edit/delete teams
- [ ] Create/edit/delete players
- [ ] Create/edit matches
- [ ] Set Playing XI (squad lock)
- [ ] Match officials recording
- [ ] Match notes (weather, pitch, etc.)
- [ ] POTM voting setup
- [ ] News management
- [ ] Gallery management

## Export & Sharing

- [ ] CSV export: Points Table
- [ ] CSV export: Player Stats
- [ ] CSV export: Matches
- [ ] Shareable Scorecard displays on match page

## Data Integrity

- [ ] Season Snapshot auto-saves after match
- [ ] Data Restore: recalculate match
- [ ] Data Restore: recalculate season
- [ ] Data Restore: recalculate all

## Fan Experience

- [ ] Live score page loads
- [ ] Predictions work
- [ ] Quiz works
- [ ] POTM voting works
- [ ] Notifications subscribed
- [ ] Search works
- [ ] Mobile responsive

## Stress Test (Concurrency)

- [ ] Two scorers open same match simultaneously
- [ ] Both submit a ball at the same time
- [ ] No duplicate balls created
- [ ] Score remains consistent
- [ ] Undo works under concurrent load
- [ ] Super Over works after concurrent scoring

## Final Verification

- [ ] Complete T4 match end-to-end (manual)
- [ ] Verify all 14 record types
- [ ] Verify season snapshot saved
- [ ] Verify CSV export downloads
- [ ] Verify shareable scorecard renders
- [ ] Verify audit logs populated
- [ ] Verify analytics events firing
- [ ] Health endpoint stable

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead Scorer | | | |
| Admin | | | |
| QA Tester | | | |
| Dev Team | | | |

---

**Launch Date**: _______________
**Go/No-Go Decision**: _______________
