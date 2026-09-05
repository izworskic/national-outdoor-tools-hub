"use strict";

const v2 = require("./national-waterfall-window-v2");
const { sourceMeta } = require("../lib/waterfall-source");

const NLDI = "https://api.water.usgs.gov/nldi/linked-data";
const CONT = "https://api.waterdata.usgs.gov/ogcapi/v0/collections/continuous/items";
const STAT = "https://api.waterdata.usgs.gov/statistics/v0/observationNormals";
const UA = "ChrisIzworskiWaterfallWindow/1.3 (+https://chrisizworski.com/national-tools/waterfalls/)";

function finite(value, min = -Infinity, max = Infinity) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

async function fetchJson(url, timeoutMs = 5000, options = {}) {
  const headers = { accept: "application/json, application/geo+json", "user-agent": UA, ...(options.headers || {}) };
  if (process.env.USGS_API_KEY && new URL(url).hostname === "api.waterdata.usgs.gov") headers["X-Api-Key"] = process.env.USGS_API_KEY;
  const response = await fetch(url, { method: options.method || "GET", headers, body: options.body, signal: AbortSignal.timeout(timeoutMs) });
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

function gaugeCandidates(payload, relation) {
  return (payload?.features || []).map((feature) => {
    const p = feature?.properties || {};
    const id = String(p.identifier || p.id || p.featureID || "").trim();
    if (!/^USGS-\d{5,15}$/.test(id)) return null;
    return { id, site_no: id.replace(/^USGS-/, ""), name: p.name || p.site_name || p.sourceName || id, relation };
  }).filter(Boolean);
}

async function navigation(comid, mode, relation, distance) {
  const url = new URL(`${NLDI}/comid/${encodeURIComponent(comid)}/navigation/${mode}/nwissite`);
  url.searchParams.set("f", "json");
  url.searchParams.set("distance", String(distance));
  url.searchParams.set("excludeGeometry", "true");
  return gaugeCandidates(await fetchJson(url, 4500), relation);
}

function props(payload) {
  return (payload?.features || []).map((feature) => feature?.properties || {}).filter(Boolean);
}

async function observation(gauge) {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 3600000);
  const url = new URL(CONT);
  url.searchParams.set("f", "json");
  url.searchParams.set("limit", "500");
  url.searchParams.set("properties", "monitoring_location_id,parameter_code,time,value,approval_status");
  const query = { op: "and", args: [
    { op: "=", args: [{ property: "monitoring_location_id" }, gauge.id] },
    { op: "=", args: [{ property: "parameter_code" }, "00060"] },
    { op: "between", args: [{ property: "time" }, [start.toISOString(), end.toISOString()]] },
  ] };
  const payload = await fetchJson(url, 5500, { method: "POST", headers: { "content-type": "application/query-cql-json" }, body: JSON.stringify(query) });
  const points = props(payload).map((p) => ({ time: p.time, value: finite(p.value, 0), approval: p.approval_status || null }))
    .filter((p) => p.value != null && Date.parse(p.time || "")).sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  if (!points.length) return null;
  const last = points.at(-1);
  const target = Date.parse(last.time) - 24 * 3600000;
  const prior = points.reduce((best, point) => !best || Math.abs(Date.parse(point.time) - target) < Math.abs(Date.parse(best.time) - target) ? point : best, null);
  const trend = prior?.value ? Math.round(((last.value - prior.value) / Math.abs(prior.value)) * 100) : null;
  return { gauge_id: gauge.id, gauge_name: gauge.name, relation: gauge.relation, flow_cfs: last.value, measured_at: last.time, trend_percent_24h: trend, approval_status: last.approval, url: url.toString() };
}

async function dailyPercentiles(gauge) {
  const now = new Date();
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
  const stats = v2._test.parseStatistics(await fetchJson(url, 4000), now);
  return stats ? { ...stats, url: url.toString() } : null;
}

async function activeConnectedGauge(comid) {
  const settled = await Promise.allSettled([
    navigation(comid, "DM", "downstream-mainstem", 120),
    navigation(comid, "UM", "upstream-mainstem", 250),
  ]);
  const all = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const candidates = [];
  const seen = new Set();
  for (const gauge of all) {
    if (seen.has(gauge.id)) continue;
    seen.add(gauge.id);
    candidates.push(gauge);
    if (candidates.length >= 8) break;
  }
  const probes = await Promise.all(candidates.map(async (gauge) => {
    try {
      const obs = await observation(gauge);
      if (!obs) return null;
      const stats = await dailyPercentiles(gauge);
      if (!stats) return null;
      return { gauge, observation: obs, stats };
    } catch { return null; }
  }));
  return probes.find(Boolean) || null;
}

function replaceSources(sources, selected, seasonal) {
  const next = (Array.isArray(sources) ? sources : []).filter((source) => !["USGS Water Data for the Nation", "USGS daily values", "USGS approved daily statistics"].includes(source?.source_name));
  next.push(sourceMeta({ name: "USGS Water Data for the Nation", url: selected.observation.url, available: true, status: "active network-connected streamflow observation", updatedAt: selected.observation.measured_at }));
  next.push(sourceMeta({ name: "USGS approved daily statistics", url: seasonal.url, available: true, status: "day-of-year percentile climatology" }));
  return next;
}

module.exports = async function handler(req, res) {
  const captured = captureResponse();
  await v2(req, captured);
  for (const [key, value] of Object.entries(captured.headers)) res.setHeader(key, value);
  if (captured.statusCode !== 200 || !captured.body) return res.status(captured.statusCode).json(captured.body);
  const result = captured.body;
  if (Number.isFinite(result?.intelligence?.now?.score)) return res.status(200).json({ ...result, methodology_version: "waterfall-window-v1.3.0" });
  const comid = result?.hydrologic_link?.comid;
  if (!comid) return res.status(200).json({ ...result, methodology_version: "waterfall-window-v1.3.0" });
  let selected = null;
  try { selected = await activeConnectedGauge(comid); } catch {}
  if (!selected) return res.status(200).json({ ...result, methodology_version: "waterfall-window-v1.3.0" });
  const seasonal = v2._test.scalePercentiles(selected.stats, result.model?.current_cfs, selected.observation.flow_cfs);
  const enriched = { ...result, observation: selected.observation };
  const intelligence = v2._test.recompute(enriched, seasonal);
  return res.status(200).json({
    ...enriched,
    methodology_version: "waterfall-window-v1.3.0",
    intelligence,
    seasonal,
    degraded: !Number.isFinite(intelligence?.now?.score),
    sources: replaceSources(result.sources, selected, seasonal),
  });
};

module.exports._test = { gaugeCandidates };
