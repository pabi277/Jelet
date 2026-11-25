/**
 * app.js — JELET Study Hub (v3) · Router, theme controller & shell hydration
 * ---------------------------------------------------------------------------
 * Phone-First Modern Web PWA. Hash-based router (works on any /<repo>/ subpath).
 * Five global destinations only: Today · Learn · Practice · Papers · You.
 * All state is local-first (IndexedDB `jelet_hub_v1`); metrics are honest
 * (0 and — on a fresh device) — never faked.
 */

import { openDB, getMeta, setMeta, onSync, isMemoryMode, storageStatus } from "./db/indexeddb.js";
import { initSyncEngine } from "./db/sync.js";
import { $, el, icon, showToast } from "./core/ui.js";

/**
 * Storage-availability notice. When IndexedDB is blocked/unavailable the
 * app keeps working on an in-memory session; this banner tells the user
 * their progress will not persist until storage is available again.
 */
function showStorageNotice() {
  if ($("#storageNotice")) return;
  const status = storageStatus();
  if (!isMemoryMode() && !status.quotaExceeded) return;

  const notice = el(`
    <div class="storage-notice" id="storageNotice" role="status" aria-live="polite">
      <span>${
        status.quotaExceeded
          ? "Storage is full — your recent progress may not be saved until you clear space."
          : "Storage is unavailable — running in an in-memory session. Progress will not persist across reloads."
      }</span>
      <button type="button" class="btn btn--ghost btn--sm" id="storageNoticeClose" aria-label="Dismiss storage notice">Dismiss</button>
    </div>
  `);
  document.body.insertBefore(notice, document.querySelector(".app-shell"));
  $("#storageNoticeClose")?.addEventListener("click", () => notice.remove());
}

/**
 * Register the offline Service Worker (sw.js) once the shell is ready.
 * Fails silently when SW support is missing (private mode, file://, old
 * webviews) — the app remains fully functional online without it.
 */
async function registerServiceWorker() {
  try {
    if (!("serviceWorker" in navigator)) return;
    // Only register over http(s); file:// and unusual schemes must not
    // throw or spam console errors.
    if (!/^https?:$/i.test(location.protocol)) return;
    const reg = await navigator.serviceWorker.register("./sw.js", {
      scope: "./",
    });
    // Notify when a new SW version is waiting so the user can reload.
    reg.addEventListener("updatefound", () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener("statechange", () => {
        if (nw.state === "installed" && navigator.serviceWorker.controller) {
          showToast("JELET Hub updated — reload to apply.");
        }
      });
    });
  } catch {
    /* SW registration is best-effort; never block the app */
  }
}
import { renderPapersLibrary, renderPaperReader } from "./views/papers.js";
import { renderLiveExam, renderPrintableOmr } from "./views/exam.js";
import { renderPracticeArena, renderPracticeRunner } from "./views/practice.js";
import { renderResultsView } from "./views/results.js";
import { renderLearnExplorer, renderUnitLesson, renderFormulaSheet } from "./views/learn.js";
import { renderTodayDashboard } from "./views/today.js";
import { renderYouHub } from "./views/you.js";
import { initAiTutor } from "./views/ai-tutor.js";

/* ------------------------------------------------------------------ *
 * Route table — five global destinations only (no audit clutter)
 * ------------------------------------------------------------------ */
const KNOWN_ROUTE_HEADS = new Set([
  "learn",
  "practice",
  "practice-run",
  "papers",
  "omr-print",
  "exam",
  "results",
  "formulas",
  "you",
]);

/**
 * True when the hash's first path segment is a known route head.
 * Unknown/deep-linked hashes (typos, stale links, junk) are normalized
 * to `#/` so the app never renders a blank screen.
 */
