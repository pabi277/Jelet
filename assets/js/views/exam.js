/**
 * exam.js — JELET Study Hub (v3) · Phone-First Live Timed OMR Runner & Printable OMR
 * ---------------------------------------------------------------------------
 * Visual references:
 *   - Phone (<1024px) : `docs/references/ui-v3/11-phone-live-exam-omr.png`
 *   - Desktop (>=1024): `docs/references/ui-v3/09-live-exam-omr-runner.png`
 *
 * Enforces:
 *   - Exact Cat-I radio (with 1-tap Clear) & Cat-II multi-select checkboxes
 *   - Crash-safe IndexedDB auto-save of millisecond timer + bubble state
 *   - Slide-up 82dvh 100-Q OMR Bottom Sheet on phone + permanent 320px right
 *     docked Question Palette on desktop + keyboard shortcuts (A-D/1-4, M, Backspace, Arrows)
 *   - Hard Exam Integrity Lock: AI Tutor & solutions are never loaded while a
 *     timed mock is active.
 */

import {
  loadManifest,
  loadPaper,
  getQuestionIndex,
} from "../core/data-loader.js";
import { renderLatex, escapeHtml } from "../core/math.js";
import { SUBJECT_META } from "../core/scoring.js";
import {
  getSession,
  saveSession,
  submitSessionToAttempt,
} from "../core/stats.js";
import {
  $,
  el,
  icon,
  formatDurationClock,
  showToast,
  categoryLabel,
  hydrateQuestionFigures,
} from "../core/ui.js";

/**
 * Render Live Timed Exam & OMR Runner (`#/exam/:sessionId`).
 * Returns a cleanup function registered with the router to clear intervals/listeners.
 */
