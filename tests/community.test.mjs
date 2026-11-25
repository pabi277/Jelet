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
