"use strict";

const v4 = require("./national-waterfall-window-v4");
const v2 = require("./national-waterfall-window-v2");
const { sourceMeta } = require("../lib/waterfall-source");

const LATEST = "https://api.waterdata.usgs.gov/ogcapi/v0/collections/latest-continuous/items";
const STAT = "https://api.waterdata.usgs.gov/statistics/v0/observationNormals";
const UA = "ChrisIzworskiWaterfallWindow/1.6 (+https://chrisizworski.com/national-tools/waterfalls/)";

function finite(value, min = -Infinity, max = Infinity) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
function round(value, digits = 0) {
  const n = finite(value);
  if (n == null) return null;
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}
function captureResponse() {
  return {
    headers: {}, statusCode: 200, body: null,
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return payload; },
  };
}
async function fetchJson(url, timeoutMs = 6500) {
  const headers = { accept: "application/json, application/geo+json", "user-agent": UA };
  if (process.env.USGS_API_KEY && new URL(url).hostname === "api.waterdata.usgs.gov") headers["X-Api-Key"] = process.env.USGS_API_KEY;
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`${new URL(url).hostname} returned ${response.status}`);
  return response.json();
}
async function seasonalForGauge(gauge, now = new Date()) {
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const url = new URL(STAT);
  url.searchParams.set("monitoring_location_id", gauge.id);
  url.searchParams.set("parameter_code", "00060");
  url.searchParams.set("computation_type", "percentile");
  url.searchParams.set("normal_type", "DOY");
  url.searchParams.set("start_date", `${month}-${day}`);
  url.searchParams.set("end_date", `${month}-${day}`);
  url.searchParams.set("page_size", "100");
  const payload = await fetchJson(url, 4500);
  const stats = v2._test.parseStatistics(payload, now);
  if (!stats) return null;
  const properties = payload?.features?.[0]?.properties || {};
  return {
    ...stats,
    site_name: properties.monitoring_location_name || gauge.name || gauge.id,
    url: url.toString(),
  };
}
async function correctedRegionalHydrology(lat, lon, radiusMiles = 120) {
  const url = new URL(LATEST);
  url.searchParams.set("f", "json");
  url.searchParams.set("bbox", v4._test.bbox(lat, lon, radiusMiles));
  url.searchParams.set("parameter_code", "00060");
  url.searchParams.set("limit", "250");
  const payload = await fetchJson(url, 6500);
  const current = v4._test.latestGaugeRows(payload, lat, lon)
    .filter((gauge) => gauge.distance_miles <= radiusMiles)
    .slice(0, 16);
  if (!current.length) return null;

  const settled = await Promise.allSettled(current.map(async (gauge) => {
    const stats = await seasonalForGauge(gauge);
    if (!stats) return null;
    const percentile = v4._test.flowPercentile(gauge.flow_cfs, stats);
    if (percentile == null) return null;
    const sample = finite(stats.sample_days, 1) || 1;
    const historyWeight = Math.min(1, Math.sqrt(sample / 30));
    const distanceWeight = 1 / Math.max(18, gauge.distance_miles + 12);
    return {
      ...gauge,
      name: stats.site_name || gauge.name,
      percentile,
      sample_days: sample,
      weight: historyWeight * distanceWeight,
      stats_url: stats.url,
    };
  }));

  const usable = settled
    .map((item) => item.status === "fulfilled" ? item.value : null)
    .filter(Boolean)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
  if (!usable.length) return null;

  const sumWeight = usable.reduce((sum, gauge) => sum + gauge.weight, 0);
  const percentile = round(usable.reduce((sum, gauge) => sum + gauge.percentile * gauge.weight, 0) / sumWeight, 0);
  return {
    percentile,
    gauge_count: usable.length,
    radius_miles: radiusMiles,
    method: "distance-and-history-weighted same-date percentile",
    gauges: usable.map((gauge) => ({
      id: gauge.id,
      name: gauge.name,
      distance_miles: gauge.distance_miles,
      flow_cfs: round(gauge.flow_cfs, 0),
      percentile: gauge.percentile,
      sample_days: gauge.sample_days,
      measured_at: gauge.measured_at,
    })),
    source_url: url.toString(),
  };
}
function replaceProxySource(sources, regional) {
  const next = (Array.isArray(sources) ? sources : []).filter((source) => source?.source_name !== "USGS regional runoff proxy");
  next.push(sourceMeta({
    name: "USGS regional runoff proxy",
    url: regional.source_url,
    available: true,
    status: `${regional.gauge_count} current discharge stations normalized to their own same-date USGS climatology`,
  }));
  return next;
}

