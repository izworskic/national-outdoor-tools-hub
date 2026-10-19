# Dark Sky Map: quality benchmark and release gates

Scope: Meteor Shower Tracker, Great Lakes Dark Sky Explorer, and 24 individual park decision pages. The park detail view is one reusable map-independent inspector, not a Leaflet popup.

## Failure analysis

Previous popup implementations squeezed long access notes and 3–4 links into a mobile map approximately 330 pixels tall, while layered, partially custom Leaflet popup rules and disabled auto-pan caused unpredictable placement and cropping. The fix is architectural: a detail panel in document flow immediately below the map, with a non-interactive, small selection banner within the map. Marker selection must never change the map center or zoom.

## Weighted loss function (0 is ideal, 100 is worst)

Let f_i be the measured fraction of failed conditions for each dimension over 5 viewport sizes × 2 maps × 24 destinations:

L = 30×f_clipping + 20×f_touch + 20×f_jump + 15×f_links + 10×f_accessibility + 5×f_state.

| Criterion | Weight | Required acceptance |
|---|---:|---|
| Clipping/overlap | 30 | 0 panels clipped, 0 sideways scrolling, all text and controls visible at 320/360/390/768/1280px |
| Touch | 20 | Every park marker at least 44×44 CSS pixels, action target height at least 44px, zero missed target selections |
| Unexpected map motion | 20 | Selecting a park, changing forecasts or closing inspector changes center by at most 0.000001 degrees and zoom by at most 0.001; only explicit Show on map or Reset may move it |
| Link correctness | 15 | 24 park planner paths, valid official links, Google Maps named-place links; wilderness and marine areas use place searches rather than navigation to arbitrary central coordinates |
| Accessibility | 10 | Keyboard-focusable park pins, named and operable Close details, region heading, accessible selection status, high-contrast visible focus |
| Selection state | 5 | Exactly one inspector, no stale previous park link after new selection, no park navigation links for weather samples, clear works |

Target: L=0 with clipping and map movement as hard zero-failure gates. Tests alone cannot prove visual clipping or touch gesture behavior.

## Automated gate

Run: node scripts/benchmark-dark-sky-map.mjs. The npm test command runs that benchmark after the repository's unit tests. The printed 0–100 result is STRUCTURAL CONTRACT LOSS, not a visual or live interaction measurement. Unit tests exercise all 24 records, safe URLs, inspector selection, close and sample behavior.

## Live browser acceptance matrix

Viewports: 320, 360, 390 (Android), 768, 1280 pixels. Inspect Headlands, Boundary Waters, Point Pelee, Dr. T.K. Lawless and Fathom Five at each width; unit test remaining destinations. Compare both map implementations.

Deterministic URLs (shareable and do not recenter):

- /national-tools/meteor-shower/?inspect=headlands
- /national-tools/meteor-shower/?inspect=bwca
- /national-tools/dark-sky/?inspect=point-pelee
- /national-tools/dark-sky/headlands/?inspect=headlands

Pass criteria: (1) inspector fits page width with no clipped buttons, overlap or horizontal scroll; (2) banner is short and does not cover map controls; (3) destinations show the correct 3–4 actions, with active clickable URLs; (4) after user zoom/pan, selecting and closing does not shift the viewport; (5) Google Maps for wilderness uses a search; (6) CSS still displays the inspector if external Leaflet styles fail; (7) forecast samples cannot masquerade as park entries.

Release policy: don't equate Vercel READY with a visual pass. Keep work on a single branch until CI and production-proxy browser checks pass; do not add new services or repeatedly trigger builds solely for status checks.
