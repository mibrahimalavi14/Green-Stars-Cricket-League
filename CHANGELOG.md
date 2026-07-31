# Changelog

## v1.1.0 (Launch Polish)
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
