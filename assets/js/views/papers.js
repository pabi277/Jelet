/**
 * papers.js — JELET Study Hub (v3) · Verified Papers Library & Reader (`#/papers`)
 * ---------------------------------------------------------------------------
 * Visual reference: `docs/references/ui-v3/02-papers-library.png` + `README.md`.
 * Strictly renders the 4 verified single-session WBJEEB papers (2025 -> 2022)
 * with zero fake Morning/Evening shifts, zero "Partial Key / No Key" badges,
 * live search across all 400 PYQs, bookmark toggles, personal bests, 1-tap
 * 2-hour Timed Mock launch, Read & Keys mode, and Printable OMR sheet link.
 */

import {
  loadManifest,
  loadAllPapers,
  loadPaper,
  loadSolutions,
} from "../core/data-loader.js";
import { renderLatex, stripLatexForSearch, escapeHtml } from "../core/math.js";
import {
  formatTwelfths,
  isVoidedQuestion,
  SUBJECT_META,
} from "../core/scoring.js";
import {
  computeHubSnapshot,
  createSession,
  getBookmarksMap,
  toggleBookmark,
  savePersonalNote,
} from "../core/stats.js";
import {
  $,
  el,
  icon,
  showToast,
  categoryLabel,
  buildSolutionBlock,
  hydrateQuestionFigures,
  subjectBadgeHtml,
} from "../core/ui.js";

const PAPER_CHIPS = [
  { id: "all", label: "All Papers" },
  { id: "2025", label: "2025" },
  { id: "2024", label: "2024" },
  { id: "2023", label: "2023" },
  { id: "2022", label: "2022" },
  { id: "bookmarked", label: "Bookmarked" },
  { id: "cat2", label: "Cat-II Multi" },
  { id: "voided", label: "Voided W" },
];

