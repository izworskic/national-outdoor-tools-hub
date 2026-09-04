# Agent boundary

This repository owns National Outdoor Tools **network orchestration**, not individual decision engines.

It may change:
- the National Tools landing page and intent hubs,
- cross-tool navigation/discovery,
- national network governance contracts and candidate prioritization,
- production validation across canonical public routes.

It must not copy implementation from sibling tool repositories. Shared location/freshness helpers belong in `izworskic/national-outdoor-core`. Tool-specific behavior belongs in the owning tool repo. Cross-tool behavior must use explicit versioned package or HTTP contracts.

Preserve existing public canonical URLs unless a migration issue explicitly authorizes a URL change.

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