export async function renderLiveExam(main, sessionId, { openSheet, closeSheet }) {
  main.innerHTML = `<div class="view" style="padding:var(--space-l)"><p class="view__placeholder">Restoring exam session…</p></div>`;

  const session = await getSession(sessionId);
  if (!session || session.status !== "in_progress") {
    main.innerHTML = `
      <div class="view" style="padding:var(--space-l)">
        <div class="card stack-s">
          <h2 class="card__title">Exam session not found or already submitted</h2>
          <p class="card__meta">Check your Results history or launch a new paper from the Papers library.</p>
          <div><a class="btn btn--primary" href="#/papers">Go to Papers</a></div>
        </div>
      </div>
    `;
    return () => {};
  }

  // Load questions in exact session order (WITHOUT loading solutions!)
  const [manifest, qIndex] = await Promise.all([loadManifest(), getQuestionIndex()]);
  const unitTitleMap = new Map((manifest.units || []).map((u) => [u.unitId, u.title]));
  const questions = (session.questionIds || [])
    .map((id) => qIndex.get(id))
    .filter(Boolean);

  if (!questions.length) {
    main.innerHTML = `<div class="card" style="margin:var(--space-l)"><p>Unable to load questions for this session.</p></div>`;
    return () => {};
  }

  // Mutable live state mirrored continuously to IndexedDB `sessions`
  let currentIndex = Math.min(Math.max(0, session.currentIndex || 0), questions.length - 1);
  const responses = { ...(session.responses || {}) };
  const reviewSet = new Set(session.markedForReview || []);
  let remainingMs =
    session.remainingMs != null ? session.remainingMs : 120 * 60 * 1000;
  let lastTick = Date.now();
  let submitting = false;
  let confirmModalOpen = false;

  // Compute subject jump ranges dynamically from `questions`
  const subjectTabs = [];
  for (const sid of ["MATH", "PHYS", "CHEM", "FEEE"]) {
    const firstIdx = questions.findIndex((q) => q.subjectId === sid);
    const count = questions.filter((q) => q.subjectId === sid).length;
    if (firstIdx !== -1 && count > 0) {
      subjectTabs.push({
        subjectId: sid,
        shortName: SUBJECT_META[sid]?.shortName || sid,
        fullName: SUBJECT_META[sid]?.name || sid,
        count,
        firstIndex: firstIdx,
      });
    }
  }

  async function persistNow() {
    if (submitting) return;
    session.currentIndex = currentIndex;
    session.responses = responses;
    session.markedForReview = [...reviewSet];
    session.remainingMs = Math.max(0, Math.round(remainingMs));
    session.lastTickAt = Date.now();
    try {
      await saveSession(session);
    } catch (_) {
      /* ignore transient write errors */
    }
  }

  function countStats() {
    let answered = 0;
    for (const q of questions) {
      if ((responses[q.id] || []).length > 0) answered += 1;
    }
    const review = reviewSet.size;
    const left = Math.max(0, questions.length - answered);
    return { answered, review, left };
  }

  const root = el(`
    <div class="exam-runner">
      <!-- Row 1: Sticky 52px Exam Header (11-phone-live-exam-omr.png & 09-live-exam-omr-runner.png) -->
      <header class="exam-header">
        <button type="button" class="icon-btn" id="examPauseExitBtn" title="Save &amp; Pause Exam" aria-label="Save and exit exam">
          ${icon("icon-back")}
        </button>
        <div class="exam-header__title" id="examHeaderTitle">${escapeHtml(session.title.replace(/ · Official Timed Mock$/, ""))}</div>
        <div class="exam-timer-pill mono" id="examTimerPill" aria-live="off">
          ${icon("icon-timer")} <span id="examTimerText">${formatDurationClock(remainingMs, { forceHours: true })}</span>
        </div>
        <button type="button" class="btn btn--primary btn--sm exam-omr-trigger" id="examOpenOmrBtn">
          OMR <span class="mono" id="examOmrCountText">0/${questions.length}</span>
        </button>
        <button type="button" class="btn btn--primary btn--sm exam-desktop-submit" id="examDesktopSubmitBtn">
          Submit Paper
        </button>
      </header>

      <!-- Row 2: Sticky 44px Subject Jump Strip -->
      <nav class="exam-subject-strip" id="examSubjectStrip" aria-label="Jump to subject section"></nav>

      <!-- Workspace: Single column on Phone -> Split Question + 320px Docked Palette on Desktop (>=1024px) -->
      <div class="exam-workspace">
        <div class="exam-question-col">
          <article class="card exam-q-card" id="examQuestionCard"></article>
        </div>

        <aside class="card exam-docked-palette" aria-label="Desktop Question Palette">
          <div class="row-between">
            <div>
              <h2 class="card__title" style="margin:0">Question Palette</h2>
              <p class="card__meta">OMR status · Live</p>
            </div>
            <span class="mono pill" id="desktopPalettePct">0%</span>
          </div>
          <div class="omr-legend" id="desktopOmrLegend"></div>
          <div class="omr-grid exam-docked-grid" id="desktopOmrGrid"></div>
          <div class="exam-palette-summary" id="desktopPaletteSummary"></div>
          <p class="card__meta" style="font-size:var(--fs-micro)">
            Keys: <span class="mono">A–D</span> answer · <span class="mono">M</span> review · <span class="mono">⌫</span> clear · <span class="mono">←/→</span> nav
          </p>
        </aside>
      </div>

      <!-- Sticky Thumb Bottom Bar -->
      <footer class="exam-bottom-bar">
        <button type="button" class="btn btn--ghost exam-review-btn" id="examMarkReviewBtn">
          ${icon("icon-bookmark")} <span>Mark Review</span>
        </button>
        <button type="button" class="btn btn--ghost" id="examPrevBtn">
          Previous
        </button>
        <button type="button" class="btn btn--primary" id="examNextBtn">
          Save &amp; Next
        </button>
      </footer>

      <!-- Submit Confirmation Dialog -->
      <div class="exam-submit-modal" id="examSubmitModal" hidden role="dialog" aria-modal="true" aria-label="Confirm paper submission">
        <div class="card exam-submit-modal__card stack-m">
          <h3 class="card__title">Submit ${escapeHtml(session.title)}?</h3>
          <div id="examSubmitSummary" class="stack-xs"></div>
          <p class="card__meta">Once submitted, answers are locked and exact 1/12-mark WBJEEB scoring + SymPy solutions unlock immediately.</p>
          <div class="row-between" style="gap:var(--space-s)">
            <button type="button" class="btn btn--ghost btn--block" id="cancelSubmitBtn">Keep Solving</button>
            <button type="button" class="btn btn--primary btn--block" id="confirmSubmitBtn">Submit Final OMR</button>
          </div>
        </div>
      </div>
    </div>
  `);

  main.innerHTML = "";
  main.appendChild(root);

  const omrSheet = $("#omrSheet");
  // Enhance #omrSheet body with live legend + Submit button while in Exam view
  const omrSheetTitle = omrSheet?.querySelector(".bottom-sheet__title");
  const omrSheetBody = omrSheet?.querySelector(".bottom-sheet__body");
  if (omrSheetTitle) {
    omrSheetTitle.textContent = `Question Palette · ${questions.length} Qs`;
  }
  if (omrSheetBody) {
    omrSheetBody.innerHTML = `
      <div class="omr-legend" id="mobileOmrLegend" style="margin-bottom:var(--space-s)"></div>
      <div class="omr-grid" id="omrGrid" aria-label="Question grid"></div>
      <div class="exam-sheet-actions">
        <button type="button" class="btn btn--primary btn--block" id="mobileSheetSubmitBtn">
          Submit Paper
        </button>
      </div>
    `;
  }

  function renderSubjectStrip() {
    const strip = $("#examSubjectStrip", root);
    strip.innerHTML = "";
    const curSubj = questions[currentIndex]?.subjectId;
    for (const tab of subjectTabs) {
      const active = tab.subjectId === curSubj;
      const btn = el(`
        <button type="button" class="chip ${active ? "chip--active" : ""}" data-subj="${tab.subjectId}">
          <span>${escapeHtml(tab.shortName)}</span>
          <span class="mono exam-subj-count">${tab.count}</span>
        </button>
      `);
      btn.addEventListener("click", () => {
        currentIndex = tab.firstIndex;
        persistNow();
        renderQuestionAndPalettes();
      });
      strip.appendChild(btn);
    }
  }

  function cellStateFor(q) {
    const hasAns = (responses[q.id] || []).length > 0;
    const isRev = reviewSet.has(q.id);
    if (hasAns && isRev) return "answered-review";
    if (isRev) return "review";
    if (hasAns) return "answered";
    return "unvisited";
  }

  function populateGrid(gridEl, closeOnTap) {
    if (!gridEl) return;
    gridEl.innerHTML = "";
    questions.forEach((q, idx) => {
      const st = cellStateFor(q);
      const cell = el(
        `<button class="omr-cell ${idx === currentIndex ? "is-current" : ""}" type="button" data-q="${idx + 1}" ${st !== "unvisited" ? `data-state="${st}"` : ""}>${q.qNumber || idx + 1}</button>`
      );
      cell.addEventListener("click", () => {
        currentIndex = idx;
        persistNow();
        renderQuestionAndPalettes();
        if (closeOnTap && omrSheet) closeSheet(omrSheet);
      });
      gridEl.appendChild(cell);
    });
  }

  function renderPalettes() {
    const { answered, review, left } = countStats();
    const countText = $("#examOmrCountText", root);
    if (countText) countText.textContent = `${answered}/${questions.length}`;

    const legendHtml = `
      <span class="omr-legend__item"><span class="omr-dot omr-dot--answered"></span> ${answered} Answered</span>
      <span class="omr-legend__item"><span class="omr-dot omr-dot--review"></span> ${review} Review</span>
      <span class="omr-legend__item"><span class="omr-dot omr-dot--left"></span> ${left} Left</span>
    `;
    const mobLegend = $("#mobileOmrLegend");
    if (mobLegend) mobLegend.innerHTML = legendHtml;
    const deskLegend = $("#desktopOmrLegend", root);
    if (deskLegend) deskLegend.innerHTML = legendHtml;

    const pct = Math.round((answered * 100) / questions.length);
    const pctEl = $("#desktopPalettePct", root);
    if (pctEl) pctEl.textContent = `${pct}%`;

    const summaryEl = $("#desktopPaletteSummary", root);
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="meter"><div class="meter__fill" style="width:${pct}%"></div></div>
        <div class="row-between card__meta" style="margin-top:var(--space-2xs)">
          <span>${pct}% answered</span>
          <span class="mono">Q${currentIndex + 1} / ${questions.length}</span>
        </div>
      `;
    }

    populateGrid($("#omrGrid"), true);
    populateGrid($("#desktopOmrGrid", root), false);
  }

  function toggleOption(q, optId) {
    const prev = responses[q.id] || [];
    if (q.category === 2) {
      // Category-II multi-select checkbox
      const set = new Set(prev);
      if (set.has(optId)) set.delete(optId);
      else set.add(optId);
      responses[q.id] = ["A", "B", "C", "D"].filter((x) => set.has(x));
    } else {
      // Category-I radio: tapping an already-selected option clears it cleanly!
      if (prev.length === 1 && prev[0] === optId) {
        responses[q.id] = [];
      } else {
        responses[q.id] = [optId];
      }
    }
    persistNow();
    renderQuestionAndPalettes();
  }

  function clearCurrentChoice() {
    const q = questions[currentIndex];
    if (!q) return;
    responses[q.id] = [];
    persistNow();
    renderQuestionAndPalettes();
  }

  function toggleReviewCurrent() {
    const q = questions[currentIndex];
    if (!q) return;
    if (reviewSet.has(q.id)) reviewSet.delete(q.id);
    else reviewSet.add(q.id);
    persistNow();
    renderQuestionAndPalettes();
  }

  function renderQuestionCard() {
    const q = questions[currentIndex];
    const qCard = $("#examQuestionCard", root);
    const selected = new Set(responses[q.id] || []);
    const isCat2 = q.category === 2;
    const isReviewed = reviewSet.has(q.id);
    const unitTitle = unitTitleMap.get(q.unitId) || q.unitId;
    const keyTierBadge =
      q.key?.keyTier === "official"
        ? "Official WBJEEB Set A Verified"
        : "SymPy-Verified Set A";

    const optionsHtml = (q.options || [])
      .map((opt) => {
        const isSel = selected.has(opt.id);
        const indicator = isCat2
          ? `<span class="option__check" aria-hidden="true">${isSel ? "✓" : ""}</span>`
          : `<span class="option__radio" aria-hidden="true"></span>`;
        return `
          <button
            type="button"
            class="option exam-option"
            data-opt="${escapeHtml(opt.id)}"
            data-selected="${isSel}"
            role="${isCat2 ? "checkbox" : "radio"}"
            aria-checked="${isSel}"
          >
            ${indicator}
            <span class="option__letter">${escapeHtml(opt.id)}</span>
            <div class="exam-option__content">
              <div>${renderLatex(opt.latex)}</div>
              ${opt.figure?.src ? `<div class="figure-frame" data-opt-figure="${escapeHtml(opt.id)}"></div>` : ""}
            </div>
          </button>
        `;
      })
      .join("");

    qCard.innerHTML = `
      <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
        <h2 class="exam-q-heading">Question ${q.qNumber || currentIndex + 1} <span class="exam-q-of">of ${questions.length}</span></h2>
        ${isReviewed ? `<span class="badge badge--review">${icon("icon-bookmark-filled")} Marked for Review</span>` : ""}
      </div>

      <div class="cluster-xs" style="margin-top:var(--space-xs)">
        <span class="badge badge--brand">${escapeHtml(q.unitId)} · ${escapeHtml(unitTitle)}</span>
        <span class="badge ${isCat2 ? "badge--partial" : "badge--correct"}">${escapeHtml(categoryLabel(q))}</span>
        <span class="pill">${icon("icon-lock")} ${escapeHtml(keyTierBadge)}</span>
      </div>

      ${
        isCat2
          ? `<div class="cat2-callout">Category II Multi-Correct: One or more options may be correct. Partial marks (+2 × c/C) if zero wrong options are marked; 0 negative marks.</div>`
          : ""
      }

      <div class="question-stem" style="margin-top:var(--space-m)">
        ${renderLatex(q.stemLatex, { preserveNewlines: true })}
      </div>

      ${q.stemFigure?.src ? `<div class="figure-frame" style="margin-top:var(--space-m)" data-stem-figure="true"></div>` : ""}

      <div class="stack-xs" style="margin-top:var(--space-m)" role="${isCat2 ? "group" : "radiogroup"}" aria-label="Answer options">
        ${optionsHtml}
      </div>

      ${
        selected.size > 0
          ? `<div style="margin-top:var(--space-s);display:flex;justify-content:space-between;align-items:center">
               <span class="card__meta">Selected: <strong class="mono">${[...selected].join(", ")}</strong></span>
               <button type="button" class="btn btn--ghost btn--sm" id="examInlineClearBtn">Clear choice</button>
             </div>`
          : ""
      }
    `;

    hydrateQuestionFigures(qCard, q);

    qCard.querySelectorAll(".exam-option").forEach((btn) => {
      btn.addEventListener("click", () => toggleOption(q, btn.dataset.opt));
    });

    const clearBtn = $("#examInlineClearBtn", qCard);
    if (clearBtn) clearBtn.addEventListener("click", clearCurrentChoice);

    // Sync bottom-bar states
    const revBtn = $("#examMarkReviewBtn", root);
    if (revBtn) {
      revBtn.classList.toggle("is-reviewed", isReviewed);
      revBtn.innerHTML = `${icon(isReviewed ? "icon-bookmark-filled" : "icon-bookmark")} <span>${isReviewed ? "Reviewed" : "Mark Review"}</span>`;
    }
    const prevBtn = $("#examPrevBtn", root);
    if (prevBtn) prevBtn.disabled = currentIndex === 0;

    const nextBtn = $("#examNextBtn", root);
    if (nextBtn) {
      nextBtn.innerHTML =
        currentIndex === questions.length - 1 ? "Review &amp; Submit" : "Save &amp; Next";
    }
  }

  function renderQuestionAndPalettes() {
    renderSubjectStrip();
    renderQuestionCard();
    renderPalettes();
  }

  function openSubmitDialog() {
    confirmModalOpen = true;
    const { answered, review, left } = countStats();
    const modal = $("#examSubmitModal", root);
    const sum = $("#examSubmitSummary", root);
    sum.innerHTML = `
      <div class="row-between"><span class="card__meta">Time Remaining</span><strong class="mono">${formatDurationClock(remainingMs, { forceHours: true })}</strong></div>
      <div class="row-between"><span class="card__meta">Answered</span><strong class="mono">${answered} / ${questions.length}</strong></div>
      <div class="row-between"><span class="card__meta">Marked for Review</span><strong class="mono">${review}</strong></div>
      <div class="row-between"><span class="card__meta">Unattempted</span><strong class="mono">${left}</strong></div>
    `;
    modal.hidden = false;
    if (omrSheet) closeSheet(omrSheet);
  }

  function closeSubmitDialog() {
    confirmModalOpen = false;
    $("#examSubmitModal", root).hidden = true;
  }

  async function finalizeSubmission(autoExpired = false) {
    if (submitting) return;
    submitting = true;
    clearInterval(timerInterval);
    session.currentIndex = currentIndex;
    session.responses = responses;
    session.markedForReview = [...reviewSet];
    session.remainingMs = Math.max(0, Math.round(remainingMs));
    const attempt = await submitSessionToAttempt({ session, questions });
    if (autoExpired) {
      showToast("Time up! Paper auto-submitted.");
    }
    location.hash = `#/results/${attempt.attemptId}`;
  }

  // Controls wiring
  $("#examPauseExitBtn", root).addEventListener("click", async () => {
    await persistNow();
    showToast("Exam paused & saved locally — resume anytime");
    location.hash = "#/papers";
  });

  $("#examOpenOmrBtn", root).addEventListener("click", () => {
    if (omrSheet) openSheet(omrSheet);
  });

  $("#examDesktopSubmitBtn", root).addEventListener("click", openSubmitDialog);
  const mobSub = $("#mobileSheetSubmitBtn");
  if (mobSub) mobSub.addEventListener("click", openSubmitDialog);

  $("#cancelSubmitBtn", root).addEventListener("click", closeSubmitDialog);
  $("#confirmSubmitBtn", root).addEventListener("click", () => finalizeSubmission(false));

  $("#examMarkReviewBtn", root).addEventListener("click", toggleReviewCurrent);
  $("#examPrevBtn", root).addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      persistNow();
      renderQuestionAndPalettes();
    }
  });
  $("#examNextBtn", root).addEventListener("click", () => {
    if (currentIndex < questions.length - 1) {
      currentIndex += 1;
      persistNow();
      renderQuestionAndPalettes();
    } else {
      openSubmitDialog();
    }
  });

  // Desktop Keyboard Shortcuts (`A-D` / `1-4`, `M`, `Backspace`, `ArrowLeft/Right`)
  function onKeyDown(ev) {
    if (confirmModalOpen || submitting) return;
    if (ev.target && ["INPUT", "TEXTAREA", "SELECT"].includes(ev.target.tagName)) return;
    const key = ev.key;
    const up = key.toUpperCase();
    const q = questions[currentIndex];
    if (!q) return;

    if (["A", "B", "C", "D"].includes(up)) {
      ev.preventDefault();
      toggleOption(q, up);
    } else if (["1", "2", "3", "4"].includes(key)) {
      ev.preventDefault();
      toggleOption(q, ["A", "B", "C", "D"][Number(key) - 1]);
    } else if (up === "M") {
      ev.preventDefault();
      toggleReviewCurrent();
    } else if (key === "Backspace" || key === "Delete") {
      ev.preventDefault();
      clearCurrentChoice();
    } else if (key === "ArrowRight") {
      if (currentIndex < questions.length - 1) {
        ev.preventDefault();
        currentIndex += 1;
        persistNow();
        renderQuestionAndPalettes();
      }
    } else if (key === "ArrowLeft") {
      if (currentIndex > 0) {
        ev.preventDefault();
        currentIndex -= 1;
        persistNow();
        renderQuestionAndPalettes();
      }
    }
  }
  document.addEventListener("keydown", onKeyDown);

  function onVisibilityChange() {
    if (document.visibilityState === "hidden") persistNow();
    else lastTick = Date.now();
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  // Live 1-second timer + 5-second crash-safe persistence
  let tickCount = 0;
  const timerPill = $("#examTimerPill", root);
  const timerText = $("#examTimerText", root);
  const timerInterval = setInterval(() => {
    const now = Date.now();
    const delta = Math.min(5000, Math.max(0, now - lastTick));
    lastTick = now;
    remainingMs = Math.max(0, remainingMs - delta);

    if (timerText) {
      timerText.textContent = formatDurationClock(remainingMs, { forceHours: true });
    }
    if (timerPill) {
      timerPill.dataset.urgency =
        remainingMs <= 2 * 60 * 1000
          ? "danger"
          : remainingMs <= 10 * 60 * 1000
          ? "warn"
          : "normal";
    }

    tickCount += 1;
    if (tickCount % 5 === 0) persistNow();

    if (remainingMs <= 0) {
      finalizeSubmission(true);
    }
  }, 1000);

  renderQuestionAndPalettes();

  return () => {
    clearInterval(timerInterval);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    persistNow();
  };
}

