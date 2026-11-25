/**
 * you.js — JELET Study Hub (v3) · You & AI Local Vault, JU CGPA Check & Backups (`#/you`)
 * ---------------------------------------------------------------------------
 * Visual references:
 *   - `13-phone-you-ai-and-ju-hub.png` : Privacy banner, JU Target & CGPA Check,
 *                                        CodeC BYOK AI Vault, AMOLED toggle & Signed Backup
 *   - `01-settings.png`                : Saved Bookmarks & Recently Viewed activity cards,
 *                                        Offline Pack & About/Sources
 */

import { mountBenchmark } from "./benchmark.js";
import { getAllAttempts } from "../core/stats.js";
import { isShareableMock } from "../core/share-result.js";

import { loadManifest, warmOfflineCorpus } from "../core/data-loader.js";
import { escapeHtml } from "../core/math.js";
import {
  evaluateDiplomaEligibility,
  JU_BENCHMARKS,
  formatTwelfths,
} from "../core/scoring.js";
import { computeHubSnapshot } from "../core/stats.js";
import { sparklineSvg } from "../core/charts.js";
import {
  AI_PROVIDERS,
  readAiVault,
  writeAiVault,
  clearAiVault,
  maskApiKey,
  resolveEffectiveModel,
  testAiConnection,
} from "../core/ai-vault.js";
import { getMeta, setMeta } from "../db/indexeddb.js";
import {
  exportBackup,
  downloadBackup,
  verifyEnvelope,
  importBackup,
} from "../db/backup.js";
import {
  getSyncStatus,
  enableSync,
  disableSync,
  syncNow,
  setSessionPassphrase,
} from "../db/sync.js";
import { $, el, icon, showToast, formatDurationClock } from "../core/ui.js";

