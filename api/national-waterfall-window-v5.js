"use strict";

const v4 = require("./national-waterfall-window-v4");
const v2 = require("./national-waterfall-window-v2");
const { sourceMeta } = require("../lib/waterfall-source");

const LATEST = "https://api.waterdata.usgs.gov/ogcapi/v0/collections/latest-continuous/items";
const STAT = "https://api.waterdata.usgs.gov/statistics/v0/observationNormals";
const UA = "ChrisIzworskiWaterfallWindow/1.5 (+https://chrisizworski.com/national-tools/waterfalls/)";

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
  // Do not use a properties projection here. The modern latest-continuous
  // collection does not carry all monitoring-location metadata fields.
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

module.exports = async function handler(req, res) {
  const captured = captureResponse();
  await v4(req, captured);
  for (const [key, value] of Object.entries(captured.headers)) res.setHeader(key, value);
  if (captured.statusCode !== 200 || !captured.body) return res.status(captured.statusCode).json(captured.body);

  let result = { ...captured.body, methodology_version: "waterfall-window-v1.5.0" };
  if (Number.isFinite(result?.intelligence?.now?.score)) {
    result.narrative = v4._test.narrative(result);
    return res.status(200).json(result);
  }

  const lat = finite(result.waterfall?.latitude, -90, 90);
  const lon = finite(result.waterfall?.longitude, -180, 180);
  if (lat == null || lon == null) return res.status(200).json(result);

  let regional = null;
  try { regional = await correctedRegionalHydrology(lat, lon, 120); } catch {}
  if (!regional) {
    result.evidence_mode = "limited";
    result.narrative = v4._test.narrative(result);
    return res.status(200).json(result);
  }

  result = {
    ...result,
    evidence_mode: "regional-proxy",
    regional_proxy: regional,
    intelligence: v4._test.proxyIntelligence(result, regional),
    degraded: false,
    sources: replaceProxySource(result.sources, regional),
  };
  result.narrative = v4._test.narrative(result);
  return res.status(200).json(result);
};

module.exports._test = { correctedRegionalHydrology };
