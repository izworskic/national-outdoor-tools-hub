"use strict";

const v3 = require("./national-waterfall-window-v3");
const v2 = require("./national-waterfall-window-v2");
const { sourceMeta } = require("../lib/waterfall-source");

const LATEST = "https://api.waterdata.usgs.gov/ogcapi/v0/collections/latest-continuous/items";
const STAT = "https://api.waterdata.usgs.gov/statistics/v0/observationNormals";
const UA = "ChrisIzworskiWaterfallWindow/1.4 (+https://chrisizworski.com/national-tools/waterfalls/)";

function finite(value, min = -Infinity, max = Infinity) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
function clamp(value, min = 0, max = 100) { return Math.max(min, Math.min(max, value)); }
function round(value, digits = 0) {
  const n = finite(value);
  if (n == null) return null;
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}
function interpolate(points, value) {
  const n = finite(value);
  if (n == null) return null;
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  if (n <= sorted[0][0]) return sorted[0][1];
  if (n >= sorted.at(-1)[0]) return sorted.at(-1)[1];
  for (let i = 1; i < sorted.length; i += 1) {
    if (n <= sorted[i][0]) {
      const [x1, y1] = sorted[i - 1], [x2, y2] = sorted[i];
      const t = (n - x1) / (x2 - x1 || 1);
      return y1 + (y2 - y1) * t;
    }
  }
  return sorted.at(-1)[1];
}
function haversineMiles(lat1, lon1, lat2, lon2) {
  const r = 3958.7613, rad = (x) => x * Math.PI / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}
