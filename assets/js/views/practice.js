/**
 * practice.js — JELET Study Hub (v3) · Practice Arena & Interactive Practice Runner
 * ---------------------------------------------------------------------------
 * Visual reference: `docs/references/ui-v3/04-practice-options.png` + `README.md`.
 * Supports:
 *   - Independent vs With Assistance segmented toggle
 *   - Source filter: Official PYQs (2022–2025) / Practice Sets / Combined
 *   - Topic Drill (Subject, Unit M01..E08, Year, Count)
 *   - Category-II Multi-Correct Mastery trainer
 *   - Extensible Practice Sets (`manifest.practiceSets[]`)
 *   - Exam-Style 2h OMR Paper launcher
 *   - Spaced Mistake Queue (Leitner Box 0 / due items — replaces fake "Live Study Room")
 *   - Interactive Practice Runner (`#/practice-run/:sessionId`) with immediate
 *     option feedback, hints, SymPy solutions & Codec AI Tutor in Assisted mode.
 */

import {
  loadManifest,
  loadAllPapers,
  loadAllPracticeSets,
  getQuestionIndex,
  loadSolutionForQuestion,
} from "../core/data-loader.js";
import { renderLatex, escapeHtml } from "../core/math.js";
import {
  scoreQuestion,
  formatTwelfths,
  isVoidedQuestion,
  SUBJECT_META,
} from "../core/scoring.js";
import {
  computeHubSnapshot,
  createSession,
  getSession,
  saveSession,
  submitSessionToAttempt,
  getBookmarksMap,
  toggleBookmark,
} from "../core/stats.js";
import {
  $,
  el,
  icon,
  showToast,
  categoryLabel,
  outcomeBadgeHtml,
  buildSolutionBlock,
  hydrateQuestionFigures,
  subjectBadgeHtml,
} from "../core/ui.js";

