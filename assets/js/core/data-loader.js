/**
 * data-loader.js — JELET Study Hub (v3) · Static Corpus, Practice Set & SVG Loader
 * ---------------------------------------------------------------------------
 * Strictly relative `./_data/...` paths so the app runs identically on
 * localhost, Termux, CodeC Android Web Preview, and GitHub Pages `/<repo>/`.
 *
 * Lazy-load discipline:
 *   - `_data/solutions/<year>.solutions.json` is NEVER fetched during an
 *     active Independent Timed Mock — only on Results, Lesson, Paper Reader,
 *     or Assisted Practice.
 *   - `_data/figures/<year>/*.svg` is fetched and mounted as sanitized inline
 *     `<svg>` so `var(--fig-*)` tokens switch live in AMOLED Dark Mode.
 */

const _cache = {
  manifest: null,
  papers: new Map(),
  solutions: new Map(),
  units: new Map(),
  practiceSets: new Map(),
  practiceSolutions: new Map(),
  svgs: new Map(),
  questionIndex: null,
};

async function fetchJson(relPath) {
  const clean = relPath.startsWith("./") ? relPath : `./${relPath.replace(/^\/+/, "")}`;
  const res = await fetch(clean);
  if (!res.ok) {
    throw new Error(`Failed to load ${clean} (HTTP ${res.status})`);
  }
  return res.json();
}

/** Load `_data/manifest.json` (cached). */
export async function loadManifest() {
  if (!_cache.manifest) {
    _cache.manifest = await fetchJson("./_data/manifest.json");
  }
  return _cache.manifest;
}

/** Normalize year or paperId (`2025` or `"jelet-2025"`) to manifest entry. */
async function resolvePaperEntry(yearOrId) {
  const manifest = await loadManifest();
  const str = String(yearOrId);
  return manifest.papers.find(
    (p) => p.paperId === str || String(p.year) === str
  );
}

/** Load one official WBJEEB paper (`2022`..`2025`), annotating runtime metadata cleanly. */
export async function loadPaper(yearOrId) {
  const entry = await resolvePaperEntry(yearOrId);
  if (!entry) throw new Error(`Unknown paper: ${yearOrId}`);
  if (_cache.papers.has(entry.paperId)) {
    return _cache.papers.get(entry.paperId);
  }
  const raw = await fetchJson(entry.dataFile);
  const enriched = {
    ...raw,
    meta: entry,
    questions: (raw.questions || []).map((q) => ({
      ...q,
      paperId: raw.paperId,
      year: raw.year,
      sourceType: "official-pyq",
    })),
  };
  _cache.papers.set(entry.paperId, enriched);
  return enriched;
}

/** Load all official WBJEEB papers sorted newest-first (`2025` -> `2022`). */
export async function loadAllPapers() {
  const manifest = await loadManifest();
  const sorted = [...manifest.papers].sort((a, b) => b.year - a.year);
  return Promise.all(sorted.map((p) => loadPaper(p.paperId)));
}

/** Build a fast lookup map `questionId -> question` across all official PYQ papers. */
export async function getQuestionIndex() {
  if (_cache.questionIndex) return _cache.questionIndex;
  const papers = await loadAllPapers();
  const map = new Map();
  for (const p of papers) {
    for (const q of p.questions) {
      map.set(q.id, q);
    }
  }
  // Also include any drop-in practice sets registered in manifest.practiceSets
  const pracSets = await loadAllPracticeSets();
  for (const ps of pracSets) {
    for (const q of ps.questions || []) {
      map.set(q.id, q);
    }
  }
  _cache.questionIndex = map;
  return map;
}

/** Lazy-load worked solutions for an official paper (`2022`..`2025`). */
export async function loadSolutions(yearOrId) {
  const entry = await resolvePaperEntry(yearOrId);
  if (!entry) throw new Error(`Unknown paper for solutions: ${yearOrId}`);
  if (_cache.solutions.has(entry.paperId)) {
    return _cache.solutions.get(entry.paperId);
  }
  const data = await fetchJson(entry.solutionsFile);
  _cache.solutions.set(entry.paperId, data.solutions || {});
  return _cache.solutions.get(entry.paperId);
}

