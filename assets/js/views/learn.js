/**
 * learn.js — JELET Study Hub (v3) · 42-Unit Explorer, Unit Workbook & Formula Sheet
 * ---------------------------------------------------------------------------
 * Visual references:
 *   - `06-learn-subjects.png` : 4 subject cards with left stripes + exact unit counts (11/15/8/8 = 42)
 *   - `05-lesson.png`         : Deep unit workbook, KaTeX formulas + "Explain this step",
 *                               Worked Example, WBJEEB Traps, unit PYQs, zero-network YouTube
 *                               facade (`youtube-nocookie.com` on tap only), sticky bottom CTA.
 */

import {
  loadManifest,
  loadAllUnits,
  loadUnit,
  getQuestionIndex,
  loadSolutionsForQuestions,
} from "../core/data-loader.js";
import { renderLatex, stripLatexForSearch, escapeHtml } from "../core/math.js";
import { SUBJECT_META, isVoidedQuestion } from "../core/scoring.js";
import {
  getUnitProgressMap,
  updateUnitProgress,
  toggleWatchedVideo,
  getBookmarksMap,
  toggleBookmark,
  savePersonalNote,
  createSession,
} from "../core/stats.js";
import { setMeta } from "../db/indexeddb.js";
import {
  $,
  el,
  icon,
  showToast,
  categoryLabel,
  buildSolutionBlock,
  hydrateQuestionFigures,
} from "../core/ui.js";

const SUBJECT_ORDER = ["MATH", "PHYS", "CHEM", "FEEE"];
const SUBJECT_ICONS = {
  MATH: "icon-math",
  PHYS: "icon-phys",
  CHEM: "icon-chem",
  FEEE: "icon-feee",
};

/**
 * Screen 2: `Learn` 42-Unit Explorer (`#/learn`)
 */
export async function renderLearnExplorer(main, query, { openAiTutor } = {}) {
  main.innerHTML = `<div class="view"><p class="view__placeholder">Loading 42-unit JELET syllabus…</p></div>`;

  const [manifest, allUnits, progressMap] = await Promise.all([
    loadManifest(),
    loadAllUnits(),
    getUnitProgressMap(),
  ]);

  const initialSubj = query?.get("subject")?.toUpperCase() || null;
  const expandedSubjects = new Set(initialSubj ? [initialSubj] : []);
  let searchQuery = "";
  let activeFilter = "all"; // "all" | "studying" | "revised" | "high"

  const indexedUnits = allUnits.map((u) => {
    const secSource = u.notes?.length ? u.notes : u.sections || [];
    const formulasText = secSource
      .flatMap((s) => [
        s.heading,
        stripLatexForSearch(s.proseLatex),
        ...(s.keyFormulas || []).map((f) => `${f.label} ${stripLatexForSearch(f.latex)}`),
      ])
      .join(" ");
    return {
      unit: u,
      searchBlob: `${u.unitId} ${u.officialCode} ${u.title} ${formulasText}`.toLowerCase(),
    };
  });

  const root = el(`
    <div class="view stack-m learn-view">
      <div>
        <p class="card__meta" style="margin:0 0 var(--space-xs)">Official WBJEEB JELET Syllabus · 42 Units (11 Maths · 15 Physics · 8 Chemistry · 8 FEEE)</p>
        <div class="sticky-filter-bar">
          <div class="row-between" style="gap:var(--space-xs)">
            <label class="search-box" style="flex:1" aria-label="Search 42 units, formulas, topics">
              ${icon("icon-search")}
              <input type="search" id="learnSearchInput" placeholder="Search 42 units, formulas, topics…" autocomplete="off" />
            </label>
            <a href="#/formulas" class="btn btn--ghost btn--icon-only" title="All 42-Unit Formula Sheet" aria-label="Open Formula Sheet">
              ${icon("icon-formula")}
            </a>
          </div>
          <div class="chip-row" id="learnFilterChips"></div>
        </div>
      </div>

      <div class="learn-subjects-grid" id="learnSubjectsSlot"></div>

      <div class="card card--subtle row-between">
        <div>
          <strong>Consistent revision builds JU rank speed.</strong>
          <p class="card__meta">Every unit bridges 1st-year Diploma theory directly to verified 2022–2025 PYQs.</p>
        </div>
      </div>

      <!-- Floating Ask AI Tutor Pill (06-learn-subjects.png) -->
      <button type="button" class="floating-ai-pill" id="learnFloatingAiBtn">
        ${icon("icon-spark")} <span>Ask AI Tutor</span>
      </button>
    </div>
  `);

  main.innerHTML = "";
  main.appendChild(root);

  const filterDefs = [
    { id: "all", label: "All 42 Units" },
    { id: "high", label: "High Weightage" },
    { id: "studying", label: "Studying" },
    { id: "revised", label: "Revised" },
  ];

  function renderChips() {
    const row = $("#learnFilterChips", root);
    row.innerHTML = "";
    for (const f of filterDefs) {
      const b = el(
        `<button type="button" class="chip ${activeFilter === f.id ? "chip--active" : ""}">${escapeHtml(f.label)}</button>`
      );
      b.addEventListener("click", () => {
        activeFilter = f.id;
        renderChips();
        renderSubjects();
      });
      row.appendChild(b);
    }
  }

  function unitMatches(entry) {
    const u = entry.unit;
    const prog = progressMap.get(u.unitId);
    const status = prog?.status || "unstarted";
    if (activeFilter === "studying" && status !== "studying") return false;
    if (activeFilter === "revised" && status !== "revised") return false;
    if (activeFilter === "high" && u.examFrequency !== "high") return false;
    if (searchQuery.trim()) {
      return entry.searchBlob.includes(searchQuery.trim().toLowerCase());
    }
    return true;
  }

  function renderSubjects() {
    const slot = $("#learnSubjectsSlot", root);
    slot.innerHTML = "";
    const forceExpand = Boolean(searchQuery.trim() || activeFilter !== "all");

    for (const sid of SUBJECT_ORDER) {
      const sMeta = SUBJECT_META[sid];
      const allSubjUnits = indexedUnits.filter((e) => e.unit.subjectId === sid);
      const matchingUnits = allSubjUnits.filter(unitMatches);
      if (forceExpand && matchingUnits.length === 0) continue;

      const revisedCount = allSubjUnits.filter(
        (e) => progressMap.get(e.unit.unitId)?.status === "revised"
      ).length;
      const pct = allSubjUnits.length
        ? Math.round((revisedCount * 100) / allSubjUnits.length)
        : 0;
      const isOpen = forceExpand || expandedSubjects.has(sid);

      const unitRowsHtml = matchingUnits
        .map(({ unit: u }) => {
          const st = progressMap.get(u.unitId)?.status || "unstarted";
          const stBadge =
            st === "revised"
              ? `<span class="badge badge--correct">${icon("icon-check")} Revised</span>`
              : st === "studying"
              ? `<span class="badge badge--partial">Studying</span>`
              : "";
          return `
            <a class="unit-list-row" href="#/learn/${escapeHtml(u.unitId)}">
              <div class="unit-list-row__main">
                <span class="mono unit-code-chip">${escapeHtml(u.unitId)}</span>
                <div>
                  <div class="unit-list-row__title">${escapeHtml(u.title)}</div>
                  <div class="card__meta">
                    ${escapeHtml(u.officialCode)} · ${(u.pyqIds || []).length} PYQs · ~${u.estimatedMinutes || 30}m
                    ${u.examFrequency === "high" ? " · High Yield" : ""}
                  </div>
                </div>
              </div>
              <div class="cluster-xs">
                ${stBadge}
                ${icon("icon-chevron")}
              </div>
            </a>
          `;
        })
        .join("");

      const card = el(`
        <section class="subject-card subject-card--container" data-subject="${sid}">
          <button type="button" class="subject-card__header-btn js-subj-toggle">
            <span class="subject-icon-box" data-subject="${sid}">${icon(SUBJECT_ICONS[sid])}</span>
            <div class="subject-card__info">
              <h3 class="subject-card__title">${escapeHtml(sMeta.name)}</h3>
              <p class="subject-card__count">${sMeta.qCount} Qs · ${sMeta.maxMarks} Marks · ${sMeta.unitCount} Units</p>
              <div class="row-between" style="margin-top:var(--space-xs);gap:var(--space-s)">
                <div class="meter" style="flex:1"><div class="meter__fill" style="width:${pct}%"></div></div>
                <span class="mono card__meta">${revisedCount} / ${allSubjUnits.length}</span>
              </div>
            </div>
            ${icon(isOpen ? "icon-chevron-down" : "icon-chevron")}
          </button>

          <div class="unit-list" ${isOpen ? "" : "hidden"}>
            ${unitRowsHtml || `<p class="card__meta" style="padding-top:var(--space-s)">No units match current filter.</p>`}
          </div>
        </section>
      `);

      $(".js-subj-toggle", card).addEventListener("click", () => {
        if (expandedSubjects.has(sid)) expandedSubjects.delete(sid);
        else expandedSubjects.add(sid);
        renderSubjects();
      });

      slot.appendChild(card);
    }

    if (!slot.children.length) {
      slot.innerHTML = `<div class="card"><p class="card__meta">No syllabus units matched "${escapeHtml(searchQuery)}".</p></div>`;
    }
  }

  $("#learnSearchInput", root).addEventListener("input", (ev) => {
    searchQuery = ev.target.value || "";
    renderSubjects();
  });

  $("#learnFloatingAiBtn", root).addEventListener("click", () => {
    if (openAiTutor) {
      openAiTutor({ mode: "general", manifest, origin: "Learn Explorer" });
    }
  });

  renderChips();
  renderSubjects();
}

