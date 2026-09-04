# MASTER EXECUTION PROMPT — National Garden Water Decision Intelligence

## Role

You are the end-to-end product, data, horticulture, weather, UX, SEO, testing and release agent for a new standalone national tool owned by `izworskic/national-garden-water`.

Do not implement this decision engine in `national-planting`, `national-outdoor-tools-hub`, or `national-outdoor-core`. The hub owns discovery/orchestration; core owns shared helpers; this repository owns garden-water behavior.

## Mission

Build a no-login national garden-watering decision tool that answers:

**Do I need to water my garden today? If so, how much?**

The result must be a defensible decision derived from the garden's modeled root-zone water balance, not a generic weekly-inch rule or weather dashboard.

Canonical target:
`https://chrisizworski.com/national-tools/garden-water/`

## Governing research

Treat `docs/national-garden-water-research.md` in `izworskic/national-outdoor-tools-hub` as the product research contract. Primary authorities are:

- USDA NRCS for available water-holding capacity, soil texture, rooting depth and irrigation water management.
- National Weather Service for point/grid precipitation forecasts and Forecast Reference Evapotranspiration (FRET).
- FAO-56 for reference ET → crop ET methodology and crop/stage coefficients, supplemented with U.S. Extension/NRCS crop guidance where appropriate.
- Gardener-entered irrigation and rain-gauge observations outrank modeled assumptions for those same quantities.

## Non-negotiable product doctrine

1. Never claim actual soil moisture unless a sensor or gardener observation supplied it.
2. Never infer rainfall amount from probability of precipitation.
3. Never ignore user-entered irrigation or rain-gauge totals.
4. Never apply mapped NRCS yard soil to a container as though it describes potting media.
5. Never use “1 inch per week” as the final local algorithm; it is educational baseline context only.
6. Avoid unnecessary irrigation immediately before meaningful imminent rain when the expected amount/timing can cover the deficit.
7. Show uncertainty and fallback provenance.
8. Produce a decision before exposing methodology.

## Core decisions

The primary result must be exactly one of these user-facing states:

- **WATER TODAY**
- **WAIT**
- **CHECK SOIL FIRST**
- **HOLD FOR RAIN**

Every result must include:
- recommended application depth in inches when watering is advised;
- gallons when garden area is supplied;
- one concise reason naming the dominant drivers;
- next check time/date;
- confidence level;
- the assumptions that materially changed the answer.

## Model contract

Represent the garden as a root-zone reservoir.

At minimum model:
- available water holding capacity by soil/media profile;
- effective rooting depth by crop and growth stage;
- total available water in the modeled root zone;
- estimated depletion;
- recent effective precipitation;
- gardener-entered irrigation;
- reference ET;
- crop coefficient by crop/stage;
- estimated crop ET;
- near-term forecast precipitation amount and timing;
- bed modifier (in-ground / raised bed / container);
- mulch modifier;
- confidence/freshness.

Core equations:

`ETc = ETo × Kc`

`effective_input = effective_rain + logged_irrigation`

`depletion_next = clamp(depletion_prior + ETc - effective_input, 0, root_zone_available_water)`

Recommended irrigation must refill only an appropriate portion of the modeled deficit and must not exceed a defensible root-zone/application cap.

When the initial state cannot be reconstructed with high confidence, do not invent precision. Use a conservative initialization plus `CHECK SOIL FIRST` where warranted and explain the uncertainty.

## Data acquisition

### Location
Use the existing shared national geocode HTTP contract. Do not fork/copy the shared geocoder.

### Weather
Server-side API should retrieve:
- NWS point/grid data for quantitative precipitation and relevant forecast conditions;
- NWS FRET daily and weekly reference evapotranspiration when available;
- recent observed precipitation from an authoritative station/grid source when available.

Never make the page browser call fragile upstream government endpoints directly if the owning API can normalize/cache them.

### Soil
Use USDA NRCS Soil Data Access to resolve the point to a map unit/component/horizon profile when possible. Derive a conservative available-water estimate from sourceable horizon properties. Surface soil-source confidence and allow manual soil texture override.

### Crop profiles
Ship a versioned static dataset with source traceability for:
- crop/group;
- stage-specific Kc or defensible coefficient mapping;
- rooting-depth range/stage assumption;
- stress/depletion sensitivity where evidence supports it;
- notes/limitations.

Start with high-demand search/usefulness groups rather than hundreds of weakly sourced crops: tomato, pepper, cucumber, squash, beans, corn, brassicas, lettuce/leafy greens, carrots/root crops, onions, herbs, melons plus a generic vegetable fallback.

## User interaction

### Step 1 — location
City/ZIP or device location using the established national location behavior.

### Step 2 — garden profile
Keep initial controls compact:
- crop/crop group;
- growth stage;
- in-ground / raised bed / container;
- soil/media auto/manual;
- mulch yes/no.