export async function renderYouHub(main, { onThemeToggle } = {}) {
  main.innerHTML = `<div class="view"><p class="view__placeholder">Loading local vault…</p></div>`;

  const manifest = await loadManifest();
  let snapshot = await computeHubSnapshot(manifest);
  let meta = snapshot.meta;
  let vault = readAiVault();
  let pendingImportEnvelope = null;
  let activityDrawer = null; // "bookmarks" | "recent" | null

  // Migrate/preserve any previously saved dropdown or free-text target college string
  const savedTargetText =
    meta.profile?.targetBranch ||
    meta.profile?.targetCollege ||
    "Jadavpur Univ. CSE";

  const profile = {
    name: meta.profile?.name || "",
    targetYear: meta.profile?.targetYear || 2028,
    targetBranch: savedTargetText,
    category: meta.profile?.category || "General",
    diplomaCgpa: meta.profile?.diplomaCgpa ?? "",
  };

  const activeProviderCfg = AI_PROVIDERS[vault.provider] || AI_PROVIDERS.gemini;
  const readiness = snapshot.readiness || {
    minAttempts: 5,
    hasEnoughData: false,
    estimatePct: null,
    stageLabel: "Insufficient data",
    sessionCount: 0,
    totalQuestionAttempts: 0,
    totalCorrect: 0,
    averageAccuracyPct: null,
    unitsCovered: 0,
    totalUnits: 42,
    unitCoveragePct: 0,
    questionsCovered: 0,
    totalQuestions: 400,
    questionCoveragePct: 0,
    trend: "insufficient",
    trendLabel: "Need more attempts",
  };
  const trendBadgeClass =
    readiness.trend === "improving"
      ? "badge--correct"
      : readiness.trend === "declining"
      ? "badge--partial"
      : "badge--brand";

  // Mock history & trend view model (Phase 08)
  const mockHistory = snapshot.mockHistory || {
    count: 0,
    mocks: [],
    trends: { score: [], accuracy: [], timeMs: [] },
    bests: { bestScore: null, bestAccuracy: null, fastestTime: null },
    empty: true,
  };
  const mockBestIds = new Set(
    [
      mockHistory.bests.bestScore?.attemptId,
      mockHistory.bests.bestAccuracy?.attemptId,
      mockHistory.bests.fastestTime?.attemptId,
    ].filter(Boolean)
  );
  const mockDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };
  const fmtMarks = (v) => (v == null ? "—" : formatTwelfths(v * 12));
  const fmtPct = (v) => (v == null ? "—" : `${Math.round(v)}%`);
  const scoreVals = mockHistory.trends.score || [];
  const accVals = mockHistory.trends.accuracy || [];
  const timeVals = mockHistory.trends.timeMs || [];
  const latestScore = scoreVals.length ? scoreVals[scoreVals.length - 1] : null;
  const latestAcc = accVals.length ? accVals[accVals.length - 1] : null;
  const latestTime = timeVals.length ? timeVals[timeVals.length - 1] : null;

  const root = el(`
    <div class="view stack-m you-view">
      <!-- Top Mint Privacy Lock Banner (13-phone-you-ai-and-ju-hub.png & 01-settings.png) -->
      <div class="ai-banner">
        ${icon("icon-lock")}
        <span>100% Local-First on Your Device · API key stays isolated and NEVER enters backups.</span>
      </div>

      <!-- Readiness Snapshot (Phase 07 · Slice 4 — Explicitly-Labeled Estimate Only) -->
      <section class="card stack-s readiness-card" id="youReadinessSection" aria-label="Study readiness estimate">
        <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
          <div>
            <h3 class="card__title" style="margin:0">Study readiness — estimate, not a prediction of your exam score</h3>
          </div>
          ${
            readiness.hasEnoughData
              ? `<span class="badge badge--brand mono" id="readinessStageBadge">${readiness.estimatePct}% · ${escapeHtml(readiness.stageLabel)}</span>`
              : `<span class="pill mono">Min ${readiness.minAttempts} Qs</span>`
          }
        </div>
        ${
          readiness.hasEnoughData
            ? `
              <p class="card__meta" style="margin:0">
                Rough local readiness snapshot from your independent attempt history across accuracy, 42-unit breadth, 400-PYQ depth, and recent trend — never a guaranteed WBJEEB score or rank.
              </p>
              <div class="meter"><div class="meter__fill" style="width:${readiness.estimatePct}%"></div></div>
              <div class="readiness-grid" id="readinessBreakdownGrid">
                <div class="readiness-metric">
                  <span class="readiness-metric__label">Attempts</span>
                  <strong class="readiness-metric__val mono">${readiness.totalQuestionAttempts} Qs</strong>
                  <span class="card__meta">${readiness.sessionCount} independent set${readiness.sessionCount === 1 ? "" : "s"}</span>
                </div>
                <div class="readiness-metric">
                  <span class="readiness-metric__label">Avg Accuracy</span>
                  <strong class="readiness-metric__val mono">${readiness.averageAccuracyPct}%</strong>
                  <span class="card__meta">${readiness.totalCorrect}/${readiness.totalQuestionAttempts} correct</span>
                </div>
                <div class="readiness-metric">
                  <span class="readiness-metric__label">Syllabus Coverage</span>
                  <strong class="readiness-metric__val mono">${readiness.unitsCovered}/${readiness.totalUnits} units</strong>
                  <span class="card__meta">${readiness.questionsCovered}/${readiness.totalQuestions} PYQs (${readiness.questionCoveragePct}%)</span>
                </div>
                <div class="readiness-metric">
                  <span class="readiness-metric__label">Recent Trend</span>
                  <div><span class="badge ${trendBadgeClass} mono">${escapeHtml(readiness.trendLabel)}</span></div>
                  <span class="card__meta">Last independent sets</span>
                </div>
              </div>
              ${
                readiness.mockCount
                  ? `<div class="readiness-mock-line">${icon("icon-timer")} <strong>Mock performance:</strong> ${readiness.mockCount} timed mock${readiness.mockCount === 1 ? "" : "s"} · Best <strong class="mono">${readiness.mockBestTwelfths != null ? formatTwelfths(readiness.mockBestTwelfths) + " / 120" : "—"}</strong> · Avg accuracy <strong class="mono">${readiness.mockAvgAccuracyPct != null ? readiness.mockAvgAccuracyPct + "%" : "—"}</strong>${readiness.mockTrend !== "insufficient" ? ` · Mock trend ${escapeHtml(readiness.mockTrend)}` : ""}</div>`
                  : ""
              }
            `
            : `
              <div class="readiness-empty" id="readinessEmptyState">
                <p class="card__meta" style="margin:0">
                  <strong>Practice more to generate your readiness estimate</strong> (${readiness.totalQuestionAttempts}/${readiness.minAttempts} independent question attempts recorded; ${readiness.unitsCovered}/${readiness.totalUnits} units &amp; ${readiness.questionsCovered}/${readiness.totalQuestions} PYQs touched).
                </p>
                <p class="card__meta" style="margin:0">
                  What to do: complete an <strong>Independent</strong> Daily 10-Q sprint, Topic Drill, or 2-hour Timed Mock so the hub can compute local accuracy, 42-unit coverage, and recent trend.
                </p>
                <div class="cluster-xs">
                  <a href="#/practice" class="btn btn--primary btn--sm" style="text-decoration:none">${icon("icon-practice")} Open Practice Arena</a>
                  <a href="#/papers" class="btn btn--ghost btn--sm" style="text-decoration:none">${icon("icon-papers")} Browse Papers</a>
                </div>
              </div>
            `
        }
      </section>

      <!-- Mock History & Trends (Phase 08) -->
      <section class="card stack-s" id="youMockHistorySection" aria-label="Mock history and trends">
        <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
          <div>
            <h3 class="card__title" style="margin:0">Mock History</h3>
            <p class="card__meta">Timed 100-Q / 120-mark / 2-hour mocks — score, accuracy &amp; completion-time trends</p>
          </div>
          <span class="pill mono">${mockHistory.count} mock${mockHistory.count === 1 ? "" : "s"}</span>
        </div>

        ${
          mockHistory.empty
            ? `
          <div class="mock-history-empty" id="mockHistoryEmptyState">
            <div class="cluster-xs">${icon("icon-timer")} <strong>No mocks yet</strong></div>
            <p class="card__meta">Start a 2-hour timed mock from the Papers library to begin tracking your score, accuracy and completion-time trends.</p>
            <a href="#/papers" class="btn btn--primary btn--sm" style="text-decoration:none">${icon("icon-papers")} Browse Papers</a>
          </div>`
            : `
          <div class="mock-trends-grid">
            <div class="mock-trend-card">
              <div class="row-between"><strong style="font-size:var(--fs-body)">Score</strong><span class="card__meta mono">${fmtMarks(latestScore)} / 120</span></div>
              ${sparklineSvg(scoreVals, { width: 150, height: 40, ariaLabel: "Score over time" })}
              <span class="card__meta mono">Best ${fmtMarks(mockHistory.bests.bestScore?.scoreMarks)} / 120</span>
            </div>
            <div class="mock-trend-card">
              <div class="row-between"><strong style="font-size:var(--fs-body)">Accuracy</strong><span class="card__meta mono">${fmtPct(latestAcc)}</span></div>
              ${sparklineSvg(accVals, { width: 150, height: 40, stroke: "var(--fig-secondary)", fill: "var(--fig-secondary)", ariaLabel: "Accuracy over time" })}
              <span class="card__meta mono">Best ${mockHistory.bests.bestAccuracy ? mockHistory.bests.bestAccuracy.accuracyPct + "%" : "—"}</span>
            </div>
            <div class="mock-trend-card">
              <div class="row-between"><strong style="font-size:var(--fs-body)">Time taken</strong><span class="card__meta mono">${latestTime != null ? formatDurationClock(latestTime) : "—"}</span></div>
              ${sparklineSvg(timeVals, { width: 150, height: 40, stroke: "var(--fig-accent)", fill: "var(--fig-accent)", ariaLabel: "Completion time over time" })}
              <span class="card__meta mono">Fastest ${mockHistory.bests.fastestTime ? formatDurationClock(mockHistory.bests.fastestTime.elapsedMs) : "—"}</span>
            </div>
          </div>

          <div class="mock-bests-grid">
            <div class="mock-best-tile">
              <span class="card__meta">${icon("icon-trophy")} Best Score</span>
              <strong class="mono">${mockHistory.bests.bestScore ? fmtMarks(mockHistory.bests.bestScore.scoreMarks) + " / 120" : "—"}</strong>
              <span class="card__meta">${mockHistory.bests.bestScore ? mockDate(mockHistory.bests.bestScore.submittedAt) : "—"}</span>
            </div>
            <div class="mock-best-tile">
              <span class="card__meta">${icon("icon-check")} Best Accuracy</span>
              <strong class="mono">${mockHistory.bests.bestAccuracy ? mockHistory.bests.bestAccuracy.accuracyPct + "%" : "—"}</strong>
              <span class="card__meta">${mockHistory.bests.bestAccuracy ? mockDate(mockHistory.bests.bestAccuracy.submittedAt) : "—"}</span>
            </div>
            <div class="mock-best-tile">
              <span class="card__meta">${icon("icon-timer")} Fastest Completion</span>
              <strong class="mono">${mockHistory.bests.fastestTime ? formatDurationClock(mockHistory.bests.fastestTime.elapsedMs) : "—"}</strong>
              <span class="card__meta">${mockHistory.bests.fastestTime ? mockDate(mockHistory.bests.fastestTime.submittedAt) : "—"}</span>
            </div>
          </div>

          <div class="stack-xs">
            ${mockHistory.mocks
              .map(
                (m) => `
            <a class="mock-history-item" href="#/results/${escapeHtml(m.attemptId)}">
              <div class="row-between">
                <div class="cluster-xs">
                  ${mockBestIds.has(m.attemptId) ? `<span class="badge badge--correct">${icon("icon-trophy")} PB</span>` : ""}
                  <strong class="mono">${fmtMarks(m.scoreMarks)} / 120</strong>
                  <span class="badge ${m.accuracyPct >= 75 ? "badge--correct" : m.accuracyPct >= 50 ? "badge--partial" : "badge--wrong"} mono">${m.accuracyPct}%</span>
                </div>
                <span class="card__meta mono">${escapeHtml(mockDate(m.submittedAt))}</span>
              </div>
              <div class="row-between" style="margin-top:var(--space-2xs)">
                <span class="card__meta">${escapeHtml(m.title)}</span>
                <span class="card__meta mono">${m.elapsedMs != null ? formatDurationClock(m.elapsedMs) : "—"} / ${m.durationMs != null ? formatDurationClock(m.durationMs) : "—"}</span>
              </div>
            </a>`
              )
              .join("")}
          </div>`
        }
      </section>

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
            <span class="form-label">Target College &amp; Department</span>
            <input type="text" class="input-field" id="profTargetInput" placeholder="e.g. Jadavpur Univ. CSE, KGEC IT, JGEC EE…" value="${escapeHtml(profile.targetBranch)}" />
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
                    `<option value="${p.id}" ${vault.provider === p.id ? "selected" : ""}>${escapeHtml(p.label)}</option>`
                )
                .join("")}
            </select>
          </label>
          <label class="form-field">
            <span class="form-label">Model</span>
            <select class="input-select" id="aiModelModeSelect">
              <option value="default" id="aiDefaultModelOpt" ${!vault.useCustomModel ? "selected" : ""}>Default (${escapeHtml(activeProviderCfg.defaultModel)})</option>
              <option value="custom" ${vault.useCustomModel ? "selected" : ""}>Custom model</option>
            </select>
          </label>
        </div>

        <div class="form-field" id="aiCustomModelWrap" ${vault.useCustomModel ? "" : "hidden"}>
          <label class="form-label" for="aiCustomModelInput">Custom Model Name (blank falls back to provider default)</label>
          <input type="text" class="input-field mono" id="aiCustomModelInput" placeholder="e.g. gemini-2.5-pro, llama-3.1-8b-instant, deepseek/deepseek-chat…" value="${escapeHtml(vault.customModel || "")}" autocomplete="off" />
        </div>

        <label class="form-field">
          <span class="form-label">Personal API Key (stored only on this device)</span>
          <input type="password" class="input-field mono" id="aiKeyInput" placeholder="Paste Gemini / Groq / OpenRouter key…" autocomplete="off" />
        </label>

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

      <!-- Card 5: Optional Encrypted Cloud Sync (Phase 09 — opt-in, local-first default) -->
      <section class="card stack-s" id="youSyncSection" aria-label="Encrypted cloud sync">
        <div class="row-between" style="flex-wrap:wrap;gap:var(--space-xs)">
          <div>
            <h3 class="card__title" style="margin:0">${icon("icon-lock")} Encrypted Cloud Sync (optional)</h3>
            <p class="card__meta" id="syncSubtitle">Carry your study state across devices — fully offline-capable without it.</p>
          </div>
          <span class="pill" id="syncStatusPill">Off</span>
        </div>

        <div class="toggle-row">
          <div>
            <strong>Sync my study state</strong>
            <div class="card__meta" id="syncToggleHint">Sync is off — your data stays on this device.</div>
          </div>
          <button type="button" class="switch-btn" id="syncToggleBtn" role="switch" aria-checked="false" aria-label="Enable encrypted cloud sync">
            <span class="switch-btn__thumb"></span>
          </button>
        </div>

        <div id="syncConfigFields" hidden>
          <div class="form-grid-2">
            <label class="form-field">
              <span class="form-label">Sync endpoint base URL</span>
              <input type="url" class="input-field mono" id="syncBaseUrlInput" placeholder="https://your-endpoint.example/api" autocomplete="off" spellcheck="false" />
            </label>
            <label class="form-field">
              <span class="form-label">Encryption passphrase (min 8 chars · never stored)</span>
              <input type="password" class="input-field mono" id="syncPassphraseInput" placeholder="Type passphrase to encrypt/decrypt…" autocomplete="new-password" />
            </label>
          </div>

          <div class="cluster-xs">
            <button type="button" class="btn btn--primary btn--sm" id="syncSaveBtn">${icon("icon-lock")} Save &amp; Enable</button>
            <button type="button" class="btn btn--ghost btn--sm" id="syncNowBtn">${icon("icon-refresh")} Sync now</button>
            <button type="button" class="btn btn--ghost btn--sm" id="syncUnlockBtn" hidden>Unlock for this session</button>
          </div>
          <div id="syncDiagnostic" class="card__meta" aria-live="polite"></div>

          <div class="readiness-grid" id="syncStatusGrid" style="margin-top:var(--space-xs)"></div>
          <div id="syncErrorLine" class="card__meta" style="color:var(--text-muted)"></div>

          <details class="tiebreak-details">
            <summary>${icon("icon-info")} What syncs · what NEVER syncs · encryption model</summary>
            <div class="stack-xs card__meta" style="margin-top:var(--space-s)">
              <div>• <strong>Synced (study state only):</strong> sessions, attempt history, per-question stats, unit progress, bookmarks &amp; notes, profile and settings.</div>
              <div>• <strong>Never synced:</strong> your AI provider API keys — they stay in the isolated <span class="mono">jelet_ai_vault_v1</span> vault on this device and never enter IndexedDB, backups, or sync payloads.</div>
              <div>• <strong>Encryption:</strong> every payload is encrypted on this device with PBKDF2-SHA-256 (250k iterations) → AES-GCM-256 before any network request. Your passphrase lives in this tab's memory only — never written to disk. Honest standard browser crypto, not “military grade”: pick a long passphrase.</div>
              <div>• <strong>Endpoint:</strong> any provider that can store one JSON document behind <span class="mono">GET/PUT {base}/sync</span> — full contract in <span class="mono">DEPLOY.md</span>.</div>
              <div>• <strong>Merge:</strong> last-write-wins per record (newest timestamp; ties keep this device) with a merge log — unsynced local changes are never silently overwritten.</div>
            </div>
          </details>

          <details class="tiebreak-details" id="syncLogDetails" hidden>
            <summary>${icon("icon-layers")} Merge log</summary>
            <div class="stack-xs" id="syncLogBody" style="margin-top:var(--space-s)"></div>
          </details>
        </div>

        <p class="card__meta" id="syncOffNote" style="margin:0">Sync is off — your data stays on this device.</p>
      </section>
    </div>
  `);

  main.innerHTML = "";
  main.appendChild(root);
  const latestMock = (await getAllAttempts()).filter(isShareableMock)
    .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)))[0];
  await mountBenchmark(root, latestMock);

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
  $("#profTargetInput", root).addEventListener("change", (e) => {
    const val = e.target.value.trim();
    const yearMatch = val.match(/\b(202[6-9]|203[0-5])\b/);
    const yr = yearMatch ? Number(yearMatch[1]) : profile.targetYear || 2028;
    saveProfilePatch({ targetBranch: val || "Jadavpur Univ. CSE", targetYear: yr });
    showToast("Target college saved");
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
    const pCfg = AI_PROVIDERS[vault.provider] || AI_PROVIDERS.gemini;
    const effectiveModel = resolveEffectiveModel(vault);
    const pill = $("#aiVaultStatusPill", root);
    pill.className = hasKey ? "badge badge--correct" : "pill";
    pill.textContent = hasKey ? `${pCfg.label} · Key Saved` : "Offline Corpus Mode";
    $("#aiMaskedKeyLine", root).textContent = `Key: ${maskApiKey(vault.apiKey)} · Model: ${effectiveModel}`;
    const defaultOpt = $("#aiDefaultModelOpt", root);
    if (defaultOpt) {
      defaultOpt.textContent = `Default (${pCfg.defaultModel})`;
    }
    const modeSelect = $("#aiModelModeSelect", root);
    if (modeSelect) {
      modeSelect.value = vault.useCustomModel ? "custom" : "default";
    }
    const customWrap = $("#aiCustomModelWrap", root);
    if (customWrap) {
      customWrap.hidden = !vault.useCustomModel;
    }
    $("#aiPreviewToggleBtn", root).setAttribute("aria-checked", String(Boolean(vault.previewPrompt)));
  }

  function persistModelControls() {
    const p = $("#aiProviderSelect", root).value;
    const useCustomModel = $("#aiModelModeSelect", root).value === "custom";
    const customModel = $("#aiCustomModelInput", root).value.trim();
    const defaultModel = AI_PROVIDERS[p]?.defaultModel || AI_PROVIDERS.gemini.defaultModel;
    writeAiVault({
      provider: p,
      useCustomModel,
      customModel,
      model: useCustomModel ? customModel || defaultModel : defaultModel,
    });
    syncAiVaultDom();
  }

  $("#aiProviderSelect", root).addEventListener("change", () => {
    persistModelControls();
  });

  $("#aiModelModeSelect", root).addEventListener("change", () => {
    persistModelControls();
    if ($("#aiModelModeSelect", root).value === "custom") {
      $("#aiCustomModelInput", root)?.focus();
    }
  });

  $("#aiCustomModelInput", root).addEventListener("change", () => {
    persistModelControls();
    showToast("AI model preference saved");
  });

  $("#saveAiKeyBtn", root).addEventListener("click", () => {
    const val = $("#aiKeyInput", root).value.trim();
    const p = $("#aiProviderSelect", root).value;
    const useCustomModel = $("#aiModelModeSelect", root).value === "custom";
    const customModel = $("#aiCustomModelInput", root).value.trim();
    if (!AI_PROVIDERS[p]) {
      $("#aiConnDiagnostic", root).textContent = `✗ Unknown provider "${p}". Choose Google Gemini, Groq, or OpenRouter.`;
      return;
    }
    if (!val && !readAiVault().apiKey) {
      persistModelControls();
      showToast("Paste an API key first (model preference saved)");
      return;
    }
    const patch = {
      provider: p,
      useCustomModel,
      customModel,
      model: useCustomModel ? customModel || AI_PROVIDERS[p].defaultModel : AI_PROVIDERS[p].defaultModel,
    };
    if (val) patch.apiKey = val;
    writeAiVault(patch);
    $("#aiKeyInput", root).value = "";
    syncAiVaultDom();
    showToast(val ? "API key & model saved in isolated local vault" : "AI model preference saved");
  });

  $("#clearAiKeyBtn", root).addEventListener("click", () => {
    clearAiVault();
    $("#aiKeyInput", root).value = "";
    $("#aiCustomModelInput", root).value = "";
    $("#aiConnDiagnostic", root).textContent = "API key cleared. Offline Corpus Tutor remains active.";
    syncAiVaultDom();
    showToast("Isolated AI vault cleared");
  });

  $("#testAiConnBtn", root).addEventListener("click", async () => {
    const diag = $("#aiConnDiagnostic", root);
    const typed = $("#aiKeyInput", root).value.trim();
    const p = $("#aiProviderSelect", root).value;
    const useCustomModel = $("#aiModelModeSelect", root).value === "custom";
    const customModel = $("#aiCustomModelInput", root).value.trim();
    const base = readAiVault();
    const testVault = {
      ...base,
      provider: p,
      useCustomModel,
      customModel,
      apiKey: typed || base.apiKey,
    };
    diag.textContent = `Testing direct browser connection to ${AI_PROVIDERS[p]?.label || p}…`;
    try {
      const res = await testAiConnection(testVault);
      diag.textContent = `✔ Connected to ${res.model} (${res.latencyMs} ms) — zero study data sent.`;
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
    const btn = ev.currentTarget;
    if (onThemeToggle) {
      const next = await onThemeToggle();
      btn.setAttribute("aria-checked", String(next === "dark"));
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

  // ---------------------------------------------------------------- *
  // Encrypted Cloud Sync (Phase 09 — opt-in, local-first default)
  // ---------------------------------------------------------------- *
  let syncBusy = false;
  let syncFieldsRevealed = false;

  const fmtWhen = (iso) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  async function renderSyncStatus() {
    const st = await getSyncStatus();
    const pill = $("#syncStatusPill", root);
    if (!st.enabled) {
      pill.className = "pill";
      pill.textContent = "Off";
    } else if (st.locked) {
      pill.className = "badge badge--partial";
      pill.textContent = "Locked";
    } else if (st.lastError) {
      pill.className = "badge badge--wrong";
      pill.textContent = st.pending > 0 ? "Sync pending" : "Error";
    } else if (st.pending > 0) {
      pill.className = "badge badge--partial";
      pill.textContent = `Pending ${st.pending}`;
    } else {
      pill.className = "badge badge--correct";
      pill.textContent = "Up to date";
    }

    $("#syncOffNote", root).hidden = st.enabled;
    $("#syncConfigFields", root).hidden = !(st.enabled || syncFieldsRevealed);
    $("#syncToggleBtn", root).setAttribute("aria-checked", String(st.enabled));
    $("#syncToggleHint", root).textContent = st.enabled
      ? st.locked
        ? "Sync is on — enter your passphrase to unlock this session."
        : `Encrypted sync active · ${st.baseUrl || "endpoint not set"}`
      : "Sync is off — your data stays on this device.";

    const urlInput = $("#syncBaseUrlInput", root);
    if (st.baseUrl && document.activeElement !== urlInput && !urlInput.value) {
      urlInput.value = st.baseUrl;
    }
    $("#syncUnlockBtn", root).hidden = !(st.enabled && st.locked);

    const tiles = [
      {
        label: "Last synced",
        value: st.lastSyncedAt ? fmtWhen(st.lastSyncedAt) : "Never",
        sub: st.lastSyncedAt ? "" : "No successful sync yet",
      },
      {
        label: "Pending changes",
        value: String(st.pending),
        sub: st.pending > 0 ? "Queued offline — will flush on reconnect" : "Outbox empty",
      },
      {
        label: "Connection",
        value: st.online ? "Online" : "Offline",
        sub: st.online ? "Endpoint reachable check on next sync" : "Mutations queue until reconnected",
      },
      {
        label: "Session key",
        value: !st.enabled ? "—" : st.unlocked ? "Unlocked" : "Locked",
        sub: st.enabled ? "Passphrase held in memory only" : "Sync disabled",
      },
    ];
    $("#syncStatusGrid", root).innerHTML = tiles
      .map(
        (t) => `
        <div class="readiness-metric">
          <span class="readiness-metric__label">${t.label}</span>
          <strong class="readiness-metric__val mono">${escapeHtml(t.value)}</strong>
          <span class="card__meta">${escapeHtml(t.sub)}</span>
        </div>`
      )
      .join("");

    $("#syncErrorLine", root).textContent = st.lastError
      ? `Last error: ${st.lastError}`
      : "";

    const logDetails = $("#syncLogDetails", root);
    const log = st.mergeLog || [];
    logDetails.hidden = log.length === 0;
    if (log.length) {
      $("#syncLogBody", root).innerHTML = log
        .slice()
        .reverse()
        .slice(0, 20)
        .map((e) => {
          const tone =
            e.action === "took-remote" || e.action === "added-remote"
              ? "badge--brand"
              : e.action === "dropped-tombstoned"
              ? "badge--partial"
              : "badge--correct";
          return `
            <div class="row-between" style="padding:var(--space-3xs) 0;border-bottom:1px solid var(--border-subtle)">
              <span class="mono card__meta">${escapeHtml(e.store)}/${escapeHtml(String(e.key))}</span>
              <span class="badge ${tone} mono">${escapeHtml(e.action)}</span>
            </div>`;
        })
        .join("");
    }
  }

  async function runSyncNow() {
    if (syncBusy) return;
    syncBusy = true;
    const diag = $("#syncDiagnostic", root);
    const passInput = $("#syncPassphraseInput", root);
    const typed = passInput.value;
    diag.textContent = "Syncing — pull → merge → push…";
    try {
      const res = await syncNow(typed ? { passphrase: typed } : {});
      passInput.value = "";
      const n = res.stats.merged;
      diag.textContent =
        n > 0
          ? `Merged ${n} record${n === 1 ? "" : "s"} from cloud · ${res.stats.keptLocal} local record${res.stats.keptLocal === 1 ? "" : "s"} kept (newer here).`
          : "Up to date — no remote changes to merge.";
      showToast(
        n > 0
          ? `Synced — merged ${n} record${n === 1 ? "" : "s"}`
          : "Synced — up to date"
      );
    } catch (err) {
      diag.textContent = `✗ ${err.message || "Sync failed."}`;
    } finally {
      syncBusy = false;
      renderSyncStatus().catch(() => {});
    }
  }

  $("#syncToggleBtn", root).addEventListener("click", async () => {
    const st = await getSyncStatus();
    if (st.enabled) {
      try {
        await disableSync();
      } catch {
        /* ignore */
      }
      syncFieldsRevealed = false;
      $("#syncPassphraseInput", root).value = "";
      $("#syncDiagnostic", root).textContent = "";
      showToast("Sync is off — your data stays on this device.");
      renderSyncStatus();
      return;
    }
    syncFieldsRevealed = true;
    renderSyncStatus();
    $("#syncBaseUrlInput", root).focus();
  });

  $("#syncSaveBtn", root).addEventListener("click", async () => {
    if (syncBusy) return;
    const diag = $("#syncDiagnostic", root);
    try {
      await enableSync({
        baseUrl: $("#syncBaseUrlInput", root).value,
        passphrase: $("#syncPassphraseInput", root).value,
      });
      $("#syncPassphraseInput", root).value = "";
      diag.textContent = "Sync enabled — passphrase held in memory for this session.";
      showToast("Sync enabled — your study state can now sync, encrypted");
      await renderSyncStatus();
      await runSyncNow();
    } catch (err) {
      diag.textContent = `✗ ${err.message || "Could not enable sync."}`;
    }
  });

  $("#syncUnlockBtn", root).addEventListener("click", () => {
    const ok = setSessionPassphrase($("#syncPassphraseInput", root).value);
    if (!ok) {
      $("#syncDiagnostic", root).textContent =
        "✗ Enter your encryption passphrase first (min 8 characters).";
      return;
    }
    $("#syncPassphraseInput", root).value = "";
    $("#syncDiagnostic", root).textContent =
      "Unlocked for this session — the passphrase stays in memory only.";
    showToast("Sync unlocked for this session");
    renderSyncStatus();
  });

  $("#syncNowBtn", root).addEventListener("click", () => runSyncNow());

  renderSyncStatus().catch(() => {});
  renderCgpaStatus();
  syncAiVaultDom();
}
