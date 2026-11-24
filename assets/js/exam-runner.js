/**
 * exam-runner.js — JELET Study Hub (v3) · Live 2h Timed Mock Runner + OMR
 * ------------------------------------------------------------------------
 * Phone-First Live Exam Runner (Screen 11) with desktop split sidebar
 * (Screen 09). Features:
 *
 *   - 2-hour (120 min) countdown timer with auto-submit at 0
 *   - 100-question OMR runner with Category-I (radio) / Category-II (checkbox)
 *   - 82dvh slide-up OMR Bottom Sheet with 100-Q palette grid
 *   - Subject chips (Maths 40 / Physics 30 / Chem 20 / FEEE 10)
 *   - Auto-save & resume on crash (IndexedDB `sessions` store)
 *   - Printable A4 OMR companion sheet
 *   - Submit → exact 1/12-mark scoring (scoring.js)
 *
 * All state is local-first; answers persist to IndexedDB on every change
 * so a crash-reload restores the exact bubble state and remaining time.
 */

import { openDB, get, put, deleteRecord, getAll } from "./db/indexeddb.js";
import {
  scorePaper,
  tieBreakerVector,
  formatDuration,
  EXAM_DURATION_SECONDS,
  remainingSeconds,
} from "./scoring.js";

/* ================================================================== *
 * Paper data loader
 * ================================================================== */

/**
 * Load a paper's JSON from _data/papers/.
 * @param {string} year e.g. "2025"
 */
export async function loadPaper(year) {
  const res = await fetch(`./_data/papers/${year}.json`);
  if (!res.ok) throw new Error(`Paper ${year} not found (${res.status})`);
  return res.json();
}

/** List available paper years from the manifest. */
export async function listPapers() {
  const res = await fetch("./_data/manifest.json");
  if (!res.ok) return [];
  const manifest = await res.json();
  return (manifest.papers || []).map((p) => ({
    paperId: p.paperId,
    year: p.year,
    questionCount: p.questionCount,
    keyTier: p.keyTier,
  }));
}

/* ================================================================== *
 * Session persistence (IndexedDB `sessions` store)
 * ================================================================== */

function makeSessionId(paperId) {
  return `exam-${paperId}-${Date.now()}`;
}

/** Save (or update) the current exam session to IndexedDB. */
export async function saveSession(session) {
  await put("sessions", session);
}

/** Load the most recent active session for a paper, if any. */
export async function loadSession(paperId) {
  const all = await getAll("sessions");
  const matches = all
    .filter(
      (s) =>
        s.type === "exam" &&
        s.paperId === paperId &&
        s.status === "active"
    )
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return matches[0] || null;
}

/** Delete a session (after submit or manual discard). */
export async function discardSession(sessionId) {
  await deleteRecord("sessions", sessionId);
}

/* ================================================================== *
 * Timer
 * ================================================================== */

class ExamTimer {
  constructor(deadlineEpochMs, onTick, onExpire) {
    this.deadline = deadlineEpochMs;
    this.onTick = onTick;
    this.onExpire = onExpire;
    this._interval = null;
    this._expired = false;
  }

  start() {
    if (this._interval) return;
    this._interval = setInterval(() => this._tick(), 1000);
    this._tick();
  }

  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  _tick() {
    const remaining = remainingSeconds(this.deadline, Date.now());
    if (this.onTick) this.onTick(remaining);
    if (remaining <= 0 && !this._expired) {
      this._expired = true;
      this.stop();
      if (this.onExpire) this.onExpire();
    }
  }

  /** Current remaining seconds. */
  get remaining() {
    return remainingSeconds(this.deadline, Date.now());
  }
}

/* ================================================================== *
 * Exam Runner UI
 * ================================================================== */

/**
 * Render the exam runner view.
 * @param {HTMLElement} main  The #appMain container
 * @param {string} year       Paper year to load (e.g. "2025")
 * @param {object} opts       { onSubmit } callback for submission results
 */
