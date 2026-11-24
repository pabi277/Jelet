/**
 * today.js — JELET Study Hub (v3) · Today Dashboard & Persistent Pomodoro Timer
 * ---------------------------------------------------------------------------
 * Visual references:
 *   - Phone (<1024px) : `docs/references/ui-v3/07-today-dashboard.png`
 *   - Desktop (>=1024): `docs/references/ui-v3/08-modern-web-dashboard.png`
 *
 * Computes 100% of metrics honestly from `jelet_hub_v1` IndexedDB (`0` and `—`
 * on a fresh device). Zero fake streaks, zero fake completion bars.
 */

import {
  loadManifest,
  loadAllPapers,
  loadUnit,
  getQuestionIndex,
} from "../core/data-loader.js";
import { escapeHtml } from "../core/math.js";
import { sparklineSvg } from "../core/charts.js";
import { formatTwelfths, SUBJECT_META, isVoidedQuestion } from "../core/scoring.js";
import {
  computeHubSnapshot,
  createSession,
  createMistakeRedrillSession,
  WEAK_AREA_MIN_ATTEMPTS,
  MISTAKE_GRADUATION_THRESHOLD,
  resolveUnitQuestionPool,
  samplePracticeQuestions,
} from "../core/stats.js";
import { getMeta, setMeta } from "../db/indexeddb.js";
import {
  $,
  el,
  icon,
  formatDurationClock,
  showToast,
  subjectBadgeHtml,
} from "../core/ui.js";

const POMODORO_FULL_SEC = 25 * 60;
const SUBJECT_ICONS = {
  MATH: "icon-math",
  PHYS: "icon-phys",
  CHEM: "icon-chem",
  FEEE: "icon-feee",
};

function getPomodoroSeconds(pomo) {
  if (!pomo) return POMODORO_FULL_SEC;
  if (!pomo.running || !pomo.lastStartedAt) {
    return Math.max(0, Number(pomo.secondsLeft ?? POMODORO_FULL_SEC));
  }
  const elapsedSec = Math.floor((Date.now() - pomo.lastStartedAt) / 1000);
  return Math.max(0, Number(pomo.secondsLeft ?? POMODORO_FULL_SEC) - elapsedSec);
}

