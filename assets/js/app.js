/**
 * app.js — JELET Study Hub (v3) · Router, theme controller & shell hydration
 * ---------------------------------------------------------------------------
 * Phone-First Modern Web PWA. Hash-based router (works on any /<repo>/ subpath).
 * Five global destinations only: Today · Learn · Practice · Papers · You.
 * All state is local-first (IndexedDB `jelet_hub_v1`); metrics are honest
 * (0 and — on a fresh device) — never faked.
 */

import { openDB, getMeta, setMeta, onSync } from "./db/indexeddb.js";
import { $, el, icon } from "./core/ui.js";
import { renderPapersLibrary, renderPaperReader } from "./views/papers.js";

/* ------------------------------------------------------------------ *
 * Route table — five global destinations only (no audit clutter)
 * ------------------------------------------------------------------ */
export const ROUTES = [
  { id: "today", label: "Today", desktopLabel: "Today", href: "#/", icon: "icon-today" },
  { id: "learn", label: "Learn", desktopLabel: "Learn", href: "#/learn", icon: "icon-learn" },
  { id: "practice", label: "Practice", desktopLabel: "Practice", href: "#/practice", icon: "icon-practice" },
  { id: "papers", label: "Papers", desktopLabel: "Papers", href: "#/papers", icon: "icon-papers" },
  { id: "you", label: "You", desktopLabel: "You & AI", href: "#/you", icon: "icon-you" },
];

const SUBJECTS = [
  { id: "MATH", name: "Mathematics", units: 11, qs: "40 Qs · 50 Marks", icon: "icon-math" },
  { id: "PHYS", name: "Physics", units: 15, qs: "30 Qs · 35 Marks", icon: "icon-phys" },
  { id: "CHEM", name: "Chemistry", units: 8, qs: "20 Qs · 25 Marks", icon: "icon-chem" },
  { id: "FEEE", name: "FEEE", units: 8, qs: "10 Qs · 10 Marks", icon: "icon-feee" },
];

let _activeViewCleanup = null;
let _aiTutorOpener = null;
let _rendering = false;

export function registerAiTutorOpener(fn) {
  _aiTutorOpener = fn;
}

export function openAiTutorContext(ctx = {}) {
  if (_aiTutorOpener) {
    _aiTutorOpener(ctx);
  }
}

/** Parse `location.hash` into `{ navId, view, param, query }`. */
export function parseRoute(hashStr = location.hash) {
  const raw = (hashStr || "#/").replace(/^#/, "") || "/";
  const [pathPart, queryPart = ""] = raw.split("?");
  const query = new URLSearchParams(queryPart);
  const segs = pathPart.split("/").filter(Boolean);

  if (segs.length === 0) {
    return { navId: "today", view: "today", param: null, query };
  }
  const head = segs[0];
  const param = segs[1] ? decodeURIComponent(segs[1]) : null;

  if (head === "learn") {
    return { navId: "learn", view: param ? "lesson" : "learn", param, query };
  }
  if (head === "practice") {
    return { navId: "practice", view: "practice", param, query };
  }
  if (head === "practice-run" && param) {
    return { navId: "practice", view: "practice-run", param, query };
  }
  if (head === "papers") {
    return { navId: "papers", view: param ? "paper-reader" : "papers", param, query };
  }
  if (head === "omr-print" && param) {
    return { navId: "papers", view: "omr-print", param, query };
  }
  if (head === "exam" && param) {
    return { navId: "papers", view: "exam", param, query };
  }
  if (head === "results" && param) {
    return { navId: "practice", view: "results", param, query };
  }
  if (head === "formulas") {
    return { navId: "today", view: "formulas", param: null, query };
  }
  if (head === "you") {
    return { navId: "you", view: "you", param: null, query };
  }
  return { navId: "today", view: "today", param: null, query };
}

/* ------------------------------------------------------------------ *
 * Theme controller (AMOLED dark mode persisted in IndexedDB meta)
 * ------------------------------------------------------------------ */
export function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  const toggle = $("#themeToggle");
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.title = isDark ? "Switch to Light Mode" : "Switch to AMOLED Dark Mode";
    toggle.innerHTML = isDark ? icon("icon-sun") : icon("icon-moon");
  }
}

export async function toggleTheme() {
  const meta = await getMeta();
  const next = meta.theme === "dark" ? "light" : "dark";
  await setMeta({ theme: next, updatedAt: new Date().toISOString() });
  applyTheme(next);
  return next;
}

/* ------------------------------------------------------------------ *
 * Bottom-sheet primitive (reused by OMR Palette & Codec AI Tutor)
 * ------------------------------------------------------------------ */
export function openSheet(sheet) {
  if (!sheet) return;
  const overlay = $("#sheetOverlay");
  if (overlay) {
    overlay.hidden = false;
    overlay.classList.add("is-open");
  }
  sheet.classList.add("is-open");
  sheet.setAttribute("aria-hidden", "false");
}

export function closeSheet(sheet) {
  if (!sheet) return;
  sheet.classList.remove("is-open");
  sheet.setAttribute("aria-hidden", "true");
  const anyOpen = document.querySelector(".bottom-sheet.is-open");
  if (!anyOpen) {
    const overlay = $("#sheetOverlay");
    if (overlay) overlay.classList.remove("is-open");
  }
}