export async function renderPapersLibrary(main, { openAiTutor } = {}) {
  main.innerHTML = `<div class="view"><p class="view__placeholder">Loading verified WBJEEB papers…</p></div>`;

  const [manifest, papers] = await Promise.all([loadManifest(), loadAllPapers()]);
  let snapshot = await computeHubSnapshot(manifest);
  let bookmarksMap = await getBookmarksMap();

  let activeChip = "all";
  let searchQuery = "";

  // Pre-build search text per question once
  const searchableQuestions = [];
  for (const p of papers) {
    for (const q of p.questions) {
      const text = [
        `jelet ${p.year}`,
        `q${q.qNumber}`,
        q.id,
        q.subjectId,
        q.unitId,
        ...(q.tags || []),
        stripLatexForSearch(q.stemLatex),
        ...(q.options || []).map((o) => stripLatexForSearch(o.latex)),
      ].join(" ");
      searchableQuestions.push({ paper: p, question: q, searchText: text });
    }
  }

  const root = el(`
    <div class="view stack-l">
      <div class="sticky-filter-bar">
        <label class="search-box" aria-label="Search across 400 verified PYQs">
          ${icon("icon-search")}
          <input type="search" id="papersSearchInput" placeholder="Search across ${manifest.totals.questions} verified PYQs, units, topics…" autocomplete="off" />
        </label>
        <div class="chip-row" id="papersChipRow" role="tablist" aria-label="Paper filters"></div>
      </div>

      <div id="papersActiveSessionSlot"></div>
      <div id="papersListSlot" class="stack-m"></div>
      <div id="papersQuestionResultsSlot" class="stack-m"></div>
    </div>
  `);

  main.innerHTML = "";
  main.appendChild(root);

  const chipRow = $("#papersChipRow", root);
  const searchInput = $("#papersSearchInput", root);
  const activeSlot = $("#papersActiveSessionSlot", root);
  const listSlot = $("#papersListSlot", root);
  const qResultsSlot = $("#papersQuestionResultsSlot", root);

  function renderChips() {
    chipRow.innerHTML = "";
    for (const c of PAPER_CHIPS) {
      const btn = el(
        `<button type="button" class="chip ${activeChip === c.id ? "chip--active" : ""}" data-chip="${c.id}">${escapeHtml(c.label)}</button>`
      );
      btn.addEventListener("click", () => {
        activeChip = c.id;
        renderChips();
        renderContent();
      });
      chipRow.appendChild(btn);
    }
  }

  async function launchMock(paper) {
    const sess = await createSession({
      kind: "mock",
      mode: "independent",
      paperId: paper.paperId,
      title: `${paper.meta.title} · Official Timed Mock`,
      questions: paper.questions,
      durationMinutes: paper.meta.durationMinutes || 120,
    });
    location.hash = `#/exam/${sess.sessionId}`;
  }

  function renderActiveMockBanner() {
    activeSlot.innerHTML = "";
    const activeMock = (snapshot.activeSessions || []).find((s) => s.kind === "mock");
    if (!activeMock) return;
    const answeredCount = Object.values(activeMock.responses || {}).filter(
      (arr) => arr && arr.length > 0
    ).length;
    const banner = el(`
      <div class="card card--accent-border row-between">
        <div>
          <div class="badge badge--brand">${icon("icon-timer")} In-Progress Timed Mock</div>
          <h3 class="card__title" style="margin-top:var(--space-2xs)">${escapeHtml(activeMock.title)}</h3>
          <p class="card__meta">${answeredCount} / ${activeMock.questionIds.length} answered · Auto-saved locally</p>
        </div>
        <button type="button" class="btn btn--primary" id="resumeMockBtn">${icon("icon-play")} Resume</button>
      </div>
    `);
    $("#resumeMockBtn", banner).addEventListener("click", () => {
      location.hash = `#/exam/${activeMock.sessionId}`;
    });
    activeSlot.appendChild(banner);
  }

  function renderPaperCards() {
    listSlot.innerHTML = "";
    const isQuestionFilterOnly = activeChip === "cat2" || activeChip === "voided";
    if (isQuestionFilterOnly && !searchQuery) {
      // Skip paper cards so question results take focus
      return;
    }

    const filteredPapers = papers.filter((p) => {
      if (["2025", "2024", "2023", "2022"].includes(activeChip)) {
        return String(p.year) === activeChip;
      }
      if (activeChip === "bookmarked") {
        if (bookmarksMap.get(p.paperId)?.bookmarked) return true;
        return p.questions.some((q) => bookmarksMap.get(q.id)?.bookmarked);
      }
      return true;
    });

    if (!filteredPapers.length && !searchQuery) {
      listSlot.innerHTML = `<div class="card"><p class="card__meta">No bookmarked papers or questions yet. Tap the bookmark ribbon on any paper or question to save it here.</p></div>`;
      return;
    }

    for (const p of filteredPapers) {
      const m = p.meta;
      const isBkm = Boolean(bookmarksMap.get(p.paperId)?.bookmarked);
      const best = snapshot.paperBestMap.get(p.paperId);
      const bestText = best
        ? `${formatTwelfths(best.totalTwelfths)} / ${m.maxMarks}`
        : `— / ${m.maxMarks}`;
      const keyLabel =
        m.keyTier === "official"
          ? "Full Verified Key · Official WBJEEB"
          : "Full Verified Key · SymPy Derived";
      const voidCount = (m.voidedQuestions || []).length;

      const card = el(`
        <article class="card paper-card">
          <div class="row-between" style="align-items:flex-start">
            <div>
              <div class="cluster-xs">
                <span class="year-pill">${escapeHtml(m.year)}</span>
                <span class="badge badge--correct">${icon("icon-check")} ${escapeHtml(keyLabel)}</span>
              </div>
              <h3 class="card__title" style="margin-top:var(--space-xs)">${escapeHtml(m.title)}</h3>
              <p class="card__meta">
                Single Annual Session · Booklet Series ${escapeHtml(m.bookletSeries)} · ${m.questionCount} Qs · ${m.maxMarks} Marks · ${m.durationMinutes} Mins
              </p>
            </div>
            <button type="button" class="icon-btn js-paper-bkm" aria-label="Bookmark ${escapeHtml(m.title)}" aria-pressed="${isBkm}">
              ${icon(isBkm ? "icon-bookmark-filled" : "icon-bookmark")}
            </button>
          </div>

          <div class="cluster-xs" style="margin-top:var(--space-s)">
            <span class="pill">Best Score: <strong class="mono">${escapeHtml(bestText)}</strong></span>
            ${
              voidCount > 0
                ? `<span class="badge badge--review">${voidCount} Withdrawn W (Q${m.voidedQuestions.join(", Q")})</span>`
                : ""
            }
          </div>

          <div class="paper-card__actions reader-action-bar" role="group" aria-label="Actions for ${escapeHtml(m.title)}">
            <button type="button" class="reader-action-bar__item js-read-paper">
              ${icon("icon-papers")} Read &amp; Keys
            </button>
            <button type="button" class="reader-action-bar__item js-print-omr" aria-label="Print OMR Sheet for ${escapeHtml(m.title)}">
              ${icon("icon-print")} Print OMR
            </button>
            <button type="button" class="reader-action-bar__item reader-action-bar__item--primary js-start-mock">
              ${icon("icon-play")} Start 2h Mock
            </button>
          </div>
        </article>
      `);

      $(".js-paper-bkm", card).addEventListener("click", async () => {
        await toggleBookmark(p.paperId, "paper", m.title);
        bookmarksMap = await getBookmarksMap();
        showToast(bookmarksMap.get(p.paperId)?.bookmarked ? "Paper bookmarked" : "Bookmark removed");
        renderContent();
      });

      $(".js-start-mock", card).addEventListener("click", () => launchMock(cardPaper(p)));
      $(".js-read-paper", card).addEventListener("click", () => {
        location.hash = `#/papers/${p.paperId}`;
      });
      $(".js-print-omr", card).addEventListener("click", () => {
        location.hash = `#/omr-print/${p.paperId}`;
      });

      listSlot.appendChild(card);
    }
  }

  function cardPaper(p) {
    return p;
  }

  function renderQuestionSearchResults() {
    qResultsSlot.innerHTML = "";
    const qNorm = searchQuery.trim().toLowerCase();
    const shouldShowQuestions =
      qNorm.length > 0 ||
      activeChip === "cat2" ||
      activeChip === "voided" ||
      activeChip === "bookmarked";

    if (!shouldShowQuestions) return;

    const matches = searchableQuestions.filter(({ paper, question, searchText }) => {
      if (["2025", "2024", "2023", "2022"].includes(activeChip) && String(paper.year) !== activeChip) {
        return false;
      }
      if (activeChip === "bookmarked" && !bookmarksMap.get(question.id)?.bookmarked) {
        return false;
      }
      if (activeChip === "cat2" && question.category !== 2) {
        return false;
      }
      if (activeChip === "voided" && !isVoidedQuestion(question)) {
        return false;
      }
      if (qNorm && !searchText.includes(qNorm)) {
        return false;
      }
      return true;
    });

    if (!matches.length) {
      if (qNorm || activeChip === "cat2" || activeChip === "voided") {
        qResultsSlot.innerHTML = `<div class="card"><p class="card__meta">No matching PYQs found for this filter.</p></div>`;
      }
      return;
    }

    const shown = matches.slice(0, 40);
    const header = el(`
      <div class="row-between">
        <h3 class="section-heading">Matching Verified PYQs (${matches.length})</h3>
        ${matches.length > 40 ? `<span class="card__meta">Showing top 40 — refine search</span>` : ""}
      </div>
    `);
    qResultsSlot.appendChild(header);

    for (const { paper, question } of shown) {
      qResultsSlot.appendChild(
        buildLibraryQuestionCard(paper, question, bookmarksMap, {
          onBookmarkChange: async () => {
            bookmarksMap = await getBookmarksMap();
          },
          openAiTutor,
        })
      );
    }
  }

  function renderContent() {
    renderActiveMockBanner();
    renderPaperCards();
    renderQuestionSearchResults();
  }

  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value || "";
    renderContent();
  });

  renderChips();
  renderContent();
}

