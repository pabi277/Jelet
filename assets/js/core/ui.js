/**
 * ui.js — JELET Study Hub (v3) · Shared DOM, Question & Solution Card Helpers
 * ---------------------------------------------------------------------------
 * Reusable phone-first rendering helpers shared across Papers, Live Exam,
 * Practice, Results, Learn, Today, You, and Codec AI Tutor.
 */

import { renderLatex, escapeHtml } from "./math.js";
import { mountFigure } from "./data-loader.js";
import { isVoidedQuestion, formatTwelfths, formatExactFraction, SUBJECT_META } from "./scoring.js";

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function icon(id, extraClass = "") {
  const cls = extraClass ? `ico ${extraClass}` : "ico";
  return `<svg class="${cls}" aria-hidden="true"><use href="./assets/icons/icons.svg#${id}"/></svg>`;
}

export function el(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

/** Format milliseconds `mm:ss` or `hh:mm:ss` in tabular numerals. */
export function formatDurationClock(ms, { forceHours = false } = {}) {
  const totalSec = Math.max(0, Math.ceil((Number(ms) || 0) / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (forceHours || hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/** Subtle non-blocking toast notification for phone actions (bookmark, backup, etc.). */
let _toastTimer = null;
export function showToast(message) {
  let node = document.getElementById("appToast");
  if (!node) {
    node = document.createElement("div");
    node.id = "appToast";
    node.className = "app-toast";
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    document.body.appendChild(node);
  }
  node.textContent = message;
  node.classList.add("is-visible");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => node.classList.remove("is-visible"), 2600);
}

/** Category marking pill text (`Cat I · +1 / -0.25` or `Cat II · +2 / Partial`). */
export function categoryLabel(question) {
  if (isVoidedQuestion(question)) {
    const marks = question.category === 2 ? "+2.00" : "+1.00";
    return `Cat ${question.category === 2 ? "II" : "I"} · Voided W (${marks} to all)`;
  }
  return question.category === 2
    ? "Cat II · +2 / Partial · 0 Neg"
    : "Cat I · +1 / −0.25";
}

/** Outcome badge HTML (`Correct`, `Partial`, `Incorrect`, `Unattempted`, `Voided W`). */
export function outcomeBadgeHtml(item) {
  if (!item) return "";
  const scoreStr = formatTwelfths(item.twelfths, { signed: true });
  const thirdHint =
    Math.abs(item.twelfths) % 3 !== 0 ? ` (${formatExactFraction(item.twelfths)})` : "";
  switch (item.outcome) {
    case "correct":
      return `<span class="badge badge--correct">${icon("icon-check")} Correct (${scoreStr})</span>`;
    case "partial":
      return `<span class="badge badge--partial">Partial (${scoreStr}${thirdHint})</span>`;
    case "incorrect":
      return `<span class="badge badge--wrong">${icon("icon-close")} Incorrect (${scoreStr})</span>`;
    case "voided_awarded":
      return `<span class="badge badge--review">Voided W (${scoreStr})</span>`;
    default:
      return `<span class="pill">Unattempted (0)</span>`;
  }
}

/**
 * Render a SymPy-verified solution block (concept summary + steps + verification + traps).
 */
export function buildSolutionBlock(question, solution, { onAskAi = null } = {}) {
  const wrap = el(`<div class="solution-panel"></div>`);
  if (!solution) {
    wrap.innerHTML = `<p class="card__meta">Solution data unavailable.</p>`;
    return wrap;
  }

  const keyDisplay = isVoidedQuestion(question)
    ? `Withdrawn (W) — Full +${formatTwelfths(question.fullTwelfths)} mark awarded to all`
    : (question.key?.correct || []).join(", ");

  const stepsHtml = (solution.steps || [])
    .map(
      (st) => `
      <div class="solution-step">
        <div class="solution-step__head">Step ${escapeHtml(st.stepNumber)}: ${renderLatex(st.title || "")}</div>
        <div class="solution-step__body">${renderLatex(st.bodyLatex || "", { preserveNewlines: true })}</div>
      </div>
    `
    )
    .join("");

  let trapsHtml = "";
  if (solution.optionTraps && Object.keys(solution.optionTraps).length) {
    const rows = Object.entries(solution.optionTraps)
      .map(
        ([opt, txt]) =>
          `<div><strong>Option ${escapeHtml(opt)}:</strong> ${renderLatex(txt)}</div>`
      )
      .join("");
    trapsHtml = `<div class="exam-trap"><strong>${icon("icon-alert")} Option Trap Watch:</strong>${rows}</div>`;
  }

  const verifNote = solution.verification?.note
    ? `<div class="solution-verify">${icon("icon-check")} <span><strong>Verified (${escapeHtml(solution.verification.method || "sympy")}):</strong> ${escapeHtml(solution.verification.note)}</span></div>`
    : "";

  wrap.innerHTML = `
    <div class="ai-banner">
      ${icon("icon-lock")}
      <span>Official Answer: <strong>${escapeHtml(keyDisplay)}</strong> · ${escapeHtml(question.key?.sourceRef || "SymPy Verified")}</span>
    </div>
    ${
      solution.conceptSummary
        ? `<div class="worked-example" style="margin-top:var(--space-s)">
             <div class="solution-step__head">Concept Summary</div>
             <div>${renderLatex(solution.conceptSummary)}</div>
           </div>`
        : ""
    }
    <div class="solution-steps-list">${stepsHtml}</div>
    ${trapsHtml}
    ${verifNote}
    ${
      onAskAi
        ? `<div style="margin-top:var(--space-s);display:flex;justify-content:flex-end">
             <button type="button" class="btn btn--ghost btn--sm js-ask-ai-btn">
               ${icon("icon-spark")} Ask Codec AI Tutor
             </button>
           </div>`
        : ""
    }
  `;

  if (onAskAi) {
    const btn = $(".js-ask-ai-btn", wrap);
    if (btn) btn.addEventListener("click", () => onAskAi(question, solution));
  }
  return wrap;
}

/**
 * Mount all stem and option SVG figures inside a rendered question container.
 */
export function hydrateQuestionFigures(rootEl, question) {
  if (!rootEl || !question) return;
  if (question.stemFigure?.src) {
    const stemSlot = $('[data-stem-figure="true"]', rootEl);
    if (stemSlot) mountFigure(stemSlot, question.stemFigure, { zoomable: true });
  }
  for (const opt of question.options || []) {
    if (opt.figure?.src) {
      const optSlot = $(`[data-opt-figure="${opt.id}"]`, rootEl);
      if (optSlot) mountFigure(optSlot, opt.figure, { zoomable: true, compact: true });
    }
  }
}

export function subjectBadgeHtml(subjectId) {
  const s = SUBJECT_META[subjectId] || { shortName: subjectId };
  return `<span class="subject-pill" data-subject="${escapeHtml(subjectId)}">${escapeHtml(s.shortName)}</span>`;
}