### Step 3 — what the model cannot know
Ask for or clearly default:
- irrigation in the past 7 days: none or date + approximate inches;
- optional rain-gauge total;
- optional garden square footage.

Persist these locally. Do not include location, crop profile, irrigation log, rain-gauge values or garden area in analytics payloads.

## UI

Use the quiet editorial national/Michigan tool system: paper background, serif hierarchy, restrained green accents, flat surfaces, no gradients/shadows, no White Christmas styling.

Above the fold after submit:
1. large decision phrase;
2. amount;
3. why;
4. next check;
5. small confidence/source line.

Then show a compact **water in / water out / root-zone reserve / forecast rain** explanation and a seven-day balance strip.

Bury methodology/source detail below the working tool in collapsible or lower-page sections.

## Search architecture

Primary canonical only:
`/national-tools/garden-water/`

Do not make indexable ZIP/city doorway pages.

Build substantive support content only when it independently answers real watering intents, e.g. tomato watering, raised-bed watering, sandy-soil watering, watering before rain. Cross-link them to the canonical tool and Garden hub.

## Analytics

Track only coarse, privacy-safe interaction events such as:
- tool submitted;
- decision class;
- crop group category;
- bed type;
- manual soil override used yes/no;
- irrigation-history supplied yes/no;
- result error/fallback class.

Never send raw ZIP/city, coordinates, garden area, irrigation amount or rain-gauge values in analytics.

## Benchmark

Load and obey `benchmarks/national-garden-water.json` from `izworskic/national-outdoor-tools-hub` until copied as a versioned benchmark into the new owning repo.

Hard release threshold:
- score >= 92/100;
- every critical dimension >= 85;
- every veto loss = 0.

Do not self-award a score based only on file existence. Score scenario behavior and production interaction.

## Required implementation structure

At minimum create:
- `AGENTS.md`
- `README.md`
- `package.json`
- `vercel.json`
- `api/national-garden-water.js`
- `public/national-tools/garden-water/index.html`
- `public/assets/national-garden-water.css`
- `public/assets/national-garden-water-engine.js`
- `public/assets/national-garden-water-page.js`
- `public/data/national-garden-water-crops.json`
- `benchmarks/national-garden-water.json`
- `benchmarks/current-score.json`
- `tests/national-garden-water.test.js`
- `scripts/browser-smoke-production.mjs`
- `.github/workflows/verify.yml`

Keep the pure water-balance engine testable without network access.

## Required tests

Unit/regression scenarios must include:
- user logged irrigation reverses an otherwise-water decision;
- rain-gauge value overrides modeled rainfall for the relevant period;
- PoP cannot become rainfall depth;
- sandy vs loam/clay reservoir behavior;
- crop/stage coefficient changes demand;
- shallow vs deeper root-zone behavior;
- raised-bed modifier;
- container separation from NRCS yard soil;
- mulch modifier;
- imminent sufficient rain creates HOLD FOR RAIN;
- insufficient rain does not falsely create HOLD FOR RAIN;
- gallon conversion (`1 inch × 1 sq ft ≈ 0.623 gallons`);
- missing/stale FRET fallback explicitly lowers confidence;
- failed soil lookup offers manual soil path rather than failing the whole tool;
- zero/near-zero deficit cannot recommend overwatering;
- large deficit application is capped to a defensible irrigation amount with follow-up check.

## Production release sequence

1. Research/data contract complete.
2. Pure engine + fixtures + unit tests.
3. API normalization/fallbacks + contract tests.
4. Editorial UI and local garden-profile storage.
5. Benchmark score with zero vetoes.
6. Vercel preview green.
7. Real browser preview smoke green.
8. Merge owning repo.
9. Confirm owning Vercel production deployment.
10. Add main-site rewrites in `izworskic/chrisizworski-com` for canonical, API and owned assets.
11. Verify canonical through `https://chrisizworski.com`, not only the child Vercel domain.
12. Add Garden hub card in `izworskic/national-outdoor-tools-hub` and update stale garden-hub planting copy.
13. Run a production Chromium smoke on desktop and mobile that enters ZIP, selects crop/stage, supplies irrigation history and verifies decision + amount.
14. Only then call the release complete.

## Failure behavior

If an upstream source is unavailable:
- preserve the user's garden profile;
- use only an explicitly documented fallback if it remains decision-safe;
- lower confidence;
- show a human-readable error/fallback note;
- never convert missing data into false precision.

## Completion definition

The build is complete only when a gardener can open the canonical public URL, enter a U.S. location, describe the garden and recent irrigation, and receive a useful watering decision and amount; the result survives refresh/local profile use; source/freshness assumptions are visible; CI and benchmark pass; and the actual production browser smoke succeeds on the main domain.