/** Expandable question + solution card used in Papers search & Paper Reader. */
function buildLibraryQuestionCard(paper, q, bookmarksMap, { onBookmarkChange, openAiTutor, solutionsMap = null } = {}) {
  const isBkm = Boolean(bookmarksMap.get(q.id)?.bookmarked);
  const savedNote = bookmarksMap.get(q.id)?.note || "";
  const voided = isVoidedQuestion(q);

  const optsHtml = (q.options || [])
    .map(
      (opt) => `
      <div class="reader-opt" data-opt-id="${escapeHtml(opt.id)}">
        <span class="option__letter">${escapeHtml(opt.id)}</span>
        <div class="reader-opt__body">
          <div>${renderLatex(opt.latex)}</div>
          ${opt.figure?.src ? `<div class="figure-frame" data-opt-figure="${escapeHtml(opt.id)}"></div>` : ""}
        </div>
      </div>
    `
    )
    .join("");

  const card = el(`
    <article class="card stack-s" id="qcard-${escapeHtml(q.id)}">
      <div class="row-between" style="align-items:flex-start">
        <div class="cluster-xs">
          <span class="mono pill">JELET ${paper.year} · Q${q.qNumber}</span>
          ${subjectBadgeHtml(q.subjectId)}
          <a class="pill link-pill" href="#/learn/${escapeHtml(q.unitId)}">Unit ${escapeHtml(q.unitId)}</a>
          <span class="badge ${voided ? "badge--review" : q.category === 2 ? "badge--partial" : "badge--brand"}">
            ${escapeHtml(categoryLabel(q))}
          </span>
        </div>
        <button type="button" class="icon-btn js-q-bkm" aria-label="Bookmark Q${q.qNumber}" aria-pressed="${isBkm}">
          ${icon(isBkm ? "icon-bookmark-filled" : "icon-bookmark")}
        </button>
      </div>

      <div class="question-stem">${renderLatex(q.stemLatex, { preserveNewlines: true })}</div>
      ${q.stemFigure?.src ? `<div class="figure-frame" data-stem-figure="true"></div>` : ""}

      <div class="stack-xs js-reader-opts">${optsHtml}</div>

      <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
        <button type="button" class="btn btn--ghost btn--sm js-toggle-sol">
          ${icon("icon-check")} Show Key &amp; SymPy Solution
        </button>
        <button type="button" class="btn btn--ghost btn--sm js-toggle-note">
          ${savedNote ? "Edit Note" : "+ Personal Note"}
        </button>
      </div>

      <div class="js-note-slot" hidden>
        <textarea class="input-textarea js-note-input" rows="2" placeholder="Write your personal shortcut or mistake note for ${escapeHtml(q.id)}…">${escapeHtml(savedNote)}</textarea>
        <div style="margin-top:var(--space-xs);display:flex;justify-content:flex-end">
          <button type="button" class="btn btn--primary btn--sm js-save-note">Save Note</button>
        </div>
      </div>

      <div class="js-sol-slot" hidden></div>
    </article>
  `);

  hydrateQuestionFigures(card, q);

  $(".js-q-bkm", card).addEventListener("click", async (ev) => {
    const btn = ev.currentTarget;
    const updated = await toggleBookmark(q.id, "question", `JELET ${paper.year} · Q${q.qNumber} (${q.unitId})`);
    const nowBkm = Boolean(updated?.bookmarked);
    btn.setAttribute("aria-pressed", String(nowBkm));
    btn.innerHTML = icon(nowBkm ? "icon-bookmark-filled" : "icon-bookmark");
    showToast(nowBkm ? "Question bookmarked" : "Bookmark removed");
    if (onBookmarkChange) await onBookmarkChange();
  });

  const noteSlot = $(".js-note-slot", card);
  $(".js-toggle-note", card).addEventListener("click", () => {
    noteSlot.hidden = !noteSlot.hidden;
  });
  $(".js-save-note", card).addEventListener("click", async () => {
    const val = $(".js-note-input", card).value;
    await savePersonalNote(q.id, "question", val, `JELET ${paper.year} · Q${q.qNumber} (${q.unitId})`);
    showToast("Personal note saved locally");
    noteSlot.hidden = true;
    if (onBookmarkChange) await onBookmarkChange();
  });

  const solSlot = $(".js-sol-slot", card);
  const solBtn = $(".js-toggle-sol", card);
  solBtn.addEventListener("click", async () => {
    if (!solSlot.hidden) {
      solSlot.hidden = true;
      solBtn.innerHTML = `${icon("icon-check")} Show Key &amp; SymPy Solution`;
      card.querySelectorAll(".reader-opt").forEach((elOpt) => elOpt.removeAttribute("data-correct"));
      return;
    }
    solBtn.textContent = "Loading verified solution…";
    const sols = solutionsMap || (await loadSolutions(paper.paperId));
    const sol = sols[q.id];

    // Highlight official correct options
    const correctSet = new Set(q.key?.correct || []);
    card.querySelectorAll(".reader-opt").forEach((elOpt) => {
      if (correctSet.has(elOpt.dataset.optId)) {
        elOpt.setAttribute("data-correct", "true");
      }
    });

    solSlot.innerHTML = "";
    solSlot.appendChild(
      buildSolutionBlock(q, sol, {
        onAskAi: openAiTutor ? (question, solution) => openAiTutor({ question, solution, paperTitle: paper.meta.title }) : null,
      })
    );
    solSlot.hidden = false;
    solBtn.innerHTML = `${icon("icon-close")} Hide Solution`;
  });

  return card;
}