/** Resolve a single question's solution (official PYQ or curated practice set). */
export async function loadSolutionForQuestion(question) {
  if (!question) return null;
  if (question.sourceType === "curated-practice" && question.setId) {
    const sols = await loadPracticeSolutions(question.setId);
    return sols[question.id] || null;
  }
  const yearOrId = question.paperId || question.year || question.id?.slice(0, 10);
  const sols = await loadSolutions(yearOrId);
  return sols[question.id] || null;
}

/** Load solutions map covering an arbitrary array of questions (spanning years/sets). */
export async function loadSolutionsForQuestions(questions) {
  const out = {};
  const paperIds = new Set();
  const pracIds = new Set();
  for (const q of questions) {
    if (q.sourceType === "curated-practice" && q.setId) pracIds.add(q.setId);
    else if (q.paperId || q.year) paperIds.add(q.paperId || q.year);
  }
  await Promise.all([
    ...[...paperIds].map(async (pid) => {
      const sols = await loadSolutions(pid);
      Object.assign(out, sols);
    }),
    ...[...pracIds].map(async (sid) => {
      const sols = await loadPracticeSolutions(sid);
      Object.assign(out, sols);
    }),
  ]);
  return out;
}

/** Load a single unit workbook (`M01`..`E08`). */
export async function loadUnit(unitId) {
  const id = String(unitId).toUpperCase();
  if (_cache.units.has(id)) return _cache.units.get(id);
  const data = await fetchJson(`./_data/units/${id}.json`);
  _cache.units.set(id, data);
  return data;
}

/** Load all 42 canonical syllabus unit workbooks (`M01`..`E08`). */
export async function loadAllUnits() {
  const manifest = await loadManifest();
  return Promise.all((manifest.units || []).map((u) => loadUnit(u.unitId)));
}

/* ------------------------------------------------------------------ *
 * Extensible Practice Sets (`_data/practice-sets/*.json`, docs/03 §2.5)
 * Dropping a new set entry into `manifest.practiceSets[]` automatically
 * surfaces it across Practice & Learn with zero UI code edits.
 * ------------------------------------------------------------------ */
export async function loadPracticeSet(setId) {
  if (_cache.practiceSets.has(setId)) return _cache.practiceSets.get(setId);
  const manifest = await loadManifest();
  const entry = (manifest.practiceSets || []).find((s) => s.setId === setId);
  const filePath = entry?.dataFile || `./_data/practice-sets/${setId}.json`;
  const raw = await fetchJson(filePath);
  const enriched = {
    ...raw,
    sourceType: "curated-practice",
    questions: (raw.questions || []).map((q) => ({
      ...q,
      setId: raw.setId || setId,
      sourceType: "curated-practice",
    })),
  };
  _cache.practiceSets.set(setId, enriched);
  return enriched;
}

export async function loadAllPracticeSets() {
  const manifest = await loadManifest();
  const list = manifest.practiceSets || [];
  if (!list.length) return [];
  return Promise.all(list.map((s) => loadPracticeSet(s.setId)));
}

export async function loadPracticeSolutions(setId) {
  if (_cache.practiceSolutions.has(setId)) return _cache.practiceSolutions.get(setId);
  const manifest = await loadManifest();
  const entry = (manifest.practiceSets || []).find((s) => s.setId === setId);
  const solPath = entry?.solutionsFile || `./_data/solutions/practice-${setId}.solutions.json`;
  try {
    const data = await fetchJson(solPath);
    const map = data.solutions || {};
    _cache.practiceSolutions.set(setId, map);
    return map;
  } catch {
    _cache.practiceSolutions.set(setId, {});
    return {};
  }
}

/* ------------------------------------------------------------------ *
 * Theme-Adaptive Inline SVG Figure Loader + Tap-to-Zoom Fullscreen Modal
 * ------------------------------------------------------------------ */
export async function fetchSvgText(src) {
  const clean = src.startsWith("./") ? src : `./${src.replace(/^\/+/, "")}`;
  if (_cache.svgs.has(clean)) return _cache.svgs.get(clean);
  const res = await fetch(clean);
  if (!res.ok) throw new Error(`Missing SVG figure: ${clean}`);
  const txt = await res.text();
  _cache.svgs.set(clean, txt);
  return txt;
}

/** Parse SVG XML safely (stripping scripts/on* handlers) and return a live `<svg>` element. */
function parseSafeSvgElement(svgText, altText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) return null;

  svg.querySelectorAll("script, foreignObject").forEach((n) => n.remove());
  svg.querySelectorAll("*").forEach((node) => {
    for (const attr of [...node.attributes]) {
      if (attr.name.toLowerCase().startsWith("on")) node.removeAttribute(attr.name);
    }
  });
  svg.setAttribute("role", "img");
  if (altText) svg.setAttribute("aria-label", altText);
  return document.importNode(svg, true);
}