function bbox(lat, lon, radiusMiles) {
  const latDelta = radiusMiles / 69;
  const lonDelta = radiusMiles / Math.max(20, 69 * Math.cos(lat * Math.PI / 180));
  return [lon - lonDelta, lat - latDelta, lon + lonDelta, lat + latDelta].map((n) => round(n, 5)).join(",");
}
async function fetchJson(url, timeoutMs = 6000) {
  const headers = { accept: "application/json, application/geo+json", "user-agent": UA };
  if (process.env.USGS_API_KEY && new URL(url).hostname === "api.waterdata.usgs.gov") headers["X-Api-Key"] = process.env.USGS_API_KEY;
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`${new URL(url).hostname} returned ${response.status}`);
  return response.json();
}
function captureResponse() {
  return {
    headers: {}, statusCode: 200, body: null,
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return payload; },
  };
}
async function dailyPercentiles(gaugeId, now = new Date()) {
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const url = new URL(STAT);
  url.searchParams.set("monitoring_location_id", gaugeId);
  url.searchParams.set("parameter_code", "00060");
  url.searchParams.set("computation_type", "percentile");
  url.searchParams.set("normal_type", "DOY");
  url.searchParams.set("start_date", `${month}-${day}`);
  url.searchParams.set("end_date", `${month}-${day}`);
  url.searchParams.set("page_size", "100");
  const stats = v2._test.parseStatistics(await fetchJson(url, 4500), now);
  return stats ? { ...stats, url: url.toString() } : null;
}
function flowPercentile(flow, stats) {
  const q = finite(flow, 0);
  if (q == null || !stats) return null;
  const p25 = finite(stats.p25, 0), p50 = finite(stats.p50, 0), p75 = finite(stats.p75, 0), p90 = finite(stats.p90, 0);
  if ([p25, p50, p75, p90].some((v) => v == null)) return null;
  return round(interpolate([
    [Math.max(0, p25 * .25), 5], [p25, 25], [p50, 50], [p75, 75], [p90, 90], [Math.max(p90 + 1, p90 * 1.8), 98],
  ], q), 0);
}
function latestGaugeRows(payload, lat, lon) {
  const now = Date.now();
  const rows = [];
  const seen = new Set();
  for (const feature of payload?.features || []) {
    const p = feature?.properties || {};
    const id = String(p.monitoring_location_id || "");
    const parameter = String(p.parameter_code || "");
    const siteType = String(p.site_type_code || "");
    const time = p.time || null;
    const flow = finite(p.value, 0);
    const coords = feature?.geometry?.coordinates || [];
    const glon = finite(coords[0], -180, 180), glat = finite(coords[1], -90, 90);
    if (!/^USGS-\d{5,15}$/.test(id) || parameter !== "00060" || (siteType && siteType !== "ST") || flow == null || glat == null || glon == null) continue;
    if (!Date.parse(time || "") || now - Date.parse(time) > 36 * 3600000) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push({
      id,
      name: p.monitoring_location_name || id,
      flow_cfs: flow,
      measured_at: time,
      latitude: glat,
      longitude: glon,
      distance_miles: round(haversineMiles(lat, lon, glat, glon), 1),
    });
  }
  return rows.sort((a, b) => a.distance_miles - b.distance_miles);
}
async function nearbyLatestFlows(lat, lon, radiusMiles = 120) {
  const url = new URL(LATEST);
  url.searchParams.set("f", "json");
  url.searchParams.set("bbox", bbox(lat, lon, radiusMiles));
  url.searchParams.set("parameter_code", "00060");
  url.searchParams.set("site_type_code", "ST");
  url.searchParams.set("limit", "250");
  url.searchParams.set("properties", "monitoring_location_id,monitoring_location_name,parameter_code,time,value,approval_status,site_type_code");
  const payload = await fetchJson(url, 6500);
  return { rows: latestGaugeRows(payload, lat, lon).filter((row) => row.distance_miles <= radiusMiles), url: url.toString() };
}
async function regionalHydrology(lat, lon) {
  const latest = await nearbyLatestFlows(lat, lon, 120);
  const nearest = latest.rows.slice(0, 8);
  const settled = await Promise.allSettled(nearest.map(async (gauge) => {
    const stats = await dailyPercentiles(gauge.id);
    const percentile = flowPercentile(gauge.flow_cfs, stats);
    if (percentile == null) return null;
    return { ...gauge, percentile, stats };
  }));
  const gauges = settled.map((r) => r.status === "fulfilled" ? r.value : null).filter(Boolean).slice(0, 4);
  if (!gauges.length) return null;
  let sum = 0, weightSum = 0;
  for (const gauge of gauges) {
    const weight = 1 / Math.max(12, gauge.distance_miles + 8);
    sum += gauge.percentile * weight;
    weightSum += weight;
  }
  const percentile = round(sum / weightSum, 0);
  return {
    percentile,
    gauge_count: gauges.length,
    radius_miles: 120,
    gauges: gauges.map((g) => ({ id: g.id, name: g.name, distance_miles: g.distance_miles, flow_cfs: round(g.flow_cfs, 0), percentile: g.percentile, measured_at: g.measured_at })),
    source_url: latest.url,
  };
}
function scoreLabel(score) {
  const n = finite(score, 0, 100);
  if (n == null) return "Limited evidence";
  if (n >= 92) return "Exceptional";
  if (n >= 80) return "Excellent";
  if (n >= 68) return "Very good";
  if (n >= 55) return "Good";
  if (n >= 40) return "Fair";
  if (n >= 25) return "Low flow";
  return "Very low flow";
}
function proxyBaseScore(percentile) {
  return round(interpolate([[5,18],[20,30],[35,42],[50,55],[65,67],[75,76],[90,89],[98,96]], percentile), 0);
}
function modelAdjustment(current, future) {
  const now = finite(current, .001), later = finite(future, 0);
  if (now == null || later == null) return null;
  return round(interpolate([[.35,-15],[.6,-10],[.8,-5],[1,0],[1.15,3],[1.35,6],[1.7,10],[2.5,14],[4,17]], later / now), 0);
}
function modelTrendText(model, horizon = "24h") {
  const current = finite(model?.current_cfs, .001);
  const future = finite(horizon === "72h" ? model?.peak_72h_cfs : model?.peak_24h_cfs, 0);
  if (current == null || future == null) return "does not provide a strong local trend signal";
  const ratio = future / current;
  if (ratio >= 1.5) return "is projecting a substantial rise";
  if (ratio >= 1.15) return "is projecting a modest rise";
  if (ratio <= .7) return "is projecting a notable easing";
  if (ratio <= .88) return "is projecting a modest easing";
  return "is staying fairly steady";
}
function proxyIntelligence(result, regional) {
  const model = result.model || {};
  const base = proxyBaseScore(regional.percentile);
  const adj24 = modelAdjustment(model.current_cfs, model.peak_24h_cfs);
  const adj72 = modelAdjustment(model.current_cfs, model.peak_72h_cfs);
  const nowScore = base;
  const score24 = adj24 == null ? null : round(clamp(base + adj24), 0);
  const score72 = adj72 == null ? null : round(clamp(base + adj72), 0);
  const hasModel = finite(model.current_cfs, 0) != null;
  let conf = .44 + Math.min(4, regional.gauge_count) * .045 + (hasModel ? .08 : 0);
  conf = Math.min(.69, conf);
  const qpf72 = finite(result.precipitation?.qpf_72h_in, 0);
  const reasons = [
    `No useful live streamgage is available at the falls, so the outlook uses a regional runoff proxy rather than borrowed CFS.`,
    `${regional.gauge_count} nearby active USGS stream${regional.gauge_count === 1 ? " is" : "s are"} collectively running near the ${regional.percentile}th percentile for this date.`,
    `The local National Water Model reach ${modelTrendText(model, "24h")}.`,
  ];
  if (qpf72 != null) reasons.push(`${round(qpf72, 2)} in of NWS forecast precipitation is additional context for the next three days.`);
  return {
    now: { score: nowScore, label: scoreLabel(nowScore), flow_cfs: null, evidence: "regional-runoff-proxy" },
    next_24h: { score: score24, label: scoreLabel(score24), peak_flow_cfs: null, peak_time: model.peak_24h_time || null, evidence: "regional-runoff-proxy+local-model" },
    next_3d: { score: score72, label: scoreLabel(score72), peak_flow_cfs: null, peak_time: model.peak_72h_time || null, evidence: "regional-runoff-proxy+local-model" },
    confidence: { value: round(conf, 2), label: conf >= .56 ? "Moderate" : "Low" },
    reasons: reasons.slice(0, 4),
    caution: result.intelligence?.caution || { level: "normal", message: "The spectacle outlook is not a trail, access or river-edge safety rating." },
  };
}
function bestWindow(intelligence) {
  const options = [
    ["right now", intelligence?.now?.score],
    ["within the next 24 hours", intelligence?.next_24h?.score],
    ["within the next three days", intelligence?.next_3d?.score],
  ].filter(([, score]) => finite(score, 0, 100) != null);
  if (!options.length) return null;
  return options.sort((a, b) => b[1] - a[1])[0];
}
function seasonalWords(ratio) {
  const n = finite(ratio, 0);
  if (n == null) return "without a strong direct seasonal comparison";
  if (n >= 1.6) return "well above the usual flow for this time of year";
  if (n >= 1.2) return "above the usual flow for this time of year";
  if (n <= .55) return "well below the usual flow for this time of year";
  if (n <= .8) return "below the usual flow for this time of year";
  return "close to the usual flow for this time of year";
}
function narrative(result) {
  const name = result.waterfall?.name || "This waterfall";
  const intel = result.intelligence || {};
  const score = finite(intel.now?.score, 0, 100);
  const label = intel.now?.label || "Limited evidence";
  const best = bestWindow(intel);
  const rain = finite(result.precipitation?.qpf_72h_in, 0);
  if (result.evidence_mode === "regional-proxy") {
    const p = result.regional_proxy?.percentile;
    const count = result.regional_proxy?.gauge_count || 0;
    let headline = `${name}: ${label.toLowerCase()} water-volume setup`;
    if (score != null && score >= 80) headline = `${name} has a strong waterfall window`;
    else if (score != null && score < 40) headline = `${name} is probably running on the lighter side`;
    const summary = `There is not a useful live streamgage at ${name}, so this outlook does not assign another river's flow rate to the falls. Instead, it combines the local modeled stream reach with ${count} nearby active USGS streams. Those regional streams are collectively near the ${p}th percentile for this date, which points to ${label.toLowerCase()} water volume at an ungauged waterfall like this.`;
    const outlook = best ? `The strongest modeled window is ${best[0]}. The local reach ${modelTrendText(result.model, best[0].includes("three") ? "72h" : "24h")}${rain != null ? `, while the NWS forecast adds ${round(rain,2)} in of precipitation over roughly three days` : ""}.` : `The present regional runoff signal is usable, but the local model is not strong enough to rank a future window.`;
    return { headline, summary, outlook, note: "This is an inferred waterfall-volume signal, not a measured discharge at the falls. The score is intentionally capped at Moderate confidence in proxy mode." };
  }
  const ratio = intel.now?.ratio_to_seasonal_median ?? intel.now?.ratio;
  const gauge = result.observation?.gauge_name;
  const summary = gauge
    ? `${name} has a network-connected USGS observation and a local National Water Model reach. Current conditions are ${seasonalWords(ratio)}, which supports a ${label.toLowerCase()} spectacle outlook right now.`
    : `${name} has enough hydrologic evidence for a ${label.toLowerCase()} outlook, using the local modeled reach and available seasonal context.`;
  const outlook = best ? `The best window in the current guidance is ${best[0]} at about ${best[1]}/100. The local reach ${modelTrendText(result.model, best[0].includes("three") ? "72h" : "24h")}${rain != null ? `; the NWS forecast shows about ${round(rain,2)} in of precipitation over roughly three days` : ""}.` : `The current evidence does not support ranking a future window yet.`;
  return { headline: `${name}: ${label.toLowerCase()} right now`, summary, outlook, note: "For gauged waterfalls, the score compares connected observations and local model guidance with same-season USGS history. It remains a spectacle estimate, not a safety rating." };
}
function addProxySource(sources, regional) {
  const next = Array.isArray(sources) ? [...sources] : [];
  next.push(sourceMeta({ name: "USGS regional runoff proxy", url: regional.source_url, available: true, status: `${regional.gauge_count} nearby active streamgages normalized to day-of-year percentiles` }));
  return next;
}

