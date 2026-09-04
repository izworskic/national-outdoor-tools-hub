# Chris Izworski Network Analytics Contract

Effective: 2026-09-04

## Shared measurement property

All public Chris Izworski network tools and pages use Google Analytics 4 measurement ID:

`G-Y5D2V2W7HN`

This includes chrisizworski.com, its subdomains, Michigan Birding Report, Michigan Trout Report, Great Lakes Levels, Freighter View Farms, and standalone/public tool applications that belong to the same measurement network.

## Required implementation for every new public surface

Analytics must be inherited from a shared rendering/deployment layer, not copied manually into individual pages.

- Static or generated HTML: run an idempotent deploy/build injector across every emitted `.html` document.
- Next.js/App Router: load GA4 from the root layout.
- Next.js/Pages Router: load GA4 from the global document/app shell.
- Server-rendered HTML: use a shared HTML analytics wrapper.
- Generated SEO/location pages: the generator or post-generation build stage must guarantee coverage.
- WordPress-hosted properties: install the same measurement ID through the platform's supported analytics/tag integration so all rendered pages inherit it.
- CSP-protected apps: permit the Google tag script and GA collection/connect endpoints needed by the implementation.

## New repository gate

A newly extracted or newly created public tool repository is not production-ready until all of these are true:

1. `G-Y5D2V2W7HN` is installed at the shared/root/build layer.
2. New pages created through the normal framework or generator inherit it automatically.
3. A regression check prevents accidental removal of the measurement contract.
4. Representative built or production HTML is verified to contain the measurement ID.
5. Analytics does not use precise coordinates or other sensitive location values as user identity.

## Release verification

Do not infer production coverage from a source commit alone. Confirm that the production deployment corresponds to the analytics change and inspect representative rendered HTML for `G-Y5D2V2W7HN`.

If a hosting project is not linked to its source repository, treat source and production as separate states and explicitly redeploy or relink before calling analytics live.
