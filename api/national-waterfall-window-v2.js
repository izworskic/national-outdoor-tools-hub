"use strict";

const baseHandler = require("./national-waterfall-window");
const { buildWaterfallWindow } = require("../lib/waterfall-window");
const { finite, sourceMeta } = require("../lib/waterfall-source");

const STAT = "https://api.waterdata.usgs.gov/statistics/v0/observationNormals";
const UA = "ChrisIzworskiWaterfallWindow/1.2 (+https://chrisizworski.com/national-tools/waterfalls/)";

function round(value, digits = 0) {
  const n = finite(value);
  if (n == null) return null;
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function arrayValue(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return trimmed.replace(/^\[|\]$/g, "").split(",").map((item) => item.trim().replace(/^["']|["']$/g, ""));
}

function statisticsRows(payload, depth = 0, inherited = {}) {
  if (depth > 8 || payload == null) return [];
  if (Array.isArray(payload)) return payload.flatMap((item) => statisticsRows(item, depth + 1, inherited));
  if (typeof payload !== "object") return [];

  const row = payload.properties && typeof payload.properties === "object" ? payload.properties : payload;
  const context = {
    monitoring_location_id: row.monitoring_location_id || row.monitoringLocationId || inherited.monitoring_location_id || inherited.monitoringLocationId || null,
    parameter_code: row.parameter_code || inherited.parameter_code || null,
  };

  const isPercentileRow = Boolean(row.time_of_year || row.timeOfYear) && Array.isArray(row.percentiles) && Array.isArray(row.values);
  if (isPercentileRow) return [{ ...row, ...context }];

  if (Array.isArray(row.data)) {
    return row.data.flatMap((block) => statisticsRows(block, depth + 1, context));
  }

  if (Array.isArray(row.values) && row.values.some((value) => value && typeof value === "object")) {
    return row.values.flatMap((value) => statisticsRows(value, depth + 1, context));
  }

  return Object.values(row).flatMap((value) => statisticsRows(value, depth + 1, context));
}

function parseStatistics(payload, now = new Date()) {
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const dayKey = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  for (const row of statisticsRows(payload)) {
    if (row.parameter_code && String(row.parameter_code) !== "00060") continue;
    const type = String(row.time_of_year_type || row.normal_type || "").toLowerCase();
    if (type && type !== "day_of_year" && type !== "doy") continue;
    if (row.time_of_year && String(row.time_of_year) !== dayKey) continue;
    const percentiles = arrayValue(row.percentiles);
    const values = arrayValue(row.values);
    if (!percentiles.length || percentiles.length !== values.length) continue;
    const by = new Map(percentiles.map((percentile, index) => [Number(percentile), finite(values[index], 0)]));
    const stats = {
      p25: by.get(25) ?? null,
      p50: by.get(50) ?? null,
      p75: by.get(75) ?? null,
      p90: by.get(90) ?? null,
      sample_days: finite(row.sample_count, 1) ?? null,
      window_days: 1,
      month,
      day,
    };
    if ([stats.p25, stats.p50, stats.p75, stats.p90].every((value) => value != null)) return stats;
  }
  return null;
}

async function fetchJson(url, timeoutMs = 4000) {
  const headers = { accept: "application/json", "user-agent": UA };
  if (process.env.USGS_API_KEY && new URL(url).hostname === "api.waterdata.usgs.gov") headers["X-Api-Key"] = process.env.USGS_API_KEY;
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`${new URL(url).hostname} returned ${response.status}`);
  return response.json();
}

async function dailyPercentiles(gaugeId, now = new Date()) {
  const id = String(gaugeId || "").replace(/^USGS-/, "");
  if (!/^\d{5,15}$/.test(id)) return null;
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const url = new URL(STAT);
  url.searchParams.set("monitoring_location_id", `USGS-${id}`);
  url.searchParams.set("parameter_code", "00060");
  url.searchParams.set("computation_type", "percentile");
  url.searchParams.set("normal_type", "DOY");
  url.searchParams.set("start_date", `${month}-${day}`);
  url.searchParams.set("end_date", `${month}-${day}`);
  url.searchParams.set("page_size", "100");
  const stats = parseStatistics(await fetchJson(url, 4000), now);
  return stats ? { ...stats, url: url.toString() } : null;
}

function scalePercentiles(stats, localModelFlow, gaugeFlow) {
  if (!stats) return null;
  const model = finite(localModelFlow, 0.001);
  const gauge = finite(gaugeFlow, 0.001);
  if (model == null || gauge == null) {
    return {
      ...stats,
      scale_factor: 1,
      basis: "USGS day-of-year percentile climatology from the connected streamgage",
    };
  }
  const scale = clamp(model / gauge, 0.05, 20);
  return {
    ...stats,
    p25: round(stats.p25 * scale, 1),
    p50: round(stats.p50 * scale, 1),
    p75: round(stats.p75 * scale, 1),
    p90: round(stats.p90 * scale, 1),
    scale_factor: round(scale, 3),
    basis: "USGS day-of-year percentile climatology scaled to the local National Water Model reach",
  };
}

function captureResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return payload; },
  };
}