module.exports = async function handler(req, res) {
  const captured = captureResponse();
  await v3(req, captured);
  for (const [key, value] of Object.entries(captured.headers)) res.setHeader(key, value);
  if (captured.statusCode !== 200 || !captured.body) return res.status(captured.statusCode).json(captured.body);

  let result = { ...captured.body, methodology_version: "waterfall-window-v1.4.0", evidence_mode: "direct-network" };
  if (!Number.isFinite(result?.intelligence?.now?.score)) {
    const lat = finite(result.waterfall?.latitude, -90, 90), lon = finite(result.waterfall?.longitude, -180, 180);
    let regional = null;
    if (lat != null && lon != null) {
      try { regional = await regionalHydrology(lat, lon); } catch {}
    }
    if (regional) {
      result = {
        ...result,
        evidence_mode: "regional-proxy",
        regional_proxy: regional,
        intelligence: proxyIntelligence(result, regional),
        degraded: false,
        sources: addProxySource(result.sources, regional),
      };
    } else {
      result.evidence_mode = "limited";
    }
  }
  result.narrative = narrative(result);
  return res.status(200).json(result);
};

module.exports._test = {
  bbox,
  flowPercentile,
  latestGaugeRows,
  modelAdjustment,
  proxyBaseScore,
  proxyIntelligence,
  narrative,
};
