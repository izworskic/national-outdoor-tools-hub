# Agent boundary

This repository owns National Outdoor Tools **network orchestration**, not individual decision engines.

It may change:
- the National Tools landing page and intent hubs,
- cross-tool navigation/discovery,
- national network governance contracts and candidate prioritization,
- production validation across canonical public routes.

It must not copy implementation from sibling tool repositories. Shared location/freshness helpers belong in `izworskic/national-outdoor-core`. Tool-specific behavior belongs in the owning tool repo. Cross-tool behavior must use explicit versioned package or HTTP contracts.

Preserve existing public canonical URLs unless a migration issue explicitly authorizes a URL change.

## Optional engine discovery contract

Before inventing new cross-tool logic, consult `benchmarks/national-engine-registry.json` and `docs/ENGINE_REGISTRY.md` **when an existing engine may plausibly answer part of the problem**.

The registry is discovery-only. It does not require reuse.

- A tool may reuse one engine, several engines, or none.
- Never distort a product, source model, scientific/biological assumptions, UX, or search intent merely to fit a registered engine.
- Prefer a stable package or HTTP contract when reuse is genuinely beneficial.
- Do not import internal files from sibling repositories as cross-repo dependencies.
- Do not extract working code merely because it looks reusable. Prefer extraction after a real second consumer exists and the common contract can be tested against both products.
- Treat `pattern-reference` entries as architectural examples, not formulas to copy. Domain-specific thresholds and weights require independent validation.
- If a purpose-built implementation is clearer, safer, more accurate, or materially better for the user, build it instead and register the new capability after it proves useful.

Registration means **available to consider**, never **required to use**.

## Mandatory analytics contract

Read `docs/ANALYTICS_CONTRACT.md` before creating, extracting, publishing, or routing any public tool or page.

Every new ChrisIzworski.com network tool or page, including a new standalone repository, must ship with Google Analytics 4 measurement ID `G-Y5D2V2W7HN` unless the property has an explicitly documented separate measurement ID. Freighter View Farms is part of this shared measurement network and uses `G-Y5D2V2W7HN`.

Implementation must be inherited, not remembered page by page:
- static/generated sites: use an idempotent build/deploy injector that covers every emitted HTML document;
- Next.js or other app frameworks: install the tag in the root/global layout or document shell;
- server-rendered HTML routes: route output through the same shared analytics wrapper;
- generated long-tail/location pages: verify the generated output contains the tag;
- restrictive CSPs: explicitly allow the Google tag and collection endpoints required by GA4.

A release is not complete until representative production HTML is checked for the expected measurement ID. New standalone repositories must adopt this contract before they are added to the public tool network.
