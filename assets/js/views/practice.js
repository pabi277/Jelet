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
  loadAllUnits,
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
  ADAPTIVE_MIN_ATTEMPTS,
  MISTAKE_GRADUATION_THRESHOLD,
  computeHubSnapshot,
  createSession,
  createMistakeRedrillSession,
  getSession,
  saveSession,
  submitSessionToAttempt,
  getBookmarksMap,
  toggleBookmark,
  getQuestionStatsMap,
  toggleMistakeFlag,
  isMistakeRecordActive,
  resolveDefaultRoutingStrategy,
  resolveUnitQuestionPool,
  samplePracticeQuestions,
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

  const [manifest, papers, allUnits, practiceSets] = await Promise.all([
    loadManifest(),
    loadAllPapers(),
    loadAllUnits(),
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

  const routingDefaults = resolveDefaultRoutingStrategy(snapshot.questionStats);
  const requestedRouting = query?.get("routing")?.toLowerCase();

  let mode = query?.get("mode") === "assisted" ? "assisted" : "independent";
  let routingStrategy =
    requestedRouting === "balanced"
      ? "balanced"
      : requestedRouting === "adaptive" && routingDefaults.adaptiveReady
      ? "adaptive"
      : routingDefaults.strategy; // "adaptive" (>=5 attempts) | "balanced" (<5 attempts)
  let sourceFilter = "official-pyq"; // "official-pyq" | "curated-practice" | "combined"
  let expandedPanel =
    initialUnit !== "ALL"
      ? "drill"
      : query?.get("panel") === "mistake"
      ? "mistake"
      : null; // "drill" | "exam" | "sets" | "mistake" | null

  let drillSubject = initialSubject;
  let drillUnit = initialUnit;
  let drillYear = "ALL";
  let drillCount = 10;

  const allPyqs = papers.flatMap((p) => p.questions);
  const pyqById = new Map(allPyqs.map((q) => [q.id, q]));
  const unitById = new Map(allUnits.map((u) => [u.unitId, u]));
  const allPracticeQs = practiceSets.flatMap((s) => s.questions || []);
  const allQuestionsMap = new Map([...allPyqs, ...allPracticeQs].map((q) => [q.id, q]));

  function getEffectiveRouting() {
    if (mode !== "independent") return "balanced";
    if (routingStrategy === "adaptive" && routingDefaults.adaptiveReady) return "adaptive";
    return "balanced";
  }

  function getSourcePool() {
    if (sourceFilter === "official-pyq") return allPyqs;
    if (sourceFilter === "curated-practice") return allPracticeQs;
    return [...allPyqs, ...allPracticeQs];
  }

  const root = el(`
    <div class="view stack-m">
      <!-- Top Segmented Pill Toggle (04-practice-options.png) -->
      <div class="segmented" id="practiceAssistSegmented" role="tablist" aria-label="Practice assistance mode">
        <button type="button" class="segmented__opt is-active" data-mode="independent">Independent</button>
        <button type="button" class="segmented__opt" data-mode="assisted">With assistance</button>
      </div>
      <p class="card__meta" id="practiceModeNote" style="margin-top:calc(-1 * var(--space-xs))"></p>

      <!-- Adaptive vs Balanced Question Routing Toggle (Phase 07 · Slice 2) -->
      <div class="card card--subtle stack-xs practice-routing-bar" id="practiceRoutingCard">
        <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
          <div class="cluster-xs">
            <strong>Question Routing</strong>
            <span class="pill mono" id="practiceRoutingBadge"></span>
          </div>
          <div class="segmented segmented--compact" id="practiceRoutingToggle" role="tablist" aria-label="Question routing strategy">
            <button type="button" class="segmented__opt" data-routing="adaptive">Adaptive</button>
            <button type="button" class="segmented__opt" data-routing="balanced">Balanced</button>
          </div>
        </div>
        <p class="card__meta" id="practiceRoutingNote"></p>
      </div>

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
    root.querySelectorAll("#practiceAssistSegmented .segmented__opt").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.mode === mode);
    });
    $("#practiceModeNote", root).textContent =
      mode === "independent"
        ? "Independent mode: Answers checked on submit. Updates your true accuracy & Spaced Mistake Queue."
        : "With assistance: Immediate option feedback, concept hints, SymPy steps & Codec AI Tutor unlocked (tracked separately).";

    const effRouting = getEffectiveRouting();
    root.querySelectorAll("#practiceRoutingToggle .segmented__opt").forEach((btn) => {
      const isSelected = btn.dataset.routing === effRouting;
      btn.classList.toggle("is-active", isSelected);
      btn.setAttribute("aria-selected", String(isSelected));
      btn.disabled = mode !== "independent";
    });

    const badgeEl = $("#practiceRoutingBadge", root);
    const noteEl = $("#practiceRoutingNote", root);
    if (mode !== "independent") {
      badgeEl.className = "pill mono";
      badgeEl.textContent = "Balanced (Assisted)";
      noteEl.textContent =
        "With assistance uses Balanced sampling so every topic can be explored with hints.";
    } else if (!routingDefaults.adaptiveReady) {
      badgeEl.className = "pill mono";
      badgeEl.textContent = `${routingDefaults.totalAttempts}/${ADAPTIVE_MIN_ATTEMPTS} attempts`;
      noteEl.textContent = `Balanced active — solve ${ADAPTIVE_MIN_ATTEMPTS - routingDefaults.totalAttempts} more independent question${ADAPTIVE_MIN_ATTEMPTS - routingDefaults.totalAttempts === 1 ? "" : "s"} to auto-unlock Adaptive weak-area weighting.`;
    } else if (effRouting === "adaptive") {
      badgeEl.className = "badge badge--brand mono";
      badgeEl.textContent = `Adaptive · ${routingDefaults.totalAttempts} attempts`;
      noteEl.textContent =
        "Weights questions toward weak units & missed PYQs while keeping a maintenance rotation of mastered topics.";
    } else {
      badgeEl.className = "pill mono";
      badgeEl.textContent = `Balanced · ${routingDefaults.totalAttempts} attempts`;
      noteEl.textContent =
        "Uniform random sampling across your selected syllabus pool (switch to Adaptive anytime).";
    }
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
    // Reuse canonical unit.practiceQuestions / unit.pyqIds mapping for unit-scoped drills
    if (drillUnit !== "ALL" && sourceFilter !== "curated-practice") {
      const unitObj = unitById.get(drillUnit);
      const unitPyqPool = resolveUnitQuestionPool(unitObj, pyqById, {
        filterFn: (q) => drillYear === "ALL" || String(q.year) === drillYear,
      });
      if (sourceFilter === "official-pyq") {
        return unitPyqPool;
      }
      const extraUnitPool = allPracticeQs.filter(
        (q) =>
          !isVoidedQuestion(q) &&
          q.unitId === drillUnit &&
          (drillYear === "ALL" || String(q.year) === drillYear)
      );
      return [...unitPyqPool, ...extraUnitPool];
    }

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
            ${icon("icon-play")} Start ${getEffectiveRouting() === "adaptive" ? "Adaptive " : ""}Drill (${Math.min(drillCount, drillMatching.length)} Qs · ${mode === "assisted" ? "With Assistance" : "Independent"})
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
      const sampled = samplePracticeQuestions(drillMatching, drillCount, {
        strategy: routingStrategy,
        mode,
        questionStats: snapshot.questionStats,
      });
      const prefix = sampled.effectiveStrategy === "adaptive" ? "Adaptive" : "Balanced";
      const label =
        drillUnit !== "ALL"
          ? `Unit ${drillUnit} ${prefix} Drill`
          : drillSubject !== "ALL"
          ? `${SUBJECT_META[drillSubject]?.name || drillSubject} ${prefix} Drill`
          : `Mixed Syllabus ${prefix} Drill`;
      startPracticeSession({ kind: "drill", title: label, pool: sampled.questions });
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
      const sampled = samplePracticeQuestions(cat2Pool, 15, {
        strategy: routingStrategy,
        mode,
        questionStats: snapshot.questionStats,
      });
      startPracticeSession({
        kind: "cat2",
        title: `Category-II Multi-Correct Mastery (${sampled.questions.length} Qs)`,
        pool: sampled.questions,
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

    // 5. Spaced Mistake Notebook (Phase 07 · Slice 3: 1d/3d/7d spaced schedule + N=2 graduation + 1-tap re-drill)
    const scheduledMistakes = snapshot.mistakeQueue?.scheduledMistakes || [];
    const graduatedMistakes = snapshot.mistakeQueue?.graduatedMistakes || [];
    const activeMistakeCount = dueCount + scheduledMistakes.length;

    const mistakeCard = el(`
      <div class="card stack-s">
        <button type="button" class="mode-card-btn" id="toggleMistakePanel">
          <span class="mode-card-btn__icon">${icon("icon-refresh")}</span>
          <span class="mode-card-btn__body">
            <span class="mode-card-btn__title">Spaced Mistake Notebook</span>
            <span class="mode-card-btn__desc">${
              dueCount > 0
                ? `${dueCount} due now · ${scheduledMistakes.length} scheduled (1d/3d/7d) · graduates at ${MISTAKE_GRADUATION_THRESHOLD}/2 correct`
                : scheduledMistakes.length > 0
                ? `0 due now · ${scheduledMistakes.length} scheduled on 1d/3d/7d review intervals`
                : "0 active mistakes — missed independent answers or flagged items queue here"
            }</span>
          </span>
          <div class="cluster-xs">
            <span class="badge ${dueCount > 0 ? "badge--partial" : "badge--brand"} mono">${dueCount} due</span>
            ${icon(expandedPanel === "mistake" ? "icon-chevron-down" : "icon-chevron")}
          </div>
        </button>

        <div class="mode-config stack-s" ${expandedPanel === "mistake" ? "" : "hidden"}>
          ${
            dueCount > 0
              ? `<button type="button" class="btn btn--primary btn--block" id="startMistakeQueueBtn">
                   ${icon("icon-play")} Re-drill All Due (${Math.min(dueCount, 20)} Q${dueCount === 1 ? "" : "s"})
                 </button>`
              : ""
          }
          <div id="arenaMistakeDueList" class="stack-xs"></div>
          ${
            scheduledMistakes.length > 0
              ? `<details class="tiebreak-details">
                   <summary>Scheduled Upcoming Reviews (${scheduledMistakes.length})</summary>
                   <div class="stack-xs" style="margin-top:var(--space-s)" id="arenaMistakeScheduledList"></div>
                 </details>`
              : ""
          }
          ${
            activeMistakeCount === 0
              ? `<p class="card__meta">Your active mistake queue is clear${graduatedMistakes.length ? ` (${graduatedMistakes.length} question${graduatedMistakes.length === 1 ? "" : "s"} graduated after ${MISTAKE_GRADUATION_THRESHOLD} correct re-drills)` : ""}. Solve an Independent drill/mock or flag any tricky question in Results to schedule spaced re-drills.</p>`
              : ""
          }
        </div>
      </div>
    `);

    $("#toggleMistakePanel", mistakeCard).addEventListener("click", () => {
      expandedPanel = expandedPanel === "mistake" ? null : "mistake";
      renderModeCards();
    });

    $("#startMistakeQueueBtn", mistakeCard)?.addEventListener("click", async () => {
      const dueQs = snapshot.dueMistakes
        .map((r) => allQuestionsMap.get(r.questionId))
        .filter(Boolean)
        .slice(0, 20);
      if (!dueQs.length) return;
      const sess = await createMistakeRedrillSession({
        questions: dueQs,
        mistakeRecords: snapshot.dueMistakes,
        title: `Spaced Mistake Review (${dueQs.length} Qs)`,
      });
      location.hash = `#/practice-run/${sess.sessionId}`;
    });

    const dueListEl = $("#arenaMistakeDueList", mistakeCard);
    if (dueListEl && dueCount > 0) {
      for (const rec of snapshot.dueMistakes.slice(0, 12)) {
        const q = allQuestionsMap.get(rec.questionId);
        if (!q) continue;
        const streak = rec.consecutiveCorrect ?? rec.leitnerBox ?? 0;
        const lastStr = rec.lastAttemptAt
          ? new Date(rec.lastAttemptAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
          : null;
        const qLabel = q.year ? `JELET ${q.year} · Q${q.qNumber}` : q.id;
        const row = el(`
          <div class="mistake-notebook-item">
            <div class="mistake-notebook-item__info">
              <div class="cluster-xs">
                <strong class="mono" style="font-size:var(--fs-caption)">${escapeHtml(qLabel)}</strong>
                ${subjectBadgeHtml(q.subjectId)}
                <span class="mono pill">${escapeHtml(q.unitId)}</span>
                ${rec.flaggedAsMistake ? `<span class="badge badge--review">Flagged</span>` : ""}
              </div>
              <span class="card__meta mono">
                ${rec.attemptsCount || 0} attempt${(rec.attemptsCount || 0) === 1 ? "" : "s"}${lastStr ? ` · Last ${escapeHtml(lastStr)}` : ""} · ${streak}/${MISTAKE_GRADUATION_THRESHOLD} to graduate
              </span>
            </div>
            <button type="button" class="btn btn--primary btn--sm js-arena-redrill-one" data-qid="${escapeHtml(q.id)}">
              ${icon("icon-play")} Re-drill
            </button>
          </div>
        `);
        $(".js-arena-redrill-one", row).addEventListener("click", async () => {
          const sess = await createMistakeRedrillSession({
            questions: [q],
            mistakeRecords: [rec],
          });
          location.hash = `#/practice-run/${sess.sessionId}`;
        });
        dueListEl.appendChild(row);
      }
    }

    const schedListEl = $("#arenaMistakeScheduledList", mistakeCard);
    if (schedListEl && scheduledMistakes.length > 0) {
      for (const rec of scheduledMistakes.slice(0, 12)) {
        const q = allQuestionsMap.get(rec.questionId);
        if (!q) continue;
        const dueDateStr = rec.nextReviewAt
          ? new Date(rec.nextReviewAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
          : "Upcoming";
        const streak = rec.consecutiveCorrect ?? rec.leitnerBox ?? 0;
        const qLabel = q.year ? `JELET ${q.year} · Q${q.qNumber}` : q.id;
        const row = el(`
          <div class="mistake-notebook-item">
            <div class="mistake-notebook-item__info">
              <div class="cluster-xs">
                <strong class="mono" style="font-size:var(--fs-caption)">${escapeHtml(qLabel)}</strong>
                ${subjectBadgeHtml(q.subjectId)}
                <span class="mono pill">Due ${escapeHtml(dueDateStr)}</span>
              </div>
              <span class="card__meta mono">${streak}/${MISTAKE_GRADUATION_THRESHOLD} correct · ${rec.attemptsCount || 0} attempt(s)</span>
            </div>
            <button type="button" class="btn btn--ghost btn--sm js-arena-redrill-sched" data-qid="${escapeHtml(q.id)}">
              Re-drill
            </button>
          </div>
        `);
        $(".js-arena-redrill-sched", row).addEventListener("click", async () => {
          const sess = await createMistakeRedrillSession({
            questions: [q],
            mistakeRecords: [rec],
          });
          location.hash = `#/practice-run/${sess.sessionId}`;
        });
        schedListEl.appendChild(row);
      }
    }
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

  root.querySelectorAll("#practiceAssistSegmented .segmented__opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      syncModeButtons();
      renderModeCards();
    });
  });

  root.querySelectorAll("#practiceRoutingToggle .segmented__opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (mode !== "independent") return;
      const target = btn.dataset.routing;
      if (target === "adaptive" && !routingDefaults.adaptiveReady) {
        routingStrategy = "balanced";
        showToast(
          `Solve ${ADAPTIVE_MIN_ATTEMPTS - routingDefaults.totalAttempts} more independent question(s) to unlock Adaptive routing.`
        );
      } else {
        routingStrategy = target;
      }
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

  let [bookmarksMap, qStatsMap] = await Promise.all([
    getBookmarksMap(),
    getQuestionStatsMap(),
  ]);

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
    const liveStat = qStatsMap.get(q.id);
    const isFlaggedMistake = Boolean(liveStat?.flaggedAsMistake);
    const unitTitle = unitTitleMap.get(q.unitId) || q.unitId;

    const priorCtx =
      session.mistakeContext?.[q.id] ||
      (session.kind === "mistake" && liveStat
        ? {
            previousSelected: liveStat.lastMistakeSelected?.length
              ? liveStat.lastMistakeSelected
              : liveStat.lastSelected || [],
            lastOutcome: liveStat.lastMistakeOutcome || liveStat.lastOutcome || null,
            lastAttemptAt: liveStat.lastAttemptAt || null,
            attemptsCount: liveStat.attemptsCount || 0,
            consecutiveCorrect: liveStat.consecutiveCorrect ?? liveStat.leitnerBox ?? 0,
            flaggedAsMistake: Boolean(liveStat.flaggedAsMistake),
          }
        : null);

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
            aria-label="Option ${escapeHtml(opt.id)}"
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

    let mistakeBannerHtml = "";
    if (priorCtx) {
      const prevPickText = priorCtx.previousSelected?.length
        ? `Previous answer: ${priorCtx.previousSelected.join(", ")}${priorCtx.lastOutcome ? ` (${priorCtx.lastOutcome})` : ""}`
        : priorCtx.flaggedAsMistake
        ? "Explicitly flagged for spaced review"
        : "Queued from past mistake";
      const lastDateText = priorCtx.lastAttemptAt
        ? ` · Last ${new Date(priorCtx.lastAttemptAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}`
        : "";
      mistakeBannerHtml = `
        <div class="mistake-redrill-banner" id="pracMistakeBanner">
          <div class="cluster-xs">
            <span class="badge badge--partial">${icon("icon-refresh")} Mistake Re-drill</span>
            <span class="mono pill">${priorCtx.consecutiveCorrect || 0}/${MISTAKE_GRADUATION_THRESHOLD} correct to graduate</span>
          </div>
          <p class="card__meta mono" style="margin:0">
            ${escapeHtml(prevPickText)} · ${priorCtx.attemptsCount || 0} attempt${(priorCtx.attemptsCount || 0) === 1 ? "" : "s"}${escapeHtml(lastDateText)}
          </p>
        </div>
      `;
    }

    const card = el(`
      <article class="card stack-s">
        <div class="row-between" style="align-items:flex-start">
          <div class="cluster-xs">
            ${q.year ? `<span class="mono pill">JELET ${q.year} · Q${q.qNumber}</span>` : `<span class="mono pill">Q${currentIndex + 1}</span>`}
            ${subjectBadgeHtml(q.subjectId)}
            <span class="pill">${escapeHtml(q.unitId)} · ${escapeHtml(unitTitle)}</span>
            <span class="badge ${isCat2 ? "badge--partial" : "badge--brand"}">${escapeHtml(categoryLabel(q))}</span>
          </div>
          <div class="cluster-xs" style="flex-wrap:nowrap">
            <button type="button" class="icon-btn js-prac-flag-mistake" title="${isFlaggedMistake ? "Unflag from Mistake Notebook" : "Flag into Mistake Notebook"}" aria-label="Flag question in Mistake Notebook" aria-pressed="${isFlaggedMistake}">
              ${icon("icon-alert")}
            </button>
            <button type="button" class="icon-btn js-prac-bkm" aria-label="Bookmark question" aria-pressed="${isBkm}">
              ${icon(isBkm ? "icon-bookmark-filled" : "icon-bookmark")}
            </button>
          </div>
        </div>

        ${mistakeBannerHtml}

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
            ${
              priorCtx && !isRevealed
                ? `<button type="button" class="btn btn--ghost btn--sm" id="pracPrevSolBtn">
                     ${icon("icon-layers")} Previous Answer &amp; Solution (Marks Assisted)
                   </button>`
                : ""
            }
          </div>
          ${isRevealed && scoredItem ? outcomeBadgeHtml(scoredItem) : ""}
        </div>

        <div id="pracHintBox" hidden></div>
        <div id="pracPrevSolBox" hidden></div>
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

    $("#pracPrevSolBtn", card)?.addEventListener("click", async () => {
      assistedSet.add(q.id);
      await persist();
      const sol = await loadSolutionForQuestion(q);
      const prevBox = $("#pracPrevSolBox", card);
      prevBox.hidden = false;
      prevBox.innerHTML = "";
      const prevPickDisplay = priorCtx?.previousSelected?.length
        ? priorCtx.previousSelected.join(", ")
        : "None (Flagged)";
      prevBox.appendChild(
        el(`
          <div class="worked-example" style="margin-bottom:var(--space-xs)">
            <div class="solution-step__head">Previous Attempt Record</div>
            <p class="card__meta mono" style="margin:0">
              Previously given answer: <strong>${escapeHtml(prevPickDisplay)}</strong> · Official Key: <strong>${escapeHtml((q.key?.correct || []).join(", "))}</strong>
            </p>
          </div>
        `)
      );
      prevBox.appendChild(
        buildSolutionBlock(q, sol, {
          onAskAi: openAiTutor
            ? (question, solution) =>
                openAiTutor({
                  question,
                  solution,
                  studentSelected: priorCtx?.previousSelected || [],
                })
            : null,
        })
      );
    });

    $(".js-prac-flag-mistake", card).addEventListener("click", async (ev) => {
      const btn = ev.currentTarget;
      const updated = await toggleMistakeFlag(q);
      qStatsMap = await getQuestionStatsMap();
      const nowFlagged = Boolean(updated?.flaggedAsMistake);
      btn.setAttribute("aria-pressed", String(nowFlagged));
      btn.title = nowFlagged
        ? "Unflag from Mistake Notebook"
        : "Flag into Mistake Notebook";
      showToast(
        nowFlagged
          ? "Added to Spaced Mistake Notebook"
          : isMistakeRecordActive(updated)
          ? "Manual flag cleared (past mistake still in queue)"
          : "Removed from Spaced Mistake Notebook"
      );
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
