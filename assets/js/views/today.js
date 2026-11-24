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
  getQuestionIndex,
} from "../core/data-loader.js";
import { escapeHtml } from "../core/math.js";
import { formatTwelfths, SUBJECT_META, isVoidedQuestion } from "../core/scoring.js";
import { computeHubSnapshot, createSession } from "../core/stats.js";
import { getMeta, setMeta } from "../db/indexeddb.js";
import { $, el, icon, formatDurationClock, showToast } from "../core/ui.js";

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
    dueMistakes,
    subjectStats,
    roadmapUnit,
  } = snapshot;

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

      <!-- Spaced Repetition / Mistake Queue Strip (07-today-dashboard.png) -->
      <button type="button" class="card mistake-strip-btn" id="todayMistakeBtn">
        <span class="quick-action-card__icon" data-tone="brand">${icon("icon-refresh")}</span>
        <span class="mistake-strip-btn__body">
          <strong>Spaced Repetition · Mistake Queue</strong>
          <span class="card__meta">${
            dueMistakes.length > 0
              ? `${dueMistakes.length} question${dueMistakes.length === 1 ? "" : "s"} due today from past mistakes`
              : "0 questions due today — honest local Leitner queue"
          }</span>
        </span>
        ${icon("icon-chevron")}
      </button>

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
  $("#qaDaily10Btn", root).addEventListener("click", async () => {
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
  });

  // Mistake Queue Strip action
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
    const sess = await createSession({
      kind: "mistake",
      mode: "independent",
      title: `Spaced Mistake Queue (${qs.length} Qs)`,
      questions: qs,
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