function hasModel(result) {
  return [result?.model?.current_cfs, result?.model?.peak_24h_cfs, result?.model?.peak_72h_cfs].some((value) => finite(value, 0) != null);
}

function recompute(result, seasonal) {
  const observation = result.observation || null;
  const model = result.model || {};
  const precipitation = result.precipitation || null;
  const regulation = result.regulation || {};
  const current = finite(model.current_cfs, 0) ?? finite(observation?.flow_cfs, 0);
  const intelligence = buildWaterfallWindow({
    current_flow_cfs: current,
    nwm_current_cfs: model.current_cfs,
    nwm_peak_24h_cfs: model.peak_24h_cfs,
    nwm_peak_24h_time: model.peak_24h_time,
    nwm_peak_72h_cfs: model.peak_72h_cfs,
    nwm_peak_72h_time: model.peak_72h_time,
    trend_percent_24h: observation?.trend_percent_24h,
    qpf_24h_in: precipitation?.qpf_24h_in,
    qpf_72h_in: precipitation?.qpf_72h_in,
    seasonal: seasonal || {},
    has_reach: Boolean(result.hydrologic_link?.comid),
    has_nwm: hasModel(result),
    has_gauge: finite(observation?.flow_cfs, 0) != null,
    has_seasonal: Boolean(seasonal),
    has_precip: Boolean(precipitation && (precipitation.qpf_24h_in != null || precipitation.qpf_72h_in != null)),
    gauge_relation: observation?.relation || null,
    regulated_flow: Boolean(regulation.detected),
  });
  return intelligence;
}

function replaceSeasonalSource(sources, seasonal) {
  const next = (Array.isArray(sources) ? sources : []).filter((source) => source?.source_name !== "USGS daily values" && source?.source_name !== "USGS approved daily statistics");
  next.push(sourceMeta({
    name: "USGS approved daily statistics",
    url: seasonal?.url || "https://api.waterdata.usgs.gov/statistics/v0/docs",
    available: Boolean(seasonal),
    status: seasonal ? "day-of-year percentile climatology" : "seasonal climatology unavailable",
  }));
  return next;
}

module.exports = async function handler(req, res) {
  const captured = captureResponse();
  await baseHandler(req, captured);
  for (const [key, value] of Object.entries(captured.headers)) res.setHeader(key, value);
  if (captured.statusCode !== 200 || !captured.body) return res.status(captured.statusCode).json(captured.body);

  const result = captured.body;
  const gaugeId = result.observation?.gauge_id;
  if (!gaugeId) return res.status(200).json({ ...result, methodology_version: "waterfall-window-v1.2.0" });

  let stats = null;
  try {
    stats = await dailyPercentiles(gaugeId);
  } catch {}

  const seasonal = stats
    ? scalePercentiles(stats, result.model?.current_cfs, result.observation?.flow_cfs)
    : result.seasonal || null;
  const intelligence = recompute(result, seasonal);
  const degraded = !hasModel(result) || finite(result.observation?.flow_cfs, 0) == null || !seasonal || !result.precipitation;

  return res.status(200).json({
    ...result,
    methodology_version: "waterfall-window-v1.2.0",
    intelligence,
    seasonal,
    degraded,
    sources: replaceSeasonalSource(result.sources, seasonal),
  });
};

module.exports._test = {
  arrayValue,
  statisticsRows,
  parseStatistics,
  scalePercentiles,
  recompute,
};
