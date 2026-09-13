# National Engine Scale Roadmap — 1M Search Impressions/Day

**Created:** 2026-09-13

This roadmap adds a portfolio **Scale Score** for the long-range target of 1,000,000 Google Search impressions per day. It does not replace `benchmarks/national-outdoor-tools.json`, its loss function, hard vetoes, source lifecycle, canonical rules, location-admission contract, or production benchmark.

The complete 50-engine ranking is in `benchmarks/national-engine-scale-roadmap-2026-09-13.json`.

## Scale Score

- Search surface: 25
- Repeat demand: 20
- Geographic scale: 15
- Data quality: 15
- Unique-answer potential: 10
- Competition gap: 5
- Repeat-visit potential: 5
- Internal-link synergy: 5

Scores are strategic prioritization estimates, not keyword-volume or traffic forecasts. Re-score against Search Console and post-launch analytics.

## Top 15

| Rank | Engine | Score | Status |
|---:|---|---:|---|
| 1 | River Conditions & Forecast | 95.2 | Existing anchor |
| 2 | Coastal Water Window | 93.3 | Existing anchor |
| 3 | Smoke / Clear-Air Window | 93.3 | Blocked on source/config |
| 4 | National Park Conditions Desk | 92.4 | New prototype candidate |
| 5 | Paddling Conditions Window | 91.0 | New activity lens |
| 6 | Flood / High-Water Trip Impact | 91.0 | New candidate |
| 7 | Night Sky Clear/Dark Window | 90.6 | Existing anchor |
| 8 | Snowpack & Melt | 90.5 | Existing anchor |
| 9 | Aurora Visibility | 90.2 | Existing anchor |
| 10 | Planting Calendar | 89.9 | Existing anchor |
| 11 | Bird Migration Intelligence | 89.8 | New seasonal candidate |
| 12 | Garden Water Stress | 89.8 | Existing enhancement |
| 13 | Beach / Swim Decision | 89.7 | Coastal lens |
| 14 | Frost / Freeze Timing | 89.6 | Existing seasonal engine |
| 15 | Wildfire Trip Impact | 89.0 | Blocked/source-integration |

## Decision

### Deepen before multiplying URLs

The network foundation is Rivers, Coastal, Night Sky, Snow, Aurora and Planting. These already have national reach and strong recurring intent. Improving their decision quality and selective geographic search surfaces should precede broad new URL generation.

### Unblock Smoke

Smoke / Clear-Air is one of the largest opportunities in the matrix, but the existing candidate benchmark correctly blocks an indexable implementation until AirNow/FIRMS source and configuration gates are satisfied. Do not ship a weaker substitute.

### First new scalable prototype: National Park Conditions Desk

Prototype one national park decision engine combining authoritative NPS alerts and park information with NWS weather and existing National Tools signals. The product question is not “what is the weather at this park?” It is “what is changing at this park, what will materially affect my visit, and when is the better outdoor window?”

Do not automatically create a page for every park. Admit park pages only when the park has enough distinct source depth, search intent, and decision value to clear the existing location/canonical gates.

### Current-season acquisition layer

While evergreen work proceeds, use Fall Color, Frost/Freeze, Bird Migration, Monarch Migration and Elk Rut for September/October acquisition. These should feed users into evergreen tools rather than live as isolated seasonal pages.

## Operating sequence

1. Deepen Rivers and Coastal and verify modern-source reliability.
2. Resolve Smoke source/configuration prerequisites.
3. Prototype National Park Conditions Desk without indexing a location network yet.
4. Prototype Bird Migration Intelligence during the active fall migration window.
5. Strengthen Fall Color and Frost search surfaces for immediate seasonal acquisition.
6. Measure entry page impressions, CTR, transitions, repeat use and indexed-query diversity.
7. Admit geographic pages only when the location materially changes the sources, calculations, recommendations, or user decision.

## Portfolio thesis

The path to 1M daily impressions is not thousands of interchangeable tools. Evergreen anchors create the floor. Seasonal engines rotate demand through the year. Select regional and location surfaces capture long-tail intent only when they are genuinely different products. Destination monopolies such as Firefall, Moonbow, river releases and lock/traffic tools add defensibility, links and event spikes, but they are not expected to carry the baseline by themselves.