/**
 * Full 100-Question Paper Reader (`#/papers/:paperId`)
 */
export async function renderPaperReader(main, paperId, { openAiTutor } = {}) {
  main.innerHTML = `<div class="view"><p class="view__placeholder">Opening ${escapeHtml(paperId)}…</p></div>`;
  let paper, solutionsMap, bookmarksMap;
  try {
    [paper, solutionsMap, bookmarksMap] = await Promise.all([
      loadPaper(paperId),
      loadSolutions(paperId),
      getBookmarksMap(),
    ]);
  } catch {
    main.innerHTML = `<div class="card"><p>Paper not found.</p><a class="btn btn--ghost" href="#/papers">Back to Papers</a></div>`;
    return;
  }

  let activeSubject = "ALL";

  const root = el(`
    <div class="view stack-m">
      <div class="card stack-s">
        <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
          <a href="#/papers" class="btn btn--ghost btn--sm">${icon("icon-back")} Papers</a>
          <span class="mono pill">Set ${escapeHtml(paper.bookletSeries)} · 100 Qs · 120M</span>
        </div>
        <div>
          <h2 class="card__title" style="margin:0">${escapeHtml(paper.meta.title)} — Complete Verified Booklet</h2>
          <p class="card__meta" style="margin-top:var(--space-3xs)">
            Key Ref: ${escapeHtml(paper.meta.keyDocumentRef)}
          </p>
        </div>
        <div class="reader-action-bar" role="group" aria-label="Paper reader actions">
          <button type="button" class="reader-action-bar__item is-active" id="readerReadKeysBtn" aria-current="page">
            ${icon("icon-papers")} Read &amp; Keys
          </button>
          <a href="#/omr-print/${escapeHtml(paper.paperId)}" class="reader-action-bar__item">
            ${icon("icon-print")} Print OMR
          </a>
          <button type="button" class="reader-action-bar__item reader-action-bar__item--primary" id="readerStartMockBtn">
            ${icon("icon-play")} Start 2h Mock
          </button>
        </div>
        <div class="chip-row" id="readerSubjectChips"></div>
      </div>

      <div id="readerQuestionsList" class="stack-m"></div>
    </div>
  `);

  main.innerHTML = "";
  main.appendChild(root);

  $("#readerReadKeysBtn", root).addEventListener("click", () => {
    const qEl = $("#readerQuestionsList", root);
    if (qEl) qEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("#readerStartMockBtn", root).addEventListener("click", async () => {
    const sess = await createSession({
      kind: "mock",
      mode: "independent",
      paperId: paper.paperId,
      title: `${paper.meta.title} · Official Timed Mock`,
      questions: paper.questions,
      durationMinutes: paper.meta.durationMinutes || 120,
    });
    location.hash = `#/exam/${sess.sessionId}`;
  });

  const subjChips = [
    { id: "ALL", label: "All 100 Qs" },
    { id: "MATH", label: "Maths (Q1–40)" },
    { id: "PHYS", label: "Physics (Q41–70)" },
    { id: "CHEM", label: "Chemistry (Q71–90)" },
    { id: "FEEE", label: "FEEE (Q91–100)" },
    { id: "CAT2", label: "Cat-II Only" },
  ];

  const chipContainer = $("#readerSubjectChips", root);
  const qList = $("#readerQuestionsList", root);

  function renderSubjectChips() {
    chipContainer.innerHTML = "";
    for (const s of subjChips) {
      const b = el(
        `<button type="button" class="chip ${activeSubject === s.id ? "chip--active" : ""}">${escapeHtml(s.label)}</button>`
      );
      b.addEventListener("click", () => {
        activeSubject = s.id;
        renderSubjectChips();
        renderQuestions();
      });
      chipContainer.appendChild(b);
    }
  }

  function renderQuestions() {
    qList.innerHTML = "";
    const filtered = paper.questions.filter((q) => {
      if (activeSubject === "ALL") return true;
      if (activeSubject === "CAT2") return q.category === 2;
      return q.subjectId === activeSubject;
    });
    for (const q of filtered) {
      qList.appendChild(
        buildLibraryQuestionCard(paper, q, bookmarksMap, {
          solutionsMap,
          openAiTutor,
          onBookmarkChange: async () => {
            bookmarksMap = await getBookmarksMap();
          },
        })
      );
    }
  }

  renderSubjectChips();
  renderQuestions();
}
