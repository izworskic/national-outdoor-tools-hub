# National Garden Water Decision Tool — research brief

Status: research/architecture gate for a future owning repo `izworskic/national-garden-water`.

## User job

Answer a deceptively simple question: **Do I need to water my garden today?**

The answer must be a decision, not a weather dashboard. The tool should explain whether to **water today**, **wait**, **check soil first**, or **hold because useful rain is imminent**, then estimate how much water to apply.

## What the research says

### 1. Weekly-inch rules are only a baseline
University of Minnesota and Illinois Extension both use roughly 1 inch/week as a starting point for vegetable gardens, but they explicitly note that heat, wind, soil, mulch and crop conditions change demand. Raised beds and containers dry faster. Deep, less-frequent irrigation is generally preferred to shallow daily watering.

Sources:
- https://extension.umn.edu/agriculture/specialty-crops/vegetable-farming/digging-or-expanding-a-well
- https://extension.illinois.edu/blogs/garden-scoop/2020-04-29-new-vegetable-garden-maintenance-weed-and-watering
- https://extension.illinois.edu/news-releases/tips-getting-landscape-plants-through-summer

### 2. Root-zone water storage matters
USDA NRCS defines available water capacity as water held between field capacity and permanent wilting point. Texture, organic matter, compaction, rock fragments, soil depth and rooting depth all affect the reservoir plants can actually use. NRCS guidance for small farms/gardens explicitly combines soil texture, rooting depth and current moisture deficit to determine irrigation need.

Sources:
- https://www.nrcs.usda.gov/sites/default/files/2022-10/nrcs142p2_051590.pdf
- https://www.nrcs.usda.gov/sites/default/files/2024-09/USDA-NRCS%20Indiana%20-%20%20449%20Irrigation%20Water%20Management%20Plan%20for%20Small%20Farms%20and%20Gardens.pdf
- https://www.nrcs.usda.gov/resources/data-and-reports/gridded-national-soil-survey-geographic-database-gnatsgo

### 3. Evapotranspiration is the right weather-demand signal
NWS Forecast Reference Evapotranspiration (FRET) expresses the depth of water expected to evaporate/transpire from a standardized short reference crop. NDFD provides daily (`evp24`) and weekly (`evp168`) FRET over roughly the next 7 days. This is materially better than deriving watering need from temperature alone.

Sources:
- https://www.weather.gov/cae/fretinfo.html
- https://digital.weather.gov/staticpages/definitions.php
- https://digital.weather.gov/xml/rest.php
- https://digital.weather.gov/xml/docs/elementInputNames.php

### 4. Crop demand must scale reference ET
FAO-56 crop-coefficient methodology converts reference ET into crop ET (`ETc = ETo × Kc`). Vegetable Kc varies by crop and growth stage. Representative mid-season coefficients include roughly 1.0 lettuce/spinach, 1.15 tomato, 1.05 many brassicas/carrots, and 0.9 radish. Growth stage materially changes Kc.

Sources:
- https://www.fao.org/4/X0490E/x0490e0b.htm
- https://www.fao.org/4/S2022E/s2022e07.htm

### 5. Weather cannot know whether the gardener already irrigated
Any weather-only tool that says “water now” without knowing recent irrigation can be wrong. The product must expose a low-friction irrigation log/override and clearly state its assumption when none is supplied. Rain-gauge input should override estimated rainfall when available.

## Recommended source stack

1. **Location:** existing `national-geocode` shared contract.
2. **Forecast precipitation:** NWS `api.weather.gov` point/grid forecast, especially `quantitativePrecipitation` and probability of precipitation.
3. **Reference ET:** NWS NDFD XML REST FRET (`evp24`, `evp168`).
4. **Soil:** USDA NRCS Soil Data Access point query for dominant component, horizon AWC/texture where reliable; always allow manual texture override.
5. **Recent rainfall:** nearest NWS observation stations for recent measured precipitation, with explicit completeness/confidence. Add a user rain-gauge override. A secondary no-key gridded source may be evaluated only as a fallback after validation.
6. **Crop biology:** source-traceable static crop profile derived from FAO-56 plus Extension/NRCS rooting-depth guidance.

