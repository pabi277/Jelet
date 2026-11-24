/**
 * results.js — JELET Study Hub (v3) · Score Ring, JU Cutoff Band, 9-Step Tie-Breaker & Solutions
 * ---------------------------------------------------------------------------
 * Visual references:
 *   - Phone (<1024px) : `docs/references/ui-v3/03-practice-results.png`
 *   - Desktop (>=1024): `docs/references/ui-v3/10-codec-ai-tutor-and-results.png`
 *
 * Enforces:
 *   - Exact integer twelfths score formatting (zero float drift)
 *   - Documented Historical JU Cutoff Bands (never fake simulated ranks!)
 *   - Official WBJEEB 9-step tie-breaker vector accordion
 *   - Zero "Unverified Key / Unresolved Issue" badges
 *   - Expandable SymPy-verified solutions + 1-tap Codec AI Doubt Tutor trigger
 */

import {
  loadManifest,
  getQuestionIndex,
  loadSolutionsForQuestions,
} from "../core/data-loader.js";
import { renderLatex, escapeHtml } from "../core/math.js";
import {
  formatTwelfths,
  evaluateJuCutoffBand,
  isVoidedQuestion,
  SUBJECT_META,
  MAX_PAPER_TWELFTHS,
} from "../core/scoring.js";
import {
  getAttempt,
  createSession,
  createMistakeRedrillSession,
  getBookmarksMap,
  toggleBookmark,
  getQuestionStatsMap,
  toggleMistakeFlag,
  isMistakeRecordActive,
} from "../core/stats.js";
import {
  $,
  el,
  icon,
  showToast,
  outcomeBadgeHtml,
  buildSolutionBlock,
  hydrateQuestionFigures,
  subjectBadgeHtml,
} from "../core/ui.js";

