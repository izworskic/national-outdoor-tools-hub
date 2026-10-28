# Dark Sky Destination Field Guide v1: research, source contract and release plan

**Review date:** October 28, 2026. **Scope:** three *existing* canonical URLs only:
- `/national-tools/dark-sky/newport/`
- `/national-tools/dark-sky/voyageurs/`
- `/national-tools/dark-sky/bwca/`

## Why this investment

Midwest, Wisconsin and Minnesota hubs now explain the experiences. The individual destinations must make the next action usable: arrive at a real place (Newport and Voyageurs), find an appropriate date and permit (BWCAW), and make *a separate sky forecast decision* without claiming live roads, gates, permit availability or guaranteed meteors. **No new URL or competing city/state page is being published.** Preserve all 24 park pages, shared map, NWS weather model, CARTO fallback, local geolocation opt-in, meteor and aurora links, original canonicals, Google Analytics 4 and existing advertising code.

## Sources and verified visitor facts

**Newport State Park** (Door County, WI)
- Wisconsin DNR: https://dnr.wisconsin.gov/topic/parks/newport — **6 a.m.–11 p.m. year-round**, vehicle admission sticker required. June 22, 2026 construction near Parking Lot 3 Dark Sky Viewing Area; official notice says viewing area remains open despite construction. July 17, 2026 notice describes restored access to trails after 2025 severe storms. These notices are *dated snapshots*, **not current live availability**.
- DNR night sky https://dnr.wisconsin.gov/topic/parks/newport/darksky — go in daylight and learn the viewing area; certified Dark Sky Park.
- DNR recreational facilities https://dnr.wisconsin.gov/topic/parks/newport/recreation — a picnic area and sandy lake beach near parking lot #3; shore/weather/water hazards still apply.
- Wisconsin State Park system camping rules https://dnr.wisconsin.gov/topic/parks/camping/rules — non-campers leave by **11 p.m.**, registered campers subject to campsite rules and restrictions. A sky score outside ordinary hours is not permission.
- Google Maps link is a **text-based search for Lot 3**, not a user-verified GPS parking pin; do not route to the NWS model's park representative coordinate.

**Voyageurs National Park** (Minnesota)
- NPS https://www.nps.gov/voya/planyourvisit/stargazing.htm — *two named designated mainland-accessible dark sky areas*: **upper Rainy Lake Visitor Center parking lot** and **Meadwood Road Day Use Area along Ash River Visitor Center Road**. Also names wilderness/campsite shorelines but without guaranteeing road access to them.
- NPS https://www.nps.gov/voya/planyourvisit/basicinfo.htm — park overall open **24 hours**, but visitor services/roads and activities may vary. Much of the park requires water transport, and ice hazards occur seasonally.
- NPS https://www.nps.gov/voya/planyourvisit/visitorcenters.htm — Rainy Lake Visitor Center physical address **1797 Township Road 342, International Falls MN 56649**; the NPS lists seasonal visitor-center hours and seasonal closure for Ash River Visitor Center. **Building closure does not automatically establish lot closure or availability.** Check actual alerts before traveling.
- Two Google Maps links use **named location searches**, not fabricated coordinates or the regional forecast pin. The live NWS weather response still samples one park-area coordinate and must never be labeled per-parking-lot weather.
- NPS conditions: https://www.nps.gov/voya/planyourvisit/conditions.htm

**Boundary Waters Canoe Area Wilderness** (MN)
- US Forest Service via Recreation.gov https://www.recreation.gov/permits/233396 — a permit is required to enter BWCAW **year-round**. **May 1–September 30** quota permits for overnight paddle/hike/motor and motorized day use; non-motorized day use uses self-issued permits year-round. **October 1–April 30**, self-issued permits are required for all visitors. One permit per group; limit **nine people and four watercraft**. Quota permits specify an entry date and named entry point, and their availability is NOT checked by this guide.
- US Forest Service trip guide https://www.fs.usda.gov/sites/nfs/files/r09/superior/publication/USFS%20BWCAW%20Trip%20Planning%20Guide%202023.pdf — planning sequence includes entry-point selection, weather/safety, group size, Leave No Trace and actual camping route planning. Official source for seasonality.
- No destination-level driving directions: **wilderness centroid is not an entry point or road-access observing location**. The permit helper is pure local client code and must never imply live availability or authorized campsite.

## Evidence and image provenance

Use existing location-verified and individually credited catalog `data/northern-dark-sky-field-guide-photos.json`, including Newport Milky Way (Yinan Chen, CC BY 3.0), Newport daytime shoreline (Yinan Chen, public-domain dedication), Voyageurs Rainy Lake (Yinan Chen, public-domain dedication), Voyageurs NPS archive aurora (official NPS public-domain full rights), and BWCA campsite sunset (Crary033, CC BY-SA 4.0). Each rendered image has title/alt, source, author, license and archival date. Photographs show historic scenery, not current forecasts or confirmed safety.

## Implementation contract

1. `scripts/destination-field-guide.mjs` injects the three editorial experiences after existing park pages are generated, preserving all legacy decision and map hooks. Other 21 destination pages remain unchanged.
2. Newport displays the existing verified NWS 72-hour modeled dark hours that overlap published **06:00–23:00 America/Chicago** ordinary visiting hours. An optional client event from the existing `great-lakes-dark-sky.js` carries **read-only** weather data from its unchanged NWS engine to the Newport panel. Missing/failed forecast must fail closed. No claim of actual entry, road, parking, campground, weather observation or a meteor count.
3. Voyageurs links NPS-specified mainland choices with source citations and named Google Maps queries. No claim that the regional forecast score corresponds to either exact lot; no invented geocoded marker.
4. BWCA date-and-trip-type helper returns seasonal category only; it does not submit to Recreation.gov and never checks actual reservations or prices. The official permit portal remains the authoritative path.
5. Shared generated page SEO, map, meteor shower links, all three canonical URLs, and GA4 ID `G-Y5D2V2W7HN` are retained. Only these three park sitemap lastmod fields are revised.

## Test/merge gates

- Full npm unit+build checks; no change to the original 24-item registry.
- Focused `tests/destination-field-guide.test.js`: canonical, map and weather hooks, source-backed access, permit year transitions (Apr 30, May 1, Sep 30, Oct 1), Newport model hour inside/outside park hours and failed forecast, image licensing, CSS scope.
- Vercel preview build, GitHub workflow checks, then squash merge only on green.
- Production: confirm deployment READY, public **200** for all three canonicals, GA4, assets/photo loading, mobile and desktop screenshot, map tiles, hour/permit widget behavior where available.
- Advertising is out of scope. If large ad areas obstruct first-screen choices, report visually without modifying AdSense.
- We do not claim increased Google impressions, indexed-by-Google status, real-time parking or a formal Field Guide v1 score without separate evidence.