/**
 * Printable A4 100-Question OMR Sheet (`#/omr-print/:paperId`)
 */
export async function renderPrintableOmr(main, paperId) {
  let paper;
  try {
    paper = await loadPaper(paperId);
  } catch {
    main.innerHTML = `<div class="card"><p>Paper not found.</p></div>`;
    return;
  }

  const qByNum = new Map(paper.questions.map((q) => [q.qNumber, q]));

  function buildColumn(start, end) {
    let rows = "";
    for (let n = start; n <= end; n++) {
      const q = qByNum.get(n);
      const isCat2 = q?.category === 2;
      rows += `
        <div class="print-omr-row ${isCat2 ? "print-omr-row--cat2" : ""}">
          <span class="print-omr-qnum mono">${String(n).padStart(3, " ")}</span>
          <span class="print-omr-cat">${isCat2 ? "II" : "I"}</span>
          <span class="print-omr-bubble">A</span>
          <span class="print-omr-bubble">B</span>
          <span class="print-omr-bubble">C</span>
          <span class="print-omr-bubble">D</span>
        </div>
      `;
    }
    return `<div class="print-omr-col">${rows}</div>`;
  }

  const root = el(`
    <div class="view stack-m">
      <div class="row-between no-print" style="flex-wrap:wrap;gap:var(--space-s)">
        <a href="#/papers" class="btn btn--ghost btn--sm">${icon("icon-back")} Back to Papers</a>
        <button type="button" class="btn btn--primary btn--sm" id="triggerPrintOmrBtn">
          ${icon("icon-print")} Print / Save A4 PDF
        </button>
      </div>

      <section class="card print-omr-sheet">
        <header class="print-omr-sheet__head">
          <div>
            <h2 style="margin:0;font-size:var(--fs-h3)">WBJEEB JELET Paper-I · Offline OMR Practice Sheet</h2>
            <p class="card__meta">${escapeHtml(paper.meta.title)} · Booklet Series ${escapeHtml(paper.bookletSeries)} · Duration: 120 Minutes · Max Marks: 120</p>
          </div>
          <div class="print-omr-fields">
            <div class="print-omr-box">Candidate Name: ______________________</div>
            <div class="print-omr-box">Date: ____ / ____ / 202_ · Score: ____ / 120</div>
          </div>
        </header>

        <p class="card__meta" style="margin:var(--space-xs) 0 var(--space-s)">
          <strong>Marking Rules:</strong> Category I (marked <span class="mono">I</span>): Single option only (+1, −0.25 wrong/multi-bubble). Category II (shaded <span class="mono">II</span>): One or more correct (+2 × c/C if zero wrong marked, 0 negative). Use black/blue ballpoint pen.
        </p>

        <div class="print-omr-columns">
          ${buildColumn(1, 25)}
          ${buildColumn(26, 50)}
          ${buildColumn(51, 75)}
          ${buildColumn(76, 100)}
        </div>
      </section>
    </div>
  `);

  main.innerHTML = "";
  main.appendChild(root);

  $("#triggerPrintOmrBtn", root).addEventListener("click", () => {
    window.print();
  });
}
