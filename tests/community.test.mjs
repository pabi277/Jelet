import { test } from "node:test";
import assert from "node:assert/strict";
import { resultSummary, resultCardSvg, isShareableMock } from "../assets/js/core/share-result.js";

const mock = (patch = {}) => ({ attemptId: "new", kind: "mock", mode: "independent", paperId: "jelet-2025", title: "PRIVATE NAME", maxTwelfths: 1440, totalTwelfths: 901, elapsedMs: 3600000, submittedAt: "2026-11-25T10:00:00Z", counts: { correct: 60, incorrect: 20 }, bySubject: { MATH: { totalTwelfths: 400 } }, profile: { name: "PRIVATE NAME" }, apiKey: "SECRET", ...patch });

test("share defaults to allowlisted score and accuracy only, never profile/keys", () => {
  const summary = resultSummary(mock());
  assert.deepEqual(summary, { totalTwelfths: 901, maxTwelfths: 1440, accuracyPct: 75 });
  const svg = resultCardSvg(summary);
  assert.match(svg, /901 \/ 1440 twelfths/);
  assert.match(svg, /Study result · JELET Study Hub/);
  assert.match(svg, /Not an official WBJEEB document/);
  for (const text of ["PRIVATE", "SECRET", "2025", "Time taken", "trend", "MATH"]) assert.ok(!svg.includes(text));
});

test("full share explicitly adds paper, recorded time, sections and pairwise readiness trend", () => {
  const previous = mock({ attemptId: "old", submittedAt: "2026-11-24T10:00:00Z", counts: { correct: 40, incorrect: 40 } });
  const full = resultSummary(mock(), [previous], true);
  assert.equal(full.trend, "improving");
  assert.equal(full.paper, "JELET 2025");
  assert.equal(full.elapsedMs, 3600000);
  assert.match(resultCardSvg(full), /MATH: /);
  assert.equal(resultSummary(mock(), [], true).trend, "insufficient");
  assert.equal(resultSummary(mock({ elapsedMs: null }), [], true).elapsedMs, null);
  assert.equal(resultSummary(mock(), [mock({ submittedAt: "2027", attemptId: "future" })], true).trend, "insufficient");
  assert.equal(resultSummary(mock(), [], false).paper, undefined);
});

test("share trend handles flat and declining, excludes assisted records", () => {
  const prev = mock({ attemptId: "old", submittedAt: "2026-11-24" });
  assert.equal(resultSummary(mock(), [prev], true).trend, "flat");
  assert.equal(resultSummary(mock({ counts: { correct: 1, incorrect: 9 } }), [prev], true).trend, "declining");
  assert.equal(resultSummary(mock(), [{ ...prev, mode: "assisted" }], true).trend, "insufficient");
  assert.equal(isShareableMock(mock({ kind: "drill" })), false);
  assert.throws(() => resultSummary(mock({ mode: "assisted" })));
});

test("SVG escapes text and refuses injectable palette values", () => {
  const svg = resultCardSvg({ ...resultSummary(mock()), paper: '<script>alert("x")</script>', sections: [], trend: "flat" }, { text: 'red" onload="alert(1)' });
  assert.ok(!svg.includes("<script>"));
  assert.ok(!svg.includes("onload="));
  assert.ok(!svg.includes("var(--"));
});

import { benchmarkEndpoint, weekStartUtc, benchmarkSubmission, validateBenchmark, benchmarkPosition, fetchBenchmark, contributeBenchmark } from "../assets/js/core/benchmark.js";
import { sanitizeForSync } from "../assets/js/db/sync.js";
const now = Date.parse("2026-11-25T12:00:00Z");
const aggregate = patch => ({ version: 1, weekStart: "2026-11-23", generatedAt: "2026-11-25T11:00:00Z", count: 10, scores: [{ twelfths: -3, count: 2 }, { twelfths: 900, count: 3 }, { twelfths: 1200, count: 5 }], ...patch });

test("UTC week boundary is Monday, including Sunday/year rollover", () => {
  assert.equal(weekStartUtc(now), "2026-11-23");
  assert.equal(weekStartUtc(Date.parse("2026-11-29T23:59:59Z")), "2026-11-23");
  assert.equal(weekStartUtc(Date.parse("2026-11-30T00:00:00Z")), "2026-11-30");
  assert.equal(weekStartUtc(Date.parse("2027-01-01T00:00:00Z")), "2026-12-28");
});

test("benchmark empty data never invents a percentile or submission", () => {
  const empty = aggregate({ count: 0, scores: [] });
  assert.equal(benchmarkPosition(900, empty, now), null);
  assert.equal(validateBenchmark(empty, now).count, 0);
  assert.throws(() => validateBenchmark(null, now));
  assert.throws(() => validateBenchmark({ mean: 50 }, now));
});