/**
 * Screen 3: `Unit Lesson, Video Lectures & Workbook` (`#/learn/:unitId`, ref `05-lesson.png`)
 */
export async function renderUnitLesson(main, unitIdParam, { openAiTutor, query } = {}) {
  const unitId = String(unitIdParam || "M01").toUpperCase();
  main.innerHTML = `<div class="view" style="padding:var(--space-l)"><p class="view__placeholder">Opening Unit ${escapeHtml(unitId)}…</p></div>`;

  let unit, manifest, progressMap, bookmarksMap, qIndex;
  try {
    [unit, manifest, progressMap, bookmarksMap, qIndex] = await Promise.all([
      loadUnit(unitId),
      loadManifest(),
      getUnitProgressMap(),
      getBookmarksMap(),
      getQuestionIndex(),
    ]);
  } catch {
    main.innerHTML = `<div class="card" style="margin:var(--space-m)"><p>Unit ${escapeHtml(unitId)} not found in the 42-unit syllabus.</p><a class="btn btn--primary" href="#/learn">Back to Learn</a></div>`;
    return;
  }

  // Record visit & update roadmapCursor; mark unstarted -> studying automatically on open
  const existingProg = progressMap.get(unit.unitId);
  const initialStatus =
    !existingProg || existingProg.status === "unstarted" ? "studying" : existingProg.status;
  let currentProg = await updateUnitProgress(unit.unitId, {
    status: initialStatus,
    lastVisitedAt: new Date().toISOString(),
  });
  await setMeta({ roadmapCursor: unit.unitId });

  const subjectUnits = (manifest.units || []).filter((u) => u.subjectId === unit.subjectId);
  const idxInSubject = subjectUnits.findIndex((u) => u.unitId === unit.unitId);
  const posText = `${idxInSubject + 1} / ${subjectUnits.length}`;
  const posPct = Math.round(((idxInSubject + 1) * 100) / Math.max(1, subjectUnits.length));

  const unitPyqs = (unit.pyqIds || []).map((id) => qIndex.get(id)).filter(Boolean);
  const practiceIdList =
    Array.isArray(unit.practiceQuestions) && unit.practiceQuestions.length
      ? unit.practiceQuestions
      : unit.pyqIds || [];
  const unitPracticeQs = practiceIdList
    .map((id) => qIndex.get(id))
    .filter((q) => q && !isVoidedQuestion(q));
  const noteSections =
    Array.isArray(unit.notes) && unit.notes.length ? unit.notes : unit.sections || [];
  const formulaSourceSections =
    Array.isArray(unit.sections) && unit.sections.length ? unit.sections : noteSections;
  const unitFormulas = formulaSourceSections.flatMap((sec) =>
    (sec.keyFormulas || []).map((kf) => ({
      ...kf,
      sectionHeading: sec.heading || "",
      sectionAnchor: sec.anchor || "",
    }))
  );
  let solutionsCache = null;
  const requestedTab = String(query?.get?.("tab") || "").toLowerCase();
  const validTabs = new Set(["workbook", "study", "formulas", "pyqs", "videos"]);
  let activeTab = validTabs.has(requestedTab) ? requestedTab : "workbook";

  const isBookmarkedInit = Boolean(bookmarksMap.get(unit.unitId)?.bookmarked);

  async function launchUnitPractice(mode = "assisted") {
    if (!unitPracticeQs.length) {
      location.hash = `#/practice?unit=${encodeURIComponent(unit.unitId)}`;
      return;
    }
    const sess = await createSession({
      kind: "drill",
      mode,
      title: `${unit.unitId} · ${unit.title} (${unitPracticeQs.length} PYQs)`,
      questions: unitPracticeQs,
    });
    location.hash = `#/practice-run/${sess.sessionId}`;
  }

  function buildWorkedExampleHtml(ex) {
    const stepsHtml = (ex.stepsLatex || [])
      .map(
        (st, idx) => `
        <div class="worked-step">
          <div class="solution-step__head">Step ${idx + 1}</div>
          <div>${renderLatex(st)}</div>
        </div>
      `
      )
      .join("");
    return `
      <div class="worked-example stack-s">
        <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
          <strong style="color:var(--brand-primary);display:flex;align-items:center;gap:var(--space-xs)">
            ${icon("icon-spark")} Worked Example
          </strong>
          <span class="mono pill">${escapeHtml(ex.exampleId || unit.unitId)}</span>
        </div>
        <div class="lesson-prose">${renderLatex(ex.problemLatex || "")}</div>
        <hr style="border:none;border-top:1px solid var(--border-subtle);margin:0" />
        <div class="stack-xs">${stepsHtml}</div>
        <div class="badge badge--correct" style="align-self:flex-start">
          Answer: ${renderLatex(ex.answerLatex || "")}
        </div>
      </div>
    `;
  }

  const root = el(`
    <div class="lesson-shell">
      <!-- Compact Phone Lesson Header (05-lesson.png) -->
      <header class="lesson-topbar">
        <a href="#/learn?subject=${escapeHtml(unit.subjectId)}" class="icon-btn" aria-label="Back to ${escapeHtml(unit.subjectId)} units">
          ${icon("icon-back")}
        </a>
        <div class="lesson-topbar__title-wrap">
          <div class="lesson-topbar__title">${escapeHtml(unit.unitId)} · ${escapeHtml(unit.title)}</div>
          <div class="card__meta">${escapeHtml(unit.officialCode)} · ${escapeHtml(SUBJECT_META[unit.subjectId]?.shortName || unit.subjectId)}</div>
        </div>
        <span class="mono card__meta">${escapeHtml(posText)}</span>
        <button type="button" class="icon-btn" id="lessonBookmarkBtn" aria-label="Bookmark unit" aria-pressed="${isBookmarkedInit}">
          ${icon(isBookmarkedInit ? "icon-bookmark-filled" : "icon-bookmark")}
        </button>
      </header>
      <div class="lesson-progress-line"><div style="width:${posPct}%"></div></div>

      <div class="lesson-workspace">
        <div class="lesson-main-col stack-m">
          <!-- Pill Tabs: Workbook · PYQs · Videos -->
          <div class="chip-row" id="lessonTabsRow"></div>

          <!-- Content Slot -->
          <div id="lessonBodySlot" class="stack-m"></div>
        </div>

        <!-- Sticky Desktop Outline Card (>=1024px) -->
        <aside class="card lesson-outline-card stack-s">
          <div class="badge badge--brand">${escapeHtml(unit.unitId)} · ${escapeHtml(unit.officialCode)}</div>
          <h3 class="card__title" style="margin:0">${escapeHtml(unit.title)}</h3>
          <p class="card__meta">Est. ${unit.estimatedMinutes || 30} min · ${unitPyqs.length} Verified PYQs</p>
          <div class="stack-xs" id="lessonOutlineLinks">
            ${noteSections
              .map(
                (sec) =>
                  `<a class="lesson-outline-link" href="#/learn/${escapeHtml(unit.unitId)}" data-anchor="${escapeHtml(sec.anchor)}">${escapeHtml(sec.heading)}</a>`
              )
              .join("")}
          </div>
          <hr style="border:none;border-top:1px solid var(--border-subtle);width:100%" />
          <div class="row-between">
            ${
              idxInSubject > 0
                ? `<a class="btn btn--ghost btn--sm" href="#/learn/${escapeHtml(subjectUnits[idxInSubject - 1].unitId)}">← ${escapeHtml(subjectUnits[idxInSubject - 1].unitId)}</a>`
                : `<span></span>`
            }
            ${
              idxInSubject < subjectUnits.length - 1
                ? `<a class="btn btn--ghost btn--sm" href="#/learn/${escapeHtml(subjectUnits[idxInSubject + 1].unitId)}">${escapeHtml(subjectUnits[idxInSubject + 1].unitId)} →</a>`
                : `<span></span>`
            }
          </div>
        </aside>
      </div>

      <!-- Sticky Bottom Action Bar (05-lesson.png) -->
      <footer class="lesson-bottom-bar">
        <button type="button" class="btn btn--primary" id="lessonPracticeBtn">
          Practise this topic (${unitPracticeQs.length} PYQs) ${icon("icon-chevron")}
        </button>
        <button type="button" class="btn btn--ghost" id="lessonReviseBtn"></button>
      </footer>
    </div>
  `);

  main.innerHTML = "";
  main.appendChild(root);

  function syncReviseBtn() {
    const btn = $("#lessonReviseBtn", root);
    const isRev = currentProg.status === "revised";
    btn.className = isRev ? "btn btn--ghost is-revised-btn" : "btn btn--ghost";
    btn.innerHTML = isRev ? `${icon("icon-check")} Revised` : "Mark Revised";
  }

  function renderTabs() {
    const row = $("#lessonTabsRow", root);
    row.innerHTML = "";
    const tabs = [
      { id: "study", label: "Study Pack" },
      { id: "videos", label: `Videos (${(unit.videoLectures || []).length})` },
      { id: "formulas", label: `Formulas (${unitFormulas.length})` },
      { id: "workbook", label: "Workbook" },
      { id: "pyqs", label: `Verified PYQs (${unitPyqs.length})` },
    ];
    for (const t of tabs) {
      const b = el(
        `<button type="button" class="chip ${activeTab === t.id ? "chip--active" : ""}" data-tab="${escapeHtml(t.id)}">${escapeHtml(t.label)}</button>`
      );
      b.addEventListener("click", () => {
        activeTab = t.id;
        renderTabs();
        renderTabContent();
      });
      row.appendChild(b);
    }
  }

  async function renderTabContent() {
    const slot = $("#lessonBodySlot", root);
    slot.innerHTML = "";

    if (activeTab === "workbook") {
      const renderedExampleIds = new Set();

      // 1. Detailed Notes Sections + Key Formulas + Inline Worked Examples
      for (const sec of noteSections) {
        const formulasHtml = (sec.keyFormulas || [])
          .map(
            (kf) => `
            <div class="lesson-formula-card">
              <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
                <span class="solution-step__head" style="margin:0">${escapeHtml(kf.label)}</span>
                <button type="button" class="explain-step-btn js-explain-formula" data-fid="${escapeHtml(kf.formulaId)}">
                  ${icon("icon-spark")} Explain this step
                </button>
              </div>
              <div class="math-scroll" style="margin-top:var(--space-xs)">
                ${renderLatex(kf.latex)}
              </div>
            </div>
          `
          )
          .join("");

        const inlineExamplesHtml = (sec.examples || [])
          .map((ex) => {
            if (ex.exampleId) renderedExampleIds.add(ex.exampleId);
            return buildWorkedExampleHtml(ex);
          })
          .join("");

        const secEl = el(`
          <section class="card stack-s" id="sec-${escapeHtml(sec.anchor || "")}">
            <h2 class="card__title" style="margin:0">${escapeHtml(sec.heading)}</h2>
            <div class="lesson-prose">${renderLatex(sec.proseLatex || "", { preserveNewlines: true })}</div>
            ${formulasHtml}
            ${inlineExamplesHtml}
          </section>
        `);

        secEl.querySelectorAll(".js-explain-formula").forEach((btn) => {
          btn.addEventListener("click", () => {
            const kf = (sec.keyFormulas || []).find((f) => f.formulaId === btn.dataset.fid);
            if (openAiTutor && kf) {
              openAiTutor({
                mode: "lesson",
                unit,
                formula: kf,
                origin: "Unit Lesson",
                section: sec.heading,
              });
            }
          });
        });

        slot.appendChild(secEl);
      }

      // 2. Any standalone Worked Examples not already shown inline (`05-lesson.png`)
      for (const ex of unit.workedExamples || []) {
        if (ex.exampleId && renderedExampleIds.has(ex.exampleId)) continue;
        slot.appendChild(el(buildWorkedExampleHtml(ex)));
      }

      // 3. Warm Amber WBJEEB Traps Callout
      if ((unit.wbjeebTraps || []).length) {
        const trapsCard = el(`
          <section class="exam-trap stack-xs">
            <strong style="display:flex;align-items:center;gap:var(--space-xs);font-size:var(--fs-body)">
              ${icon("icon-alert")} WBJEEB Exam Traps to Watch
            </strong>
            <ul style="margin:0;padding-left:var(--space-l)">
              ${unit.wbjeebTraps.map((t) => `<li style="margin-top:var(--space-2xs)">${renderLatex(t)}</li>`).join("")}
            </ul>
          </section>
        `);
        slot.appendChild(trapsCard);
      }

      // 4. Focused Unit Practice Launcher (`practiceQuestions[]` curated from verified PYQs)
      if (unitPracticeQs.length) {
        const cat1Count = unitPracticeQs.filter((q) => q.category === 1).length;
        const cat2Count = unitPracticeQs.filter((q) => q.category === 2).length;
        const pracCard = el(`
          <section class="card card--accent-border stack-s">
            <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
              <div>
                <span class="badge badge--brand">Focused Unit Practice</span>
                <h3 class="card__title" style="margin-top:var(--space-2xs)">${escapeHtml(unit.unitId)} Curated PYQ Set (${unitPracticeQs.length} Qs)</h3>
                <p class="card__meta">${cat1Count} Cat-I (+1 / −0.25) · ${cat2Count} Cat-II (+2 multi-correct) · 2022–2025 verified</p>
              </div>
            </div>
            <div class="cluster-xs">
              <button type="button" class="btn btn--primary btn--sm" id="unitPracAssistedBtn">
                ${icon("icon-play")} Start Assisted Set
              </button>
              <button type="button" class="btn btn--ghost btn--sm" id="unitPracIndepBtn">
                Independent Drill
              </button>
            </div>
          </section>
        `);
        $("#unitPracAssistedBtn", pracCard).addEventListener("click", () => launchUnitPractice("assisted"));
        $("#unitPracIndepBtn", pracCard).addEventListener("click", () => launchUnitPractice("independent"));
        slot.appendChild(pracCard);
      }

      // 4. Personal Study Note for Unit
      const savedUnitNote = bookmarksMap.get(unit.unitId)?.note || "";
      const noteCard = el(`
        <section class="card stack-xs">
          <label class="form-label" for="unitPersonalNoteInput">My Personal Revision Notes (${escapeHtml(unit.unitId)})</label>
          <textarea id="unitPersonalNoteInput" class="input-textarea" rows="3" placeholder="Jot down your own memory hooks or diploma-to-JELET formula bridges…">${escapeHtml(savedUnitNote)}</textarea>
          <div style="display:flex;justify-content:flex-end">
            <button type="button" class="btn btn--ghost btn--sm" id="saveUnitNoteBtn">Save Note Locally</button>
          </div>
        </section>
      `);
      $("#saveUnitNoteBtn", noteCard).addEventListener("click", async () => {
        const val = $("#unitPersonalNoteInput", noteCard).value;
        await savePersonalNote(unit.unitId, "unit", val, `${unit.unitId} · ${unit.title}`);
        bookmarksMap = await getBookmarksMap();
        showToast("Unit note saved locally");
      });
      slot.appendChild(noteCard);
      return;
    }

    if (activeTab === "study") {
      // Phase 13 — Study Pack tab (docs/phases/phase-13/plan.md §2.3).
      // Per-block visual identity (owner refinement, unit-model reference §6):
      // primers = worked-example tint cards, hooks = compact chip grid,
      // mistakes = amber caution list, checklist = tick list, reading = quiet
      // footnote block — never five identical cards, never raw JSON.
      const sp = unit.studyPack;
      if (!sp || typeof sp !== "object" || !Array.isArray(sp.conceptPrimer) || !sp.conceptPrimer.length) {
        // Calm empty state — units whose pack has not shipped yet.
        slot.appendChild(
          el(`
            <section class="card stack-xs">
              <div class="cluster-xs">
                ${icon("icon-spark")}
                <strong>Study Pack (${escapeHtml(unit.unitId)})</strong>
              </div>
              <p class="card__meta" style="margin:0">
                Study Pack for this unit is being authored — every pack is originally written and verified before shipping. Meanwhile: Videos · Formulas · Workbook · PYQs above.
              </p>
            </section>
          `)
        );
        return;
      }

      const prov = sp.provenance || {};
      const provPending = /^pending/i.test(String(prov.reviewedBy || ""));
      const provText = provPending
        ? "AI-assisted draft · owner review pending"
        : `AI-assisted draft · reviewed by ${prov.reviewedBy || "owner"} · ${prov.reviewedAt || ""}`.trim();

      const primerHtml = sp.conceptPrimer
        .map(
          (p) => `
          <article class="worked-example study-primer stack-xs">
            <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
              <strong class="study-primer__heading">${escapeHtml(p.heading || "")}</strong>
              ${p.prdId ? `<span class="mono pill">${escapeHtml(p.prdId)}</span>` : ""}
            </div>
            <div class="lesson-prose">${renderLatex(p.proseLatex || "", { preserveNewlines: true })}</div>
          </article>
        `
        )
        .join("");

      const sfHtml = (sp.keyFormulas || [])
        .map(
          (f) => `
          <div class="lesson-formula-card study-sf">
            <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
              <div class="cluster-xs">
                ${f.sfId ? `<span class="mono pill">${escapeHtml(f.sfId)}</span>` : ""}
                <span class="solution-step__head" style="margin:0">${escapeHtml(f.label || "")}</span>
              </div>
            </div>
            <div class="math-scroll" style="margin-top:var(--space-xs)">${renderLatex(f.latex || "")}</div>
            ${f.use ? `<p class="lesson-formula-card__note" style="margin-top:var(--space-3xs)">${escapeHtml(f.use)}</p>` : ""}
          </div>
        `
        )
        .join("");

      const defsHtml = (sp.keyDefinitions || [])
        .map(
          (d) => `
          <div class="study-def">
            <dt>${escapeHtml(d.term || "")}</dt>
            <dd>${renderLatex(d.definition || "")}</dd>
          </div>
        `
        )
        .join("");

      const cmpHtml = (sp.comparisons || [])
        .map(
          (c) => `
          <div class="stack-xs">
            <div class="study-cmp-title">${escapeHtml(c.title || "")}</div>
            <div class="study-cmp-scroll">
              <table class="study-cmp">
                <thead>
                  <tr>${(c.columns || []).map((col) => `<th scope="col">${escapeHtml(col)}</th>`).join("")}</tr>
                </thead>
                <tbody>
                  ${(c.rows || [])
                    .map(
                      (row) => `
                      <tr>
                        <th scope="row">${escapeHtml(row.label || "")}</th>
                        ${(row.values || []).map((v) => `<td>${renderLatex(v)}</td>`).join("")}
                      </tr>
                    `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        `
        )
        .join("");

      const mcqHtml = (sp.mcqSelfTest || [])
        .map(
          (q, i) => `
          <article class="card stack-xs study-mcq" data-correct="${escapeHtml((q.correct || []).join(","))}">
            <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
              ${q.mcqId ? `<span class="mono pill">${escapeHtml(q.mcqId)}</span>` : ""}
              <span class="card__meta">Self-test Q${i + 1} / ${(sp.mcqSelfTest || []).length}</span>
            </div>
            <div class="lesson-prose">${renderLatex(q.stemLatex || "")}</div>
            <div class="stack-xs">
              ${(q.options || [])
                .map(
                  (opt) => `
                  <div class="study-mcq-opt" data-opt="${escapeHtml(opt.id || "")}">
                    <span class="study-mcq-opt__letter">${escapeHtml(opt.id || "")}</span>
                    <div class="study-mcq-opt__body">${renderLatex(opt.latex || "")}</div>
                  </div>
                `
                )
                .join("")}
            </div>
            <button type="button" class="btn btn--ghost btn--sm js-mcq-reveal" aria-expanded="false" style="align-self:flex-start">
              ${icon("icon-check")} Reveal answer + reason
            </button>
            <div class="study-mcq-answer" hidden>
              <div class="study-mcq-answer__key">Correct:
                ${(q.correct || []).map((c) => `<span class="badge badge--correct">${escapeHtml(c)}</span>`).join(" ")}
              </div>
              <div class="study-mcq-answer__why">${renderLatex(q.explanation || "")}</div>
            </div>
          </article>
        `
        )
        .join("");

      const hooksHtml = (sp.memoryHooks || [])
        .map(
          (h, i) => `
          <div class="lesson-formula-card study-hook">
            <span class="mono study-hook__idx">H${i + 1}</span>
            <div class="study-hook__text">${renderLatex(h)}</div>
          </div>
        `
        )
        .join("");

      const mistakesHtml = (sp.commonMistakes || [])
        .map((m) => `<li style="margin-top:var(--space-2xs)">${renderLatex(m)}</li>`)
        .join("");

      const checklistHtml = (sp.examChecklist || [])
        .map((item) => `<li class="study-check-item">${renderLatex(item)}</li>`)
        .join("");

      // Long checklists collapse behind the shared tiebreak-details disclosure.
      const checklistBlock =
        (sp.examChecklist || []).length > 8
          ? `<details class="tiebreak-details"><summary>Exam-Day Checklist (${(sp.examChecklist || []).length} checks)</summary><ul class="study-checklist">${checklistHtml}</ul></details>`
          : `<section class="stack-xs">
              <h3 class="study-block-title">${icon("icon-check")} Exam-Day Checklist</h3>
              <ul class="study-checklist">${checklistHtml}</ul>
            </section>`;

      const readingHtml = (sp.furtherReading || [])
        .map(
          (r) => `
          <div class="study-reading__item">
            <div class="study-reading__book">${escapeHtml(r.book || "")}</div>
            <div class="card__meta">${escapeHtml([r.author, r.chapters].filter(Boolean).join(" · "))}</div>
            <p class="study-reading__note">${escapeHtml(r.note || "")}</p>
          </div>
        `
        )
        .join("");

      slot.appendChild(
        el(`
          <div class="stack-m">
            <section class="study-pack-intro stack-xs">
              <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
                <div class="cluster-xs">
                  ${icon("icon-spark")}
                  <strong>${escapeHtml(unit.unitId)} Study Pack</strong>
                </div>
                <span class="mono pill">${escapeHtml(unit.officialCode)}</span>
              </div>
              <p class="study-pack-intro__lede" style="margin:0">
                ${escapeHtml(unit.title)} — plain-words primers, recall hooks, mistake radar and a last-minute checklist in one compact pass.
              </p>
            </section>

            <section class="stack-xs">
              <h3 class="study-block-title">${icon("icon-learn")} Concept Primer <span class="study-block-title__meta">plain words before the maths</span></h3>
              ${primerHtml}
            </section>

            ${sfHtml ? `
            <section class="stack-xs">
              <h3 class="study-block-title">${icon("icon-formula")} Key Formula Family <span class="study-block-title__meta">the complete exam set · ${escapeHtml(String((sp.keyFormulas || []).length))} identities</span></h3>
              <div class="stack-xs">${sfHtml}</div>
            </section>` : ""}

            ${defsHtml ? `
            <section class="stack-xs">
              <h3 class="study-block-title">${icon("icon-layers")} Key Definitions <span class="study-block-title__meta">the terms the paper uses</span></h3>
              <dl class="study-defs">${defsHtml}</dl>
            </section>` : ""}

            ${cmpHtml ? `
            <section class="stack-xs">
              <h3 class="study-block-title">${icon("icon-info")} Comparisons <span class="study-block-title__meta">side-by-side, never confused again</span></h3>
              ${cmpHtml}
            </section>` : ""}

            ${mcqHtml ? `
            <section class="stack-xs">
              <h3 class="study-block-title">${icon("icon-check")} MCQ Self-Test <span class="study-block-title__meta">exam-true practice · tap to reveal · never scored</span></h3>
              ${mcqHtml}
            </section>` : ""}

            <section class="stack-xs">
              <h3 class="study-block-title">${icon("icon-bolt")} Memory Hooks <span class="study-block-title__meta">one-line recall aids</span></h3>
              <div class="study-hook-grid">${hooksHtml}</div>
            </section>

            <section class="stack-xs">
              <h3 class="study-block-title">${icon("icon-alert")} Common Mistakes <span class="study-block-title__meta">self-inflicted slips — board-designed traps live in the Workbook tab</span></h3>
              <div class="exam-trap stack-xs">
                <ul style="margin:0;padding-left:var(--space-l)">${mistakesHtml}</ul>
              </div>
            </section>

            ${checklistBlock}

            <section class="stack-xs">
              <h3 class="study-block-title">${icon("icon-bookmark")} Read Further <span class="study-block-title__meta">title &amp; chapter pointers only</span></h3>
              <div class="study-reading stack-xs">${readingHtml}</div>
            </section>

            <p class="card__meta study-provenance">${escapeHtml(provText)}</p>
          </div>
        `)
      );

      // MCQ self-test wiring: per-question reveal, zero storage, zero scoring.
      slot.querySelectorAll(".js-mcq-reveal").forEach((btn) => {
        btn.addEventListener("click", () => {
          const card = btn.closest(".study-mcq");
          if (!card) return;
          const box = card.querySelector(".study-mcq-answer");
          const revealed = !box.hidden;
          box.hidden = revealed;
          btn.setAttribute("aria-expanded", revealed ? "false" : "true");
          btn.innerHTML = revealed
            ? `${icon("icon-check")} Reveal answer + reason`
            : `${icon("icon-close")} Hide answer`;
          const correctSet = new Set(String(card.dataset.correct || "").split(",").filter(Boolean));
          card.querySelectorAll(".study-mcq-opt").forEach((opt) => {
            if (revealed) opt.removeAttribute("data-hit");
            else if (correctSet.has(String(opt.dataset.opt))) opt.setAttribute("data-hit", "true");
          });
        });
      });
      return;
    }

    if (activeTab === "formulas") {
      const headerCard = el(`
        <section class="card stack-xs unit-formula-sheet">
          <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
            <div class="cluster-xs">
              ${icon("icon-formula")}
              <strong>${escapeHtml(unit.unitId)} Formula Sheet (${unitFormulas.length})</strong>
            </div>
            <a class="btn btn--ghost btn--sm" href="#/formulas">All 42 Units →</a>
          </div>
          <p class="unit-formula-sheet__meta" style="margin:0">
            High-yield equations for ${escapeHtml(unit.title)} (${escapeHtml(unit.officialCode)}), rendered offline with KaTeX.
          </p>
        </section>
      `);
      slot.appendChild(headerCard);

      if (!unitFormulas.length) {
        slot.appendChild(
          el(`<div class="card"><p class="card__meta">No key formulas listed for ${escapeHtml(unit.unitId)}.</p></div>`)
        );
        return;
      }

      const listCard = el(`
        <section class="card stack-s unit-formula-sheet">
          ${unitFormulas
            .map(
              (kf) => `
              <div class="lesson-formula-card">
                <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
                  <div class="cluster-xs">
                    ${kf.formulaId ? `<span class="mono pill">${escapeHtml(kf.formulaId)}</span>` : ""}
                    <span class="solution-step__head" style="margin:0">${escapeHtml(kf.label)}</span>
                  </div>
                  ${
                    openAiTutor
                      ? `<button type="button" class="explain-step-btn js-unit-formula-ai" data-fid="${escapeHtml(kf.formulaId || "")}">
                          ${icon("icon-spark")} Explain
                        </button>`
                      : ""
                  }
                </div>
                ${
                  kf.sectionHeading
                    ? `<div class="unit-formula-sheet__meta" style="margin-top:var(--space-3xs)">${escapeHtml(kf.sectionHeading)}</div>`
                    : ""
                }
                <div class="math-scroll" style="margin-top:var(--space-xs)">
                  ${renderLatex(kf.latex)}
                </div>
                ${
                  kf.aiExplainContext
                    ? `<p class="lesson-formula-card__note">${escapeHtml(kf.aiExplainContext)}</p>`
                    : ""
                }
              </div>
            `
            )
            .join("")}
        </section>
      `);

      listCard.querySelectorAll(".js-unit-formula-ai").forEach((btn) => {
        btn.addEventListener("click", () => {
          const kf = unitFormulas.find((f) => f.formulaId === btn.dataset.fid);
          if (openAiTutor && kf) {
            openAiTutor({ mode: "lesson", unit, formula: kf, origin: "Unit Formula Sheet" });
          }
        });
      });
      slot.appendChild(listCard);

      if ((unit.wbjeebTraps || []).length) {
        slot.appendChild(
          el(`
            <section class="exam-trap stack-xs">
              <strong style="display:flex;align-items:center;gap:var(--space-xs);font-size:var(--fs-body)">
                ${icon("icon-alert")} Quick Formula Sign &amp; Unit Checks (${escapeHtml(unit.unitId)})
              </strong>
              <ul style="margin:0;padding-left:var(--space-l)">
                ${unit.wbjeebTraps.map((t) => `<li style="margin-top:var(--space-2xs)">${renderLatex(t)}</li>`).join("")}
              </ul>
            </section>
          `)
        );
      }
      return;
    }

    if (activeTab === "pyqs") {
      if (!unitPyqs.length) {
        slot.innerHTML = `<div class="card"><p class="card__meta">No PYQs mapped to this unit.</p></div>`;
        return;
      }
      if (!solutionsCache) {
        slot.innerHTML = `<div class="card"><p class="card__meta">Loading ${unitPyqs.length} verified PYQs &amp; SymPy solutions…</p></div>`;
        solutionsCache = await loadSolutionsForQuestions(unitPyqs);
        slot.innerHTML = "";
      }

      for (const q of unitPyqs) {
        const voided = isVoidedQuestion(q);
        const sol = solutionsCache[q.id];
        const card = el(`
          <article class="card stack-s">
            <div class="cluster-xs">
              <span class="mono pill">JELET ${q.year} · Q${q.qNumber}</span>
              <span class="badge ${voided ? "badge--review" : q.category === 2 ? "badge--partial" : "badge--brand"}">
                ${escapeHtml(categoryLabel(q))}
              </span>
            </div>
            <div class="question-stem">${renderLatex(q.stemLatex, { preserveNewlines: true })}</div>
            ${q.stemFigure?.src ? `<div class="figure-frame" data-stem-figure="true"></div>` : ""}
            <div class="stack-xs">
              ${(q.options || [])
                .map(
                  (opt) => `
                  <div class="reader-opt" data-opt-id="${escapeHtml(opt.id)}">
                    <span class="option__letter">${escapeHtml(opt.id)}</span>
                    <div class="reader-opt__body">
                      <div>${renderLatex(opt.latex)}</div>
                      ${opt.figure?.src ? `<div class="figure-frame" data-opt-figure="${escapeHtml(opt.id)}"></div>` : ""}
                    </div>
                  </div>`
                )
                .join("")}
            </div>
            <button type="button" class="btn btn--ghost btn--sm js-unit-q-sol" style="align-self:flex-start">
              ${icon("icon-check")} Reveal Key &amp; SymPy Steps
            </button>
            <div class="js-unit-sol-box" hidden></div>
          </article>
        `);
        hydrateQuestionFigures(card, q);

        const solBtn = $(".js-unit-q-sol", card);
        const solBox = $(".js-unit-sol-box", card);
        solBtn.addEventListener("click", () => {
          if (!solBox.hidden) {
            solBox.hidden = true;
            solBtn.innerHTML = `${icon("icon-check")} Reveal Key &amp; SymPy Steps`;
            card.querySelectorAll(".reader-opt").forEach((r) => r.removeAttribute("data-correct"));
            return;
          }
          const cSet = new Set(q.key?.correct || []);
          card.querySelectorAll(".reader-opt").forEach((r) => {
            if (cSet.has(r.dataset.optId)) r.setAttribute("data-correct", "true");
          });
          solBox.innerHTML = "";
          solBox.appendChild(
            buildSolutionBlock(q, sol, {
              onAskAi: openAiTutor
                ? (question, solution) => openAiTutor({ question, solution, origin: "Unit PYQs" })
                : null,
            })
          );
          solBox.hidden = false;
          solBtn.innerHTML = `${icon("icon-close")} Hide Solution`;
        });
        slot.appendChild(card);
      }
      return;
    }

    if (activeTab === "videos") {
      // Zero Auto-Iframe Load Law (AGENTS.md §1.4 & docs/03 §2.4)
      const videos = unit.videoLectures || [];
      if (!videos.length) {
        slot.appendChild(
          el(`
            <div class="card stack-xs">
              <div class="cluster-xs">
                ${icon("icon-video")}
                <strong>Curated Video Lectures (${escapeHtml(unit.unitId)})</strong>
              </div>
              <p class="card__meta">
                Zero third-party iframes are loaded automatically (100% offline privacy). Curated Bengali/English/Hindi lecture IDs added to <span class="mono">_data/units/${escapeHtml(unit.unitId)}.json</span> render here as click-to-load <span class="mono">youtube-nocookie.com</span> facades with local Watched ✔ tracking.
              </p>
            </div>
          `)
        );
        return;
      }

      const watchedSet = new Set(currentProg.watchedVideoIds || []);
      const langNames = { bn: "Bengali", en: "English", hi: "Hindi" };

      for (const vid of videos) {
        const watchKey = vid.videoId || vid.url;
        const isWatched = watchedSet.has(watchKey);
        const startSec = Number(vid.startSeconds) || 0;
        const deepLink = vid.videoId
          ? `https://youtu.be/${encodeURIComponent(vid.videoId)}${startSec ? `?t=${startSec}` : ""}`
          : vid.url;
        const embedUrl = vid.videoId
          ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(vid.videoId)}?rel=0${startSec ? `&start=${startSec}` : ""}`
          : "";
        const durationBadge =
          vid.duration || (vid.durationMinutes ? `${vid.durationMinutes} min` : "");
        const providerMeta = [vid.channelName || vid.provider, vid.scopeNote]
          .filter(Boolean)
          .join(" · ");

        const vCard = el(`
          <article class="card stack-s">
            <div class="row-between" style="align-items:flex-start;gap:var(--space-xs);flex-wrap:wrap">
              <div style="flex:1;min-width:0">
                <div class="cluster-xs">
                  <span class="badge badge--brand">${escapeHtml(langNames[vid.language] || vid.provider || "Lecture")}</span>
                  ${durationBadge ? `<span class="pill">${escapeHtml(durationBadge)}</span>` : ""}
                </div>
                <h3 class="card__title" style="margin-top:var(--space-xs)">${escapeHtml(vid.title)}</h3>
                <p class="card__meta">${escapeHtml(providerMeta)}</p>
              </div>
              <button type="button" class="btn btn--ghost btn--sm js-watch-toggle">
                ${isWatched ? `${icon("icon-check")} Watched` : "Mark Watched"}
              </button>
            </div>
            <div class="js-video-stage">
              <div class="cluster-xs">
                ${
                  embedUrl
                    ? `<button type="button" class="btn btn--primary btn--sm js-mount-yt">
                        ${icon("icon-play")} Watch Inside App
                      </button>`
                    : ""
                }
                ${
                  deepLink
                    ? `<a class="btn btn--ghost btn--sm" href="${escapeHtml(deepLink)}" target="_blank" rel="noopener noreferrer">
                        ${icon("icon-external")} ${vid.videoId ? "Open in YouTube App" : "Open Lecture"}
                      </a>`
                    : ""
                }
              </div>
            </div>
          </article>
        `);

        $(".js-watch-toggle", vCard).addEventListener("click", async () => {
          currentProg = await toggleWatchedVideo(unit.unitId, watchKey);
          renderTabContent();
        });

        const mountBtn = $(".js-mount-yt", vCard);
        if (mountBtn) {
          mountBtn.addEventListener("click", () => {
            const stage = $(".js-video-stage", vCard);
            if (typeof navigator !== "undefined" && navigator.onLine === false) {
              stage.innerHTML = `<div class="exam-trap">You are currently offline. Video streaming requires internet — your workbook, formulas, and ${unitPyqs.length} PYQs remain 100% available offline.</div>`;
              return;
            }
            stage.innerHTML = `
              <div class="video-embed-frame">
                <iframe
                  src="${escapeHtml(embedUrl)}"
                  title="${escapeHtml(vid.title)}"
                  loading="lazy"
                  referrerpolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; encrypted-media; picture-in-picture"
                  allowfullscreen
                ></iframe>
              </div>
            `;
          });
        }

        slot.appendChild(vCard);
      }
    }
  }

  // Outline smooth scroll links
  root.querySelectorAll(".lesson-outline-link").forEach((link) => {
    link.addEventListener("click", (ev) => {
      ev.preventDefault();
      if (activeTab !== "workbook") {
        activeTab = "workbook";
        renderTabs();
        renderTabContent();
      }
      const target = document.getElementById(`sec-${link.dataset.anchor}`);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  $("#lessonBookmarkBtn", root).addEventListener("click", async (ev) => {
    const btn = ev.currentTarget;
    const rec = await toggleBookmark(unit.unitId, "unit", `${unit.unitId} · ${unit.title}`);
    bookmarksMap = await getBookmarksMap();
    const saved = Boolean(rec?.bookmarked);
    btn.setAttribute("aria-pressed", String(saved));
    btn.innerHTML = icon(saved ? "icon-bookmark-filled" : "icon-bookmark");
    showToast(saved ? "Unit bookmarked" : "Bookmark removed");
  });

  $("#lessonReviseBtn", root).addEventListener("click", async () => {
    const nextStatus = currentProg.status === "revised" ? "studying" : "revised";
    currentProg = await updateUnitProgress(unit.unitId, { status: nextStatus });
    syncReviseBtn();
    showToast(nextStatus === "revised" ? `${unit.unitId} marked Revised!` : `${unit.unitId} set to Studying`);
  });

  $("#lessonPracticeBtn", root).addEventListener("click", () => launchUnitPractice("assisted"));

  syncReviseBtn();
  renderTabs();
  await renderTabContent();
}

/**
 * 42-Unit Formula & Trap Crib Sheet (`#/formulas` — Today Quick Action)
 */
export async function renderFormulaSheet(main, { openAiTutor } = {}) {
  main.innerHTML = `<div class="view"><p class="view__placeholder">Loading 42-unit Formula Sheet…</p></div>`;
  const allUnits = await loadAllUnits();

  let activeSubject = "ALL";
  let query = "";

  const root = el(`
    <div class="view stack-m">
      <div class="row-between">
        <a href="#/" class="btn btn--ghost btn--sm">${icon("icon-back")} Today</a>
        <span class="pill">42 Canonical Syllabus Units</span>
      </div>
      <div class="sticky-filter-bar">
        <label class="search-box" aria-label="Search formulas">
          ${icon("icon-search")}
          <input type="search" id="formulaSearchInput" placeholder="Search Cayley-Hamilton, lens, resonance, pH…" autocomplete="off" />
        </label>
        <div class="chip-row" id="formulaSubjectChips"></div>
      </div>
      <div id="formulaCardsSlot" class="stack-m"></div>
    </div>
  `);

  main.innerHTML = "";
  main.appendChild(root);

  const chips = [
    { id: "ALL", label: "All Subjects" },
    { id: "MATH", label: "Mathematics (11)" },
    { id: "PHYS", label: "Physics (15)" },
    { id: "CHEM", label: "Chemistry (8)" },
    { id: "FEEE", label: "FEEE (8)" },
  ];

  function renderChips() {
    const row = $("#formulaSubjectChips", root);
    row.innerHTML = "";
    for (const c of chips) {
      const b = el(
        `<button type="button" class="chip ${activeSubject === c.id ? "chip--active" : ""}">${escapeHtml(c.label)}</button>`
      );
      b.addEventListener("click", () => {
        activeSubject = c.id;
        renderChips();
        renderCards();
      });
      row.appendChild(b);
    }
  }

  function renderCards() {
    const slot = $("#formulaCardsSlot", root);
    slot.innerHTML = "";
    const qNorm = query.trim().toLowerCase();

    for (const u of allUnits) {
      if (activeSubject !== "ALL" && u.subjectId !== activeSubject) continue;
      const formulas = (u.sections || []).flatMap((s) => s.keyFormulas || []);
      const blob = `${u.unitId} ${u.title} ${formulas
        .map((f) => `${f.label} ${stripLatexForSearch(f.latex)}`)
        .join(" ")} ${(u.wbjeebTraps || []).join(" ")}`.toLowerCase();

      if (qNorm && !blob.includes(qNorm)) continue;

      const card = el(`
        <section class="card stack-s">
          <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
            <div class="cluster-xs">
              <span class="mono badge badge--brand">${escapeHtml(u.unitId)}</span>
              <strong>${escapeHtml(u.title)}</strong>
            </div>
            <div class="cluster-xs">
              <a class="btn btn--ghost btn--sm" href="#/learn/${escapeHtml(u.unitId)}?tab=formulas">Unit Formulas</a>
              <a class="btn btn--ghost btn--sm" href="#/learn/${escapeHtml(u.unitId)}">Workbook</a>
            </div>
          </div>
          ${formulas
            .map(
              (f) => `
              <div class="lesson-formula-card">
                <div class="row-between">
                  <span class="solution-step__head" style="margin:0">${escapeHtml(f.label)}</span>
                  ${
                    openAiTutor
                      ? `<button type="button" class="explain-step-btn js-f-ai" data-fid="${escapeHtml(f.formulaId)}">${icon("icon-spark")} Explain</button>`
                      : ""
                  }
                </div>
                <div class="math-scroll" style="margin-top:var(--space-2xs)">${renderLatex(f.latex)}</div>
              </div>`
            )
            .join("")}
        </section>
      `);

      card.querySelectorAll(".js-f-ai").forEach((btn) => {
        btn.addEventListener("click", () => {
          const kf = formulas.find((f) => f.formulaId === btn.dataset.fid);
          if (openAiTutor && kf) openAiTutor({ mode: "lesson", unit: u, formula: kf, origin: "Formula Sheet" });
        });
      });

      slot.appendChild(card);
    }

    if (!slot.children.length) {
      slot.innerHTML = `<div class="card"><p class="card__meta">No formulas matched "${escapeHtml(query)}".</p></div>`;
    }
  }

  $("#formulaSearchInput", root).addEventListener("input", (ev) => {
    query = ev.target.value || "";
    renderCards();
  });

  renderChips();
  renderCards();
}
