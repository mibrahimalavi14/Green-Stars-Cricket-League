# GSCL v1.0.1 — DISASTER RECOVERY

Backup and restore procedures for production database.

## Database

- **Provider**: Neon PostgreSQL
- **Cluster**: `ep-autumn-art-aodvkqzb`
- **Connection**: `postgresql://neondb:***@ep-autumn-art-aodvkqzb.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

## Backup Strategy

### Automatic (Neon)
- Neon takes automatic snapshots every 24 hours
- Snapshots retained for 7 days (free tier) or 30 days (paid)
- Point-in-time recovery available on paid plans

### Manual Backup
```bash
# Export full database
pg_dump "postgresql://neondb:***@ep-autumn-art-aodvkqzb.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" > gscl-backup-$(date +%Y%m%d).sql

# Export specific tables only
pg_dump -t matches -t innings -t players -t teams "postgresql://..." > gscl-tables.sql
```

### Backup Schedule
| What | When | Retention |
|------|------|-----------|
| Neon auto-snapshot | Daily | 7 days (free) |
| Manual pg_dump | Before each match day | Keep 5 latest |
| Schema export | Before any migration | Keep all |

## Restore Procedures

### Scenario 1: Single Match Data Corruption
```bash
# 1. Go to Admin → Restore
# 2. Enter Match ID
# 3. Click "Restore"
# This recalculates all stats for that match
```

Or via API:
```bash
curl -X POST https://green-stars-cricket-league.vercel.app/api/admin/recalculate \
  -H "Content-Type: application/json" \
  -d '{"action":"restore_match","matchId":"MATCH_ID_HERE"}'
```

### Scenario 2: Season Stats Corrupted
```bash
# Admin → Restore → Select Season → Recalculate
# This rebuilds: points table, player stats, snapshots
```

Or via API:
```bash
curl -X POST https://green-stars-cricket-league.vercel.app/api/admin/recalculate \
  -H "Content-Type: application/json" \
  -d '{"action":"recalc_season","seasonId":"SEASON_ID_HERE"}'
```

### Scenario 3: Full Database Corruption
```bash
# 1. Get latest backup file
# 2. Restore to Neon:
psql "postgresql://neondb:***@ep-autumn-art-aodvkqzb..." < gscl-backup-20260725.sql

# 3. Run prisma db push to sync schema
npx prisma db push

# 4. Recalculate everything
curl -X POST https://green-stars-cricket-league.vercel.app/api/admin/recalculate \
  -H "Content-Type: application/json" \
  -d '{"action":"recalc_all"}'
```

### Scenario 4: Schema Migration Failure
```bash
# If prisma migrate deploy fails with P3005:
npx prisma db push --accept-data-loss

# Then verify:
npx prisma db seed
```

## Key Data to Protect

| Data | Criticality | Recoverable? |
|------|------------|-------------|
| Match results | Critical | Yes (from snapshot) |
| Ball-by-ball data | High | Partially |
| Player stats | Critical | Yes (recalculable) |
| Points table | Critical | Yes (recalculable) |
| Season snapshots | Medium | No (historical) |
| User predictions | Low | No |
| POTM votes | Low | No |
| Audit logs | Medium | No |

## Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| Single match restore | 5 min | 0 (recalculated) |
| Season recalculate | 10 min | 0 (recalculated) |
| Full database restore | 30 min | 24 hours |
| Full recalculate | 15 min | 0 |

## Monitoring

### Health Check
```bash
curl https://green-stars-cricket-league.vercel.app/api/health
```
Expected: `{"status":"ok","database":"connected","version":"1.0.1"}`

### Check Database Directly
```bash
# Using Neon SQL Editor (dashboard.neon.tech)
SELECT count(*) FROM "Match";
SELECT count(*) FROM "Player";
SELECT count(*) FROM "SeasonSnapshot";
```

## Contact

- **Neon Dashboard**: https://console.neon.tech
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub**: https://github.com/mibrahimalavi14/Green-Stars-Cricket-League
