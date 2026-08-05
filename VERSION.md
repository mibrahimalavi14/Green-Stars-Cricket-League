# GSCL — VERSION

| Field | Value |
|-------|-------|
| **Current Version** | v1.1.1 |
| **Release Date** | August 2026 |
| **Status** | Production — Season 1 |
| **Feature Freeze** | Yes |
| **Stable Production Tag** | `v1.1.0-season1` (initial production release) |
| **Current Release Tag** | `v1.1.1-season1` (patch — certificate fix)

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

## Versioning Policy (Semantic)

| Version | Purpose |
|---------|---------|
| v1.1.0-season1 | Initial production release (immutable) |
| v1.1.1-season1 | Bug fix #1 — certificate deployment fix |
| v1.1.2+ | Future bug/security fixes for v1.1.x |
| v1.2.0 | Minor, backward-compatible improvements (if feature freeze lifts) |
| v2.0.0 | Major Season 2 features |

## v2.0 Backlog (post-Season 1 feedback)

- PWA / Offline Support
- WebSockets / Live Updates
- Image Optimization (WebP/AVIF)
- Error Monitoring (Sentry)
- Season Report PDF
- Social Media Result Image
