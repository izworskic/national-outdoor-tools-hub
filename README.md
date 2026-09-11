# National Outdoor Tools Hub

Extracted from `izworskic/chrisizworski-com` to reduce agent navigation cost and blast radius.

**Ownership:** National tools landing/search hubs, cross-tool navigation, network governance contracts, candidate prioritization, and production-level validation. It does **not** own individual decision-engine implementation.

**Authoritative network governance:**
- `docs/NATIONAL_OUTDOOR_TOOLS_MASTER_PROMPT.md`
- `benchmarks/national-outdoor-tools.json`
- `benchmarks/national-source-lifecycle.json`
- `benchmarks/national-location-admission.json`
- `benchmarks/national-intelligence-candidates-2026-09-02.json`

Individual tools remain authoritative in their own repositories. Shared location/freshness code remains authoritative in `izworskic/national-outdoor-core`.

Public canonical URLs remain on `chrisizworski.com` and are composed through the site-shell router.

## Landing-page contract

- Keep one visible catalog card per tool or destination suite. Persona, search, and seasonal controls filter those same cards.
- Add new discovery directly to `public/national-tools/index.html` and its `ItemList`; do not stack build-time HTML injectors or repeat a tool across intent, featured, and library surfaces.
- Run `scripts/verify-directory.mjs` in the deploy build so card IDs, crawlable URLs, structured data, and the single-catalog rule cannot drift.
