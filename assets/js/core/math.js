/**
 * math.js — JELET Study Hub (v3) · Offline KaTeX Math & Prose Renderer
 * ---------------------------------------------------------------------------
 * Uses the vendored offline KaTeX bundle (`assets/vendor/katex/katex.mjs`).
 * Zero network calls, XSS-safe plain-text escaping, and `.math-scroll`
 * horizontal containment so 3x3 matrices and long integrals never cause
 * page-level horizontal scroll on narrow 360px phones.
 */

import katex from "../../vendor/katex/katex.mjs";

/** Escape HTML special characters in plain-text prose segments. */
export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Normalize odd-dollar edge cases (e.g. a formula missing a trailing `$`). */
function normalizeDelimiters(raw) {
  const s = String(raw ?? "");
  const withoutEscaped = s.replace(/\\\$/g, "").replace(/\$\$/g, "");
  const count = (withoutEscaped.match(/\$/g) || []).length;
  if (count % 2 === 1) {
    return s + "$";
  }
  return s;
}

/** Render a pure LaTeX expression with KaTeX, falling back cleanly if malformed. */
export function renderPureLatex(expr, displayMode = false) {
  const trimmed = String(expr ?? "").trim();
  if (!trimmed) return "";
  try {
    const html = katex.renderToString(trimmed, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
    });
    return displayMode ? `<div class="math-scroll">${html}</div>` : html;
  } catch {
    return `<code>${escapeHtml(trimmed)}</code>`;
  }
}

/**
 * Render mixed prose + `$...$` inline math + `$$...$$` display math to safe HTML.
 * Preserves newlines as `<br>` when `preserveNewlines` is true.
 */
export function renderLatex(input, { displayBlock = false, preserveNewlines = false } = {}) {
  if (input === null || input === undefined || input === "") return "";
  const str = normalizeDelimiters(input);
  const tokenRe = /\$\$([\s\S]+?)\$\$|\$((?:\\.|[^$\\])+)\$/g;

  let out = "";
  let lastIndex = 0;
  let match;

  while ((match = tokenRe.exec(str)) !== null) {
    if (match.index > lastIndex) {
      let plain = escapeHtml(str.slice(lastIndex, match.index));
      if (preserveNewlines) plain = plain.replace(/\n/g, "<br>");
      out += plain;
    }
    const isDisplay = match[1] !== undefined;
    const expr = isDisplay ? match[1] : match[2];
    out += renderPureLatex(expr, isDisplay);
    lastIndex = tokenRe.lastIndex;
  }

  if (lastIndex < str.length) {
    let tail = escapeHtml(str.slice(lastIndex));
    if (preserveNewlines) tail = tail.replace(/\n/g, "<br>");
    out += tail;
  }

  if (displayBlock) {
    return `<div class="math-scroll">${out}</div>`;
  }
  return out;
}

/** Convert LaTeX-annotated prose into clean searchable lowercase text. */
export function stripLatexForSearch(str) {
  if (!str) return "";
  return String(str)
    .replace(/\$\$?/g, " ")
    .replace(/\\(?:text|mathrm|operatorname|mathbf|mathit)\{([^}]*)\}/g, " $1 ")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/[{}^_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