export function closeAllSheets() {
  document.querySelectorAll(".bottom-sheet.is-open").forEach((s) => closeSheet(s));
}

/* ------------------------------------------------------------------ *
 * Temporary fallback views for slices under construction
 * ------------------------------------------------------------------ */
function renderTodayFallback(main) {
  main.innerHTML = "";
  const grid = el(`<section class="subject-grid" style="margin-top:1rem" aria-label="Subject mastery"></section>`);
  for (const s of SUBJECTS) {
    grid.appendChild(
      el(`
        <button class="subject-card" data-subject="${s.id}" type="button">
          <h3 class="subject-card__title">${s.name}</h3>
          <p class="subject-card__count">${s.qs} · ${s.units} units</p>
          <div class="meter" style="margin-top:.5rem"><div class="meter__fill" style="width:0%"></div></div>
          <p class="subject-card__count" style="margin-top:.4rem">0 / ${s.units} mastered</p>
        </button>
      `)
    );
  }
  main.appendChild(grid);
}

function renderPlaceholder(main, title) {
  main.innerHTML = "";
  main.appendChild(
    el(`
      <div class="view">
        <h2 style="margin:0 0 .5rem">${title}</h2>
        <p class="view__placeholder">Loading screen module…</p>
      </div>
    `)
  );
}

/* ------------------------------------------------------------------ *
 * Shell hydration
 * ------------------------------------------------------------------ */
function buildNav(navRoot) {
  navRoot.innerHTML = "";
  navRoot.appendChild(
    el(`
      <div class="bottom-nav__brand" aria-hidden="true">
        <span class="bottom-nav__brand-title">JELET Study Hub</span>
        <span class="bottom-nav__brand-sub">2028 · Target JU</span>
      </div>
    `)
  );
  for (const r of ROUTES) {
    const btn = el(`
      <button class="bottom-nav__tab" type="button" data-route="${r.id}">
        ${icon(r.icon)}<span>${r.label}</span>
      </button>
    `);
    btn.addEventListener("click", () => {
      location.hash = r.href;
    });
    navRoot.appendChild(btn);
  }
}

function setActiveShell(route) {
  const shell = $(".app-shell");
  if (shell) {
    if (route.view === "exam") shell.setAttribute("data-immersive", "exam");
    else if (route.view === "lesson") shell.setAttribute("data-immersive", "lesson");
    else shell.removeAttribute("data-immersive");
  }

  document.querySelectorAll(".bottom-nav__tab").forEach((b) => {
    if (b.dataset.route === route.navId) {
      b.setAttribute("aria-current", "page");
      b.classList.add("is-active");
    } else {
      b.removeAttribute("aria-current");
      b.classList.remove("is-active");
    }
  });

  const titleMap = {
    today: "JELET Study Hub",
    formulas: "Formula Sheet · 42 Units",
    learn: "Learn",
    lesson: `Unit ${route.param || ""}`,
    practice: "Practice",
    "practice-run": "Practice Session",
    papers: "Papers",
    "paper-reader": "Paper Booklet & Keys",
    "omr-print": "Printable OMR Sheet",
    results: "Result & Solutions",
    you: "You & AI",
  };
  const titleEl = $("#topbarTitle");
  if (titleEl) titleEl.textContent = titleMap[route.view] || "JELET Study Hub";
}

export async function render() {
  if (_rendering) return;
  _rendering = true;
  try {
    if (typeof _activeViewCleanup === "function") {
      try { _activeViewCleanup(); } catch (_) { /* ignore */ }
      _activeViewCleanup = null;
    }
    closeAllSheets();

    const route = parseRoute(location.hash);
    setActiveShell(route);
    const main = $("#appMain");

    if (route.view === "papers") {
      await renderPapersLibrary(main, { openAiTutor: openAiTutorContext });
    } else if (route.view === "paper-reader") {
      await renderPaperReader(main, route.param, { openAiTutor: openAiTutorContext });
    } else if (route.view === "today") {
      renderTodayFallback(main);
    } else {
      renderPlaceholder(main, route.view);
    }
  } finally {
    _rendering = false;
  }
}

export function setViewCleanup(fn) {
  _activeViewCleanup = fn;
}

/* ------------------------------------------------------------------ *
 * Init
 * ------------------------------------------------------------------ */
async function init() {
  buildNav($("#bottomNav"));

  $("#themeToggle").addEventListener("click", () => toggleTheme());

  $("#closeSheetBtn").addEventListener("click", () => closeSheet($("#omrSheet")));
  $("#sheetOverlay").addEventListener("click", () => closeAllSheets());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllSheets();
  });

  try {
    await openDB();
    const meta = await getMeta();
    applyTheme(meta.theme);
  } catch (err) {
    console.warn("IndexedDB unavailable — running in ephemeral light mode.", err);
    applyTheme("light");
  }

  // Cross-tab sync: only re-render on external BroadcastChannel messages, not active exam ticks
  onSync((payload) => {
    if (payload?.store === "meta") {
      getMeta().then((m) => applyTheme(m.theme)).catch(() => {});
    }
  });

  window.addEventListener("hashchange", () => render());
  await render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
