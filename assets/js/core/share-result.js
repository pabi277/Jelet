/** Local-only, allowlisted result sharing. Never serializes an attempt/profile. */
import { formatTwelfths, MAX_PAPER_TWELFTHS } from "./scoring.js";
import { computeReadinessEstimate } from "./stats.js";
import { escapeHtml } from "./math.js";

export function isShareableMock(a) {
  return Boolean(a && a.kind === "mock" && a.mode === "independent" &&
    a.maxTwelfths === MAX_PAPER_TWELFTHS && Number.isInteger(a.totalTwelfths));
}

export function mockAccuracy(a) {
  const c = a.counts || {};
  const answered = (c.correct || 0) + (c.partial || 0) + (c.incorrect || 0);
  return answered > 0 ? Math.round((c.correct || 0) * 100 / answered) : 0;
}

export function paperYear(a) {
  const match = /^jelet-(202[2-6])$/.exec(a?.paperId || "");
  return match ? Number(match[1]) : null;
}

export function resultSummary(attempt, attempts = [], full = false) {
  if (!isShareableMock(attempt)) throw new Error("Only independent full mocks can be shared.");
  const summary = {
    totalTwelfths: attempt.totalTwelfths,
    maxTwelfths: attempt.maxTwelfths,
    accuracyPct: mockAccuracy(attempt),
  };
  if (full === true) {
    summary.paper = paperYear(attempt) ? `JELET ${paperYear(attempt)}` : "Full mock";
    summary.elapsedMs = Number.isFinite(attempt.elapsedMs) ? Math.max(0, attempt.elapsedMs) : null;
    const previous = attempts.filter(a => isShareableMock(a) && a.attemptId !== attempt.attemptId &&
      a.submittedAt < attempt.submittedAt).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
    // Reuse readiness accuracy trend's ±5-point threshold on this pair only.
    summary.trend = previous
      ? computeReadinessEstimate({ attempts: [previous, attempt] }).mockTrend : "insufficient";
    summary.sections = ["MATH", "PHYS", "CHEM", "FEEE"].flatMap(id => {
      const score = attempt.bySubject?.[id]?.totalTwelfths;
      return Number.isInteger(score) ? [{ subject: id, totalTwelfths: score }] : [];
    });
  }
  return summary;
}

/** Self-contained SVG: no external images, fonts, scripts, profile or question content. */
export function resultCardSvg(summary, palette = {}) {
  const safeColor = (value, fallback) => /^(#[\da-f]{3,8}|rgba?\([\d.,%\s]+\))$/i.test(value || "") ? value : fallback;
  const bg = safeColor(palette.background, "Canvas");
  const fg = safeColor(palette.text, "CanvasText");
  const accent = safeColor(palette.accent, "LinkText");
  const lines = [
    "Study result · JELET Study Hub",
    `${formatTwelfths(summary.totalTwelfths)} / ${formatTwelfths(summary.maxTwelfths)} marks`,
    `Exact score: ${summary.totalTwelfths} / ${summary.maxTwelfths} twelfths`,
    `Accuracy: ${summary.accuracyPct}%`,
  ];
  if (summary.paper) {
    lines.push(summary.paper,
      `Time taken: ${summary.elapsedMs == null ? "not recorded" : `${Math.floor(summary.elapsedMs / 60000)}m ${Math.floor(summary.elapsedMs / 1000) % 60}s`}`,
      `Accuracy trend vs previous mock: ${summary.trend === "insufficient" ? "no previous mock" : summary.trend}`);
    for (const s of summary.sections || []) lines.push(`${s.subject}: ${formatTwelfths(s.totalTwelfths)} marks`);
  }
  lines.push("Self-reported practice · Not an official WBJEEB document");
  const height = 80 + lines.length * 38;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 ${height}" role="img" aria-label="Study result · JELET Study Hub"><rect width="680" height="${height}" rx="24" fill="${bg}"/><g font-family="system-ui, sans-serif" font-size="21" fill="${fg}">${lines.map((line, i) => `<text x="28" y="${50 + i * 38}"${i === 1 ? ` fill="${accent}" font-weight="bold"` : ""}>${escapeHtml(line)}</text>`).join("")}</g></svg>`;
}