export async function renderExam(main, year, opts = {}) {
  let paper;
  try {
    paper = await loadPaper(year);
  } catch (err) {
    console.error("Failed to load paper:", err);
    main.innerHTML = `<div class="view"><p class="view__placeholder">Paper ${year} could not be loaded.</p></div>`;
    return;
  }

  // Check for existing active session → resume prompt
  const existing = await loadSession(paper.paperId);

  /* ---- State ---- */
  const state = {
    paper,
    answers: new Map(),      // qNumber → Set<string>
    reviewed: new Set(),     // qNumbers flagged for review
    currentIndex: 0,         // 0-based index into paper.questions
    submitted: false,
    sessionId: null,
    deadline: null,
  };

  if (existing && !opts.forceNew) {
    // Restore from saved session
    state.answers = new Map(
      Object.entries(existing.answers || {}).map(([k, v]) => [
        Number(k),
        new Set(v),
      ])
    );
    state.reviewed = new Set(existing.reviewed || []);
    state.currentIndex = existing.currentIndex || 0;
    state.sessionId = existing.sessionId;
    state.deadline = existing.deadline;
  } else {
    // Start fresh
    state.sessionId = makeSessionId(paper.paperId);
    state.deadline = Date.now() + EXAM_DURATION_SECONDS * 1000;
    await saveSession({
      sessionId: state.sessionId,
      type: "exam",
      paperId: paper.paperId,
      year,
      status: "active",
      answers: {},
      reviewed: [],
      currentIndex: 0,
      deadline: state.deadline,
      startedAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  let timer = null;

  /* ---- Persistence helper: save state to IndexedDB ---- */
  async function persist() {
    if (!state.sessionId) return;
    await saveSession({
      sessionId: state.sessionId,
      type: "exam",
      paperId: paper.paperId,
      year,
      status: "active",
      answers: Object.fromEntries(
        [...state.answers].map(([k, v]) => [k, [...v]])
      ),
      reviewed: [...state.reviewed],
      currentIndex: state.currentIndex,
      deadline: state.deadline,
      startedAt: existing?.startedAt || Date.now(),
      updatedAt: Date.now(),
    });
  }

  /* ---- Timer management ---- */
  function startTimer() {
    if (timer) timer.stop();
    timer = new ExamTimer(state.deadline, (remaining) => {
      updateTimerDisplay(remaining);
      // Auto-persist every 10 seconds to be safe
      if (remaining % 10 === 0) persist();
    }, async () => {
      // Auto-submit when time expires
      await submitExam(true);
    });
    timer.start();
  }

  function stopTimer() {
    if (timer) {
      timer.stop();
      timer = null;
    }
  }

  function updateTimerDisplay(remaining) {
    const el = document.getElementById("examTimer");
    if (el) {
      el.textContent = formatDuration(remaining);
      if (remaining <= 60) el.classList.add("is-urgent");
      else el.classList.remove("is-urgent");
    }
  }

  /* ---- Answer manipulation ---- */
  function getSelected(qNumber) {
    return state.answers.get(qNumber) || new Set();
  }

  function setAnswer(qNumber, letter) {
    const q = paper.questions[qNumber - 1];
    if (!q) return;
    const cat = q.category;
    let sel = state.answers.get(qNumber) || new Set();

    if (cat === 1) {
      // Radio: replace with single letter (or clear if same letter clicked)
      if (sel.has(letter)) {
        sel.clear();
      } else {
        sel.clear();
        sel.add(letter);
      }
    } else {
      // Checkbox: toggle
      if (sel.has(letter)) {
        sel.delete(letter);
      } else {
        sel.add(letter);
      }
    }

    if (sel.size === 0) {
      state.answers.delete(qNumber);
    } else {
      state.answers.set(qNumber, sel);
    }

    renderCurrentQuestion();
    updateOmrGrid();
    updateProgress();
    persist();
  }

  function toggleReview() {
    const qNum = paper.questions[state.currentIndex].qNumber;
    if (state.reviewed.has(qNum)) {
      state.reviewed.delete(qNum);
    } else {
      state.reviewed.add(qNum);
    }
    updateOmrGrid();
    renderCurrentQuestion();
    persist();
  }

  function goToQuestion(index) {
    if (index < 0 || index >= paper.questions.length) return;
    state.currentIndex = index;
    renderCurrentQuestion();
    updateOmrGrid();
    persist();
    // Scroll to top of question
    main.scrollTop = 0;
  }

  function nextQuestion() {
    if (state.currentIndex < paper.questions.length - 1) {
      goToQuestion(state.currentIndex + 1);
    }
  }

  function prevQuestion() {
    if (state.currentIndex > 0) {
      goToQuestion(state.currentIndex - 1);
    }
  }

  /* ---- Submit ---- */
  async function submitExam(auto = false) {
    if (state.submitted) return;
    state.submitted = true;
    stopTimer();

    // Build answers map
    const answersMap = {};
    for (const [qNum, sel] of state.answers) {
      answersMap[qNum] = sel;
    }

    // Score
    const scored = scorePaper(paper, answersMap);
    const tb = tieBreakerVector(scored);

    // Save attempt
    const attemptId = `attempt-${Date.now()}`;
    const attempt = {
      attemptId,
      paperId: paper.paperId,
      year,
      mode: "timed",
      submittedAt: Date.now(),
      auto,
      totalTwelfths: scored.totalTwelfths,
      totalMarks: scored.totalMarks,
      totalPositiveTwelfths: scored.totalPositiveTwelfths,
      totalNegativeTwelfths: scored.totalNegativeTwelfths,
      perQuestion: scored.perQuestion.map((r) => ({
        questionNumber: r.questionNumber,
        outcome: r.outcome,
        twelfths: r.twelfths,
      })),
      bySubject: scored.bySubject,
      byOutcome: scored.byOutcome,
      tieBreaker: tb.vector,
    };

    // Save attempt to DB (best-effort)
    try {
      await openDB();
      await put("attempts", attempt);
    } catch (e) {
      console.warn("Failed to save attempt:", e);
    }

    // Clean up session
    if (state.sessionId) {
      await discardSession(state.sessionId);
    }

    // Render results
    renderExamResults(main, scored, tb, paper, opts);
  }

  /* ---- Rendering ---- */

  function renderShell() {
    main.innerHTML = "";

    const examHeader = el(`
      <div class="exam-header" id="examHeader">
        <button class="btn btn--ghost" id="examBackBtn" type="button">${icon("icon-back")}</button>
        <span class="exam-header__title" id="examHeaderTitle">JELET ${paper.year}</span>
        <span class="exam-header__timer" id="examTimer">${formatDuration(EXAM_DURATION_SECONDS)}</span>
      </div>
    `);
    main.appendChild(examHeader);

    // Subject chips
    const chips = el(`<div class="chip-row" id="examChips" aria-label="Subject navigation"></div>`);
    const sections = paper.sections || [];
    for (const sec of sections) {
      const chip = el(`
        <button class="chip" data-subject="${sec.subjectId}" type="button">
          ${sec.title} ${sec.qEnd - sec.qStart + 1}
        </button>
      `);
      chip.addEventListener("click", () => {
        // Navigate to first question of this subject
        const qIndex = sec.qStart - 1;
        goToQuestion(qIndex);
      });
      chips.appendChild(chip);
    }
    main.appendChild(chips);

    // Progress bar
    const progress = el(`
      <div class="exam-progress" id="examProgress">
        <span id="examProgressText">Q1 / ${paper.questions.length}</span>
        <div class="meter"><div class="meter__fill" id="examProgressFill"></div></div>
      </div>
    `);
    main.appendChild(progress);

    // Question container
    const qContainer = el(`<div id="examQuestion" class="exam-question"></div>`);
    main.appendChild(qContainer);

    // OMR sheet trigger
    const omrBtn = el(`
      <button class="btn btn--primary btn--block exam-omr-trigger" id="examOmrBtn" type="button">
        ${icon("icon-check")} OMR ${countAnswered()}/${paper.questions.length}
      </button>
    `);
    main.appendChild(omrBtn);

    // Bottom actions bar
    const actions = el(`
      <div class="exam-actions">
        <button class="btn btn--ghost" id="examPrevBtn" type="button">${icon("icon-back")} Previous</button>
        <button class="btn btn--ghost" id="examReviewBtn" type="button">${icon("icon-bookmark")} Review</button>
        <button class="btn btn--primary" id="examNextBtn" type="button">Save & Next ${icon("icon-chevron")}</button>
      </div>
    `);
    main.appendChild(actions);

    // OMR bottom sheet
    const sheet = el(`
      <div class="sheet-overlay" id="examSheetOverlay" hidden></div>
      <section class="bottom-sheet" id="examOmrSheet" role="dialog" aria-modal="true" aria-label="OMR Sheet" aria-hidden="true">
        <div class="bottom-sheet__handle" aria-hidden="true"></div>
        <div class="bottom-sheet__header">
          <h2 class="bottom-sheet__title">OMR Sheet · ${countAnswered()}/${paper.questions.length}</h2>
          <button class="btn btn--ghost" id="examCloseSheetBtn" type="button" aria-label="Close sheet">
            ${icon("icon-close")}
          </button>
        </div>
        <div class="bottom-sheet__body">
          <div class="omr-grid" id="examOmrGrid" aria-label="Question grid"></div>
        </div>
        <div class="bottom-sheet__footer">
          <button class="btn btn--ghost" id="examPrintOmrBtn" type="button">${icon("icon-download")} Print OMR</button>
          <button class="btn btn--primary" id="examSubmitFromSheetBtn" type="button">Submit Exam</button>
        </div>
      </section>
    `);
    // Append sheet to body (fixed positioning)
    document.body.appendChild(sheet);

    // Wire events
    $("#examBackBtn", main).addEventListener("click", () => {
      if (confirm("Leave the exam? Your progress is saved — you can resume later.")) {
        stopTimer();
        persist();
        if (opts.onBack) opts.onBack();
      }
    });

    $("#examOmrBtn", main).addEventListener("click", () => openSheet($("#examOmrSheet")));
    $("#examCloseSheetBtn", main).addEventListener("click", () => closeSheet($("#examOmrSheet")));
    $("#examSheetOverlay", main).addEventListener("click", () => closeSheet($("#examOmrSheet")));

    $("#examPrevBtn", main).addEventListener("click", prevQuestion);
    $("#examNextBtn", main).addEventListener("click", nextQuestion);
    $("#examReviewBtn", main).addEventListener("click", toggleReview);

    $("#examSubmitFromSheetBtn", main).addEventListener("click", async () => {
      closeSheet($("#examOmrSheet"));
      if (confirm("Submit your exam? You cannot change answers after submitting.")) {
        await submitExam(false);
      }
    });

    $("#examPrintOmrBtn", main).addEventListener("click", () => {
      printOmrSheet(paper, state.answers);
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", examKeyHandler, true);

    startTimer();
    renderCurrentQuestion();
    updateOmrGrid();
    updateProgress();
  }

  function examKeyHandler(e) {
    if (state.submitted) return;
    // Only handle when not in input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevQuestion();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextQuestion();
    } else if (e.key === "Escape") {
      const sheet = $("#examOmrSheet");
      if (sheet && sheet.classList.contains("is-open")) {
        closeSheet(sheet);
      }
    }
  }

  function renderCurrentQuestion() {
    const q = paper.questions[state.currentIndex];
    const container = $("#examQuestion", main);
    if (!container) return;

    const qNum = q.qNumber;
    const sel = getSelected(qNum);
    const isReviewed = state.reviewed.has(qNum);
    const isCat2 = q.category === 2;

    // Build options HTML
    let optionsHtml = "";
    for (const opt of q.options || []) {
      const selected = sel.has(opt.id) ? "true" : "false";
      const letter = opt.id;
      let latex = opt.latex || "";
      optionsHtml += `
        <div class="option" data-option="${letter}" data-selected="${selected}" role="${isCat2 ? "checkbox" : "radio"}" tabindex="0" aria-checked="${selected}">
          <span class="option__letter">${letter}</span>
          <span class="option__text">${latex}</span>
        </div>
      `;
    }

    // Category badge
    const catBadge = isCat2
      ? `<span class="badge badge--brand">Category-II · Multi-Correct</span>`
      : `<span class="badge badge--brand">Category-I · Single Correct</span>`;

    // Figure
    const figureHtml = q.stemFigure
      ? `<div class="figure-frame">${figureSvg(q.stemFigure, q.qNumber)}</div>`
      : "";

    container.innerHTML = `
      <div class="exam-q-card ${isReviewed ? "is-reviewed" : ""}">
        <div class="exam-q-card__head">
          <span class="exam-q-number">Q${qNum}</span>
          ${catBadge}
          ${isReviewed ? `<span class="badge badge--review">Review</span>` : ""}
        </div>
        <div class="exam-q-stem">${q.stemLatex || ""}</div>
        ${figureHtml}
        <div class="exam-q-options">${optionsHtml}</div>
        ${
          isCat2
            ? `<p class="exam-q-hint">Select ALL correct options. Any wrong selection = 0 marks.</p>`
            : `<p class="exam-q-hint">Select the single correct answer. Multiple selections = −¼ mark.</p>`
        }
      </div>
    `;

    // Wire option clicks
    container.querySelectorAll(".option").forEach((optEl) => {
      const letter = optEl.dataset.option;
      optEl.addEventListener("click", () => setAnswer(qNum, letter));
      optEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setAnswer(qNum, letter);
        }
      });
    });

    // Update Review button state
    const reviewBtn = $("#examReviewBtn", main);
    if (reviewBtn) {
      reviewBtn.classList.toggle("is-active", isReviewed);
    }

    // Update progress
    updateProgress();
  }

  function updateProgress() {
    const pct = ((state.currentIndex + 1) / paper.questions.length) * 100;
    const fill = $("#examProgressFill", main);
    if (fill) fill.style.width = `${pct}%`;

    const text = $("#examProgressText", main);
    if (text) text.textContent = `Q${paper.questions[state.currentIndex].qNumber} / ${paper.questions.length}`;

    // Update OMR button
    const omrBtn = $("#examOmrBtn", main);
    if (omrBtn) {
      omrBtn.innerHTML = `${icon("icon-check")} OMR ${countAnswered()}/${paper.questions.length}`;
    }

    // Update sheet title
    const sheetTitle = $("#examOmrSheet .bottom-sheet__title", main);
    if (sheetTitle) {
      sheetTitle.textContent = `OMR Sheet · ${countAnswered()}/${paper.questions.length}`;
    }
  }

  function countAnswered() {
    return state.answers.size;
  }

  function updateOmrGrid() {
    const grid = $("#examOmrGrid", main);
    if (!grid) return;
    grid.innerHTML = "";

    for (let i = 1; i <= paper.questions.length; i++) {
      const q = paper.questions[i - 1];
      const hasAnswer = state.answers.has(i);
      const isReviewed = state.reviewed.has(i);
      const isCurrent = i - 1 === state.currentIndex;

      let stateClass = "";
      if (isReviewed) stateClass = "data-state=\"review\"";
      else if (hasAnswer) stateClass = "data-state=\"answered\"";

      const cell = el(`
        <button class="omr-cell ${isCurrent ? "is-current" : ""}" type="button" data-q="${i}" ${stateClass}>
          ${i}
        </button>
      `);
      cell.addEventListener("click", () => {
        goToQuestion(i - 1);
        closeSheet($("#examOmrSheet"));
      });
      grid.appendChild(cell);
    }
  }

  /* ---- Render results ---- */
  function renderExamResults(container, scored, tb, paper, opts) {
    container.innerHTML = "";

    const totalMarks = scored.totalMarks;
    const totalPct = (scored.totalTwelfths / 1440) * 100;

    container.appendChild(
      el(`
        <div class="view exam-results">
          <div class="exam-results__header">
            <h2>${auto ? "Time's up — Auto-submitted" : "Exam Submitted"}</h2>
            <p>JELET ${paper.year} · ${paper.questions.length} Questions · 120 Marks</p>
          </div>

          <div class="hero-card exam-results__hero">
            <p class="hero-card__eyebrow">Your Score</p>
            <div class="exam-results__score">${totalMarks}</div>
            <div class="exam-results__sub">
              <span>${scored.totalPositiveTwelfths} positive twelfths</span>
              <span>${scored.totalNegativeTwelfths} negative twelfths</span>
            </div>
          </div>

          <section class="card" style="margin-top:1rem">
            <h3 class="card__title">Subject Breakdown</h3>
            ${renderSubjectBreakdown(scored.bySubject)}
          </section>

          <section class="card" style="margin-top:1rem">
            <h3 class="card__title">Outcome Summary</h3>
            ${renderOutcomeSummary(scored.byOutcome)}
          </section>

          <section class="card" style="margin-top:1rem">
            <h3 class="card__title">9-Step Tie-Breaker Vector</h3>
            ${renderTieBreaker(tb.steps)}
          </section>

          <div class="exam-results__actions">
            <button class="btn btn--primary" type="button" id="examDoneBtn">Done</button>
          </div>
        </div>
      `)
    );

    const doneBtn = $("#examDoneBtn", container);
    if (doneBtn) {
      doneBtn.addEventListener("click", () => {
        if (opts.onBack) opts.onBack();
        else location.hash = "#/papers";
      });
    }
  }

  function renderSubjectBreakdown(bySubject) {
    const rows = SUBJECT_LABELS.map((s) => {
      const subj = bySubject[s.id];
      if (!subj) return "";
      const marks = (subj.netTwelfths / 12).toFixed(2);
      const maxMarks = s.maxMarks;
      return `
        <div class="subject-breakdown__row">
          <span class="subject-breakdown__name">${s.name}</span>
          <div class="meter"><div class="meter__fill" style="width:${Math.max(0, Math.min(100, (subj.netTwelfths / (maxMarks * 12)) * 100))}%"></div></div>
          <span class="subject-breakdown__marks">${marks} / ${maxMarks}</span>
        </div>
      `;
    });
    return `<div class="subject-breakdown">${rows.join("")}</div>`;
  }

  function renderOutcomeSummary(byOutcome) {
    return `
      <div class="outcome-grid">
        <div class="outcome-tile"><span class="badge badge--correct">${byOutcome.correct}</span><span>Correct</span></div>
        <div class="outcome-tile"><span class="badge badge--partial">${byOutcome.partial}</span><span>Partial</span></div>
        <div class="outcome-tile"><span class="badge badge--wrong">${byOutcome.incorrect}</span><span>Incorrect</span></div>
        <div class="outcome-tile"><span class="badge badge--review">${byOutcome.unattempted}</span><span>Unattempted</span></div>
        <div class="outcome-tile"><span class="badge badge--brand">${byOutcome.voided_awarded}</span><span>Voided</span></div>
      </div>
    `;
  }

  function renderTieBreaker(steps) {
    const rows = steps
      .map(
        (s) => `
        <div class="tiebreaker-row">
          <span class="tiebreaker-step">Step ${s.step}</span>
          <span class="tiebreaker-label">${s.label}</span>
          <span class="tiebreaker-value">${s.value} twelfths</span>
          <span class="tiebreaker-dir">${s.direction === "asc" ? "↑ lower" : "↓ higher"}</span>
        </div>
      `
      )
      .join("");
    return `<div class="tiebreaker">${rows}</div>`;
  }

  /* ---- Print OMR Sheet ---- */
  function printOmrSheet(paper, answers) {
    const win = window.open("", "_blank");
    if (!win) {
      alert("Pop-up blocked. Please allow pop-ups to print the OMR sheet.");
      return;
    }

    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">`;
    html += `<link rel="stylesheet" href="./assets/css/tokens.css">`;
    html += `<title>JELET ${paper.year} OMR Sheet</title>`;
    html += `<style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: system-ui, -apple-system, sans-serif; padding: 16px; color: var(--text-primary); }
      h1 { text-align: center; margin-bottom: 4px; font-size: 18px; }
      .subtitle { text-align: center; margin-bottom: 16px; font-size: 12px; color: var(--text-secondary); }
      .omr-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; max-width: 780px; margin: 0 auto; }
      .omr-cell { border: 1.5px solid var(--fig-axis); border-radius: 8px; padding: 6px 4px; text-align: center; font-size: 11px; }
      .omr-cell__num { font-weight: bold; font-size: 13px; }
      .omr-cell__bubbles { display: flex; justify-content: center; gap: 3px; margin-top: 4px; }
      .bubble { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--fig-axis); display: flex; align-items: center; justify-content: center; font-size: 9px; }
      .bubble--selected { background: var(--brand-primary); color: var(--text-on-brand); border-color: var(--brand-primary); }
      .footer { text-align: center; margin-top: 24px; font-size: 10px; color: var(--text-muted); }
      @media print { body { padding: 0; } }
    </style></head><body>`;

    html += `<h1>JELET ${paper.year} — OMR Answer Sheet</h1>`;
    html += `<p class="subtitle">Paper-I · 100 Questions · 120 Marks · Duration: 2 Hours</p>`;
    html += `<p class="subtitle">Encircle the correct answer. For Category-II, mark ALL correct options.</p>`;
    html += `<div class="omr-grid">`;

    for (let i = 1; i <= paper.questions.length; i++) {
      const q = paper.questions[i - 1];
      const sel = answers.get(i) || new Set();
      const bubbles = ["A", "B", "C", "D"]
        .map((letter) => {
          const isSel = sel.has(letter);
          return `<div class="bubble ${isSel ? "bubble--selected" : ""}">${letter}</div>`;
        })
        .join("");
      html += `
        <div class="omr-cell">
          <div class="omr-cell__num">${i}.</div>
          <div class="omr-cell__bubbles">${bubbles}</div>
        </div>
      `;
    }

    html += `</div>`;
    html += `<div class="footer">JELET Study Hub v3 · Generated for offline practice · Official WBJEEB answer keys used</div>`;
    html += `</body></html>`;

    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  /* ---- Cleanup ---- */
  function cleanup() {
    stopTimer();
    document.removeEventListener("keydown", examKeyHandler, true);
    // Remove sheet from body
    const sheet = $("#examOmrSheet");
    if (sheet && sheet.parentNode) sheet.parentNode.removeChild(sheet);
    const overlay = $("#examSheetOverlay");
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  // Store cleanup reference
  main._examCleanup = cleanup;

  /* ---- Render ---- */
  renderShell();

  // If resuming, start timer immediately
  startTimer();
}

/* ================================================================== *
 * Shared helpers
 * ================================================================== */

const $ = (sel, root = document) => root.querySelector(sel);

function el(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

function icon(id) {
  return `<svg class="ico" aria-hidden="true"><use href="./assets/icons/icons.svg#${id}"/></svg>`;
}

function openSheet(sheet) {
  const overlay = document.getElementById("examSheetOverlay");
  if (overlay) {
    overlay.hidden = false;
    overlay.classList.add("is-open");
  }
  sheet.classList.add("is-open");
  sheet.setAttribute("aria-hidden", "false");
}

function closeSheet(sheet) {
  const overlay = document.getElementById("examSheetOverlay");
  if (overlay) {
    overlay.classList.remove("is-open");
    overlay.hidden = true;
  }
  sheet.classList.remove("is-open");
  sheet.setAttribute("aria-hidden", "true");
}

const SUBJECT_LABELS = [
  { id: "MATH", name: "Mathematics", maxMarks: 50 },
  { id: "PHYS", name: "Physics", maxMarks: 35 },
  { id: "CHEM", name: "Chemistry", maxMarks: 25 },
  { id: "FEEE", name: "FEEE", maxMarks: 10 },
];

/** Render an inline SVG figure from _data/figures/. */
async function figureSvg(figureKey, qNumber) {
  // figureKey is like "q42" — find the paper's year from context
  // This is a simplified loader — the exam runner passes the figure URL directly
  return `<div class="figure-placeholder">[Figure for Q${qNumber}]</div>`;
}

export { figureSvg };
