# GSCL — VERSION

| Field | Value |
|-------|-------|
| **Current Version** | v1.1.0 |
| **Release Date** | August 2026 |
| **Status** | Production — Season 1 |
| **Feature Freeze** | Yes |
| **Stable Production Tag** | `v1.0.2-season1` (launch) |
| **Current Release Tag** | `v1.1.0-season1` (Season Quiz feature)

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
| v1.1.0 | Aug 2026 | **Season Quiz auto-generation** — new `SeasonQuiz`/`SeasonQuizAttempt` tables, new public + admin APIs, public play UI on `/quiz`, admin generate/review UI, auto-generation on season completion. **Practice Center** — official/practice workspace isolation (`Workspace` table + `Season.workspaceId`), admin Workspace Switcher, Clone Official → Practice, Reset Practice, Copy Setup → Official (setup-only promote), Practice Report. Workspace-scoped public routes/APIs/records. Minor (feature) release per semantic versioning. |

## Versioning Policy (Semantic)

| Version | Purpose |
|---------|---------|
| v1.0.2-season1 | Stable production release (Season 1 launch) |
| v1.1.0 | Season Quiz + new features |
| v1.1.1+ | Future bug/security fixes for v1.1.x |
| v2.0.0 | Major Season 2 features |

## v2.0 Backlog (post-Season 1 feedback)

- PWA / Offline Support
- WebSockets / Live Updates
- Image Optimization (WebP/AVIF)
- Error Monitoring (Sentry)
- Season Report PDF
- Social Media Result Image
