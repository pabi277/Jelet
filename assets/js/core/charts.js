/**
 * charts.js — JELET Study Hub (v3) · Lightweight inline SVG chart helpers
 * ---------------------------------------------------------------------------
 * Pure string-returning helpers (no DOM access) so they are unit-testable in
 * Node and reusable across Today, You and Results. All strokes/fills reference
 * the theme-adaptive `var(--fig-*)` design tokens so charts switch cleanly in
 * AMOLED Dark Mode. KaTeX is never needed for these simple line/spark charts.
 */

/**
 * Render a compact sparkline (line + soft area fill + end dot) as an inline
 * SVG string. Handles 0, 1 and N values; returns an empty placeholder for 0.
 *
 * @param {number[]} values  ordered series (oldest -> newest)
 * @param {object} opts
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {string} opts.stroke  CSS color / var() for the line
 * @param {string} opts.fill    CSS color / var() for the area fill
 * @param {number} opts.strokeWidth
 * @param {string} opts.ariaLabel
 * @returns {string} inline `<svg>` markup
 */
export function sparklineSvg(
  values = [],
  {
    width = 120,
    height = 36,
    stroke = "var(--fig-primary)",
    fill = "var(--fig-primary)",
    strokeWidth = 2,
    ariaLabel = "Trend chart",
  } = {}
) {
  const nums = (Array.isArray(values) ? values : [])
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));
  if (nums.length === 0) {
    return `<svg class="sparkline" viewBox="0 0 ${width} ${height}" role="img" aria-label="${ariaLabel}" preserveAspectRatio="none"><line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="var(--fig-line)" stroke-width="${strokeWidth}" stroke-dasharray="3 3"/></svg>`;
  }

  const pad = strokeWidth + 2;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const x = (i) =>
    nums.length === 1 ? pad + innerW / 2 : pad + (i * innerW) / (nums.length - 1);
  const y = (v) => pad + innerH - ((v - min) / span) * innerH;

  const points = nums.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const linePoints = points.join(" ");
  const areaPoints = `${pad},${(pad + innerH).toFixed(1)} ${linePoints} ${(
    pad + innerW
  ).toFixed(1)},${(pad + innerH).toFixed(1)}`;
  const lastX = x(nums.length - 1).toFixed(1);
  const lastY = y(nums[nums.length - 1]).toFixed(1);
  const gid = `spark-${Math.round(width)}-${Math.round(height)}-${nums.length}`;

  return `<svg class="sparkline" viewBox="0 0 ${width} ${height}" role="img" aria-label="${ariaLabel}" preserveAspectRatio="none">
  <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${fill}" stop-opacity="0.32"/>
    <stop offset="100%" stop-color="${fill}" stop-opacity="0"/>
  </linearGradient></defs>
  <polygon points="${areaPoints}" fill="url(#${gid})"/>
  <polyline points="${linePoints}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"/>
  <circle cx="${lastX}" cy="${lastY}" r="2.6" fill="${stroke}"/>
</svg>`;
}
