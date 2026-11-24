/**
 * you.js — JELET Study Hub (v3) · You & AI Local Vault, JU CGPA Check & Backups (`#/you`)
 * ---------------------------------------------------------------------------
 * Visual references:
 *   - `13-phone-you-ai-and-ju-hub.png` : Privacy banner, JU Target & CGPA Check,
 *                                        CodeC BYOK AI Vault, AMOLED toggle & Signed Backup
 *   - `01-settings.png`                : Saved Bookmarks & Recently Viewed activity cards,
 *                                        Offline Pack & About/Sources
 */

import { loadManifest, warmOfflineCorpus } from "../core/data-loader.js";
import { escapeHtml } from "../core/math.js";
import {
  evaluateDiplomaEligibility,
  JU_BENCHMARKS,
  formatTwelfths,
} from "../core/scoring.js";
import { computeHubSnapshot } from "../core/stats.js";
import {
  AI_PROVIDERS,
  readAiVault,
  writeAiVault,
  clearAiVault,
  maskApiKey,
  testAiConnection,
} from "../core/ai-vault.js";
import { getMeta, setMeta } from "../db/indexeddb.js";
import {
  exportBackup,
  downloadBackup,
  verifyEnvelope,
  importBackup,
} from "../db/backup.js";
import { $, el, icon, showToast } from "../core/ui.js";