export async function renderTodayDashboard(main, { openAiTutor } = {}) {
  main.innerHTML = `<div class="view"><p class="view__placeholder">Loading study dashboard…</p></div>`;

  const manifest = await loadManifest();
  const snapshot = await computeHubSnapshot(manifest);
  const {
    meta,
    activeSession,
    streakDays,
    officialPyqsPracticed,
    totalOfficialPyqs,
    mockBestTwelfths,
    mockHistory,
    dueMistakes,
    mistakeQueue,
    weakAreas,
    subjectStats,
    roadmapUnit,
  } = snapshot;
  const scheduledMistakes = mistakeQueue?.scheduledMistakes || [];
  const graduatedMistakes = mistakeQueue?.graduatedMistakes || [];

  const profileName = (meta.profile?.name || "").trim();
  const targetYear = meta.profile?.targetYear || 2028;
  const targetBranch = meta.profile?.targetBranch || "Jadavpur Univ. CSE";
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const greetingTitle = profileName
    ? `${timeGreeting}, ${profileName}`
    : `${timeGreeting}`;

  // Hero left content: Active session OR Next Roadmap Unit
  let heroEyebrow = "TODAY'S ROADMAP FOCUS";
  let heroTitle = roadmapUnit
    ? `${roadmapUnit.title} (${roadmapUnit.unitId})`
    : "Matrices up to Order 3 (M01)";
  let heroSub = roadmapUnit
    ? `${SUBJECT_META[roadmapUnit.subjectId]?.name || roadmapUnit.subjectId} · ${roadmapUnit.officialCode}`
    : "Mathematics · Math-A";
  const totalRevisedUnits = Object.values(subjectStats).reduce(
    (acc, s) => acc + s.revisedUnits,
    0
  );
  let heroPct = Math.round((totalRevisedUnits * 100) / 42);
  let heroPctLabel = `${totalRevisedUnits}/42 units revised (${heroPct}%)`;
  let heroCtaLabel = "Resume Learning";

  if (activeSession) {
    const ans = Object.values(activeSession.responses || {}).filter(
      (a) => a && a.length
    ).length;
    const tot = activeSession.questionIds?.length || 1;
    heroEyebrow = "CONTINUE ACTIVE SESSION";
    heroTitle = activeSession.title;
    heroSub = `${ans} of ${tot} questions answered`;
    heroPct = Math.round((ans * 100) / tot);
    heroPctLabel = `${heroPct}% answered`;
    heroCtaLabel = activeSession.kind === "mock" ? "Resume Mock" : "Resume Drill";
  }

  let pomoState = meta.pomodoro || {
    secondsLeft: POMODORO_FULL_SEC,
    running: false,
    lastStartedAt: null,
  };
  const ringCircumference = 2 * Math.PI * 44;

  const root = el(`
    <div class="view stack-m today-dashboard">
      <!-- Greeting & Streak Strip -->
      <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
        <div>
          <div class="cluster-xs">
            <h2 class="today-greeting">${escapeHtml(greetingTitle)}</h2>
            <span class="badge badge--brand">JELET ${escapeHtml(targetYear)} · 120m Pattern</span>
          </div>
          <p class="card__meta">Target: ${escapeHtml(targetBranch)} · Local-first study tracker</p>
        </div>
        <div class="streak-chip" title="Consecutive study days with submitted practice">
          ${icon("icon-flame")} <span class="mono">${streakDays}</span> day${streakDays === 1 ? "" : "s"}
        </div>
      </div>

      <!-- Desktop 4-Tile Stat Strip (08-modern-web-dashboard.png) -->
      <section class="stat-grid today-desktop-stats" aria-label="Study statistics">
        <div class="stat-tile">
          <div class="stat-tile__label">${icon("icon-flame")} Day Streak</div>
          <div class="stat-tile__value">${streakDays}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__label">${icon("icon-check")} Verified PYQs Practiced</div>
          <div class="stat-tile__value">${officialPyqsPracticed}/${totalOfficialPyqs}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__label">${icon("icon-trophy")} Mock Best</div>
          <div class="stat-tile__value">${mockBestTwelfths !== null ? `${formatTwelfths(mockBestTwelfths)}/120` : "— / 120"}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__label">${icon("icon-refresh")} Mistake Queue</div>
          <div class="stat-tile__value">${dueMistakes.length} Due</div>
        </div>
      </section>

      <!-- Mock History Summary (Phase 08) -->
      <section class="card stack-s" id="todayMockHistoryCard" aria-label="Mock history summary">
        <div class="row-between">
          <h3 class="section-heading" style="margin:0">Mock History</h3>
          <a href="#/you" class="card__meta" style="text-decoration:none">All mocks ›</a>
        </div>
        ${
          mockHistory.empty
            ? `<p class="card__meta" style="margin:0">No timed mocks yet — start a 2-hour mock from Papers to track score, accuracy &amp; completion-time trends.</p>`
            : `
          <div class="today-mock-summary stack-xs">
            <div class="row-between">
              <span class="card__meta">Best score</span>
              <strong class="mono">${mockHistory.bests.bestScore ? formatTwelfths(mockHistory.bests.bestScore.totalTwelfths) + " / 120" : "—"}</strong>
            </div>
            ${sparklineSvg(mockHistory.trends.score, { width: 240, height: 40, ariaLabel: "Mock score trend" })}
            <div class="row-between">
              <span class="card__meta">Mocks taken</span>
              <strong class="mono">${mockHistory.count}</strong>
            </div>
          </div>`
        }
      </section>

      <!-- Emerald-Teal Focus Hero Card (07-today-dashboard.png & 08-modern-web-dashboard.png) -->
      <section class="hero-card today-hero">
        <div class="today-hero__left stack-s">
          <p class="hero-card__eyebrow" style="margin:0">${escapeHtml(heroEyebrow)}</p>
          <h3 class="hero-card__title">${escapeHtml(heroTitle)}</h3>
          <p class="today-hero__sub">${escapeHtml(heroSub)}</p>
          <div class="today-hero__progress-row">
            <div class="today-hero__bar"><div style="width:${heroPct}%"></div></div>
            <span class="mono today-hero__pct">${escapeHtml(heroPctLabel)}</span>
          </div>
          <div>
            <button type="button" class="today-hero__cta" id="todayHeroResumeBtn">
              ${icon("icon-play")} ${escapeHtml(heroCtaLabel)}
            </button>
          </div>
        </div>

        <div class="today-hero__timer">
          <div class="pomo-ring">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle class="pomo-ring__track" cx="50" cy="50" r="44" />
              <circle class="pomo-ring__fill" id="pomoRingArc" cx="50" cy="50" r="44"
                stroke-dasharray="${ringCircumference.toFixed(1)}"
                stroke-dashoffset="0" />
            </svg>
            <div class="pomo-ring__center">
              <span class="mono pomo-ring__time" id="pomoClockText">25:00</span>
              <span class="pomo-ring__caption">Focus Timer</span>
            </div>
          </div>
          <div class="cluster-xs" style="justify-content:center">
            <button type="button" class="today-hero__pomo-btn" id="pomoToggleBtn">
              ${icon("icon-play")} Start
            </button>
            <button type="button" class="today-hero__pomo-reset" id="pomoResetBtn" title="Reset 25:00 Focus Timer" aria-label="Reset Focus Timer">
              ${icon("icon-refresh")}
            </button>
          </div>
        </div>
      </section>

      <!-- Quick Actions 3-Up Row (07-today-dashboard.png) -->
      <section class="stack-xs" aria-label="Quick actions">
        <div class="row-between">
          <h3 class="section-heading">Quick Actions</h3>
          <a href="#/practice" class="card__meta" style="text-decoration:none">Practice Arena ›</a>
        </div>
        <div class="quick-actions-grid">
          <button type="button" class="quick-action-card" id="qaAiDoubtBtn">
            <span class="quick-action-card__icon" data-tone="brand">${icon("icon-spark")}</span>
            <span class="quick-action-card__label">AI Doubt Solver</span>
          </button>
          <a href="#/formulas" class="quick-action-card" style="text-decoration:none">
            <span class="quick-action-card__icon" data-tone="phys">${icon("icon-formula")}</span>
            <span class="quick-action-card__label">Formula Sheet</span>
          </a>
          <button type="button" class="quick-action-card" id="qaDaily10Btn">
            <span class="quick-action-card__icon" data-tone="chem">${icon("icon-bolt")}</span>
            <span class="quick-action-card__label">Daily 10-Q</span>
          </button>
        </div>
      </section>

      <!-- Spaced Repetition / Mistake Notebook Section (07-today-dashboard.png + Phase 07 Slice 3) -->
      <section class="card stack-s" id="todayMistakeNotebookCard" aria-label="Spaced mistake notebook">
        <button type="button" class="mistake-strip-btn" id="todayMistakeBtn" style="padding:0;border:none;background:transparent">
          <span class="quick-action-card__icon" data-tone="brand">${icon("icon-refresh")}</span>
          <span class="mistake-strip-btn__body">
            <span class="cluster-xs">
              <strong>Spaced Mistake Notebook</strong>
              <span class="badge ${dueMistakes.length > 0 ? "badge--partial" : "badge--brand"} mono" id="todayMistakeDueBadge">${dueMistakes.length} Due</span>
              ${scheduledMistakes.length > 0 ? `<span class="pill mono">${scheduledMistakes.length} Scheduled</span>` : ""}
              ${graduatedMistakes.length > 0 ? `<span class="pill mono">${graduatedMistakes.length} Graduated</span>` : ""}
            </span>
            <span class="card__meta">${
              dueMistakes.length > 0
                ? `${dueMistakes.length} mistake${dueMistakes.length === 1 ? "" : "s"} due for spaced re-drill (graduates after ${MISTAKE_GRADUATION_THRESHOLD} correct answers)`
                : scheduledMistakes.length > 0
                ? `0 due right now · ${scheduledMistakes.length} mistake${scheduledMistakes.length === 1 ? "" : "s"} scheduled on 1d/3d/7d intervals`
                : "0 questions due today — missed independent answers or flagged items queue here"
            }</span>
          </span>
          ${icon("icon-chevron")}
        </button>
        <div id="todayMistakeDueListSlot" class="stack-xs" ${dueMistakes.length > 0 ? "" : "hidden"}></div>
      </section>

      <!-- Weak Areas & Per-Subject / Per-Unit Accuracy Breakdown (Phase 07 · Slice 1) -->
      <section class="stack-xs" id="todayWeakAreasSection" aria-label="Weak areas and accuracy breakdown">
        <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
          <h3 class="section-heading">Weak Areas</h3>
          <span class="pill">Min ${WEAK_AREA_MIN_ATTEMPTS} attempts · Worst first</span>
        </div>
        <div id="todayWeakAreasSlot" class="stack-s"></div>
      </section>

      <!-- 2x2 Subject Mastery Grid (07-today-dashboard.png & 08-modern-web-dashboard.png) -->
      <section class="stack-xs" aria-label="Your subjects">
        <div class="row-between">
          <h3 class="section-heading">Your Subjects</h3>
          <a href="#/learn" class="card__meta" style="text-decoration:none">42-Unit Syllabus ›</a>
        </div>
        <div class="today-subjects-grid" id="todaySubjectsGrid"></div>
      </section>
    </div>
  `);

  main.innerHTML = "";
  main.appendChild(root);

  // Populate Weak Areas & Accuracy Breakdown (strictly local attempt data, N>=3)
  function accuracyTone(pct) {
    if (pct < 50) return "wrong";
    if (pct < 75) return "partial";
    return "correct";
  }

  async function launchUnitDrill(unitId) {
    const [unit, qIndex] = await Promise.all([loadUnit(unitId), getQuestionIndex()]);
    const rawPool = resolveUnitQuestionPool(unit, qIndex);
    if (!rawPool.length) {
      showToast(`No active PYQs mapped to ${unit.unitId} — opening unit notes.`);
      location.hash = `#/learn/${encodeURIComponent(unit.unitId)}`;
      return;
    }
    const sampled = samplePracticeQuestions(rawPool, rawPool.length, {
      strategy: "adaptive",
      mode: "independent",
      questionStats: snapshot.questionStats,
    });
    const sess = await createSession({
      kind: "drill",
      mode: "independent",
      title: `Weak-Area Drill · ${unit.unitId} ${unit.title}`,
      questions: sampled.questions,
    });
    location.hash = `#/practice-run/${sess.sessionId}`;
  }

  async function launchDaily10Sprint() {
    const papers = await loadAllPapers();
    const allActive = papers
      .flatMap((p) => p.questions)
      .filter((q) => !isVoidedQuestion(q));

    const quotas = [
      ["MATH", 4],
      ["PHYS", 3],
      ["CHEM", 2],
      ["FEEE", 1],
    ];
    const picked = [];
    // Deterministic daily seed from local date so Daily 10-Q feels cohesive yet balanced
    const daySeed = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    for (const [sid, count] of quotas) {
      const pool = allActive.filter((q) => q.subjectId === sid);
      for (let i = 0; i < count && pool.length > 0; i++) {
        const idx = (daySeed * 7 + i * 13) % pool.length;
        picked.push(pool[idx]);
      }
    }
    const sess = await createSession({
      kind: "daily10",
      mode: "independent",
      title: "Daily 10-Q JELET Weighted Sprint",
      questions: picked,
    });
    location.hash = `#/practice-run/${sess.sessionId}`;
  }

  const weakSlot = $("#todayWeakAreasSlot", root);
  if (!weakAreas.hasEnoughData) {
    const emptyCard = el(`
      <div class="card card--subtle stack-s" id="weakAreasEmptyState">
        <div class="cluster-xs">
          ${icon("icon-practice")}
          <strong>Practice to generate insights</strong>
        </div>
        <p class="card__meta">
          Solve at least ${WEAK_AREA_MIN_ATTEMPTS} independent questions in a unit or subject to surface your weakest topics with real accuracy numbers (${weakAreas.totalAttempts} independent attempt${weakAreas.totalAttempts === 1 ? "" : "s"} recorded so far).
        </p>
        <div class="cluster-xs">
          <button type="button" class="btn btn--primary btn--sm" id="weakAreasStartDailyBtn">
            ${icon("icon-bolt")} Start Daily 10-Q
          </button>
          <a href="#/practice" class="btn btn--ghost btn--sm" style="text-decoration:none">Topic Drill</a>
        </div>
      </div>
    `);
    $("#weakAreasStartDailyBtn", emptyCard).addEventListener("click", launchDaily10Sprint);
    weakSlot.appendChild(emptyCard);
  } else {
    if (weakAreas.topWeakUnits.length > 0) {
      const topCard = el(`
        <div class="card stack-s" id="weakAreasTopCard">
          <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
            <div>
              <strong class="card__title" style="display:block;margin:0">Top Focus Units</strong>
              <p class="card__meta">Lowest independent accuracy across units with ≥${WEAK_AREA_MIN_ATTEMPTS} attempts</p>
            </div>
          </div>
          <div class="stack-xs" id="weakTopUnitsList"></div>
        </div>
      `);
      const topList = $("#weakTopUnitsList", topCard);
      for (const u of weakAreas.topWeakUnits) {
        const tone = accuracyTone(u.accuracyPct);
        const item = el(`
          <div class="weak-area-row">
            <div class="weak-area-row__info">
              <div class="cluster-xs">
                <span class="mono unit-code-chip">${escapeHtml(u.unitId)}</span>
                ${subjectBadgeHtml(u.subjectId)}
                <span class="badge badge--${tone} mono">${u.accuracyPct}%</span>
              </div>
              <strong class="weak-area-row__title">${escapeHtml(u.title)}</strong>
              <span class="card__meta mono">${u.correct}/${u.attempts} correct · ${u.questionsAttempted} Q${u.questionsAttempted === 1 ? "" : "s"} attempted</span>
            </div>
            <button type="button" class="btn btn--primary btn--sm js-drill-weak-unit" data-unit="${escapeHtml(u.unitId)}">
              ${icon("icon-play")} Drill this
            </button>
          </div>
        `);
        $(".js-drill-weak-unit", item).addEventListener("click", () => launchUnitDrill(u.unitId));
        topList.appendChild(item);
      }
      weakSlot.appendChild(topCard);
    } else {
      weakSlot.appendChild(
        el(`
          <div class="card card--subtle">
            <p class="card__meta">Subject accuracy is unlocked below. Answer ≥${WEAK_AREA_MIN_ATTEMPTS} questions within any single syllabus unit to pin your top 3 weak units for 1-tap drills.</p>
          </div>
        `)
      );
    }

    // Per-Subject and Per-Unit Accuracy Breakdown (sorted worst-first)
    const breakdownCard = el(`
      <div class="card stack-s" id="weakAreasBreakdownCard">
        ${
          weakAreas.subjects.length > 0
            ? `
          <div class="stack-xs">
            <strong style="font-size:var(--fs-body)">Subject Accuracy (Worst First)</strong>
            <div class="stack-xs" id="weakSubjectBreakdownList">
              ${weakAreas.subjects
                .map((s) => {
                  const sMeta = SUBJECT_META[s.subjectId] || { shortName: s.subjectId };
                  const tone = accuracyTone(s.accuracyPct);
                  return `
                    <div class="accuracy-breakdown-row">
                      <div class="row-between" style="flex-wrap:wrap;gap:var(--space-2xs)">
                        <span class="cluster-xs">
                          ${subjectBadgeHtml(s.subjectId)}
                          <span class="card__meta mono">${s.correct}/${s.attempts} correct</span>
                        </span>
                        <span class="badge badge--${tone} mono">${s.accuracyPct}%</span>
                      </div>
                      <div class="meter"><div class="meter__fill today-subj-fill" data-subject="${escapeHtml(s.subjectId)}" style="width:${s.accuracyPct}%"></div></div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>`
            : ""
        }
        ${
          weakAreas.units.length > 0
            ? `
          <details class="tiebreak-details" ${weakAreas.units.length <= 4 ? "open" : ""}>
            <summary>Per-Unit Accuracy Breakdown (${weakAreas.units.length} unit${weakAreas.units.length === 1 ? "" : "s"} with ≥${WEAK_AREA_MIN_ATTEMPTS} attempts)</summary>
            <div class="stack-xs" style="margin-top:var(--space-s)" id="weakUnitBreakdownList"></div>
          </details>`
            : ""
        }
      </div>
    `);

    const unitBreakdownList = $("#weakUnitBreakdownList", breakdownCard);
    if (unitBreakdownList) {
      for (const u of weakAreas.units) {
        const tone = accuracyTone(u.accuracyPct);
        const row = el(`
          <div class="weak-unit-breakdown-item">
            <div class="weak-unit-breakdown-item__main">
              <span class="mono unit-code-chip">${escapeHtml(u.unitId)}</span>
              <span class="weak-unit-breakdown-item__title">${escapeHtml(u.title)}</span>
            </div>
            <div class="cluster-xs">
              <span class="card__meta mono">${u.correct}/${u.attempts}</span>
              <span class="badge badge--${tone} mono">${u.accuracyPct}%</span>
              <button type="button" class="btn btn--ghost btn--sm js-breakdown-drill-btn" data-unit="${escapeHtml(u.unitId)}">Drill</button>
            </div>
          </div>
        `);
        $(".js-breakdown-drill-btn", row).addEventListener("click", () => launchUnitDrill(u.unitId));
        unitBreakdownList.appendChild(row);
      }
    }
    weakSlot.appendChild(breakdownCard);
  }

  // Populate 2x2 Subject Cards
  const subjGrid = $("#todaySubjectsGrid", root);
  for (const sid of ["MATH", "PHYS", "CHEM", "FEEE"]) {
    const sMeta = SUBJECT_META[sid];
    const st = subjectStats[sid] || {
      revisedUnits: 0,
      totalUnits: sMeta.unitCount,
      pyqPracticed: 0,
      completionPct: 0,
    };
    const card = el(`
      <a href="#/learn?subject=${sid}" class="card today-subj-card" data-subject="${sid}" style="text-decoration:none;color:inherit">
        <div class="row-between" style="align-items:flex-start">
          <span class="subject-icon-box" data-subject="${sid}">${icon(SUBJECT_ICONS[sid])}</span>
          ${icon("icon-chevron")}
        </div>
        <div>
          <strong class="today-subj-card__title">${escapeHtml(sid === "FEEE" ? "FEEE" : sMeta.name)}</strong>
          <p class="card__meta">${st.revisedUnits}/${st.totalUnits} units · ${st.pyqPracticed} PYQs</p>
        </div>
        <div class="meter"><div class="meter__fill today-subj-fill" data-subject="${sid}" style="width:${st.completionPct}%"></div></div>
      </a>
    `);
    subjGrid.appendChild(card);
  }

  // Hero Resume action
  $("#todayHeroResumeBtn", root).addEventListener("click", () => {
    if (activeSession) {
      location.hash =
        activeSession.kind === "mock"
          ? `#/exam/${activeSession.sessionId}`
          : `#/practice-run/${activeSession.sessionId}`;
    } else if (roadmapUnit) {
      location.hash = `#/learn/${roadmapUnit.unitId}`;
    } else {
      location.hash = "#/learn";
    }
  });

  // Quick Action: AI Doubt Solver
  $("#qaAiDoubtBtn", root).addEventListener("click", () => {
    if (openAiTutor) openAiTutor({ mode: "general", manifest });
  });

  // Quick Action: Daily 10-Q (balanced 4 Maths + 3 Physics + 2 Chem + 1 FEEE PYQ sampler)
  $("#qaDaily10Btn", root).addEventListener("click", launchDaily10Sprint);

  // Populate Today Due Mistake Re-drill items (1-tap single-item re-drill)
  if (dueMistakes.length > 0) {
    const dueListSlot = $("#todayMistakeDueListSlot", root);
    const qIndex = await getQuestionIndex();
    for (const m of dueMistakes.slice(0, 4)) {
      const q = qIndex.get(m.questionId);
      if (!q) continue;
      const lastDate = m.lastAttemptAt
        ? new Date(m.lastAttemptAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        : null;
      const streak = m.consecutiveCorrect ?? m.leitnerBox ?? 0;
      const qLabel = q.year ? `JELET ${q.year} · Q${q.qNumber}` : q.id;
      const row = el(`
        <div class="mistake-notebook-item">
          <div class="mistake-notebook-item__info">
            <div class="cluster-xs">
              <strong class="mono" style="font-size:var(--fs-caption)">${escapeHtml(qLabel)}</strong>
              ${subjectBadgeHtml(q.subjectId)}
              <span class="mono pill">${escapeHtml(q.unitId)}</span>
              ${m.flaggedAsMistake ? `<span class="badge badge--review">Flagged</span>` : ""}
            </div>
            <span class="card__meta mono">
              ${m.attemptsCount || 0} attempt${(m.attemptsCount || 0) === 1 ? "" : "s"}${lastDate ? ` · Last ${escapeHtml(lastDate)}` : ""} · ${streak}/${MISTAKE_GRADUATION_THRESHOLD} to graduate
            </span>
          </div>
          <button type="button" class="btn btn--primary btn--sm js-today-redrill-one" data-qid="${escapeHtml(q.id)}">
            ${icon("icon-play")} Re-drill
          </button>
        </div>
      `);
      $(".js-today-redrill-one", row).addEventListener("click", async () => {
        const sess = await createMistakeRedrillSession({
          questions: [q],
          mistakeRecords: [m],
        });
        location.hash = `#/practice-run/${sess.sessionId}`;
      });
      dueListSlot.appendChild(row);
    }
    if (dueMistakes.length > 4) {
      dueListSlot.appendChild(
        el(
          `<a href="#/practice?panel=mistake" class="card__meta" style="text-decoration:none">View all ${dueMistakes.length} due mistakes in Practice Arena ›</a>`
        )
      );
    }
  }

  // Mistake Queue Strip action (batch re-drill all due)
  $("#todayMistakeBtn", root).addEventListener("click", async () => {
    if (!dueMistakes.length) {
      showToast("0 mistakes due right now — start a Daily 10-Q or Topic Drill!");
      location.hash = "#/practice";
      return;
    }
    const qIndex = await getQuestionIndex();
    const qs = dueMistakes
      .map((m) => qIndex.get(m.questionId))
      .filter(Boolean)
      .slice(0, 20);
    const sess = await createMistakeRedrillSession({
      questions: qs,
      mistakeRecords: dueMistakes,
      title: `Spaced Mistake Queue (${qs.length} Qs)`,
    });
    location.hash = `#/practice-run/${sess.sessionId}`;
  });

  // Persistent Pomodoro Timer logic
  const clockEl = $("#pomoClockText", root);
  const arcEl = $("#pomoRingArc", root);
  const toggleBtn = $("#pomoToggleBtn", root);
  const resetBtn = $("#pomoResetBtn", root);

  function syncPomodoroDom() {
    const sec = getPomodoroSeconds(pomoState);
    if (clockEl) clockEl.textContent = formatDurationClock(sec * 1000);
    if (arcEl) {
      const frac = sec / POMODORO_FULL_SEC;
      arcEl.style.strokeDashoffset = (ringCircumference * (1 - frac)).toFixed(1);
    }
    if (toggleBtn) {
      toggleBtn.innerHTML = pomoState.running
        ? `${icon("icon-pause")} Pause`
        : `${icon("icon-play")} ${sec < POMODORO_FULL_SEC && sec > 0 ? "Resume" : "Start"}`;
    }
    if (pomoState.running && sec <= 0) {
      pomoState = { secondsLeft: POMODORO_FULL_SEC, running: false, lastStartedAt: null };
      setMeta({ pomodoro: pomoState });
      showToast("25:00 Focus sprint complete! Take a 5-minute break.");
    }
  }

  toggleBtn.addEventListener("click", async () => {
    const currentSec = getPomodoroSeconds(pomoState);
    if (pomoState.running) {
      pomoState = {
        secondsLeft: currentSec,
        running: false,
        lastStartedAt: null,
      };
    } else {
      pomoState = {
        secondsLeft: currentSec > 0 ? currentSec : POMODORO_FULL_SEC,
        running: true,
        lastStartedAt: Date.now(),
      };
    }
    const latestMeta = await getMeta();
    await setMeta({ ...latestMeta, pomodoro: pomoState });
    syncPomodoroDom();
  });

  resetBtn.addEventListener("click", async () => {
    pomoState = {
      secondsLeft: POMODORO_FULL_SEC,
      running: false,
      lastStartedAt: null,
    };
    const latestMeta = await getMeta();
    await setMeta({ ...latestMeta, pomodoro: pomoState });
    syncPomodoroDom();
  });

  syncPomodoroDom();
  const pomoInterval = setInterval(syncPomodoroDom, 1000);

  return () => {
    clearInterval(pomoInterval);
  };
}
