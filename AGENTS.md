# GSCL Engineering Standards (Performance & Mobile)

These rules apply to EVERY new page, component, API, and query in this repo. They are the "future-proof rules" agreed for v1.3.6 (Performance & Mobile Optimization).

## Never break existing functionality
- Do NOT change scoring logic, formulas, cricket rules, database schema semantics, or existing features for performance reasons.
- Do NOT remove or modify existing features. Only optimize rendering, loading, queries, and responsive UI.
- Preserve 100% existing functionality. Verify with `npx tsc --noEmit` and `npm run build` after every change.

## Layout & responsiveness
- Never create fixed widths (`w-[800px]`, `w-[600px]`, etc). Use `max-w`, `w-full`, `minmax()`, `min-w` only inside `overflow-x-auto` scroll containers for tables.
- Use responsive Tailwind utilities everywhere: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`. Never use a bare `grid-cols-N` with N > 2 without a responsive prefix (stat panels are the exception).
- Every table must be wrapped in `overflow-x-auto` (mobile scroll container) or become responsive cards.
- Every form input must be `w-full`. Rows of inputs must use `flex flex-wrap gap-3` so they stack on small screens.
- Every dialog/modal must fit 320px screens: inner content needs `mx-4` and `max-w-md` (or similar).
- Buttons and icon buttons need a minimum ~44px touch target: use `h-10 w-10` + flex centering, not `p-1` + tiny icon.
- Use `clamp()` or responsive sizing (`text-3xl sm:text-4xl`) for major headings.

## Performance & bundle
- Every heavy component (charts, worm chart, field diagram, lightbox, admin analytics graphs, live widgets below the fold) must be lazy-loaded with `next/dynamic` plus a loading skeleton. Charts: use `next/dynamic` and keep heavy libs out of the initial bundle.
- Every expensive calculation (sorted tables, filtered lists, points table, leaderboards, records, quiz scores) must use `useMemo`/`React.memo`/`useCallback`.
- Every major route needs a `loading.tsx` skeleton.
- Remove unused imports (especially lucide-react icons). Tree-shake.
- No duplicate helper functions or utilities.

## Images
- Use `next/image` whenever possible. For user-uploaded/external images where `next/image` can't be used, at minimum add `loading="lazy"` (except above-the-fold hero/banner which uses `priority`).
- Add `loading="lazy"`, `sizes`, and `priority` only for above-the-fold images.
- Prefer the optimized assets in `public/images/optimized/*.webp` over raw PNGs/JPGs.

## Database & API
- Only fetch required columns: always use `select:` on Prisma queries; avoid `include` of whole relations when a subset is enough.
- Never run queries inside loops (no N+1). Use `include`/`select` or batched queries.
- Batch independent sequential queries with `Promise.all`.
- Every admin list (players, teams, matches, news, gallery, reviews, notifications, analytics) must support pagination (`take`/`skip`) — never load thousands of rows.
- Every search must be debounced (300ms).
- Every GET API should return only required data, avoid nested responses, and set cache headers where safe.

## Caching
- Cache frequently-used queries (records, points table, awards, team stats, player stats, hall of fame) with `unstable_cache` or React `cache`.
- Invalidate caches after: match completion, restore, recalculate, admin updates.

## Accessibility
- Buttons must have accessible labels (`aria-label`).
- Images must have `alt`.
- Inputs must have labels or `aria-label`.
- Keyboard navigation, visible focus (`focus:` styles), and color contrast.

## Verification (before shipping any change)
- `npx tsc --noEmit` passes.
- `npm run build` passes.
- No feature regression (Practice Center, Live Scoring, Super Over, Playoffs, Season Quiz, Awards, Records).
- Mobile responsive, no horizontal page scroll.
- Targets: Lighthouse Performance 95+, Accessibility 95+, Best Practices 95+, SEO 95+.