function flowCharacter(score) {
  const n = finite(score, 0, 100);
  if (n == null) return { short: "uncertain", sentence: "The available signals are not strong enough to describe the waterfall confidently right now." };
  if (n >= 90) return { short: "exceptional", sentence: "Expect a powerful, unusually full waterfall with the kind of water volume people make a special trip to see." };
  if (n >= 80) return { short: "excellent", sentence: "Expect a strong, full-looking waterfall with plenty of water and a dramatic presentation." };
  if (n >= 68) return { short: "very good", sentence: "Expect a healthy, impressive waterfall with clearly above-average visual impact." };
  if (n >= 55) return { short: "good", sentence: "Expect a solid waterfall with healthy flow. It should look good, even if it is not at peak-water intensity." };
  if (n >= 40) return { short: "moderate", sentence: "Expect a respectable, moderate waterfall. It should be flowing well enough to enjoy, but this is not a standout high-water window." };
  if (n >= 25) return { short: "light", sentence: "Expect lighter water volume, more exposed rock and a less forceful presentation than during a strong-flow period." };
  return { short: "very light", sentence: "Expect a subdued waterfall with relatively little water. The setting may still be worthwhile, but the waterfall itself is unlikely to be at its best." };
}
function visitCall(score) {
  const n = finite(score, 0, 100);
  if (n == null) return { label: "Check back before making a special trip", sentence: "The tool cannot make a strong go-or-wait call from the current evidence." };
  if (n >= 90) return { label: "Make it a priority", sentence: "If seeing the waterfall at its most dramatic is the goal, this is the kind of window to prioritize." };
  if (n >= 80) return { label: "Excellent day to go", sentence: "This is a strong waterfall day and a good time to make the trip." };
  if (n >= 68) return { label: "Good day to go", sentence: "Conditions are strong enough that the waterfall itself is a good reason to go." };
  if (n >= 55) return { label: "Worth the trip", sentence: "The waterfall should be satisfying to see. You do not need to wait for a better day unless you are chasing peak flow." };
  if (n >= 40) return { label: "Worth it if you're nearby", sentence: "If the waterfall is part of a larger day in the area, go. If you are making a long trip mainly for dramatic water, this is an average rather than exceptional window." };
  if (n >= 25) return { label: "Go for the place, not peak flow", sentence: "The scenery or hike may still make the stop worthwhile, but water volume alone is not a strong reason to make a special trip right now." };
  return { label: "Pick another day if flow is the goal", sentence: "If your main goal is a dramatic waterfall, a stronger-flow window would be a better choice." };
}
function trendGuidance(intel) {
  const now = finite(intel?.now?.score, 0, 100);
  const day = finite(intel?.next_24h?.score, 0, 100);
  const three = finite(intel?.next_3d?.score, 0, 100);
  if (now == null) return { direction: "uncertain", sentence: "There is not enough evidence to rank the next few days confidently." };
  const bestFuture = Math.max(day ?? -Infinity, three ?? -Infinity);
  const worstFuture = Math.min(day ?? Infinity, three ?? Infinity);
  if (bestFuture >= now + 10) return { direction: "improving", sentence: "If your schedule is flexible, waiting could pay off: the model shows a meaningfully better waterfall window ahead." };
  if (bestFuture >= now + 5) return { direction: "slightly improving", sentence: "Conditions may improve a little, but the difference is not large enough to make today a bad choice." };
  if (worstFuture <= now - 10) return { direction: "falling", sentence: "Current conditions are better than what is modeled later, so earlier is the better choice if you can go now." };
  if (worstFuture <= now - 5) return { direction: "slightly falling", sentence: "The waterfall may ease some, so there is little reason to wait for more water." };
  return { direction: "steady", sentence: "Water volume looks fairly steady through the forecast window, so timing your visit around weather, daylight and crowds matters more than waiting for a flow change." };
}
function bestWindowLabel(intel) {
  const options = [
    { label: "right now", score: finite(intel?.now?.score, 0, 100) },
    { label: "the next 24 hours", score: finite(intel?.next_24h?.score, 0, 100) },
    { label: "the next 3 days", score: finite(intel?.next_3d?.score, 0, 100) },
  ].filter((item) => item.score != null);
  if (!options.length) return null;
  return options.sort((a, b) => b.score - a.score)[0];
}
function seasonalPlainLanguage(result) {
  if (result.evidence_mode === "regional-proxy") {
    const p = finite(result.regional_proxy?.percentile, 0, 100);
    if (p == null) return "Regional water levels are hard to place against the season.";
    if (p >= 80) return "Streams around the area are running much wetter and fuller than usual for this time of year.";
    if (p >= 65) return "Streams around the area are running somewhat fuller than usual for this time of year.";
    if (p >= 40) return "Streams around the area are running close to the middle of their usual range for this time of year.";
    if (p >= 20) return "Streams around the area are running on the drier, lighter side for this time of year.";
    return "Streams around the area are running unusually low for this time of year.";
  }
  const ratio = finite(result.seasonal?.current_ratio, 0);
  if (ratio != null) {
    if (ratio >= 1.5) return "The connected river is running well above its usual flow for this time of year.";
    if (ratio >= 1.15) return "The connected river is running above its usual flow for this time of year.";
    if (ratio <= .6) return "The connected river is running well below its usual flow for this time of year.";
    if (ratio <= .85) return "The connected river is running below its usual flow for this time of year.";
    return "The connected river is running near its usual range for this time of year.";
  }
  const current = finite(result.observation?.flow_cfs, 0);
  const median = finite(result.seasonal?.p50, 0);
  if (current != null && median != null && median > 0) {
    const r = current / median;
    if (r >= 1.5) return "The connected river is running well above its usual flow for this time of year.";
    if (r >= 1.15) return "The connected river is running above its usual flow for this time of year.";
    if (r <= .6) return "The connected river is running well below its usual flow for this time of year.";
    if (r <= .85) return "The connected river is running below its usual flow for this time of year.";
    return "The connected river is running near its usual range for this time of year.";
  }
  return "Seasonal comparison is limited, so the recommendation leans more heavily on the current and modeled water signal.";
}
function confidencePlainLanguage(result) {
  const label = result.intelligence?.confidence?.label || "Low";
  if (result.evidence_mode === "regional-proxy") {
    return `${label} confidence. The estimate is based on the local watershed model plus nearby streams, so treat the score as a practical planning signal rather than an exact measurement at the falls.`;
  }
  if (result.evidence_mode === "limited") {
    return `${label} confidence. The available water data are too incomplete for a strong trip-planning recommendation right now.`;
  }
  return `${label} confidence. The recommendation uses a hydrologically connected streamgage, seasonal history and local model guidance.`;
}
function buildVisitorGuidance(result) {
  const name = result.waterfall?.name || "This waterfall";
  const intel = result.intelligence || {};
  const score = finite(intel.now?.score, 0, 100);
  const character = flowCharacter(score);
  const call = visitCall(score);
  const trend = trendGuidance(intel);
  const best = bestWindowLabel(intel);
  const seasonal = seasonalPlainLanguage(result);
  const rain = finite(result.precipitation?.qpf_72h_in, 0);

  let headline;
  if (score == null) headline = `${name}: not enough evidence for a strong trip call yet`;
  else if (score >= 80) headline = `${name} should be running strong right now`;
  else if (score >= 55) headline = `${name} should be running well right now`;
  else if (score >= 40) headline = `${name} should have moderate flow right now`;
  else if (score >= 25) headline = `${name} is likely running on the light side`;
  else headline = `${name} is likely running very light right now`;

  const conditions = `${character.sentence} ${seasonal}`;
  const planning = `${call.sentence} ${trend.sentence}`;
  const timing = best ? `Best water-volume window: ${best.label}.` : "A best water-volume window cannot be ranked yet.";
  let weatherContext = "";
  if (rain != null) {
    if (rain >= 1) weatherContext = ` Around ${round(rain, 2)} inches of precipitation is forecast over roughly three days, which is meaningful additional water to watch.`;
    else if (rain >= .4) weatherContext = ` Around ${round(rain, 2)} inches of precipitation is forecast over roughly three days, enough to watch for some response.`;
    else weatherContext = ` Forecast precipitation is modest at about ${round(rain, 2)} inches over roughly three days, so rain alone is not signaling a major change.`;
  }

  const reasons = [seasonal, trend.sentence];
  if (weatherContext) reasons.push(weatherContext.trim());

  return {
    headline,
    verdict: call.label,
    conditions,
    planning,
    timing: `${timing}${weatherContext}`,
    confidence: confidencePlainLanguage(result),
    reasons,
  };
}
function applyVisitorLanguage(result) {
  const visitor = buildVisitorGuidance(result);
  result.visitor_guidance = visitor;
  result.narrative = {
    headline: visitor.headline,
    summary: visitor.conditions,
    outlook: `${visitor.verdict}. ${visitor.planning} ${visitor.timing}`,
    note: visitor.confidence,
  };
  if (result.intelligence) result.intelligence = { ...result.intelligence, reasons: visitor.reasons };
  return result;
}