let _zoomModal = null;

function openFigureZoomModal(svgMarkup, altText) {
  if (!_zoomModal) {
    _zoomModal = document.createElement("div");
    _zoomModal.className = "figure-zoom-modal";
    _zoomModal.setAttribute("role", "dialog");
    _zoomModal.setAttribute("aria-modal", "true");
    _zoomModal.setAttribute("aria-label", "Diagram zoom view");
    _zoomModal.innerHTML = `
      <div class="figure-zoom-modal__bar">
        <span class="figure-zoom-modal__caption"></span>
        <button type="button" class="btn btn--ghost figure-zoom-modal__close" aria-label="Close diagram">Close</button>
      </div>
      <div class="figure-zoom-modal__stage"></div>
    `;
    document.body.appendChild(_zoomModal);
    const close = () => _zoomModal.classList.remove("is-open");
    _zoomModal.querySelector(".figure-zoom-modal__close").addEventListener("click", close);
    _zoomModal.addEventListener("click", (ev) => {
      if (ev.target === _zoomModal) close();
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && _zoomModal.classList.contains("is-open")) close();
    });
  }
  const stage = _zoomModal.querySelector(".figure-zoom-modal__stage");
  const cap = _zoomModal.querySelector(".figure-zoom-modal__caption");
  stage.innerHTML = "";
  const svgEl = parseSafeSvgElement(svgMarkup, altText);
  if (svgEl) stage.appendChild(svgEl);
  cap.textContent = altText || "Diagram (pinch or scroll to inspect)";
  _zoomModal.classList.add("is-open");
}

/**
 * Mount a `stemFigure` or `option.figure` inline inside `container` so
 * `var(--fig-*)` CSS custom properties adapt instantaneously to light/dark themes.
 */
export async function mountFigure(container, figureObj, { zoomable = true, compact = false } = {}) {
  if (!container || !figureObj || !figureObj.src) return;
  container.innerHTML = `<div class="figure-frame__loading">Loading diagram…</div>`;
  try {
    const svgText = await fetchSvgText(figureObj.src);
    const svgEl = parseSafeSvgElement(svgText, figureObj.alt || "Question diagram");
    container.innerHTML = "";
    if (!svgEl) {
      container.textContent = figureObj.alt || "Diagram unavailable";
      return;
    }
    if (compact) container.classList.add("figure-frame--compact");
    container.appendChild(svgEl);

    if (zoomable) {
      const hint = document.createElement("button");
      hint.type = "button";
      hint.className = "figure-frame__zoom-btn";
      hint.setAttribute("aria-label", "Enlarge diagram");
      hint.innerHTML = `<svg class="ico" aria-hidden="true"><use href="./assets/icons/icons.svg#icon-zoom"/></svg><span>Tap to zoom</span>`;
      hint.addEventListener("click", (ev) => {
        ev.stopPropagation();
        openFigureZoomModal(svgText, figureObj.alt);
      });
      container.appendChild(hint);
    }
  } catch {
    container.innerHTML = `<p class="card__meta">${figureObj.alt || "Diagram could not be loaded offline."}</p>`;
  }
}

/** Pre-warm the entire 4-paper, 42-unit, 109-SVG corpus into browser cache on user opt-in. */
export async function warmOfflineCorpus(onProgress) {
  const manifest = await loadManifest();
  const urls = ["./_data/manifest.json"];
  for (const p of manifest.papers || []) {
    urls.push(p.dataFile, p.solutionsFile);
  }
  for (const u of manifest.units || []) {
    urls.push(`./_data/units/${u.unitId}.json`);
  }
  const papers = await loadAllPapers();
  for (const p of papers) {
    for (const q of p.questions) {
      if (q.stemFigure?.src) urls.push(q.stemFigure.src);
      for (const o of q.options || []) {
        if (o.figure?.src) urls.push(o.figure.src);
      }
    }
  }
  const unique = [...new Set(urls)];
  let done = 0;
  for (const u of unique) {
    await fetch(u);
    done += 1;
    if (onProgress) onProgress(done, unique.length);
  }
  return { filesCached: unique.length };
}