export async function renderYouHub(main, { onThemeToggle } = {}) {
  main.innerHTML = `<div class="view"><p class="view__placeholder">Loading local vault…</p></div>`;

  const manifest = await loadManifest();
  let snapshot = await computeHubSnapshot(manifest);
  let meta = snapshot.meta;
  let vault = readAiVault();
  let pendingImportEnvelope = null;
  let activityDrawer = null; // "bookmarks" | "recent" | null

  const profile = {
    name: meta.profile?.name || "",
    targetYear: meta.profile?.targetYear || 2028,
    targetBranch: meta.profile?.targetBranch || "Jadavpur Univ. CSE",
    category: meta.profile?.category || "General",
    diplomaCgpa: meta.profile?.diplomaCgpa ?? "",
  };

  const root = el(`
    <div class="view stack-m you-view">
      <!-- Top Mint Privacy Lock Banner (13-phone-you-ai-and-ju-hub.png & 01-settings.png) -->
      <div class="ai-banner">
        ${icon("icon-lock")}
        <span>100% Local-First on Your Device · API key stays isolated and NEVER enters backups.</span>
      </div>

      <!-- Card 1: JU Target & Diploma CGPA Check (13-phone-you-ai-and-ju-hub.png) -->
      <section class="card stack-s">
        <h3 class="card__title" style="margin:0">JU Target &amp; Diploma CGPA Check</h3>
        <p class="card__meta">WBSCTE Diploma → WBJEEB Percentage &amp; Jadavpur University lateral-entry eligibility (§2.0 Notification).</p>

        <div class="form-grid-2">
          <label class="form-field">
            <span class="form-label">Your Name (optional)</span>
            <input type="text" class="input-field" id="profNameInput" placeholder="e.g. Pabitra" value="${escapeHtml(profile.name)}" />
          </label>
          <label class="form-field">
            <span class="form-label">Target Exam &amp; Department</span>
            <select class="input-select" id="profTargetSelect">
              ${[
                "Jadavpur Univ. CSE (2028)",
                "Jadavpur Univ. IT (2028)",
                "Jadavpur Univ. ETCE (2028)",
                "Jadavpur Univ. EE (2028)",
                "Jadavpur Univ. CSE (2027)",
                "Jadavpur Univ. Core (2028)",
              ]
                .map(
                  (opt) =>
                    `<option value="${escapeHtml(opt)}" ${profile.targetBranch === opt ? "selected" : ""}>${escapeHtml(opt)}</option>`
                )
                .join("")}
            </select>
          </label>
          <label class="form-field">
            <span class="form-label">Diploma CGPA (10-point scale)</span>
            <input type="number" step="0.01" min="4" max="10" class="input-field mono" id="profCgpaInput" placeholder="e.g. 9.35" value="${escapeHtml(profile.diplomaCgpa)}" />
          </label>
          <label class="form-field">
            <span class="form-label">Counselling Category</span>
            <select class="input-select" id="profCategorySelect">
              ${["General", "General-EWS", "OBC-A", "OBC-B", "SC", "ST", "PwD"]
                .map(
                  (c) =>
                    `<option value="${escapeHtml(c)}" ${profile.category === c ? "selected" : ""}>${escapeHtml(c)}</option>`
                )
                .join("")}
            </select>
          </label>
        </div>

        <div id="cgpaEligibilitySlot"></div>

        <details class="tiebreak-details">
          <summary>Historical JU Seat Matrix &amp; Safe Target Scores (2024–2026)</summary>
          <div class="stack-xs" style="margin-top:var(--space-s)">
            ${JU_BENCHMARKS.map(
              (b) => `
              <div class="row-between" style="flex-wrap:wrap;padding:var(--space-2xs) 0;border-bottom:1px solid var(--border-subtle)">
                <div>
                  <strong>${escapeHtml(b.branch)}</strong>
                  <div class="card__meta">${escapeHtml(b.campus)} · ~${b.seats} seats · ${escapeHtml(b.openGmr)}</div>
                </div>
                <span class="mono badge badge--brand">${escapeHtml(b.safeRangeText)}</span>
              </div>`
            ).join("")}
          </div>
        </details>
      </section>

      <!-- Card 2: CodeC BYOK AI Tutor Vault (13-phone-you-ai-and-ju-hub.png) -->
      <section class="card stack-s">
        <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
          <div>
            <h3 class="card__title" style="margin:0">Codec BYOK AI Tutor</h3>
            <p class="card__meta">Optional — Offline Corpus Tutor works without any key.</p>
          </div>
          <span class="pill" id="aiVaultStatusPill"></span>
        </div>

        <div class="mono card__meta" id="aiMaskedKeyLine"></div>

        <div class="form-grid-2">
          <label class="form-field">
            <span class="form-label">Provider</span>
            <select class="input-select" id="aiProviderSelect">
              ${Object.values(AI_PROVIDERS)
                .map(
                  (p) =>
                    `<option value="${p.id}" ${vault.provider === p.id ? "selected" : ""}>${escapeHtml(p.label)} (${escapeHtml(p.defaultModel)})</option>`
                )
                .join("")}
            </select>
          </label>
          <label class="form-field">
            <span class="form-label">Personal API Key (stored only on this device)</span>
            <input type="password" class="input-field mono" id="aiKeyInput" placeholder="Paste Gemini / Groq / OpenRouter key…" autocomplete="off" />
          </label>
        </div>

        <div class="cluster-xs">
          <button type="button" class="btn btn--primary btn--sm" id="saveAiKeyBtn">Save Key</button>
          <button type="button" class="btn btn--ghost btn--sm" id="testAiConnBtn">Test Connection</button>
          <button type="button" class="btn btn--ghost btn--sm" id="clearAiKeyBtn">Clear Key</button>
        </div>
        <div id="aiConnDiagnostic" class="card__meta"></div>

        <div class="toggle-row">
          <div>
            <strong>Preview prompt before sending</strong>
            <div class="card__meta">Inspect exact model &amp; JSON payload in Codec AI Tutor</div>
          </div>
          <button type="button" class="switch-btn" id="aiPreviewToggleBtn" role="switch" aria-checked="${Boolean(vault.previewPrompt)}">
            <span class="switch-btn__thumb"></span>
          </button>
        </div>
      </section>

      <!-- Card 3: My Activity (01-settings.png — real IndexedDB counts, 0 on fresh device) -->
      <section class="stack-xs">
        <h3 class="section-heading">My Activity</h3>
        <div class="today-subjects-grid">
          <button type="button" class="card activity-tile" id="openBookmarksTile">
            <span class="quick-action-card__icon" data-tone="brand">${icon("icon-bookmark")}</span>
            <span class="card__meta">Saved Bookmarks</span>
            <div class="row-between" style="width:100%">
              <strong class="mono stat-tile__value">${snapshot.savedBookmarks.length}</strong>
              ${icon("icon-chevron")}
            </div>
          </button>
          <button type="button" class="card activity-tile" id="openRecentTile">
            <span class="quick-action-card__icon" data-tone="phys">${icon("icon-learn")}</span>
            <span class="card__meta">Recently Studied Units</span>
            <div class="row-between" style="width:100%">
              <strong class="mono stat-tile__value">${snapshot.recentlyVisitedUnits.length}</strong>
              ${icon("icon-chevron")}
            </div>
          </button>
        </div>
        <div id="activityListSlot"></div>
      </section>

      <!-- Card 4: Preferences, Offline Pack & Signed Backup (01 + 13) -->
      <section class="card stack-s">
        <h3 class="card__title" style="margin:0">Preferences, Offline Pack &amp; Backup</h3>

        <div class="toggle-row">
          <div>
            <strong>AMOLED Dark Mode</strong>
            <div class="card__meta">Battery-saving deep dark palette for late-night phone study</div>
          </div>
          <button type="button" class="switch-btn" id="youDarkSwitchBtn" role="switch" aria-checked="${meta.theme === "dark"}">
            <span class="switch-btn__thumb"></span>
          </button>
        </div>

        <hr style="border:none;border-top:1px solid var(--border-subtle);margin:0" />

        <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
          <div>
            <strong>Offline Corpus Pack (2022–2025)</strong>
            <p class="card__meta" id="offlinePackStatusText">4 Papers · 400 Qs · 400 Solutions · 42 Units · 109 SVGs (~1.5 MB)</p>
          </div>
          <button type="button" class="btn btn--ghost btn--sm" id="warmOfflineBtn">
            ${icon("icon-download")} Cache Offline Pack
          </button>
        </div>

        <hr style="border:none;border-top:1px solid var(--border-subtle);margin:0" />

        <div class="stack-xs">
          <button type="button" class="action-list-row" id="exportBackupBtn">
            <span class="cluster-xs">${icon("icon-download")} <strong>Export Signed Backup (.json)</strong></span>
            ${icon("icon-chevron")}
          </button>

          <label class="action-list-row" for="importBackupFileInput" style="cursor:pointer">
            <span class="cluster-xs">${icon("icon-upload")} <strong>Import Signed Backup (.json)</strong></span>
            ${icon("icon-chevron")}
          </label>
          <input type="file" id="importBackupFileInput" accept="application/json,.json" hidden />
        </div>

        <div id="importPreviewSlot" hidden></div>

        <details class="tiebreak-details">
          <summary>${icon("icon-info")} About &amp; Official WBJEEB Corpus Sources</summary>
          <div class="stack-xs card__meta" style="margin-top:var(--space-s)">
            <div>• <strong>JELET 2025 Paper-I (Set A):</strong> Official Key Ref <span class="mono">JEEB/Reg-171/25</span> (100 Qs, 3 Withdrawn W)</div>
            <div>• <strong>JELET 2024 Paper-I (Set A):</strong> Official Key Ref <span class="mono">WBE/Ex-71</span> (100 Qs, 2 Withdrawn W)</div>
            <div>• <strong>JELET 2023 Paper-I (Set A):</strong> Official Key Ref <span class="mono">JEEB/Reg-267/23</span> (100 Qs, 4 Withdrawn W)</div>
            <div>• <strong>JELET 2022 Paper-I (Set A):</strong> Complete Dual-Solver + SymPy Verified Key (100 Qs, 1 Withdrawn W)</div>
            <div>• <strong>Zero Copyrighted Assets:</strong> 100% clean LaTeX transcriptions, 109 theme-adaptive SVGs, and 400 SymPy-verified solutions.</div>
          </div>
        </details>
      </section>
    </div>
  `);

  main.innerHTML = "";
  main.appendChild(root);

  function renderCgpaStatus() {
    const slot = $("#cgpaEligibilitySlot", root);
    if (profile.diplomaCgpa === "" || profile.diplomaCgpa === null) {
      slot.innerHTML = `<span class="pill">Enter your WBSCTE Diploma CGPA above to check WBJEEB % &amp; JU eligibility</span>`;
      return;
    }
    const res = evaluateDiplomaEligibility(profile.diplomaCgpa, profile.category);
    if (!res.valid) {
      slot.innerHTML = `<span class="badge badge--wrong">Enter a valid CGPA between 4.00 and 10.00</span>`;
      return;
    }
    if (res.eligible) {
      slot.innerHTML = `
        <span class="badge badge--correct">
          ${icon("icon-check")} ${res.percentage.toFixed(1)}% WBJEEB Equiv · JU Eligible (${escapeHtml(res.category)} cutoff ≥ ${res.cutoff}%)
        </span>
      `;
    } else {
      slot.innerHTML = `
        <span class="badge badge--wrong">
          ${res.percentage.toFixed(1)}% WBJEEB Equiv · Below ${escapeHtml(res.category)} JU cutoff (${res.cutoff}%)
        </span>
      `;
    }
  }

  async function saveProfilePatch(patch) {
    Object.assign(profile, patch);
    const latest = await getMeta();
    meta = await setMeta({
      ...latest,
      profile: {
        ...(latest.profile || {}),
        ...profile,
        diplomaCgpa: profile.diplomaCgpa === "" ? null : Number(profile.diplomaCgpa),
      },
      updatedAt: new Date().toISOString(),
    });
    renderCgpaStatus();
  }

  $("#profNameInput", root).addEventListener("change", (e) =>
    saveProfilePatch({ name: e.target.value.trim() })
  );
  $("#profTargetSelect", root).addEventListener("change", (e) => {
    const val = e.target.value;
    const yr = val.includes("2027") ? 2027 : 2028;
    saveProfilePatch({ targetBranch: val, targetYear: yr });
    showToast("JU target updated");
  });
  $("#profCgpaInput", root).addEventListener("input", (e) =>
    saveProfilePatch({ diplomaCgpa: e.target.value })
  );
  $("#profCategorySelect", root).addEventListener("change", (e) =>
    saveProfilePatch({ category: e.target.value })
  );

  // AI Vault UI sync
  function syncAiVaultDom() {
    vault = readAiVault();
    const hasKey = Boolean(vault.apiKey && vault.apiKey.trim());
    const pLabel = AI_PROVIDERS[vault.provider]?.label || "Google Gemini";
    const pill = $("#aiVaultStatusPill", root);
    pill.className = hasKey ? "badge badge--correct" : "pill";
    pill.textContent = hasKey ? `${pLabel} · Key Saved` : "Offline Corpus Mode";
    $("#aiMaskedKeyLine", root).textContent = `Key: ${maskApiKey(vault.apiKey)}`;
    $("#aiPreviewToggleBtn", root).setAttribute("aria-checked", String(Boolean(vault.previewPrompt)));
  }

  $("#aiProviderSelect", root).addEventListener("change", (e) => {
    const p = e.target.value;
    writeAiVault({ provider: p, model: AI_PROVIDERS[p]?.defaultModel });
    syncAiVaultDom();
  });

  $("#saveAiKeyBtn", root).addEventListener("click", () => {
    const val = $("#aiKeyInput", root).value.trim();
    if (!val) {
      showToast("Paste an API key first");
      return;
    }
    const p = $("#aiProviderSelect", root).value;
    writeAiVault({
      provider: p,
      model: AI_PROVIDERS[p]?.defaultModel,
      apiKey: val,
    });
    $("#aiKeyInput", root).value = "";
    syncAiVaultDom();
    showToast("API key saved in isolated local vault");
  });

  $("#clearAiKeyBtn", root).addEventListener("click", () => {
    clearAiVault();
    $("#aiKeyInput", root).value = "";
    $("#aiConnDiagnostic", root).textContent = "API key cleared. Offline Corpus Tutor remains active.";
    syncAiVaultDom();
    showToast("Isolated AI vault cleared");
  });

  $("#testAiConnBtn", root).addEventListener("click", async () => {
    const diag = $("#aiConnDiagnostic", root);
    const typed = $("#aiKeyInput", root).value.trim();
    const testVault = typed ? { ...readAiVault(), apiKey: typed } : readAiVault();
    diag.textContent = `Testing direct browser connection to ${AI_PROVIDERS[testVault.provider]?.label}…`;
    try {
      const res = await testAiConnection(testVault);
      diag.textContent = `✔ Connected (${res.latencyMs} ms) — zero study data sent.`;
    } catch (err) {
      diag.textContent = `✗ Connection failed: ${err.message}`;
    }
  });

  $("#aiPreviewToggleBtn", root).addEventListener("click", () => {
    const cur = readAiVault();
    writeAiVault({ previewPrompt: !cur.previewPrompt });
    syncAiVaultDom();
  });

  // Activity tiles
  function renderActivityDrawer() {
    const slot = $("#activityListSlot", root);
    slot.innerHTML = "";
    if (!activityDrawer) return;

    if (activityDrawer === "bookmarks") {
      if (!snapshot.savedBookmarks.length) {
        slot.innerHTML = `<div class="card"><p class="card__meta">0 bookmarks saved yet. Tap the bookmark ribbon on any paper, unit, or question.</p></div>`;
        return;
      }
      const list = el(`<div class="card stack-xs"></div>`);
      for (const b of snapshot.savedBookmarks) {
        const href =
          b.type === "paper"
            ? `#/papers/${encodeURIComponent(b.targetId)}`
            : b.type === "unit"
            ? `#/learn/${encodeURIComponent(b.targetId)}`
            : `#/papers`;
        list.appendChild(
          el(`
            <a href="${href}" class="action-list-row" style="text-decoration:none;color:inherit">
              <span><strong>${escapeHtml(b.label || b.targetId)}</strong> <span class="card__meta">(${escapeHtml(b.type)})</span></span>
              ${icon("icon-chevron")}
            </a>
          `)
        );
      }
      slot.appendChild(list);
    } else if (activityDrawer === "recent") {
      if (!snapshot.recentlyVisitedUnits.length) {
        slot.innerHTML = `<div class="card"><p class="card__meta">0 units visited yet. Open any unit in Learn to track revision progress.</p></div>`;
        return;
      }
      const list = el(`<div class="card stack-xs"></div>`);
      for (const u of snapshot.recentlyVisitedUnits.slice(0, 10)) {
        list.appendChild(
          el(`
            <a href="#/learn/${escapeHtml(u.unitId)}" class="action-list-row" style="text-decoration:none;color:inherit">
              <span><strong class="mono">${escapeHtml(u.unitId)}</strong> · <span class="card__meta">${escapeHtml(u.status)}</span></span>
              ${icon("icon-chevron")}
            </a>
          `)
        );
      }
      slot.appendChild(list);
    }
  }

  $("#openBookmarksTile", root).addEventListener("click", () => {
    activityDrawer = activityDrawer === "bookmarks" ? null : "bookmarks";
    renderActivityDrawer();
  });
  $("#openRecentTile", root).addEventListener("click", () => {
    activityDrawer = activityDrawer === "recent" ? null : "recent";
    renderActivityDrawer();
  });

  // AMOLED Dark Mode switch
  $("#youDarkSwitchBtn", root).addEventListener("click", async (ev) => {
    if (onThemeToggle) {
      const next = await onThemeToggle();
      ev.currentTarget.setAttribute("aria-checked", String(next === "dark"));
    }
  });

  // Opt-In Offline Corpus Pack pre-warmer
  $("#warmOfflineBtn", root).addEventListener("click", async (ev) => {
    const btn = ev.currentTarget;
    const statusText = $("#offlinePackStatusText", root);
    btn.disabled = true;
    try {
      const res = await warmOfflineCorpus((done, total) => {
        statusText.textContent = `Caching corpus locally: ${done} / ${total} files…`;
      });
      statusText.textContent = `✔ Ready offline (${res.filesCached} verified JSON & SVG files cached)`;
      showToast("Full 2022–2025 corpus cached for instant study");
    } catch (err) {
      statusText.textContent = `Offline cache error: ${err.message}`;
    } finally {
      btn.disabled = false;
    }
  });

  // Export Signed Backup
  $("#exportBackupBtn", root).addEventListener("click", async () => {
    const env = await exportBackup();
    downloadBackup(env);
    showToast("Signed backup exported (API key excluded)");
  });

  // Import Signed Backup with SHA-256 verification + Merge vs Replace confirmation
  $("#importBackupFileInput", root).addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const previewSlot = $("#importPreviewSlot", root);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const valid = await verifyEnvelope(parsed);
      if (!valid) {
        previewSlot.hidden = false;
        previewSlot.innerHTML = `<div class="exam-trap">Checksum verification failed — this backup file is corrupted or tampered with. Import refused.</div>`;
        return;
      }
      pendingImportEnvelope = parsed;
      const inc = parsed.stores || {};
      previewSlot.hidden = false;
      previewSlot.innerHTML = `
        <div class="worked-example stack-s">
          <strong>${icon("icon-check")} Verified Signed Backup (${escapeHtml(parsed.exportedAt || "")})</strong>
          <p class="card__meta">
            Contains ${(inc.attempts || []).length} attempt(s), ${(inc.unitProgress || []).length} unit record(s), and ${(inc.bookmarksNotes || []).length} bookmark/note(s).
          </p>
          <div class="cluster-xs">
            <button type="button" class="btn btn--primary btn--sm" id="confirmMergeImportBtn">Deterministic Merge (Recommended)</button>
          </div>
          <details class="tiebreak-details">
            <summary>Full Replace (Overwrites current device data)</summary>
            <div class="row-between" style="margin-top:var(--space-xs);gap:var(--space-xs)">
              <input type="text" class="input-field mono" id="replaceConfirmInput" placeholder="Type REPLACE to confirm" />
              <button type="button" class="btn btn--ghost btn--sm" id="confirmReplaceImportBtn">Replace</button>
            </div>
          </details>
        </div>
      `;

      $("#confirmMergeImportBtn", previewSlot).addEventListener("click", async () => {
        await importBackup(pendingImportEnvelope, "merge");
        showToast("Backup merged cleanly!");
        snapshot = await computeHubSnapshot(manifest);
        renderYouHub(main, { onThemeToggle });
      });

      $("#confirmReplaceImportBtn", previewSlot).addEventListener("click", async () => {
        const typed = $("#replaceConfirmInput", previewSlot).value.trim();
        if (typed !== "REPLACE") {
          showToast('Type "REPLACE" in uppercase to confirm full overwrite.');
          return;
        }
        await importBackup(pendingImportEnvelope, "replace");
        showToast("Device stores replaced from verified backup.");
        renderYouHub(main, { onThemeToggle });
      });
    } catch (err) {
      previewSlot.hidden = false;
      previewSlot.innerHTML = `<div class="exam-trap">Invalid JSON file: ${escapeHtml(err.message)}</div>`;
    }
  });

  renderCgpaStatus();
  syncAiVaultDom();
}