module.exports = async function handler(req, res) {
  const captured = captureResponse();
  await v4(req, captured);
  for (const [key, value] of Object.entries(captured.headers)) res.setHeader(key, value);
  if (captured.statusCode !== 200 || !captured.body) return res.status(captured.statusCode).json(captured.body);

  let result = { ...captured.body, methodology_version: "waterfall-window-v1.6.0" };
  if (Number.isFinite(result?.intelligence?.now?.score)) {
    return res.status(200).json(applyVisitorLanguage(result));
  }

  const lat = finite(result.waterfall?.latitude, -90, 90);
  const lon = finite(result.waterfall?.longitude, -180, 180);
  if (lat == null || lon == null) return res.status(200).json(applyVisitorLanguage(result));

  let regional = null;
  try { regional = await correctedRegionalHydrology(lat, lon, 120); } catch {}
  if (!regional) {
    result.evidence_mode = "limited";
    return res.status(200).json(applyVisitorLanguage(result));
  }

  result = {
    ...result,
    evidence_mode: "regional-proxy",
    regional_proxy: regional,
    intelligence: v4._test.proxyIntelligence(result, regional),
    degraded: false,
    sources: replaceProxySource(result.sources, regional),
  };
  return res.status(200).json(applyVisitorLanguage(result));
};

module.exports._test = {
  correctedRegionalHydrology,
  flowCharacter,
  visitCall,
  trendGuidance,
  buildVisitorGuidance,
};
