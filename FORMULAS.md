# GSCL — SCORING & FORMULAS REFERENCE

Single source of truth: `src/lib/config.ts` (MATCH_CONFIG), `src/lib/stats.ts`, `src/lib/utils.ts`,
`src/lib/fair-play.ts`, `src/lib/records.ts`. All rules are config-driven; this document mirrors the code.

## 1. Match Format (T4 — 4-over league)

| Rule | Value |
|------|-------|
| Overs per innings | 4 |
| Balls per over | 6 |
| Legal balls per innings | 24 |
| Wickets per innings | 10 |
| Max overs per bowler | 1 (6 balls) |
| Super Over | 6 balls, max 2 wickets |

**Innings total** = `runs` (bat runs + overthrows + penalty runs) + `extras` (wides + no-balls + byes + leg-byes).
Every innings stores: `runs`, `wickets`, `balls`, `extras`.

Per-ball attribution rules:
- **Overthrow runs** are credited to the striker and added to the team total on the same
  legal delivery (`overthrows`), shown as `+NO` in over-by-over.
- **Dead ball** is a **non-delivery**: it does not advance the over, give the bowler a ball,
  or credit runs to a batsman/bowler.
- **Penalty runs** are added to the team/innings total only — never to a batsman's or
  bowler's figures — and are not a legal delivery.

## 2. Innings End / Match Complete

A match is complete when **ANY** of these happen (auto-detected, no manual result needed):
1. 24 legal balls bowled in the 2nd innings, or
2. 10 wickets lost in the 2nd innings, or
3. 2nd innings total > 1st innings total (target chased).

**Run chase caveat:** balls bowled counts **legal deliveries only** — wides and no-balls do
not consume a ball.

## 3. Result Calculation

Let `t1 = team1 runs + extras`, `t2 = team2 runs + extras`:
- `t1 > t2` → **"Team1 won by X runs"** where `X = t1 − t2`
- `t2 > t1` → **"Team2 won by X wickets"** where `X = 10 − wicketsLost(team2)`
- `t1 = t2` → **Tied** → Super Over decides the winner

## 4. Super Over (PSL-style, every match stage)

- Triggered when both innings totals are equal.
- Each team bats 1 over (6 balls), max 2 wickets.
- Higher Super Over score wins. Super Over tie → another Super Over, **unlimited** until a winner.
- Winner team gets the win in the points table (not a tie).

## 5. Points Table

**Base points** = `Wins × 2 + Ties × 1 + No Results × 1`

| Result | Points |
|--------|--------|
| Win | 2 |
| Tie (including Super Over win = 2) | 1 |
| No Result / Abandoned | 1 |
| Loss | 0 |

**League penalties** (Admin → Penalties) are deducted:
`Final points = max(0, basePoints − totalPenaltyPoints)`

**Tie-break sorting:** `points (desc)` then `NRR (desc)`.

**Playoff qualification (official):** `qualifiedTeams = totalTeams <= 5 ? 3 : 4`.
Top-N teams qualify (green rows, `🏆 Qualified` badge); the rest are eliminated
(red rows, `❌ Eliminated` badge). The playoff format shown under the points table:
- ≤5 teams → Q1 (#1 vs #2), Eliminator (#3 vs Q1 Loser), Final.
- ≥6 teams → Q1 (#1 vs #2), Eliminator (#3 vs #4), Q2 (Q1 Loser vs Eliminator
  Winner), Final.

## 6. Net Run Rate (NRR)

```
NRR = (runsFor / oversFor) − (runsAgainst / oversAgainst)
```
- `overs = balls / 6`
- **All-out rule (ICC standard):** if a team is bowled out, it is credited with the **full
  24 balls**, not the actual balls faced. Otherwise actual balls are used.
- Runs include extras; NRR displayed to 3 decimal places.

## 7. Player Batting Stats

| Stat | Formula |
|------|---------|
| Innings | count of player matches |
| Average | `runs / dismissals` (dash if 0 dismissals) |
| Strike Rate | `(runs / ballsFaced) × 100` (2 dp) |
| Highest Score | max single-innings runs (not-out preferred on tie) |
| Fifties | innings with `50 ≤ runs < 100` |
| Hundreds | innings with `runs ≥ 100` |
| Not Outs | innings with `ballsFaced > 0` and not out |
| Ducks | innings with `runs = 0` and out |

## 8. Player Bowling Stats

| Stat | Formula |
|------|---------|
| Economy | `runsConceded / (ballsBowled / 6)` (2 dp) |
| Bowling Average | `runsConceded / wickets` |
| Bowling Strike Rate | `ballsBowled / wickets` (1 dp) |
| Best Bowling | most wickets, then fewer runs, then fewer balls |
| 4-for / 5-for / hat-tricks | innings with ≥4 / ≥5 wickets / 3 in-a-row |

## 9. Man of the Match — Impact Score (automatic)

```
Impact Score = Runs × 0.4 + Wickets × 8 + Catches × 5 + Run-Outs × 5 + Stumpings × 5
```
Highest score wins. **Tie-breakers** (in order): more wickets → more runs → higher strike rate →
more catches. Admin override only if all tie-breakers are equal.

## 10. Fair Play Points

```
FairPlay = 100 − (5 × warnings) − (10 × slow-over-rate) − (15 × behavior) − penaltyPoints + (2 × sportsmanship)
```
- Minimum 0.
- Default sportsmanship = 10.
- Table sorted by FairPlay points, then sportsmanship.

## 11. Records (auto-computed)

| Record | Rule |
|--------|------|
| Highest team score | max `runs + extras` in a completed innings |
| Lowest team score | min innings score (min 12 balls) |
| Fastest fifty | fewest balls to reach 50 (context: vs team, venue) |
| Most dot balls | most dot balls by a player |

Records are recomputed via `computeAllRecords(workspaceId)` — official workspace only.

## 12. Practice Center

- **Scoring accuracy** = `(1 − undoCount / legalBalls) × 100`, clamped 0–100.
- Practice workspace data never feeds official stats/records/awards/snapshots.
- "Copy Setup → Official" copies **setup only** (teams, XI, toss, officials, venue) — no runs/stats.

## 13. Dashboard/Cap Displays

- Orange Cap = most runs; Purple Cap = most wickets (computed across completed matches).
- All aggregates recalculated after every completed match (`recalcPlayerStats(seasonId?)`,
  `recalcPointsTable(seasonId)`), scoped to the season/workspace.

---

*Keep this in sync with `MATCH_CONFIG` in `src/lib/config.ts` — it is the only source of truth.*