test("position uses exact real histogram frequencies and reports ties separately", () => {
  assert.deepEqual(benchmarkPosition(900, aggregate(), now), { count: 10, below: 2, equal: 3, above: 5, higherThanPct: 20 });
  assert.equal(benchmarkPosition(1440, aggregate(), now).higherThanPct, 100);
  assert.equal(benchmarkPosition(-240, aggregate(), now).higherThanPct, 0);
  const tied = aggregate({ count: 47, scores: [{ twelfths: 900, count: 47 }] });
  assert.equal(benchmarkPosition(900, tied, now).higherThanPct, 0);
  assert.equal(benchmarkPosition(900, tied, now).equal, 47);
});

test("malformed, inconsistent, stale and future benchmark snapshots are rejected", () => {
  for (const a of [aggregate({ count: 11 }), aggregate({ count: -1 }), aggregate({ weekStart: "2026-11-16" }), aggregate({ generatedAt: "2026-12-01" }), aggregate({ generatedAt: null }), aggregate({ scores: [{ twelfths: 900, count: 0 }] }), aggregate({ count: 2, scores: [{ twelfths: 900, count: 1 }, { twelfths: 900, count: 1 }] }), aggregate({ scores: [{ twelfths: 900.5, count: 10 }] }), aggregate({ scores: [{ twelfths: 1441, count: 10 }] })]) assert.throws(() => validateBenchmark(a, now));
});

test("contribution requires explicit consent and allowlists only marks/accuracy/year", () => {
  assert.throws(() => benchmarkSubmission(mock()));
  assert.throws(() => benchmarkSubmission(mock(), "true"));
  assert.deepEqual(benchmarkSubmission(mock(), true), { marks: 901 / 12, accuracy: 75, paperYear: 2025 });
  for (const patch of [{ kind: "drill" }, { mode: "assisted" }, { paperId: "private-name" }, { totalTwelfths: NaN }, { totalTwelfths: 1441 }]) assert.throws(() => benchmarkSubmission(mock(patch), true));
});

test("benchmark endpoint rejects credentials, query keys, insecure remote URLs", () => {
  assert.equal(benchmarkEndpoint(""), "");
  assert.equal(benchmarkEndpoint("https://example.test/sub/"), "https://example.test/sub");
  assert.equal(benchmarkEndpoint("http://localhost:8000"), "http://localhost:8000");
  for (const url of ["http://example.test", "https://user:pass@example.test", "https://example.test?apiKey=secret", "https://example.test#key", "javascript:alert(1)"]) assert.throws(() => benchmarkEndpoint(url));
});

test("network is opt-in, carries no identity/cookies/referrer, and never auto-retries", async () => {
  const oldFetch = globalThis.fetch;
  const calls = [];
  try {
    globalThis.fetch = async (...args) => { calls.push(args); return { ok: true, json: async () => ({ accepted: true, weekStart: weekStartUtc() }) }; };
    await assert.rejects(fetchBenchmark(""), /not configured/);
    await assert.rejects(contributeBenchmark("https://example.test", mock()), /Choose/);
    assert.equal(calls.length, 0);
    await contributeBenchmark("https://example.test/sub", mock(), true);
    const [url, options] = calls[0];
    assert.equal(url, "https://example.test/sub/benchmark");
    assert.equal(options.credentials, "omit");
    assert.equal(options.referrerPolicy, "no-referrer");
    assert.equal(options.redirect, "error");
    assert.equal(options.cache, "no-store");
    assert.deepEqual(JSON.parse(options.body), benchmarkSubmission(mock(), true));
    globalThis.fetch = async () => { calls.push([]); throw new Error("network"); };
    await assert.rejects(contributeBenchmark("https://example.test", mock(), true), /may have arrived/);
    assert.equal(calls.length, 2);
    await assert.rejects(fetchBenchmark("https://example.test"), /unavailable/);
    assert.equal(calls.length, 3);
    globalThis.fetch = async () => ({ ok: true, json: async () => aggregate({ weekStart: "2000-01-03" }) });
    await assert.rejects(fetchBenchmark("https://example.test"), /stale/);
  } finally { globalThis.fetch = oldFetch; }
});

test("benchmark config and local receipts never enter encrypted study sync", () => {
  const sanitized = sanitizeForSync({ meta: [{ key: "benchmark", baseUrl: "https://private-endpoint.test" }, { key: "benchmarkReceipt:private", acceptedAt: "today" }] });
  assert.deepEqual(sanitized.meta, []);
});
