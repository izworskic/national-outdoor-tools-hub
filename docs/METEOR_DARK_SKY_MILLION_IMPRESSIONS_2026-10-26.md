# Meteor Shower + Midwest Dark Sky — Million Impressions Audit
Date: October 26, 2026

## Scope and owner
Authoritative code repository: `izworskic/national-outdoor-tools-hub`. Public root: `https://chrisizworski.com/national-tools/`.
This quality pass uses the established `chrisizworski-com/MILLION_IMPRESSIONS_PLAYBOOK.md`. It does **not** introduce a separate SEO strategy or automatic site-wide run on every merge.

## Verified baseline
- Search Console Web impressions, clicks, 28-day CTR, average position and query rows: **NOT AVAILABLE to this code-only run**.
- GA4 engagement and AdSense revenue attributable to these pages: **NOT AVAILABLE**.
- Ranking gains and organic CTR changes: **NOT MEASURED**. No claim of search uplift.
- Existing network: 1 meteor tracker, 1 Great Lakes atlas, 7 state/region guides, 24 original destination pages = **33 URLs**.

## Changes made
1. Corrected the cross-year Quadrantids 2027 peak to the **IMO's published January 4, 2027 03:30 UTC** timing, overriding a previous approximate January 3 seasonal default. Other annual future shower maxima remain approximate pending dated official confirmation.
2. Added an informative, crawlable 2026–27 peak-night reference beneath the live viewing verdict. It is clearly separate from local NWS cloud/darkness scoring. Source: https://www.imo.net/calendar/.
3. Added explicit WebApplication publisher/creator identity referencing `https://chrisizworski.com/#person`.
4. Created a scoped quality benchmark for all 33 current URLs, with source/canonical metadata, mobile controls, decision wiring, access caveats, park navigation, no exposed secrets, and sitemap consistency.
5. Added an opt-in GitHub Actions workflow that can be started manually; **not** on each push or merge after the release branch.

## Evidence
- First quality run found one overly narrow textual validation for the atlas disclaimer; the site's existing wording was factually correct. The evaluator was corrected.
- Successful owner GitHub Actions run: https://github.com/izworskic/national-outdoor-tools-hub/actions/runs/40308894620
- Results: **33 pages audited, every page 100/100 in the static publication gate**, with **18/18** focused unit tests passing.
- Audit JSON is stored as an Actions artifact in that run and records unavailable GSC/GA4/AdSense as `null`.
- This is **not** evidence of 33 pages indexed, actual live visual/browser success or increased impressions.

## Search / monetization implications
The primary Meteor Shower Tonight page remains the canonical answer for real 72-hour seeing conditions. Michigan and Midwest hubs make state-level choices. Individual place pages address specific access, geography, and observing decisions. Resist publishing generic additional city/park pages solely for indexing volume.
Preserved meteor/NWS data flow, MAP/CARTO fallback, 24 original destination URLs and link structure; no change to Ads scripts, paid API use, or auto-ad placement.

## One next action
When these pages have sufficient exposure, obtain verified GSC Web page/query performance (7 and rolling 28 days) for the meteor tracker, Michigan guide, Headlands and Port Crescent. Select **one** high-impression, weak-CTR query/page pairing for measured improvement rather than launching more thin destinations.
