/**
 * app.js — JELET Study Hub (v3) · Router, theme controller & shell hydration
 * ---------------------------------------------------------------------------
 * Phone-First Modern Web PWA. Hash-based router (works on any /<repo>/ subpath).
 * Five global destinations only: Today · Learn · Practice · Papers · You.
 * All state is local-first (IndexedDB `jelet_hub_v1`); metrics are honest
 * (0 and — on a fresh device) — never faked.
 */

import { openDB, getMeta, setMeta, onSync } from "./db/indexeddb.js";

/* ------------------------------------------------------------------ *
 * Route table — five global destinations only (no audit clutter)
 * ------------------------------------------------------------------ */
const ROUTES = [
  { id: "today", label: "Today", href: "#/", icon: "icon-today" },
  { id: "learn", label: "Learn", href: "#/learn", icon: "icon-learn" },
  { id: "practice", label: "Practice", href: "#/practice", icon: "icon-practice" },
  { id: "papers", label: "Papers", href: "#/papers", icon: "icon-papers" },
  { id: "you", label: "You", href: "#/you", icon: "icon-you" },
];

const SUBJECTS = [
  { id: "MATH", name: "Mathematics", units: 11, qs: "40 Qs · 50 Marks", icon: "icon-math" },
  { id: "PHYS", name: "Physics", units: 15, qs: "30 Qs · 35 Marks", icon: "icon-phys" },
  { id: "CHEM", name: "Chemistry", units: 8, qs: "20 Qs · 25 Marks", icon: "icon-chem" },
  { id: "FEEE", name: "FEEE", units: 8, qs: "10 Qs · 10 Marks", icon: "icon-feee" },
];

/* ------------------------------------------------------------------ *
 * Utilities
 * ------------------------------------------------------------------ */
const $ = (sel, root = document) => root.querySelector(sel);
const icon = (id) =>
  `<svg class="ico" aria-hidden="true"><use href="./assets/icons/icons.svg#${id}"/></svg>`;

function el(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

/** Resolve a hash to a route id. */
function currentRouteId() {
  const hash = location.hash || "#/";
  const found = ROUTES.find((r) => r.href === hash);
  return found ? found.id : "today";
}

/* ------------------------------------------------------------------ *
 * Theme controller (AMOLED dark mode persisted in IndexedDB meta)
 * ------------------------------------------------------------------ */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
  const toggle = $("#themeToggle");
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(theme === "dark"));
    toggle.querySelector(".ico").innerHTML =
      theme === "dark"
        ? `<use href="./assets/icons/icons.svg#icon-spark"/>`
        : `<use href="./assets/icons/icons.svg#icon-timer"/>`;
  }
}

async function toggleTheme() {
  const meta = await getMeta();
  const next = meta.theme === "dark" ? "light" : "dark";
  await setMeta({ theme: next });
  applyTheme(next);
}

/* ------------------------------------------------------------------ *
 * Bottom-sheet primitive
 * ------------------------------------------------------------------ */
function openSheet(sheet) {
  $("#sheetOverlay").classList.add("is-open");
  sheet.classList.add("is-open");
  sheet.setAttribute("aria-hidden", "false");
}
function closeSheet(sheet) {
  $("#sheetOverlay").classList.remove("is-open");
  sheet.classList.remove("is-open");
  sheet.setAttribute("aria-hidden", "true");
}

/* ------------------------------------------------------------------ *
 * View rendering
 * ------------------------------------------------------------------ */