export async function renderPracticeArena(main, query) {
  main.innerHTML = `<div class="view"><p class="view__placeholder">Loading Practice Arena…</p></div>`;

  const [manifest, papers, practiceSets] = await Promise.all([
    loadManifest(),
    loadAllPapers(),
    loadAllPracticeSets(),
  ]);
  const snapshot = await computeHubSnapshot(manifest);

  // Auto-open Topic Drill panel if navigated from a Unit Lesson (`#/practice?unit=M01`)
  const initialUnit = query?.get("unit")?.toUpperCase() || "ALL";
  const initialSubject =
    query?.get("subject")?.toUpperCase() ||
    (initialUnit !== "ALL"
      ? manifest.units.find((u) => u.unitId === initialUnit)?.subjectId || "ALL"
      : "ALL");

  let mode = query?.get("mode") === "assisted" ? "assisted" : "independent";
  let sourceFilter = "official-pyq"; // "official-pyq" | "curated-practice" | "combined"
  let expandedPanel = initialUnit !== "ALL" ? "drill" : null; // "drill" | "exam" | "sets" | null

  let drillSubject = initialSubject;
  let drillUnit = initialUnit;
  let drillYear = "ALL";
  let drillCount = 10;

  const allPyqs = papers.flatMap((p) => p.questions);
  const allPracticeQs = practiceSets.flatMap((s) => s.questions || []);

  function getSourcePool() {
    if (sourceFilter === "official-pyq") return allPyqs;
    if (sourceFilter === "curated-practice") return allPracticeQs;
    return [...allPyqs, ...allPracticeQs];
  }

  const root = el(`
    <div class="view stack-m">
      <!-- Top Segmented Pill Toggle (04-practice-options.png) -->
      <div class="segmented" role="tablist" aria-label="Practice assistance mode">
        <button type="button" class="segmented__opt is-active" data-mode="independent">Independent</button>
        <button type="button" class="segmented__opt" data-mode="assisted">With assistance</button>
      </div>
      <p class="card__meta" id="practiceModeNote" style="margin-top:calc(-1 * var(--space-xs))"></p>

      <!-- Question Source Filter Chips -->
      <div class="chip-row" id="practiceSourceChips" aria-label="Question source"></div>

      <!-- Active unsubmitted drill resume banner (if any) -->
      <div id="practiceResumeSlot"></div>

      <!-- 5 Stacked Practice Mode Cards -->
      <div class="stack-s" id="practiceCardsSlot"></div>

      <!-- Recent Submitted Attempts History -->
      <div id="practiceHistorySlot" class="stack-s"></div>
    </div>
  `);

  main.innerHTML = "";
  main.appendChild(root);

  function syncModeButtons() {
    root.querySelectorAll(".segmented__opt").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.mode === mode);
    });
    $("#practiceModeNote", root).textContent =
      mode === "independent"
        ? "Independent mode: Answers checked on submit. Updates your true accuracy & Spaced Mistake Queue."
        : "With assistance: Immediate option feedback, concept hints, SymPy steps & Codec AI Tutor unlocked (tracked separately).";
  }

  function renderSourceChips() {
    const row = $("#practiceSourceChips", root);
    row.innerHTML = "";
    const chips = [
      { id: "official-pyq", label: `Official PYQs (${allPyqs.length})` },
      { id: "curated-practice", label: `Practice Sets (${allPracticeQs.length})` },
      { id: "combined", label: "Combined" },
    ];
    for (const c of chips) {
      const btn = el(
        `<button type="button" class="chip ${sourceFilter === c.id ? "chip--active" : ""}">${escapeHtml(c.label)}</button>`
      );
      btn.addEventListener("click", () => {
        sourceFilter = c.id;
        renderSourceChips();
        renderModeCards();
      });
      row.appendChild(btn);
    }
  }

  function renderResumeBanner() {
    const slot = $("#practiceResumeSlot", root);
    slot.innerHTML = "";
    const activeDrill = (snapshot.activeSessions || []).find((s) => s.kind !== "mock");
    if (!activeDrill) return;
    const ansCount = Object.values(activeDrill.responses || {}).filter((a) => a && a.length).length;
    const card = el(`
      <div class="card card--accent-border row-between">
        <div>
          <span class="badge badge--brand">Active Drill</span>
          <h3 class="card__title" style="margin-top:var(--space-2xs)">${escapeHtml(activeDrill.title)}</h3>
          <p class="card__meta">${ansCount} / ${activeDrill.questionIds.length} answered · ${escapeHtml(activeDrill.mode)}</p>
        </div>
        <button type="button" class="btn btn--primary btn--sm" id="resumeDrillBtn">${icon("icon-play")} Resume</button>
      </div>
    `);
    $("#resumeDrillBtn", card).addEventListener("click", () => {
      location.hash = `#/practice-run/${activeDrill.sessionId}`;
    });
    slot.appendChild(card);
  }

  async function startPracticeSession({ kind, title, pool }) {
    if (!pool.length) {
      showToast("No questions match the selected filter.");
      return;
    }
    const sess = await createSession({
      kind,
      mode,
      title,
      questions: pool,
      durationMinutes: null,
    });
    location.hash = `#/practice-run/${sess.sessionId}`;
  }

  function getFilteredDrillPool() {
    return getSourcePool().filter((q) => {
      if (isVoidedQuestion(q)) return false; // Exclude voided items from custom topic drills so every item has active options
      if (drillSubject !== "ALL" && q.subjectId !== drillSubject) return false;
      if (drillUnit !== "ALL" && q.unitId !== drillUnit) return false;
      if (drillYear !== "ALL" && String(q.year) !== drillYear) return false;
      return true;
    });
  }

  function renderModeCards() {
    const slot = $("#practiceCardsSlot", root);
    slot.innerHTML = "";

    const pool = getSourcePool();
    const cat2Pool = pool.filter((q) => q.category === 2 && !isVoidedQuestion(q));
    const dueCount = snapshot.dueMistakes.length;

    // 1. Topic Drill Card
    const drillMatching = getFilteredDrillPool();
    const unitsForSubject = (manifest.units || []).filter(
      (u) => drillSubject === "ALL" || u.subjectId === drillSubject
    );
    const drillCard = el(`
      <div class="card stack-s">
        <button type="button" class="mode-card-btn" id="toggleDrillPanel">
          <span class="mode-card-btn__icon">${icon("icon-bolt")}</span>
          <span class="mode-card-btn__body">
            <span class="mode-card-btn__title">Topic Drill</span>
            <span class="mode-card-btn__desc">Master specific subjects &amp; 42 syllabus units (${drillMatching.length} Qs available)</span>
          </span>
          ${icon(expandedPanel === "drill" ? "icon-chevron-down" : "icon-chevron")}
        </button>
        <div class="mode-config" ${expandedPanel === "drill" ? "" : "hidden"}>
          <div class="form-grid-2">
            <label class="form-field">
              <span class="form-label">Subject</span>
              <select class="input-select" id="drillSubjectSel">
                <option value="ALL" ${drillSubject === "ALL" ? "selected" : ""}>All 4 Subjects</option>
                <option value="MATH" ${drillSubject === "MATH" ? "selected" : ""}>Mathematics (50m)</option>
                <option value="PHYS" ${drillSubject === "PHYS" ? "selected" : ""}>Physics (35m)</option>
                <option value="CHEM" ${drillSubject === "CHEM" ? "selected" : ""}>Chemistry (25m)</option>
                <option value="FEEE" ${drillSubject === "FEEE" ? "selected" : ""}>FEEE (10m)</option>
              </select>
            </label>
            <label class="form-field">
              <span class="form-label">Syllabus Unit</span>
              <select class="input-select" id="drillUnitSel">
                <option value="ALL" ${drillUnit === "ALL" ? "selected" : ""}>All Units (${unitsForSubject.length})</option>
                ${unitsForSubject
                  .map(
                    (u) =>
                      `<option value="${escapeHtml(u.unitId)}" ${drillUnit === u.unitId ? "selected" : ""}>${escapeHtml(u.unitId)} · ${escapeHtml(u.title)}</option>`
                  )
                  .join("")}
              </select>
            </label>
            <label class="form-field">
              <span class="form-label">Paper Year</span>
              <select class="input-select" id="drillYearSel">
                <option value="ALL" ${drillYear === "ALL" ? "selected" : ""}>All Years (2022–2025)</option>
                <option value="2025" ${drillYear === "2025" ? "selected" : ""}>JELET 2025</option>
                <option value="2024" ${drillYear === "2024" ? "selected" : ""}>JELET 2024</option>
                <option value="2023" ${drillYear === "2023" ? "selected" : ""}>JELET 2023</option>
                <option value="2022" ${drillYear === "2022" ? "selected" : ""}>JELET 2022</option>
              </select>
            </label>
            <label class="form-field">
              <span class="form-label">Question Count</span>
              <select class="input-select" id="drillCountSel">
                <option value="10" ${drillCount === 10 ? "selected" : ""}>10 Questions</option>
                <option value="20" ${drillCount === 20 ? "selected" : ""}>20 Questions</option>
                <option value="999" ${drillCount === 999 ? "selected" : ""}>All (${drillMatching.length})</option>
              </select>
            </label>
          </div>
          <button type="button" class="btn btn--primary btn--block" id="launchDrillBtn" style="margin-top:var(--space-s)">
            ${icon("icon-play")} Start Drill (${Math.min(drillCount, drillMatching.length)} Qs · ${mode === "assisted" ? "With Assistance" : "Independent"})
          </button>
        </div>
      </div>
    `);

    $("#toggleDrillPanel", drillCard).addEventListener("click", () => {
      expandedPanel = expandedPanel === "drill" ? null : "drill";
      renderModeCards();
    });
    $("#drillSubjectSel", drillCard)?.addEventListener("change", (ev) => {
      drillSubject = ev.target.value;
      drillUnit = "ALL";
      renderModeCards();
    });
    $("#drillUnitSel", drillCard)?.addEventListener("change", (ev) => {
      drillUnit = ev.target.value;
      renderModeCards();
    });
    $("#drillYearSel", drillCard)?.addEventListener("change", (ev) => {
      drillYear = ev.target.value;
      renderModeCards();
    });
    $("#drillCountSel", drillCard)?.addEventListener("change", (ev) => {
      drillCount = Number(ev.target.value);
      renderModeCards();
    });
    $("#launchDrillBtn", drillCard)?.addEventListener("click", () => {
      const selectedQs = drillMatching.slice(0, drillCount);
      const label =
        drillUnit !== "ALL"
          ? `Unit ${drillUnit} Topic Drill`
          : drillSubject !== "ALL"
          ? `${SUBJECT_META[drillSubject]?.name || drillSubject} Drill`
          : "Mixed Syllabus Topic Drill";
      startPracticeSession({ kind: "drill", title: label, pool: selectedQs });
    });
    slot.appendChild(drillCard);

    // 2. Category-II Multi-Correct Mastery
    const cat2Card = el(`
      <div class="card">
        <button type="button" class="mode-card-btn" id="startCat2Btn">
          <span class="mode-card-btn__icon">${icon("icon-practice")}</span>
          <span class="mode-card-btn__body">
            <span class="mode-card-btn__title">Category-II Multi-Correct Mastery</span>
            <span class="mode-card-btn__desc">Train partial-credit precision (+2 × c/C, 0 neg) across ${cat2Pool.length} verified Cat-II items</span>
          </span>
          ${icon("icon-chevron")}
        </button>
      </div>
    `);
    $("#startCat2Btn", cat2Card).addEventListener("click", () => {
      const sample = cat2Pool.slice(0, 15);
      startPracticeSession({
        kind: "cat2",
        title: "Category-II Multi-Correct Mastery (15 Qs)",
        pool: sample,
      });
    });
    slot.appendChild(cat2Card);

    // 3. Extra Practice Question Sets (`_data/practice-sets/`)
    const setsCard = el(`
      <div class="card stack-s">
        <button type="button" class="mode-card-btn" id="toggleSetsPanel">
          <span class="mode-card-btn__icon">${icon("icon-layers")}</span>
          <span class="mode-card-btn__body">
            <span class="mode-card-btn__title">Extra Practice Question Sets</span>
            <span class="mode-card-btn__desc">${
              practiceSets.length
                ? `${practiceSets.length} curated Booster / Mock pack(s) ready`
                : "Drop-in Unit Boosters & JU Ranker Mocks (kept separate from Official PYQs)"
            }</span>
          </span>
          ${icon(expandedPanel === "sets" ? "icon-chevron-down" : "icon-chevron")}
        </button>
        <div class="mode-config" ${expandedPanel === "sets" ? "" : "hidden"}>
          ${
            practiceSets.length
              ? practiceSets
                  .map(
                    (ps) => `
                  <div class="row-between" style="padding:var(--space-xs) 0;border-bottom:1px solid var(--border-subtle)">
                    <div>
                      <strong>${escapeHtml(ps.title)}</strong>
                      <p class="card__meta">${(ps.questions || []).length} Qs · SymPy-Verified Original</p>
                    </div>
                    <button type="button" class="btn btn--primary btn--sm js-start-pset" data-set="${escapeHtml(ps.setId)}">Start</button>
                  </div>`
                  )
                  .join("")
              : `<p class="card__meta">Currently 0 extra packs installed in <span class="mono">_data/practice-sets/</span>. Your <strong>Official PYQs Practiced (/400)</strong> counter remains 100% reserved for genuine WBJEEB papers (2022–2025); any future JSON pack added to <span class="mono">manifest.practiceSets[]</span> appears here automatically.</p>`
          }
        </div>
      </div>
    `);
    $("#toggleSetsPanel", setsCard).addEventListener("click", () => {
      expandedPanel = expandedPanel === "sets" ? null : "sets";
      renderModeCards();
    });
    setsCard.querySelectorAll(".js-start-pset").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ps = practiceSets.find((x) => x.setId === btn.dataset.set);
        if (ps) {
          startPracticeSession({
            kind: "practice-set",
            title: ps.title,
            pool: ps.questions || [],
          });
        }
      });
    });
    slot.appendChild(setsCard);

    // 4. Exam-Style Paper (2h OMR Simulation)
    const examCard = el(`
      <div class="card stack-s">
        <button type="button" class="mode-card-btn" id="toggleExamPanel">
          <span class="mode-card-btn__icon">${icon("icon-papers")}</span>
          <span class="mode-card-btn__body">
            <span class="mode-card-btn__title">Exam-Style Paper</span>
            <span class="mode-card-btn__desc">Simulate real 2-hour, 100-question, 120-mark OMR exam conditions</span>
          </span>
          ${icon(expandedPanel === "exam" ? "icon-chevron-down" : "icon-chevron")}
        </button>
        <div class="mode-config stack-xs" ${expandedPanel === "exam" ? "" : "hidden"}>
          ${papers
            .map(
              (p) => `
              <div class="row-between" style="padding:var(--space-2xs) 0">
                <span><strong>${escapeHtml(p.meta.title)}</strong> <span class="card__meta">(100 Qs · 120m)</span></span>
                <button type="button" class="btn btn--primary btn--sm js-launch-exam-year" data-pid="${escapeHtml(p.paperId)}">${icon("icon-play")} Start 2h Mock</button>
              </div>
            `
            )
            .join("")}
        </div>
      </div>
    `);
    $("#toggleExamPanel", examCard).addEventListener("click", () => {
      expandedPanel = expandedPanel === "exam" ? null : "exam";
      renderModeCards();
    });
    examCard.querySelectorAll(".js-launch-exam-year").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const p = papers.find((x) => x.paperId === btn.dataset.pid);
        if (!p) return;
        const sess = await createSession({
          kind: "mock",
          mode: "independent",
          paperId: p.paperId,
          title: `${p.meta.title} · Official Timed Mock`,
          questions: p.questions,
          durationMinutes: p.meta.durationMinutes || 120,
        });
        location.hash = `#/exam/${sess.sessionId}`;
      });
    });
    slot.appendChild(examCard);

    // 5. Spaced Mistake Queue (replaces mockup's non-existent "Live Study Room")
    const mistakeCard = el(`
      <div class="card">
        <button type="button" class="mode-card-btn" id="startMistakeQueueBtn">
          <span class="mode-card-btn__icon">${icon("icon-refresh")}</span>
          <span class="mode-card-btn__body">
            <span class="mode-card-btn__title">Spaced Mistake Queue</span>
            <span class="mode-card-btn__desc">${
              dueCount > 0
                ? `${dueCount} missed/partial question(s) due today in Leitner review`
                : "0 questions due today — solve an Independent drill or mock to populate"
            }</span>
          </span>
          <span class="badge ${dueCount > 0 ? "badge--partial" : "badge--brand"}">${dueCount} due</span>
        </button>
      </div>
    `);
    $("#startMistakeQueueBtn", mistakeCard).addEventListener("click", async () => {
      if (dueCount === 0) {
        showToast("Mistake Queue is clear! Take an Independent drill or mock first.");
        return;
      }
      const qIndex = await getQuestionIndex();
      const dueQs = snapshot.dueMistakes
        .map((r) => qIndex.get(r.questionId))
        .filter(Boolean)
        .slice(0, 20);
      await startPracticeSession({
        kind: "mistake",
        title: `Spaced Mistake Review (${dueQs.length} Qs)`,
        pool: dueQs,
      });
    });
    slot.appendChild(mistakeCard);
  }

  function renderHistory() {
    const slot = $("#practiceHistorySlot", root);
    slot.innerHTML = "";
    if (!snapshot.attempts.length) return;

    slot.appendChild(el(`<h3 class="section-heading">Recent Results (${snapshot.attempts.length})</h3>`));
    for (const att of snapshot.attempts.slice(0, 6)) {
      const dateStr = new Date(att.submittedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const row = el(`
        <a href="#/results/${escapeHtml(att.attemptId)}" class="card row-between" style="text-decoration:none;color:inherit">
          <div>
            <strong>${escapeHtml(att.title)}</strong>
            <p class="card__meta">${escapeHtml(dateStr)} · ${att.mode === "independent" ? "Independent" : "Assisted"} · ${att.counts?.correct || 0}/${att.counts?.total || 0} correct</p>
          </div>
          <div class="cluster-xs">
            <span class="mono badge badge--brand">${formatTwelfths(att.totalTwelfths)} / ${formatTwelfths(att.maxTwelfths)}</span>
            ${icon("icon-chevron")}
          </div>
        </a>
      `);
      slot.appendChild(row);
    }
  }

  root.querySelectorAll(".segmented__opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      syncModeButtons();
      renderModeCards();
    });
  });

  syncModeButtons();
  renderSourceChips();
  renderResumeBanner();
  renderModeCards();
  renderHistory();
}