## Decision model

### State variables
- root-zone available water capacity, inches
- estimated current depletion, inches and percent
- recent effective rain, inches
- logged irrigation, inches
- crop coefficient by growth stage
- reference ET / crop ET
- near-term forecast rain and timing
- bed modifier: in-ground / raised bed / container
- mulch modifier
- confidence: high / medium / low

### Core balance
`ETc = reference_ET × crop_coefficient`

`effective_input = effective_rain + logged_irrigation`

`estimated_depletion = prior_depletion + ETc - effective_input`

Clamp depletion to `[0, root_zone_available_water]`.

Do not claim measured soil moisture unless a sensor or gardener observation supplied it.

### Default trigger concept
Use crop-specific allowable depletion / stress sensitivity where sourceable. For the first production release, use conservative gardener-facing thresholds:
- **Water today:** modeled depletion is at/above the crop stress trigger and useful near-term rain is insufficient.
- **Wait:** root-zone reserve is comfortably above trigger.
- **Check soil first:** model is close to threshold or rainfall/soil confidence is weak.
- **Hold for rain:** threshold is near but forecast rainfall is sufficiently large and soon enough to cover most of the deficit.

The engine must never equate precipitation probability with rainfall amount.

## Required user controls

Keep the first interaction small.

After location resolves:
- What are you watering? crop / crop group
- Growth stage: new seedling/transplant, developing, mature/fruiting
- Bed: in-ground, raised bed, container
- Soil: auto-detected when NRCS succeeds; manual sand / sandy loam / loam / silt loam / clay loam / clay override
- Mulch: none / mulched
- Last irrigation: none in past 7 days, or date + approximate inches
- Optional rain-gauge total for past 7 days
- Optional garden area in sq ft to convert inches to gallons

Persist non-sensitive garden settings and irrigation log locally in browser storage. Do not send garden profile content to analytics.

## Output hierarchy

Above the fold:
1. **Decision:** Water today / Wait / Check soil / Hold for rain
2. **Amount:** e.g. `Apply about 0.45 in` and, if area supplied, gallons
3. **Why:** one sentence naming the dominant drivers
4. **Next check:** e.g. `Check again Friday morning`

Then show:
- root-zone deficit estimate
- recent water in
- estimated crop water out
- useful forecast rain
- soil/bed assumptions
- confidence and source freshness
- 7-day daily balance strip

## Important UX doctrine

- Do not create a giant “location entered → wall of numbers” readout.
- The answer must be visible before methodology.
- Use the same quiet editorial system as the national/Michigan tools, not White Christmas styling.
- Preserve explicit uncertainty.
- Never imply a weather model measured the user’s actual soil moisture.
- Never tell a user to water immediately before a meaningful imminent rain event simply because the current modeled deficit is positive.

## SEO / long-tail architecture

Primary canonical tool:
- `/national-tools/garden-water/`

Substantive support pages only when they contain real crop-specific/soil-specific decision content, not city doorway pages. Candidate queries:
- should I water my garden today
- how much should I water tomatoes today
- vegetable garden watering calculator
- raised bed watering calculator
- how much rain is enough for my garden
- should I water before rain
- sandy soil garden watering frequency
- tomato watering in hot weather
- lettuce watering frequency
- garden water needs by soil type

## Competitive gap

Current products often either:
- provide weather-only “watering guidance,” or
- require an account/subscription/sensor ecosystem.

The opportunity is a fast, no-login, source-transparent web decision tool that combines NWS FRET + precipitation, USDA soil, crop stage and the gardener’s own irrigation log, with a single actionable answer.

## Architecture rule

Do **not** implement this engine in `national-outdoor-tools-hub`, `national-outdoor-core`, or `national-planting`.

Create a dedicated repository/project:
- GitHub: `izworskic/national-garden-water`
- Vercel project: `national-garden-water`
- canonical: `https://chrisizworski.com/national-tools/garden-water/`

Shared location helpers may remain in `national-outdoor-core`. The tool-specific API, crop profiles, water-balance engine, UI, tests and benchmarks belong in the owning repo.