export async function renderResultsView(main, attemptId, { openAiTutor } = {}) {
  main.innerHTML = `<div class="view"><p class="view__placeholder">Loading Result Analysis…</p></div>`;

  const attempt = await getAttempt(attemptId);
  if (!attempt) {
    main.innerHTML = `
      <div class="card stack-s">
        <h2 class="card__title">Result record not found</h2>
        <div><a href="#/practice" class="btn btn--primary">Go to Practice</a></div>
      </div>
    `;
    return;
  }

  const [manifest, qIndex, bookmarksInitial, qStatsInitial] = await Promise.all([
    loadManifest(),
    getQuestionIndex(),
    getBookmarksMap(),
    getQuestionStatsMap(),
  ]);
  let bookmarksMap = bookmarksInitial;
  let qStatsMap = qStatsInitial;
  const unitTitleMap = new Map((manifest.units || []).map((u) => [u.unitId, u.title]));

  const questions = (attempt.questionIds || [])
    .map((id) => qIndex.get(id))
    .filter(Boolean);
  const qById = new Map(questions.map((q) => [q.id, q]));
  const solutionsMap = await loadSolutionsForQuestions(questions);

  const pct =
    attempt.maxTwelfths > 0
      ? Math.max(0, Math.round((attempt.totalTwelfths * 100) / attempt.maxTwelfths))
      : 0;
  const juBand = evaluateJuCutoffBand(attempt.totalTwelfths, attempt.maxTwelfths);
  const isFullPaper = attempt.maxTwelfths === MAX_PAPER_TWELFTHS;

  // Compute honest weak-unit diagnosis from missed/partial items
  const unitMissCounts = new Map();
  for (const it of attempt.items || []) {
    if (it.outcome === "incorrect" || it.outcome === "partial") {
      unitMissCounts.set(it.unitId, (unitMissCounts.get(it.unitId) || 0) + 1);
    }
  }
  const topWeakUnits = [...unitMissCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const submittedDate = new Date(attempt.submittedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let activeFilter = "all";
  const expandedIds = new Set();
  // Auto-expand the first missed/partial question (or Q1) for instant value
  const firstInteresting =
    (attempt.items || []).find((i) => i.outcome === "partial" || i.outcome === "incorrect") ||
    attempt.items?.[0];
  if (firstInteresting) expandedIds.add(firstInteresting.questionId);

  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference * (1 - Math.min(100, pct) / 100);

  const tb = attempt.tieBreakVector || {};
  const analytics = attempt.analytics || null;

  const root = el(`
    <div class="view stack-m results-layout">
      <!-- Top Header -->
      <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
        <div>
          <p class="card__meta">Submitted ${escapeHtml(submittedDate)} · ${attempt.mode === "independent" ? "Independent (Exam Rules)" : "Assisted Practice"}</p>
          <h2 class="card__title" style="margin:0">${escapeHtml(attempt.title)}</h2>
        </div>
        <div class="cluster-xs">
          <button type="button" class="btn btn--ghost btn--sm" id="retryIndepBtn">${icon("icon-refresh")} Retry Independently</button>
          <a href="#/${isFullPaper ? "papers" : "practice"}" class="btn btn--primary btn--sm">Done</a>
        </div>
      </div>

      <!-- Score Ring Hero + 4 Breakdown Tiles (03-practice-results.png & 10-codec-ai-tutor-and-results.png) -->
      <section class="card results-hero-card">
        <div class="results-ring-block">
          <div class="score-ring" aria-label="${pct} percent score">
            <svg viewBox="0 0 100 100">
              <circle class="score-ring__track" cx="50" cy="50" r="42" />
              <circle class="score-ring__fill" cx="50" cy="50" r="42"
                stroke-dasharray="${circumference.toFixed(1)}"
                stroke-dashoffset="${dashOffset.toFixed(1)}" />
            </svg>
            <div class="score-ring__label">
              <span class="mono score-ring__pct">${pct}%</span>
            </div>
          </div>
          <div class="stack-xs">
            <div class="mono results-score-big">
              ${formatTwelfths(attempt.totalTwelfths)} <span class="results-score-max">/ ${formatTwelfths(attempt.maxTwelfths)} Marks</span>
            </div>
            ${
              juBand
                ? `<span class="badge badge--${juBand.tone}">${escapeHtml(juBand.band)}</span>
                   <p class="card__meta">${escapeHtml(juBand.detail)}</p>`
                : `<p class="card__meta">${attempt.counts.correct} correct · ${attempt.counts.partial} partial · ${attempt.counts.incorrect} incorrect · ${attempt.counts.unattempted} unattempted</p>`
            }
          </div>
        </div>

        <div class="results-tiles-grid">
          <div class="results-mini-tile">
            <span class="card__meta">Category I Net</span>
            <strong class="mono">${formatTwelfths(attempt.cat1NetTwelfths, { signed: true })} / ${formatTwelfths(attempt.cat1MaxTwelfths)}</strong>
          </div>
          <div class="results-mini-tile">
            <span class="card__meta">Category II Partial/Full</span>
            <strong class="mono">${formatTwelfths(attempt.cat2Twelfths, { signed: true })} / ${formatTwelfths(attempt.cat2MaxTwelfths)}</strong>
          </div>
          <div class="results-mini-tile">
            <span class="card__meta">Board Voided W</span>
            <strong class="mono">+${formatTwelfths(attempt.voidedTwelfths || 0)}</strong>
          </div>
          <div class="results-mini-tile">
            <span class="card__meta">Negative Bleed</span>
            <strong class="mono" style="color:var(--status-wrong-fg)">−${formatTwelfths(attempt.negativeTwelfths || 0)}</strong>
          </div>
        </div>

        ${
          isFullPaper
            ? `<div class="results-subj-strip">
                 ${["MATH", "PHYS", "CHEM", "FEEE"]
                   .map((sid) => {
                     const sb = attempt.bySubject?.[sid];
                     if (!sb) return "";
                     return `<div class="results-subj-item" data-subject="${sid}">
                       <span class="card__meta">${escapeHtml(SUBJECT_META[sid].shortName)}</span>
                       <strong class="mono">${formatTwelfths(sb.totalTwelfths)} / ${SUBJECT_META[sid].maxMarks}</strong>
                     </div>`;
                   })
                   .join("")}
               </div>`
            : ""
        }

        <!-- Official WBJEEB 9-Step Tie-Breaking Vector Accordion -->
        <details class="tiebreak-details">
          <summary>Official WBJEEB 9-Step Tie-Breaking Vector (§2.7 Bulletin)</summary>
          <div class="tiebreak-grid mono">
            <div>1. Total Negatives (less wins): <strong>−${formatTwelfths(tb.totalNegativeTwelfths || 0)}</strong></div>
            <div>2. Maths Positive: <strong>+${formatTwelfths(tb.mathPositiveTwelfths || 0)}</strong></div>
            <div>3. Maths Negative: <strong>−${formatTwelfths(tb.mathNegativeTwelfths || 0)}</strong></div>
            <div>4. Physics Positive: <strong>+${formatTwelfths(tb.physPositiveTwelfths || 0)}</strong></div>
            <div>5. Physics Negative: <strong>−${formatTwelfths(tb.physNegativeTwelfths || 0)}</strong></div>
            <div>6. Chemistry Positive: <strong>+${formatTwelfths(tb.chemPositiveTwelfths || 0)}</strong></div>
            <div>7. Chemistry Negative: <strong>−${formatTwelfths(tb.chemNegativeTwelfths || 0)}</strong></div>
            <div>8. FEEE Positive: <strong>+${formatTwelfths(tb.feeePositiveTwelfths || 0)}</strong></div>
            <div>9. FEEE Negative: <strong>−${formatTwelfths(tb.feeeNegativeTwelfths || 0)}</strong></div>
          </div>
        </details>
      </section>

      <!-- Per-Mock Performance Analytics (Phase 08) -->
      ${
        analytics
          ? `
      <section class="card stack-s results-analytics" id="resultsAnalyticsSection" aria-label="Mock performance analytics">
        <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
          <h3 class="card__title" style="margin:0">Performance Analytics</h3>
          <span class="pill mono">${analytics.scorePct}% · ${formatTwelfths(analytics.totalTwelfths)} / ${formatTwelfths(analytics.maxTwelfths)} Marks</span>
        </div>
        <p class="card__meta" style="margin:0">Section scores, accuracy and time breakdown from your real submission — local only.</p>

        <h4 class="section-heading" style="font-size:var(--fs-body)">Section Scores</h4>
        <div class="results-tiles-grid">
          ${analytics.sections
            .map(
              (s) => `
            <div class="results-mini-tile" data-subject="${escapeHtml(s.subjectId)}">
              <span class="card__meta">${escapeHtml(s.shortName)} · ${s.questionCount} Qs</span>
              <strong class="mono">${formatTwelfths(s.totalTwelfths)} / ${formatTwelfths(s.maxTwelfths)}</strong>
              <span class="card__meta mono">${s.accuracyPct}% acc</span>
            </div>`
            )
            .join("")}
        </div>

        <h4 class="section-heading" style="font-size:var(--fs-body)">Accuracy</h4>
        <div class="results-tiles-grid">
          <div class="results-mini-tile"><span class="card__meta">Correct</span><strong class="mono">${analytics.accuracy.correct}</strong></div>
          <div class="results-mini-tile"><span class="card__meta">Partial</span><strong class="mono">${analytics.accuracy.partial}</strong></div>
          <div class="results-mini-tile"><span class="card__meta">Incorrect</span><strong class="mono">${analytics.accuracy.incorrect}</strong></div>
          <div class="results-mini-tile"><span class="card__meta">Unattempted</span><strong class="mono">${analytics.accuracy.unattempted}</strong></div>
        </div>
        <p class="card__meta" style="margin:0">
          Overall accuracy <strong class="mono">${analytics.accuracy.accuracyPct}%</strong> (${analytics.accuracy.correct}/${analytics.accuracy.attempted} attempted) · ${analytics.accuracy.voided} voided W awarded.
        </p>

        ${
          analytics.time.captured
            ? `
        <h4 class="section-heading" style="font-size:var(--fs-body)">Time Analysis</h4>
        <div class="analytics-time stack-xs">
          <div class="row-between"><span class="card__meta">Avg / Median per question</span><strong class="mono">${formatDurationClock(analytics.time.avgTimeMs)} / ${formatDurationClock(analytics.time.medianTimeMs)}</strong></div>
          <div class="row-between"><span class="card__meta">Slow threshold (≥ ${analytics.time.slowThresholdMs / 1000}s)</span><strong class="mono">${analytics.time.slowQuestions.length} flagged</strong></div>
          ${analytics.time.bySectionAvgMs.length
            ? `<div class="analytics-time__row"><span class="card__meta">Avg per section</span><span class="mono">${analytics.time.bySectionAvgMs.map((t) => `${escapeHtml(t.shortName)} ${formatDurationClock(t.avgTimeMs)}`).join(" · ")}</span></div>`
            : ""}
          ${analytics.time.slowQuestions.length
            ? `<div class="analytics-slow-list">${analytics.time.slowQuestions
                .map(
                  (q) => `<span class="pill mono">Q${q.qNumber} · ${formatDurationClock(q.timeMs)}</span>`
                )
                .join("")}</div>`
            : `<p class="card__meta" style="margin:0">No question exceeded 2× the average time-per-question.</p>`}
        </div>`
            : ""
        }

        <h4 class="section-heading" style="font-size:var(--fs-body)">Wrong vs Verified Key</h4>
        <div class="stack-xs" id="resultsWrongKeyList">
          ${
            analytics.wrongKey.length
              ? analytics.wrongKey
                  .map(
                    (w) => `
              <div class="wrong-key-item">
                <div class="cluster-xs">
                  <strong class="mono">Q${w.qNumber || ""}</strong>
                  ${subjectBadgeHtml(w.subjectId)}
                  <span class="card__meta">${escapeHtml(w.unitId)} · Cat ${w.category === 2 ? "II" : "I"}</span>
                  ${outcomeBadgeHtml(w)}
                </div>
                <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
                  <span class="card__meta">Your pick: <strong class="mono">${w.selected.length ? w.selected.join(", ") : "—"}</strong> · Key: <strong class="mono">${(w.correctOptions || []).join(", ") || "W"}</strong></span>
                  <button type="button" class="btn btn--ghost btn--sm js-wrong-solution" data-qid="${escapeHtml(w.questionId)}">${icon("icon-check")} View solution</button>
                </div>
              </div>`
                  )
                  .join("")
              : `<p class="card__meta" style="margin:0">Clean sweep — zero incorrect or partial items against the verified key.</p>`
          }
        </div>
      </section>`
          : ""
      }

      <!-- Honest Corpus Diagnosis Banner -->
      <section class="card card--subtle row-between" style="flex-wrap:wrap;gap:var(--space-s)">
        <div class="cluster-xs">
          ${icon("icon-spark")}
          <span>
            ${
              topWeakUnits.length
                ? `<strong>Priority Revision Units:</strong> ${topWeakUnits
                    .map(([uid, cnt]) => `<a class="pill link-pill" href="#/learn/${escapeHtml(uid)}">${escapeHtml(uid)} · ${escapeHtml(unitTitleMap.get(uid) || uid)} (${cnt})</a>`)
                    .join(" ")}`
                : `<strong>Clean Sweep:</strong> Zero incorrect or partial items in this session.`
            }
          </span>
        </div>
      </section>

      <!-- Review & Solutions Filter Chips -->
      <div class="stack-s">
        <h3 class="section-heading">Review &amp; Verified Solutions</h3>
        <div class="chip-row" id="resultsFilterChips"></div>
      </div>

      <div id="resultsItemsStack" class="stack-s"></div>
    </div>
  `);

  main.innerHTML = "";
  main.appendChild(root);

  $("#retryIndepBtn", root).addEventListener("click", async () => {
    const sess = await createSession({
      kind: isFullPaper ? "mock" : attempt.kind || "drill",
      mode: "independent",
      paperId: attempt.paperId || null,
      title: attempt.title,
      questions,
      durationMinutes: isFullPaper ? 120 : null,
    });
    location.hash = isFullPaper ? `#/exam/${sess.sessionId}` : `#/practice-run/${sess.sessionId}`;
  });

  const c = attempt.counts || {};
  const filterDefs = [
    { id: "all", label: `All (${c.total || 0})` },
    { id: "correct", label: `Correct (${c.correct || 0})` },
    { id: "partial", label: `Partial (${c.partial || 0})` },
    { id: "incorrect", label: `Incorrect (${c.incorrect || 0})` },
    { id: "unattempted", label: `Unattempted (${c.unattempted || 0})` },
    ...(c.voided_awarded ? [{ id: "voided_awarded", label: `Voided W (${c.voided_awarded})` }] : []),
  ];

  function renderFilterChips() {
    const chipRow = $("#resultsFilterChips", root);
    chipRow.innerHTML = "";
    for (const f of filterDefs) {
      const btn = el(
        `<button type="button" class="chip ${activeFilter === f.id ? "chip--active" : ""}">${escapeHtml(f.label)}</button>`
      );
      btn.addEventListener("click", () => {
        activeFilter = f.id;
        renderFilterChips();
        renderItems();
      });
      chipRow.appendChild(btn);
    }
  }

  function renderItems() {
    const stack = $("#resultsItemsStack", root);
    stack.innerHTML = "";

    const filtered = (attempt.items || []).filter(
      (it) => activeFilter === "all" || it.outcome === activeFilter
    );

    if (!filtered.length) {
      stack.innerHTML = `<div class="card"><p class="card__meta">No questions in this category.</p></div>`;
      return;
    }

    for (const item of filtered) {
      const q = qById.get(item.questionId);
      if (!q) continue;
      const isExpanded = expandedIds.has(q.id);
      const unitTitle = unitTitleMap.get(q.unitId) || q.unitId;
      const isBkm = Boolean(bookmarksMap.get(q.id)?.bookmarked);
      const sol = solutionsMap[q.id];
      const correctSet = new Set(q.key?.correct || []);
      const selSet = new Set(item.selected || []);

      const card = el(`
        <article class="card stack-s ${isExpanded ? "card--accent-border" : ""}">
          <button type="button" class="results-item-header js-toggle-item" data-qid="${escapeHtml(q.id)}">
            <div class="cluster-xs" style="text-align:left">
              <strong class="mono">Q${q.qNumber || ""}</strong>
              ${subjectBadgeHtml(q.subjectId)}
              <span class="card__meta">${escapeHtml(q.unitId)} · ${escapeHtml(unitTitle)} (Cat ${q.category === 2 ? "II" : "I"})</span>
            </div>
            <div class="cluster-xs">
              ${outcomeBadgeHtml(item)}
              ${icon(isExpanded ? "icon-chevron-down" : "icon-chevron")}
            </div>
          </button>

          <div class="js-item-detail stack-s" ${isExpanded ? "" : "hidden"}></div>
        </article>
      `);

      function mountExpandedDetail() {
        const detail = $(".js-item-detail", card);
        detail.innerHTML = "";
        const qStatRec = qStatsMap.get(q.id);
        const isFlagged = Boolean(qStatRec?.flaggedAsMistake);
        const canRedrill = !isVoidedQuestion(q);
        const optsHtml = (q.options || [])
          .map((opt) => {
            const isRight = correctSet.has(opt.id);
            const wasPicked = selSet.has(opt.id);
            const stateAttr = isRight
              ? 'data-correct="true"'
              : wasPicked
              ? 'data-wrong-pick="true"'
              : "";
            return `
              <div class="reader-opt" ${stateAttr}>
                <span class="option__letter">${escapeHtml(opt.id)}</span>
                <div class="reader-opt__body">
                  <div>${renderLatex(opt.latex)}</div>
                  ${opt.figure?.src ? `<div class="figure-frame" data-opt-figure="${escapeHtml(opt.id)}"></div>` : ""}
                </div>
                ${wasPicked ? `<span class="pill">Your pick</span>` : ""}
              </div>
            `;
          })
          .join("");

        const inner = el(`
          <div class="stack-s">
            <div class="question-stem">${renderLatex(q.stemLatex, { preserveNewlines: true })}</div>
            ${q.stemFigure?.src ? `<div class="figure-frame" data-stem-figure="true"></div>` : ""}
            <div class="stack-xs">${optsHtml}</div>
            <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
              <span class="card__meta">
                Your Response: <strong class="mono">${item.selected?.length ? item.selected.join(", ") : "Unattempted"}</strong> ·
                Official Key: <strong class="mono">${(item.correctOptions || []).join(", ")}</strong>
              </span>
              <div class="cluster-xs">
                ${
                  canRedrill
                    ? `<button type="button" class="btn btn--ghost btn--sm js-res-flag-mistake" aria-pressed="${isFlagged}">
                         ${icon("icon-alert")} ${isFlagged ? "Flagged" : "Flag Mistake"}
                       </button>
                       <button type="button" class="btn btn--ghost btn--sm js-res-redrill-one">
                         ${icon("icon-refresh")} Re-drill
                       </button>`
                    : ""
                }
                <button type="button" class="btn btn--ghost btn--sm js-res-bkm" aria-pressed="${isBkm}">
                  ${icon(isBkm ? "icon-bookmark-filled" : "icon-bookmark")} ${isBkm ? "Saved" : "Bookmark"}
                </button>
                ${
                  openAiTutor
                    ? `<button type="button" class="btn btn--primary btn--sm js-res-ai">
                         ${icon("icon-spark")} Ask AI Tutor
                       </button>`
                    : ""
                }
              </div>
            </div>
          </div>
        `);

        detail.appendChild(inner);
        hydrateQuestionFigures(inner, q);
        detail.appendChild(
          buildSolutionBlock(q, sol, {
            onAskAi: openAiTutor
              ? () =>
                  openAiTutor({
                    question: q,
                    solution: sol,
                    paperTitle: attempt.title,
                    studentSelected: item.selected || [],
                    studentOutcome: item.outcome,
                    studentScoreText: formatTwelfths(item.twelfths, { signed: true }),
                  })
              : null,
          })
        );

        $(".js-res-flag-mistake", inner)?.addEventListener("click", async (ev) => {
          const b = ev.currentTarget;
          const updated = await toggleMistakeFlag(q);
          qStatsMap = await getQuestionStatsMap();
          const nowFlagged = Boolean(updated?.flaggedAsMistake);
          b.setAttribute("aria-pressed", String(nowFlagged));
          b.innerHTML = `${icon("icon-alert")} ${nowFlagged ? "Flagged" : "Flag Mistake"}`;
          showToast(
            nowFlagged
              ? "Question flagged in Spaced Mistake Notebook"
              : isMistakeRecordActive(updated)
              ? "Manual flag cleared (past mistake remains queued)"
              : "Removed from Spaced Mistake Notebook"
          );
        });

        $(".js-res-redrill-one", inner)?.addEventListener("click", async () => {
          const rec = qStatsMap.get(q.id) || {
            questionId: q.id,
            lastSelected: item.selected || [],
            lastOutcome: item.outcome,
            lastAttemptAt: attempt.submittedAt,
            attemptsCount: 1,
            consecutiveCorrect: 0,
          };
          const sess = await createMistakeRedrillSession({
            questions: [q],
            mistakeRecords: [rec],
          });
          location.hash = `#/practice-run/${sess.sessionId}`;
        });

        $(".js-res-bkm", inner).addEventListener("click", async (ev) => {
          const b = ev.currentTarget;
          const rec = await toggleBookmark(q.id, "question", `${q.id} (${q.unitId})`);
          bookmarksMap = await getBookmarksMap();
          const nowSaved = Boolean(rec?.bookmarked);
          b.setAttribute("aria-pressed", String(nowSaved));
          b.innerHTML = `${icon(nowSaved ? "icon-bookmark-filled" : "icon-bookmark")} ${nowSaved ? "Saved" : "Bookmark"}`;
          showToast(nowSaved ? "Question bookmarked" : "Bookmark removed");
        });

        $(".js-res-ai", inner)?.addEventListener("click", () => {
          openAiTutor({
            question: q,
            solution: sol,
            paperTitle: attempt.title,
            studentSelected: item.selected || [],
            studentOutcome: item.outcome,
            studentScoreText: formatTwelfths(item.twelfths, { signed: true }),
          });
        });
      }

      if (isExpanded) mountExpandedDetail();

      $(".js-toggle-item", card).addEventListener("click", () => {
        if (expandedIds.has(q.id)) expandedIds.delete(q.id);
        else expandedIds.add(q.id);
        renderItems();
      });

      stack.appendChild(card);
    }
  }

  // One-tap "View solution" from the analytics wrong-key breakdown: jump to the
  // matching outcome filter, expand that question and scroll it into view.
  function focusQuestion(questionId) {
    const item = (attempt.items || []).find((i) => i.questionId === questionId);
    if (!item) return;
    activeFilter = item.outcome === "voided_awarded" ? "all" : item.outcome;
    expandedIds.clear();
    expandedIds.add(questionId);
    renderFilterChips();
    renderItems();
    requestAnimationFrame(() => {
      const card = $(`#resultsItemsStack .js-toggle-item[data-qid="${CSS.escape(questionId)}"]`, root);
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  root.querySelectorAll(".js-wrong-solution").forEach((btn) => {
    btn.addEventListener("click", () => focusQuestion(btn.dataset.qid));
  });

  renderFilterChips();
  renderItems();
}