export function isKnownRouteHash(hashStr = location.hash) {
  const raw = (hashStr || "#/").replace(/^#/, "") || "/";
  const head = raw.split("?")[0].split("/").filter(Boolean)[0];
  if (!head) return true; // `#/` and bare `#` are valid (Today)
  return KNOWN_ROUTE_HEADS.has(head);
}

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
 * Fallback view
 * ------------------------------------------------------------------ */
function renderPlaceholder(main, title) {
  main.innerHTML = "";
  main.appendChild(
    el(`
      <div class="view">
        <h2 style="margin:0 0 .5rem">${title}</h2>
        <p class="view__placeholder">Route not found — <a href="#/">return to Today</a>.</p>
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
      <button class="bottom-nav__tab" type="button" data-route="${r.id}" aria-label="${r.label} section">
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
    // Normalize unknown/deep-linked hashes to Today (no blank screens).
    if (!isKnownRouteHash(location.hash)) {
      location.replace("#/");
      return;
    }
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
    } else if (route.view === "exam") {
      const cleanup = await renderLiveExam(main, route.param, { openSheet, closeSheet });
      setViewCleanup(cleanup);
    } else if (route.view === "omr-print") {
      await renderPrintableOmr(main, route.param);
    } else if (route.view === "practice") {
      await renderPracticeArena(main, route.query);
    } else if (route.view === "practice-run") {
      await renderPracticeRunner(main, route.param, { openAiTutor: openAiTutorContext });
    } else if (route.view === "results") {
      await renderResultsView(main, route.param, { openAiTutor: openAiTutorContext });
    } else if (route.view === "learn") {
      await renderLearnExplorer(main, route.query, { openAiTutor: openAiTutorContext });
    } else if (route.view === "lesson") {
      await renderUnitLesson(main, route.param, { openAiTutor: openAiTutorContext, query: route.query });
    } else if (route.view === "formulas") {
      await renderFormulaSheet(main, { openAiTutor: openAiTutorContext });
    } else if (route.view === "today") {
      const cleanup = await renderTodayDashboard(main, { openAiTutor: openAiTutorContext });
      setViewCleanup(cleanup);
    } else if (route.view === "you") {
      await renderYouHub(main, { onThemeToggle: toggleTheme, invite: route.query.get("invite") });
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

  const tutor = initAiTutor({ openOverlay: openSheet, closeAllSheets });
  registerAiTutorOpener(tutor.openTutor);

  try {
    await openDB();
    const meta = await getMeta();
    applyTheme(meta.theme);
  } catch (err) {
    console.warn("IndexedDB unavailable — running in ephemeral light mode.", err);
    applyTheme("light");
  }

  // Show the storage notice when running in the in-memory fallback.
  showStorageNotice();

  // Phase 09: optional encrypted-cloud-sync engine — queues offline
  // mutations in the outbox and flushes on reconnect (`online` event).
  initSyncEngine();

  // Cross-tab sync: only re-render on external BroadcastChannel messages, not active exam ticks
  let syncReconcileTimer = null;
  const scheduleSyncReconcile = () => {
    // A sibling tab (or this tab after sync) merged cloud state — refresh the
    // current view so tabs never diverge. Never interrupt an active runner
    // or a focused form field.
    if (syncReconcileTimer) clearTimeout(syncReconcileTimer);
    syncReconcileTimer = setTimeout(() => {
      syncReconcileTimer = null;
      const route = parseRoute(location.hash);
      if (route.view === "exam" || route.view === "practice-run") return;
      const active = document.activeElement;
      const tag = active && active.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      render();
    }, 400);
  };

  onSync((payload) => {
    if (payload?.store === "meta") {
      getMeta().then((m) => applyTheme(m.theme)).catch(() => {});
    }
    if (payload?.type === "sync-applied" || payload?.type === "replace") {
      scheduleSyncReconcile();
    }
    if (payload?.type === "quota-exceeded") {
      showStorageNotice();
      showToast("Storage quota exceeded — some progress may not have been saved.");
    }
  });

  window.addEventListener("hashchange", () => render());
  await render();

  // Offline PWA: register the Service Worker after first paint.
  registerServiceWorker();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
