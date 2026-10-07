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

## Adjacent Everyday Decisions lane

The public `/national-tools/` hub remains outdoor-first. It may also surface a clearly separated **Everyday Decisions** family for nationally useful decision engines that do not belong to an outdoor region.

Rules:
- Keep Everyday Decisions visually and taxonomically separate from national outdoor utilities and regional destination collections.
- Do not apply outdoor scoring/source doctrine to a non-outdoor engine merely because it is discoverable from this hub.
- The individual engine remains authoritative in its owning repository and keeps its existing canonical URL.
- Add a dedicated intent filter only when the lane has a real user decision, not to create a generic miscellaneous bucket.
- A new everyday tool must still appear once in the single catalog and once in the ordered ItemList.

Current first member: `https://chrisizworski.com/can-i-afford-this-house/` — **Can I Afford This House? True Monthly Cost**.

## Landing-page contract

- Keep one visible catalog card per tool or destination suite. Persona, search, and seasonal controls filter those same cards.
- Add new discovery directly to `public/national-tools/index.html` and its `ItemList`; do not stack build-time HTML injectors or repeat a tool across intent, featured, and library surfaces.
- Run `scripts/verify-directory.mjs` in the deploy build so card IDs, crawlable URLs, structured data, and the single-catalog rule cannot drift.
