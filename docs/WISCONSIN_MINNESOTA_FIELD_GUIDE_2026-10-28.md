# Wisconsin + Minnesota After Dark — FIELD_GUIDE_V1 research and implementation

Date: 2026-10-28. Scope: existing canonical state guides only; no newly indexable URLs.

## Visitor intent contracts

**Wisconsin:** What time, observing area and park access rules make a Newport State Park stargazing trip feasible? Only one WI destination exists in the verified registry. Avoid synthetic Wisconsin statewide score. Preserve Newport individual live sky planner.

**Minnesota:** Should I plan a road-accessible Voyageurs mainland view or a permit-requiring Boundary Waters wilderness trip? They are not equivalent access products. Do not route anyone to a wilderness-region centroid. Weather forecast points remain indicative only.

## Official sources, checked October 28, 2026

1. Wisconsin DNR Newport homepage https://dnr.wisconsin.gov/topic/parks/newport — year-round published 06:00–23:00 hours, vehicle sticker requirement. Property notices: June 22, 2026 Lot 3 dark-sky viewing area construction, area still open as of that dated notice; July 17, 2026 trails reopening after 2025 storm blowdown. These are dated—not live—status descriptions.
2. https://dnr.wisconsin.gov/topic/parks/newport/darksky — Newport as International Dark Sky Park and advice to scout observing areas by daylight. No assumption park open past 23:00 based on sky forecasts.
3. https://dnr.wisconsin.gov/topic/parks/newport/recreation — Lot 3 near picnic/beach area, winter trail use. No parking capacity or live winter conditions inferred.
4. https://www.nps.gov/voya/planyourvisit/stargazing.htm — NPS specifically names Rainy Lake Visitor Center **upper parking lot** and **Meadwood Road Day Use Area** off Ash River Visitor Center Road as dark-sky areas; it also gives alternate lakeshores and camping docks without promising accessibility.
5. https://www.nps.gov/voya/planyourvisit/basicinfo.htm — park 24 hours year-round, but visitor services vary; much of Voyageurs needs watercraft, thin-ice hazards in spring/fall. NPS stargazing viewing spots may be mainland reachable; always check local notices.
6. https://www.recreation.gov/permits/233396 — BWCAW permits required for all visitors. May 1–Sep 30 quota for overnight visits and motorized day use; Oct 1–Apr 30 self-issued; nonmotorized day use self-issued year-round. User should choose an actual entry point and legal route.

## Images and rights

Per-file provenance and rights in `data/northern-dark-sky-field-guide-photos.json`. Four pictures used in different location-accurate contexts:
- Newport Milky Way / Yinan Chen, CC BY 3.0: https://commons.wikimedia.org/wiki/File:Milky_Way_Above_Lake_Michigan_(157749753).jpeg — explicit original description "Newport State Park" and 2016 capture date. Long exposure, not visible sky expectation.
- Newport lakeshore / Yinan Chen, public-domain dedication: https://commons.wikimedia.org/wiki/File:Gfp-wisconsin-newport-state-park-bay-and-shoreline.jpg — archival daytime image.
- Voyageurs Rainy Lake / Yinan Chen, public-domain dedication: https://commons.wikimedia.org/wiki/File:Gfp-minnesota-voyaguers-national-park-rainy-lake-bay.jpg — archival landscape.
- Boundary Waters campsite sunset / Crary033, CC BY-SA 4.0: https://commons.wikimedia.org/wiki/File:Boundary_Waters_sunset.jpg — author's own image, dated 2018; attribution and display-crop notice required. Respect share-alike for any redistributed image derivatives.

## Architecture and quality

The generator `scripts/generate-midwest-dark-sky.mjs` emits both pages and copies a scoped CSS file. New `scripts/northern-field-guides.mjs` changes only editorial HTML for Wisconsin and Minnesota. It keeps existing `darkSkyPayload`, shared map, NWS meteor forecast and area matching, `compare4`, geolocation opt-in, state filters, destination card population and all existing routes. No live/current claims from photos, maps, or forecast scores. Existing Ads and GA4 untouched.

Acceptance: `npm test`, owning repository Vercel build, production 200 and canonical check, inspector no-JS static content, 390px and 1366px image/credit/map checks, any ad overlap disclosed without editing ad code. Do not assert GSC uplift or formal >90 Field Guide score without full evaluation.