function renderToday(main) {
  main.innerHTML = "";
  const hero = el(`
    <section class="hero-card">
      <p class="hero-card__eyebrow">JELET 2028 · Target JU</p>
      <h2 class="hero-card__title">Resume your JELET prep</h2>
      <div class="hero-card__meta" style="display:flex;gap:.5rem;align-items:center">
        <span class="pill" style="background:var(--hero-overlay);color:var(--on-hero)">${icon("icon-timer")} 25:00 Focus</span>
        <span class="pill" style="background:var(--hero-overlay);color:var(--on-hero)">${icon("icon-flame")} Streak 0</span>
      </div>
      <button class="btn btn--primary" type="button">${icon("icon-play")} Resume</button>
    </section>
  `);

  const quick = el(`
    <section style="display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;margin-top:1rem">
      <button class="card" type="button" style="text-align:center;font-weight:600">${icon("icon-spark")}<br>AI Doubt</button>
      <button class="card" type="button" style="text-align:center;font-weight:600">${icon("icon-formula")}<br>Formulas</button>
      <button class="card" type="button" style="text-align:center;font-weight:600">${icon("icon-timer")}<br>Daily 10-Q</button>
    </section>
  `);

  const queue = el(`
    <section class="card" style="margin-top:1rem;display:flex;justify-content:space-between;align-items:center">
      <strong>${icon("icon-practice")} Mistake Queue</strong>
      <span class="pill">0 Questions due today ›</span>
    </section>
  `);

  const grid = el(`
    <section class="subject-grid" style="margin-top:1rem" aria-label="Subject mastery"></section>
  `);
  const gridRoot = $(".subject-grid", grid);
  for (const s of SUBJECTS) {
    gridRoot.appendChild(
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

  main.append(hero, quick, queue, grid);
}

function renderPlaceholder(main, routeId) {
  const titles = { learn: "Learn — 42 Units", practice: "Practice Arena", papers: "Papers Library", you: "You & AI" };
  main.innerHTML = "";
  main.appendChild(
    el(`
      <div class="view">
        <h2 style="margin:0 0 .5rem">${titles[routeId] || "JELET Study Hub"}</h2>
        <p class="view__placeholder">This screen is wired into the Phase 01 app shell. Full content lands in the corresponding later phase, with all metrics computed from IndexedDB (honest 0 / — on a fresh device).</p>
        <button class="btn btn--ghost" type="button" id="openSheetDemo">${icon("icon-download")} Open OMR bottom-sheet demo</button>
      </div>
    `)
  );
  const demo = $("#openSheetDemo", main);
  if (demo) demo.addEventListener("click", () => openSheet($("#omrSheet")));
}

/* ------------------------------------------------------------------ *
 * Shell hydration
 * ------------------------------------------------------------------ */
function buildNav(navRoot) {
  navRoot.innerHTML = "";
  for (const r of ROUTES) {
    const btn = el(`
      <button class="bottom-nav__tab" type="button" data-route="${r.id}" aria-current="page">
        ${icon(r.icon)}<span>${r.label}</span>
      </button>
    `);
    btn.addEventListener("click", () => {
      location.hash = r.href;
    });
    navRoot.appendChild(btn);
  }
}

function setActiveNav(routeId) {
  document.querySelectorAll(".bottom-nav__tab").forEach((b) => {
    if (b.dataset.route === routeId) {
      b.setAttribute("aria-current", "page");
      b.classList.add("is-active");
    } else {
      b.removeAttribute("aria-current");
      b.classList.remove("is-active");
    }
  });
  const titleMap = { today: "Today", learn: "Learn", practice: "Practice", papers: "Papers", you: "You & AI" };
  $("#topbarTitle").textContent = titleMap[routeId] || "JELET Study Hub";
}

async function render() {
  const routeId = currentRouteId();
  setActiveNav(routeId);
  const main = $("#appMain");
  if (routeId === "today") renderToday(main);
  else renderPlaceholder(main, routeId);
}

/* ------------------------------------------------------------------ *
 * OMR palette demo grid (100 sequential cells)
 * ------------------------------------------------------------------ */
function buildOmrGrid() {
  const grid = $("#omrGrid");
  if (!grid) return;
  grid.innerHTML = "";
  for (let i = 1; i <= 100; i++) {
    const cell = el(`<button class="omr-cell" type="button" data-q="${i}">${i}</button>`);
    cell.addEventListener("click", () => {
      const answered = cell.dataset.state === "answered";
      cell.dataset.state = answered ? "unanswered" : "answered";
      if (answered) delete cell.dataset.state;
    });
    grid.appendChild(cell);
  }
}

/* ------------------------------------------------------------------ *
 * Init
 * ------------------------------------------------------------------ */
async function init() {
  buildNav($("#bottomNav"));
  buildOmrGrid();

  // Wire theme toggle
  $("#themeToggle").addEventListener("click", toggleTheme);

  // Wire sheet dismiss
  $("#closeSheetBtn").addEventListener("click", () => closeSheet($("#omrSheet")));
  $("#sheetOverlay").addEventListener("click", () => closeSheet($("#omrSheet")));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSheet($("#omrSheet"));
  });

  // Hydrate theme from IndexedDB, then render
  try {
    await openDB();
    const meta = await getMeta();
    applyTheme(meta.theme);
  } catch (err) {
    console.warn("IndexedDB unavailable — running in ephemeral light mode.", err);
    applyTheme("light");
  }

  // Cross-tab sync: re-render when another tab mutates shared state
  onSync(() => render());

  window.addEventListener("hashchange", render);
  await render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
