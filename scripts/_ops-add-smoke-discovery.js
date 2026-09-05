"use strict";
const fs=require("node:fs");
const file="public/national-tools/index.html";
let html=fs.readFileSync(file,"utf8");
function replaceOnce(from,to,label){
  if(html.includes(to)) return;
  if(!html.includes(from)) throw new Error(`Missing anchor for ${label}`);
  html=html.replace(from,to);
}
replaceOnce(
  "Free U.S. outdoor tools for aurora, rivers, coastal water, snowpack, White Christmas odds, frost, planting, garden watering and fall color.",
  "Free U.S. outdoor tools for smoke and air quality, aurora, rivers, coastal water, snowpack, White Christmas odds, frost, planting, garden watering and fall color.",
  "meta description"
);
replaceOnce('"dateModified":"2026-09-04"','"dateModified":"2026-09-05"',"dateModified");
replaceOnce('"numberOfItems":9','"numberOfItems":10',"ItemList count");
replaceOnce(
  '{"@type":"ListItem","position":9,"url":"https://chrisizworski.com/national-tools/fall-color/","name":"Fall Color Timing"}',
  '{"@type":"ListItem","position":9,"url":"https://chrisizworski.com/national-tools/fall-color/","name":"Fall Color Timing"},\n        {"@type":"ListItem","position":10,"url":"https://chrisizworski.com/national-tools/smoke/","name":"Wildfire Smoke & Outdoor Air Window"}',
  "ItemList Smoke item"
);
replaceOnce(
  "so river conditions do not get flattened into the same experience as frost dates, garden watering, coastal water, snowpack, aurora, or fall color.",
  "so river conditions do not get flattened into the same experience as smoke and air quality, frost dates, garden watering, coastal water, snowpack, aurora, or fall color.",
  "intro"
);
replaceOnce(
`      <article class="intent-card">
        <div class="intent-kicker">Sky</div>
        <h3>Decide whether tonight is worth going out</h3>`,
`      <article class="intent-card">
        <div class="intent-kicker">Air</div>
        <h3>Find the cleaner time to be outside</h3>
        <ul>
          <li><a href="/national-tools/smoke/">Check smoke and PM2.5<span>Current AirNow AQI, hourly NOAA guidance and the cleaner 3-hour outdoor window</span></a></li>
        </ul>
      </article>
      <article class="intent-card">
        <div class="intent-kicker">Sky</div>
        <h3>Decide whether tonight is worth going out</h3>`,
  "Air decision card"
);
replaceOnce(
`      <article class="feature-card" data-tags="water river fishing paddling" data-months="1,2,3,4,5,6,7,8,9,10,11,12">`,
`      <article class="feature-card" data-tags="air smoke wildfire pm2.5 outdoors running hiking" data-months="1,2,3,4,5,6,7,8,9,10,11,12">
        <div class="feature-kicker">Air quality</div>
        <h3><a href="/national-tools/smoke/">Smoke &amp; Outdoor Air Window</a></h3>
        <p>Check current AirNow PM2.5 AQI, then compare NOAA hourly PM2.5 guidance to find the cleaner contiguous 3-hour outdoor window over the next 48 hours.</p>
        <div class="signal-line">AirNow observation + NOAA PM2.5 guidance + NWS wind</div>
        <a class="tool-cta" href="/national-tools/smoke/">Check outdoor air &rarr;</a>
      </article>
      <article class="feature-card" data-tags="water river fishing paddling" data-months="1,2,3,4,5,6,7,8,9,10,11,12">`,
  "featured Smoke card"
);
replaceOnce(
`      <button class="chip" type="button" data-filter="water">Water</button>`,
`      <button class="chip" type="button" data-filter="air">Air</button>
      <button class="chip" type="button" data-filter="water">Water</button>`,
  "Air finder chip"
);
replaceOnce(
`  <section class="library-group" data-library-group="water">`,
`  <section class="library-group" data-library-group="air">
    <h2>Smoke and outdoor air</h2>
    <p class="group-blurb">Current PM2.5 and modeled hourly concentration answer different questions, so the tool keeps official observations and planning guidance separate.</p>
    <div class="tool-grid">
      <article class="tool-card" data-search-card data-tags="air smoke wildfire pm2.5 outdoors running hiking" data-months="1,2,3,4,5,6,7,8,9,10,11,12">
        <div class="tk">Live data<span class="tk-season" hidden> / in season now</span></div>
        <div class="tool-title"><a href="/national-tools/smoke/">Wildfire Smoke &amp; Outdoor Air Window</a></div>
        <div class="tool-desc">Current AirNow PM2.5 AQI, NOAA hourly PM2.5 guidance, trend, wind and a cleaner 3-hour planning window with confidence.</div>
      </article>
    </div>
  </section>

  <section class="library-group" data-library-group="water">`,
  "Smoke library group"
);
fs.writeFileSync(file,html);
console.log("Smoke discovery links installed in national tools hub.");
