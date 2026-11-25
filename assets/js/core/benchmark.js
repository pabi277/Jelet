/** Anonymous aggregation contract. No seeds, telemetry, automatic fetches or retries. */
import { isShareableMock, mockAccuracy, paperYear } from "./share-result.js";

export function benchmarkEndpoint(value) {
  if (!String(value || "").trim()) return "";
  let url;
  try { url = new URL(String(value).trim()); } catch { throw new Error("Enter a valid benchmark base URL."); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) || url.username || url.password || url.search || url.hash) {
    throw new Error("Use HTTPS (HTTP only on localhost), without credentials, query or fragment.");
  }
  return url.href.replace(/\/+$/, "");
}

export function weekStartUtc(now = Date.now()) {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  return d.toISOString().slice(0, 10);
}

export function benchmarkSubmission(attempt, consent = false) {
  if (consent !== true) throw new Error("Choose contribute anonymously before submitting.");
  if (!isShareableMock(attempt) || !paperYear(attempt) || attempt.totalTwelfths < -240 || attempt.totalTwelfths > 1440) {
    throw new Error("Select an independent official-paper full mock with a valid score.");
  }
  // Whitelist: no attempt/session ID, title, timestamp, profile, key or device ID.
  return { marks: attempt.totalTwelfths / 12, accuracy: mockAccuracy(attempt), paperYear: paperYear(attempt) };
}

/** Validate exact-score frequency histogram and current UTC week. Never infer a CDF from a mean. */
export function validateBenchmark(body, now = Date.now()) {
  const bad = () => { throw new Error("Invalid or stale benchmark aggregate — no comparison available."); };
  if (!body || body.version !== 1 || body.weekStart !== weekStartUtc(now) ||
      !Number.isSafeInteger(body.count) || body.count < 0 ||
      !Array.isArray(body.scores) || body.scores.length > 1681) return bad();
  const generated = Date.parse(body.generatedAt);
  if (!Number.isFinite(generated) || generated > now + 300000 || generated < Date.parse(body.weekStart)) return bad();
  let sum = 0;
  const seen = new Set();
  const scores = body.scores.map(bin => {
    if (!bin || !Number.isInteger(bin.twelfths) || bin.twelfths < -240 || bin.twelfths > 1440 ||
        !Number.isSafeInteger(bin.count) || bin.count <= 0 || seen.has(bin.twelfths)) return bad();
    seen.add(bin.twelfths);
    sum += bin.count;
    return { twelfths: bin.twelfths, count: bin.count };
  });
  if (!Number.isSafeInteger(sum) || sum !== body.count) return bad();
  return { version: 1, weekStart: body.weekStart, generatedAt: body.generatedAt, count: sum, scores };
}

export function benchmarkPosition(twelfths, aggregate, now = Date.now()) {
  const a = validateBenchmark(aggregate, now);
  if (!a.count || !Number.isInteger(twelfths)) return null;
  let below = 0, equal = 0, above = 0;
  for (const bin of a.scores) {
    if (bin.twelfths < twelfths) below += bin.count;
    else if (bin.twelfths === twelfths) equal += bin.count;
    else above += bin.count;
  }
  return { count: a.count, below, equal, above, higherThanPct: Math.floor(below * 1000 / a.count) / 10 };
}

async function request(base, method, body) {
  const endpoint = benchmarkEndpoint(base);
  if (!endpoint) throw new Error("Benchmark not configured. Local study is unaffected.");
  if (typeof navigator !== "undefined" && navigator.onLine === false) throw new Error("Offline — no benchmark request sent. Local study is unaffected.");
  let res;
  try {
    res = await fetch(`${endpoint}/benchmark`, {
      method, credentials: "omit", referrerPolicy: "no-referrer", redirect: "error", cache: "no-store",
      signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error(method === "POST"
      ? "Submission not confirmed. It may have arrived; no automatic retry was made. Refresh before deciding to retry."
      : "Benchmark unavailable — check your connection or endpoint. Local study is unaffected.");
  }
  if (!res.ok) throw new Error(`Benchmark ${method} failed (HTTP ${res.status}). No automatic retry.`);
  return res.json().catch(() => { throw new Error("Benchmark returned invalid JSON. No automatic retry."); });
}

export async function fetchBenchmark(base) {
  return validateBenchmark(await request(base, "GET"));
}

export async function contributeBenchmark(base, attempt, consent = false) {
  const body = benchmarkSubmission(attempt, consent);
  const receipt = await request(base, "POST", body);
  if (receipt?.accepted !== true || receipt.weekStart !== weekStartUtc()) {
    throw new Error("Submission not confirmed by endpoint. No automatic retry.");
  }
  return { accepted: true, weekStart: receipt.weekStart };
}