/**
 * Interactive Practice Session Runner (`#/practice-run/:sessionId`)
 * Supports immediate option feedback + hints + AI Tutor in `assisted` mode,
 * and clean exam-honest scoring in `independent` mode (with opt-in single-question hint).
 */
export async function renderPracticeRunner(main, sessionId, { openAiTutor } = {}) {
  main.innerHTML = `<div class="view"><p class="view__placeholder">Opening practice session…</p></div>`;

  const session = await getSession(sessionId);
  if (!session || session.status !== "in_progress") {
    main.innerHTML = `
      <div class="card stack-s">
        <h2 class="card__title">Practice session already finished or not found</h2>
        <div><a href="#/practice" class="btn btn--primary">Back to Practice</a></div>
      </div>
    `;
    return;
  }

  const [manifest, qIndex] = await Promise.all([loadManifest(), getQuestionIndex()]);
  const unitTitleMap = new Map((manifest.units || []).map((u) => [u.unitId, u.title]));
  const questions = (session.questionIds || []).map((id) => qIndex.get(id)).filter(Boolean);

  // Empty/corrupted pool guard: never render a blank runner.
  if (!questions.length) {
    main.innerHTML = `
      <div class="card stack-s">
        <h2 class="card__title">This practice session has no questions</h2>
        <p class="card__meta">The session may be corrupted or its questions were removed. Start a fresh drill from Practice.</p>
        <div><a href="#/practice" class="btn btn--primary">Back to Practice</a></div>
      </div>
    `;
    return;
  }

  let bookmarksMap = await getBookmarksMap();

  let currentIndex = Math.min(Math.max(0, session.currentIndex || 0), questions.length - 1);
  const responses = { ...(session.responses || {}) };
  const revealedSet = new Set(session.revealedQuestionIds || []);
  const assistedSet = new Set(session.assistedQuestionIds || []);
  const isSessionAssisted = session.mode === "assisted";
  let submitting = false; // double-submit guard for Finish & Score

  async function persist() {
    session.currentIndex = currentIndex;
    session.responses = responses;
    session.revealedQuestionIds = [...revealedSet];
    session.assistedQuestionIds = [...assistedSet];
    await saveSession(session);
  }

  const root = el(`
    <div class="view stack-m">
      <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
        <a href="#/practice" class="btn btn--ghost btn--sm">${icon("icon-back")} Pause</a>
        <div class="cluster-xs">
          <span class="badge ${isSessionAssisted ? "badge--partial" : "badge--brand"}" id="pracModePill">
            ${isSessionAssisted ? "With Assistance" : "Independent"}
          </span>
          <span class="mono pill" id="pracProgressPill">1 / ${questions.length}</span>
        </div>
        <button type="button" class="btn btn--primary btn--sm" id="pracFinishBtn">Finish &amp; Score</button>
      </div>

      <div class="meter"><div class="meter__fill" id="pracProgressBar" style="width:0%"></div></div>

      <div id="pracCardSlot"></div>

      <div class="row-between" style="gap:var(--space-s)">
        <button type="button" class="btn btn--ghost btn--block" id="pracPrevBtn">Previous</button>
        <button type="button" class="btn btn--primary btn--block" id="pracNextBtn">Next Question</button>
      </div>
    </div>
  `);

  main.innerHTML = "";
  main.appendChild(root);

  async function renderCurrent() {
    const q = questions[currentIndex];
    const slot = $("#pracCardSlot", root);
    const selected = new Set(responses[q.id] || []);
    const isCat2 = q.category === 2;
    const isRevealed = revealedSet.has(q.id);
    const isBkm = Boolean(bookmarksMap.get(q.id)?.bookmarked);
    const unitTitle = unitTitleMap.get(q.unitId) || q.unitId;

    $("#pracProgressPill", root).textContent = `${currentIndex + 1} / ${questions.length}`;
    $("#pracProgressBar", root).style.width = `${Math.round(((currentIndex + 1) * 100) / questions.length)}%`;
    $("#pracPrevBtn", root).disabled = currentIndex === 0;
    $("#pracNextBtn", root).textContent =
      currentIndex === questions.length - 1 ? "Finish & View Results" : "Next Question";

    let scoredItem = null;
    if (isRevealed) {
      scoredItem = scoreQuestion(q, [...selected]);
    }
    const correctSet = new Set(q.key?.correct || []);

    const optionsHtml = (q.options || [])
      .map((opt) => {
        const isSel = selected.has(opt.id);
        let feedbackAttr = "";
        if (isRevealed) {
          if (correctSet.has(opt.id)) feedbackAttr = 'data-feedback="correct"';
          else if (isSel) feedbackAttr = 'data-feedback="wrong"';
        }
        const indicator = isCat2
          ? `<span class="option__check" aria-hidden="true">${isSel ? "✓" : ""}</span>`
          : `<span class="option__radio" aria-hidden="true"></span>`;
        return `
          <button
            type="button"
            class="option exam-option"
            data-opt="${escapeHtml(opt.id)}"
            data-selected="${isSel}"
            ${feedbackAttr}
            ${isRevealed ? "disabled" : ""}
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

    const card = el(`
      <article class="card stack-s">
        <div class="row-between" style="align-items:flex-start">
          <div class="cluster-xs">
            ${q.year ? `<span class="mono pill">JELET ${q.year} · Q${q.qNumber}</span>` : `<span class="mono pill">Q${currentIndex + 1}</span>`}
            ${subjectBadgeHtml(q.subjectId)}
            <span class="pill">${escapeHtml(q.unitId)} · ${escapeHtml(unitTitle)}</span>
            <span class="badge ${isCat2 ? "badge--partial" : "badge--brand"}">${escapeHtml(categoryLabel(q))}</span>
          </div>
          <button type="button" class="icon-btn js-prac-bkm" aria-label="Bookmark question" aria-pressed="${isBkm}">
            ${icon(isBkm ? "icon-bookmark-filled" : "icon-bookmark")}
          </button>
        </div>

        <div class="question-stem">${renderLatex(q.stemLatex, { preserveNewlines: true })}</div>
        ${q.stemFigure?.src ? `<div class="figure-frame" data-stem-figure="true"></div>` : ""}

        <div class="stack-xs">${optionsHtml}</div>

        <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
          <div class="cluster-xs">
            ${
              !isRevealed && selected.size > 0
                ? `<button type="button" class="btn btn--ghost btn--sm" id="pracClearBtn">Clear</button>`
                : ""
            }
            ${
              isSessionAssisted && !isRevealed
                ? `<button type="button" class="btn btn--primary btn--sm" id="pracCheckNowBtn">${icon("icon-check")} Check Answer</button>`
                : ""
            }
            <button type="button" class="btn btn--ghost btn--sm" id="pracHintBtn">
              ${icon("icon-spark")} ${isSessionAssisted ? "Hint / AI Tutor" : "Need Hint (Marks Q Assisted)"}
            </button>
          </div>
          ${isRevealed && scoredItem ? outcomeBadgeHtml(scoredItem) : ""}
        </div>

        <div id="pracHintBox" hidden></div>
        <div id="pracSolutionBox" ${isRevealed ? "" : "hidden"}></div>
      </article>
    `);

    slot.innerHTML = "";
    slot.appendChild(card);
    hydrateQuestionFigures(card, q);

    if (isRevealed) {
      const sol = await loadSolutionForQuestion(q);
      const solBox = $("#pracSolutionBox", card);
      solBox.innerHTML = "";
      solBox.appendChild(
        buildSolutionBlock(q, sol, {
          onAskAi: openAiTutor
            ? (question, solution) =>
                openAiTutor({
                  question,
                  solution,
                  studentSelected: [...selected],
                  studentOutcome: scoredItem?.outcome,
                })
            : null,
        })
      );
    }

    card.querySelectorAll(".exam-option").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (isRevealed) return;
        const optId = btn.dataset.opt;
        const prev = responses[q.id] || [];
        if (isCat2) {
          const s = new Set(prev);
          if (s.has(optId)) s.delete(optId);
          else s.add(optId);
          responses[q.id] = ["A", "B", "C", "D"].filter((x) => s.has(x));
        } else {
          // In Assisted Cat-I, give immediate feedback on single tap or let user check!
          // Let's auto-reveal on Cat-I tap in Assisted mode for snappy single-tap feedback,
          // while Cat-II uses "Check Answer" so multi-choices can be ticked first!
          responses[q.id] = prev[0] === optId ? [] : [optId];
          if (isSessionAssisted && responses[q.id].length === 1) {
            revealedSet.add(q.id);
          }
        }
        await persist();
        renderCurrent();
      });
    });

    $("#pracClearBtn", card)?.addEventListener("click", async () => {
      responses[q.id] = [];
      await persist();
      renderCurrent();
    });

    $("#pracCheckNowBtn", card)?.addEventListener("click", async () => {
      revealedSet.add(q.id);
      await persist();
      renderCurrent();
    });

    $("#pracHintBtn", card)?.addEventListener("click", async () => {
      assistedSet.add(q.id);
      await persist();
      const sol = await loadSolutionForQuestion(q);
      const hintBox = $("#pracHintBox", card);
      hintBox.hidden = false;
      hintBox.className = "worked-example";
      hintBox.innerHTML = `
        <div class="solution-step__head">Concept Hint (${escapeHtml(q.unitId)})</div>
        <div>${renderLatex(sol?.conceptSummary || "Apply the core unit relation and check dimensional/boundary conditions.")}</div>
        ${
          openAiTutor
            ? `<button type="button" class="btn btn--ghost btn--sm" id="pracOpenAiBtn" style="margin-top:var(--space-xs)">${icon("icon-spark")} Open Codec AI Tutor</button>`
            : ""
        }
      `;
      $("#pracOpenAiBtn", hintBox)?.addEventListener("click", () => {
        openAiTutor({
          question: q,
          solution: sol,
          studentSelected: [...selected],
        });
      });
    });

    $(".js-prac-bkm", card).addEventListener("click", async (ev) => {
      const btn = ev.currentTarget;
      const updated = await toggleBookmark(q.id, "question", `${q.id} (${q.unitId})`);
      bookmarksMap = await getBookmarksMap();
      const nowBkm = Boolean(updated?.bookmarked);
      btn.setAttribute("aria-pressed", String(nowBkm));
      btn.innerHTML = icon(nowBkm ? "icon-bookmark-filled" : "icon-bookmark");
      showToast(nowBkm ? "Question bookmarked" : "Bookmark removed");
    });
  }

  async function finishDrill() {
    if (submitting) return; // double-submit guard
    submitting = true;
    const finishBtn = $("#pracFinishBtn", root);
    if (finishBtn) {
      finishBtn.disabled = true;
      finishBtn.textContent = "Saving…";
    }
    try {
      await persist();
      const attempt = await submitSessionToAttempt({ session, questions });
      location.hash = `#/results/${attempt.attemptId}`;
    } catch (err) {
      submitting = false;
      if (finishBtn) {
        finishBtn.disabled = false;
        finishBtn.textContent = "Finish & Score";
      }
      showToast(
        err?.name === "StorageQuotaError"
          ? "Storage quota exceeded — finish again after freeing space."
          : "Could not save this attempt — your answers are preserved; try again."
      );
    }
  }

  $("#pracFinishBtn", root).addEventListener("click", finishDrill);
  $("#pracPrevBtn", root).addEventListener("click", async () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      await persist();
      renderCurrent();
    }
  });
  $("#pracNextBtn", root).addEventListener("click", async () => {
    if (currentIndex < questions.length - 1) {
      currentIndex += 1;
      await persist();
      renderCurrent();
    } else {
      await finishDrill();
    }
  });

  await renderCurrent();
}
