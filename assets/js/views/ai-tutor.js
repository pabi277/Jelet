/**
 * ai-tutor.js — JELET Study Hub (v3) · Scoped, Corpus-Grounded Codec AI Tutor
 * ---------------------------------------------------------------------------
 * Visual references:
 *   - `12-phone-codec-ai-tutor.png`         : 82dvh Bottom Sheet, context card,
 *                                             "Check prompt before sending", chips, composer
 *   - `10-codec-ai-tutor-and-results.png`   : Desktop right-hand grounded tutor panel
 *   - `docs/04-CODEC-AI-TUTOR-SPEC.md`      : Isolated BYOK vault, one-time welcome agreement,
 *                                             byte-exact prompt preview, AbortController,
 *                                             and hard Timed Mock integrity lock.
 */

import {
  loadManifest,
  loadUnit,
  loadAllUnits,
  loadSolutionForQuestion,
  getQuestionIndex,
} from "../core/data-loader.js";
import { renderPureLatex, escapeHtml, stripLatexForSearch } from "../core/math.js";
import { formatTwelfths, scoreQuestion, isVoidedQuestion } from "../core/scoring.js";
import {
  AI_PROVIDERS,
  resolveEffectiveModel,
  WELCOME_VERSION,
  readAiVault,
  writeAiVault,
  selectAiKey,
  buildGroundTruthSystemPrompt,
  buildAiRequestPayload,
  withAiRequestKey,
} from "../core/ai-vault.js";
import { $, el, icon, showToast } from "../core/ui.js";
import { sendGovernedAiRequest, loadGovernor } from "../core/ai-governor-runtime.js";
import { PROVIDER_LIMITS, estimateTokens } from "../core/ai-governor.js";
import { normalizeTutorContext, tutorContextKey } from "../core/tutor-context.js";
import { getQuestionStatsMap } from "../core/stats.js";
import {
  sessionTitle,
  sessionContext,
  upsertSession,
  deleteSession,
  clearHistory,
  listSessions,
  loadAiHistory,
  persistAiHistory,
} from "../db/ai-history.js";

/**
 * Synthesize an immediate, 100%-corpus-grounded tutor response offline
 * when no BYOK key is configured (or when user selects Corpus Verified mode).
 */
export async function buildOfflineCorpusReply({ context = {}, userPrompt, languageMode } = {}) {
  const q = context.question || null;
  const sol = q ? context.solution || (await loadSolutionForQuestion(q)) : null;
  const unit =
    context.unit ||
    (q?.unitId ? await loadUnit(q.unitId).catch(() => null) : null);
  const formula = context.formula || null;
  const promptLower = String(userPrompt || "").toLowerCase();
  const wantBengali =
    languageMode === "Bengali" ||
    promptLower.includes("bengali") ||
    promptLower.includes("বাংলা");

  // 1. Question-grounded Tutor
  if (q) {
    if (promptLower.includes("similar") && promptLower.includes("pyq")) {
      const relatedId = (unit?.pyqIds || []).find(id => id !== q.id);
      const related = relatedId ? (await getQuestionIndex()).get(relatedId) : null;
      if (related) return [`**Related PYQ (${related.year} Q${related.qNumber}, ${related.unitId}):**`, related.stemLatex,
        ...(related.options || []).map(option => `${option.id}) ${option.latex}`)].join("\n\n");
      return "No other verified PYQ is available for this unit in the offline corpus.";
    }
    const keyStr = (q.key?.correct || []).join(", ");
    const selected = context.selected || [];
    const sc =
      context.scoreResult ||
      (selected.length ? scoreQuestion(q, selected) : null);
    if (!wantBengali && (languageMode === "Hinglish" || languageMode === "Simple English")) {
      const hinglish = languageMode === "Hinglish";
      const answer = isVoidedQuestion(q)
        ? (hinglish ? `Yeh question board ne withdraw kiya hai. Sabko +${q.category === 2 ? "2.00" : "1.00"} marks milte hain.` : `The board withdrew this question. Everyone gets +${q.category === 2 ? "2.00" : "1.00"} marks.`)
        : (hinglish ? `Official answer: **(${keyStr})**. Apna answer isi se compare karo.` : `The official answer is **(${keyStr})**. Compare your choice with this key.`);
      const score = selected.length && sc && !isVoidedQuestion(q)
        ? (hinglish ? `Aapka choice: **(${selected.join(", ")})**. Result: ${sc.outcome}; marks: ${formatTwelfths(sc.twelfths)}.` : `You chose **(${selected.join(", ")})**. Result: ${sc.outcome}; marks: ${formatTwelfths(sc.twelfths)}.`) : "";
      const steps = (sol?.steps || []).map(s => `**${hinglish ? "Step" : "Step"} ${s.stepNumber} (${s.title}):** ${s.bodyLatex}`).join("\n\n");
      return [answer, score, sol?.conceptSummary ? `**${hinglish ? "Idea" : "Main idea"}:** ${sol.conceptSummary}` : "", steps,
        hinglish ? "Verified corpus ka maths aur solution English mein diya hai." : "The verified corpus steps and maths remain in English."].filter(Boolean).join("\n\n");
    }
    const stepsMd = (sol?.steps || [])
      .map(
        (s) =>
          `**${wantBengali ? `ধাপ ${s.stepNumber}` : `Step ${s.stepNumber}`} (${s.title}):** ${s.bodyLatex}`
      )
      .join("\n\n");

    const unitTraps = (unit?.wbjeebTraps || []).slice(0, 2);

    if (isVoidedQuestion(q)) {
      return [
        wantBengali
          ? `**বোর্ড কর্তৃক প্রত্যাহারকৃত প্রশ্ন (Withdrawn 'W'):** সরকারি বিজ্ঞপ্তি (${q.key?.sourceRef || "WBJEEB"}) অনুযায়ী এই প্রশ্নে সকল পরীক্ষার্থীকে পূর্ণ **+${q.category === 2 ? "2.00" : "1.00"} নম্বর** দেওয়া হয়েছে।`
          : `**Board-Voided Question ('W'):** Per official WBJEEB key (${q.key?.sourceRef || "Final Key"}), every candidate receives full **+${q.category === 2 ? "2.00" : "1.00"} marks** regardless of selection.`,
        sol?.conceptSummary ? `**Concept:** ${sol.conceptSummary}` : "",
        stepsMd,
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    // Mistake diagnosis
    let diagnosisLine = "";
    if (selected.length) {
      if (sc?.outcome === "correct") {
        diagnosisLine = wantBengali
          ? `✔ **তোমার উত্তর (${selected.join(", ")}) সম্পূর্ণ সঠিক!** (+${formatTwelfths(sc.twelfths)} নম্বর)`
          : `✔ **Your selection (${selected.join(", ")}) matches the official WBJEEB key (${keyStr})!** (+${formatTwelfths(sc.twelfths)} marks)`;
      } else if (sc?.outcome === "partial") {
        const missing = (q.key?.correct || []).filter((id) => !selected.includes(id));
        diagnosisLine = wantBengali
          ? `◐ **আংশিক নম্বর (+${formatTwelfths(sc.twelfths)} / +2.00):** তুমি **(${selected.join(", ")})** বেছে নিয়েছিলে এবং কোনো ভুল অপশন দাওনি, কিন্তু সঠিক অপশন **(${missing.join(", ")})** বাদ পড়েছে। Category-II নিয়ম: $+2 \\times \\frac{c}{C}$।`
          : `◐ **Partial Credit (+${formatTwelfths(sc.twelfths)} / +2.00):** You selected **(${selected.join(", ")})** with zero wrong options, missing **(${missing.join(", ")})**. Under WBJEEB Category-II rules ($+2 \\times c/C$), avoiding wrong bubbles saved your partial marks!`;
      } else {
        const penaltyNote =
          q.category === 2
            ? "Category-II awards **0 marks** whenever even one incorrect option is bubbled (though 0 negative penalty)."
            : "Category-I deducts **-0.25 marks** for an incorrect or multi-bubbled response.";
        diagnosisLine = wantBengali
          ? `✗ **ভুল অপশন বিশ্লেষণ:** তুমি **(${selected.join(", ")})** বেছে নিয়েছিলে, কিন্তু সরকারি সঠিক উত্তর হলো **(${keyStr})**।`
          : `✗ **Mistake Diagnosis:** You selected **(${selected.join(", ")})**, whereas the verified key is **(${keyStr})**. ${penaltyNote}`;
      }
    } else {
      diagnosisLine = wantBengali
        ? `**সরকারি সঠিক উত্তর:** **(${keyStr})** · একক: **${q.unitId}**`
        : `**Verified Answer Key:** **(${keyStr})** · Syllabus Unit **${q.unitId}** (${q.key?.sourceRef || "SymPy Verified"})`;
    }

    if (promptLower.includes("shortcut") || promptLower.includes("intuition") || promptLower.includes("trap")) {
      const relevantFormulas = (unit?.keyFormulas || unit?.formulas || [])
        .slice(0, 2)
        .map((f) => `• **${f.label}:** ${f.latex}`)
        .join("\n");
      return [
        diagnosisLine,
        sol?.conceptSummary
          ? `**${wantBengali ? "মূল ধারণা (Core Intuition)" : "Core Intuition"}:** ${sol.conceptSummary}`
          : "",
        relevantFormulas
          ? `**${wantBengali ? "প্রয়োজনীয় সূত্র" : "Key Unit Formulas"} (${q.unitId}):**\n${relevantFormulas}`
          : "",
        unitTraps.length
          ? `**${wantBengali ? "WBJEEB পরীক্ষার ফাঁদ" : "WBJEEB Exam Traps"}:**\n${unitTraps.map((t) => `• ${t}`).join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    return [
      diagnosisLine,
      sol?.conceptSummary
        ? `**${wantBengali ? "মূল ধারণা" : "Core Concept"}:** ${sol.conceptSummary}`
        : "",
      stepsMd,
      sol?.verification?.note
        ? `*SymPy Verification:* ${sol.verification.note}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  // 2. Unit / Formula grounded Tutor
  if (unit) {
    if (formula) {
      return [
        wantBengali
          ? `**সূত্র বিশ্লেষণ (${unit.unitId} · ${formula.label}):**`
          : `**Formula Breakdown (${unit.unitId} · ${formula.label}):**`,
        formula.latex,
        formula.notes ? `**Key Condition:** ${formula.notes}` : "",
        formula.aiExplainContext ? `**Study Focus:** ${formula.aiExplainContext}` : "",
        (unit.wbjeebTraps || [])[0]
          ? `**Watch This WBJEEB Trap:** ${unit.wbjeebTraps[0]}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    const topFormulas = (unit.keyFormulas || unit.formulas || [])
      .slice(0, 3)
      .map((f) => `• **${f.label}:** ${f.latex}`)
      .join("\n");
    const topTraps = (unit.wbjeebTraps || [])
      .slice(0, 2)
      .map((t) => `• ${t}`)
      .join("\n");
    return [
      `**${unit.unitId} (${unit.officialCode}) — ${unit.title}**`,
      unit.overviewLatex || "",
      topFormulas ? `**High-Yield Formulas:**\n${topFormulas}` : "",
      topTraps ? `**Common WBJEEB Traps:**\n${topTraps}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  // 3. General Corpus Search across all 42 units & 400 PYQs!
  const units = await loadAllUnits();
  const qIndex = await getQuestionIndex();
  const tokens = stripLatexForSearch(userPrompt)
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  let bestUnit = null;
  let bestScore = 0;
  for (const u of units) {
    const hay = [
      u.unitId,
      u.title,
      u.overviewLatex,
      ...(u.keyFormulas || u.formulas || []).map((f) => `${f.label} ${f.notes || ""}`),
      ...(u.wbjeebTraps || []),
    ]
      .join(" ")
      .toLowerCase();
    let sc = 0;
    for (const tok of tokens) {
      if (hay.includes(tok)) sc += 2;
    }
    if (promptLower.includes(u.unitId.toLowerCase())) sc += 10;
    if (sc > bestScore) {
      bestScore = sc;
      bestUnit = u;
    }
  }

  if (bestUnit && bestScore > 0) {
    const fList = (bestUnit.keyFormulas || bestUnit.formulas || [])
      .slice(0, 3)
      .map((f) => `• **${f.label}:** ${f.latex}`)
      .join("\n");
    const pyqCount = (bestUnit.pyqIds || []).length;
    const sampleQId = (bestUnit.pyqIds || [])[0];
    const sampleQ = sampleQId ? qIndex.get(sampleQId) : null;
    return [
      `**Matched Syllabus Unit: ${bestUnit.unitId} — ${bestUnit.title}** (${pyqCount} verified PYQs in 2022–2025)`,
      bestUnit.overviewLatex || "",
      fList ? `**Core Formulas:**\n${fList}` : "",
      (bestUnit.wbjeebTraps || [])[0]
        ? `**WBJEEB Trap:** ${bestUnit.wbjeebTraps[0]}`
        : "",
      sampleQ
        ? `*Related PYQ (${sampleQ.year} Q${sampleQ.qNumber}):* ${sampleQ.stemLatex}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return [
    "**Corpus-Grounded Tutor Ready (42 Units · 400 Verified PYQs):**",
    "Ask about any JELET syllabus topic (e.g. *Cayley-Hamilton*, *Thevenin*, *Bernoulli*, *pH buffer*, *L'Hospital*) or open **Codec AI Tutor** directly from any PYQ or Unit Formula for step-by-step SymPy-verified derivations.",
    "Want open-ended conversational AI in English or বাংলা? Add your optional free-tier Gemini / Groq / OpenRouter key in **You & AI**.",
  ].join("\n\n");
}

/** Format model prose without interpreting model-supplied HTML. Math is kept
 * separate from markdown so emphasis never mutates KaTeX-generated markup. */
function renderTutorInline(value) {
  const source = String(value || "");
  const tokens = /\$\$[\s\S]+?\$\$|\$(?:\\.|[^$\\])+\$|\\\([\s\S]+?\\\)|`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*/g;
  let result = "", last = 0, match;
  while ((match = tokens.exec(source))) {
    result += escapeHtml(source.slice(last, match.index));
    const part = match[0];
    if (part.startsWith("$$")) result += renderPureLatex(part.slice(2, -2), true);
    else if (part.startsWith("$")) result += renderPureLatex(part.slice(1, -1));
    else if (part.startsWith("\\(")) result += renderPureLatex(part.slice(2, -2));
    else if (part.startsWith("`")) result += `<code>${escapeHtml(part.slice(1, -1))}</code>`;
    else if (part.startsWith("**")) result += `<strong>${renderTutorInline(part.slice(2, -2))}</strong>`;
    else result += `<em>${renderTutorInline(part.slice(1, -1))}</em>`;
    last = tokens.lastIndex;
  }
  return result + escapeHtml(source.slice(last));
}

/** Safe lightweight Markdown + KaTeX, including multi-line display math. */
export function renderTutorBubbleHtml(markdownLike) {
  const lines = String(markdownLike || "").replace(/\r\n?/g, "\n").split("\n");
  const html = [], paragraph = [];
  let list = null;
  function flushParagraph() {
    if (paragraph.length) html.push(`<div class="ai-msg-para">${paragraph.map(renderTutorInline).join("<br>")}</div>`);
    paragraph.length = 0;
  }
  function closeList() { if (list) { html.push(`</${list}>`); list = null; } }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], trimmed = line.trim();
    if (!trimmed) { flushParagraph(); closeList(); continue; }
    const display = trimmed.startsWith("$$") ? ["$$", "$$"] : trimmed.startsWith("\\[") ? ["\\[", "\\]"] : null;
    if (display) {
      flushParagraph(); closeList();
      let math = trimmed.slice(display[0].length), end = math.indexOf(display[1]);
      while (end < 0 && i + 1 < lines.length) { math += `\n${lines[++i]}`; end = math.indexOf(display[1]); }
      if (end >= 0) {
        html.push(renderPureLatex(math.slice(0, end), true));
        const trailing = math.slice(end + display[1].length).trim();
        if (trailing) paragraph.push(trailing);
      } else paragraph.push(display[0] + math);
      continue;
    }
    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (heading) { flushParagraph(); closeList(); html.push(`<div class="ai-msg-heading">${renderTutorInline(heading[2])}</div>`); continue; }
    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { flushParagraph(); closeList(); html.push('<hr class="ai-msg-divider">'); continue; }
    const item = /^(?:([-*+])\s+|(\d+)\.\s+)(.+)$/.exec(trimmed);
    if (item) {
      flushParagraph();
      const type = item[2] ? "ol" : "ul";
      if (list !== type) { closeList(); list = type; html.push(`<${type} class="ai-msg-list">`); }
      html.push(`<li>${renderTutorInline(item[3])}</li>`);
      continue;
    }
    closeList(); paragraph.push(line);
  }
  flushParagraph(); closeList();
  return html.join("");
}

export function initAiTutor({ openOverlay, closeAllSheets }) {
  const sheet = document.getElementById("aiSheet");
  const body = document.getElementById("aiSheetBody");
  const modeBadge = document.getElementById("aiSheetModeBadge");
  const closeBtn = document.getElementById("closeAiSheetBtn");

  let activeContext = {};
  let chatHistory = []; // [{ role: "user"|"assistant", text: string, source: string }]
  let activeAbortController = null;
  let exchangeId = 0;
  let offlineRequested = false;
  let composerDraft = "";
  let requestState = null;
  let retryText = "";
  let opener = null;
  let pendingWelcomeAction = null;
  let historyOpen = false; // history panel visibility (Gap C)
  let activeHistoryKey = null; // tutorContextKey for the open conversation
  let thinking = false; // show the "thinking" bubble while a reply is being produced
  let streaming = null; // partial live text for the current exchange
  let typing = null; // in-progress typewriter reveal { text, source, tokens, idx, wordsPerTick, timer }
  let suggestionsOpen = false; // compact by default; expand when needed

  /**
   * Persist the current conversation into the device-local aiHistory record.
   * Best-effort: a storage failure must never break the tutor.
   */
  async function persistCurrentSession() {
    if (!activeHistoryKey) return;
    const snapshot = {
      key: activeHistoryKey, title: sessionTitle(activeContext),
      context: sessionContext(activeContext), messages: chatHistory.map(message => ({ ...message })),
    };
    try {
      const record = await loadAiHistory();
      const next = upsertSession(record, snapshot);
      await persistAiHistory(next);
    } catch {
      /* history persistence is best-effort */
    }
  }

  function renderRequestState() {
    const slot = $("#aiRequestState", body);
    if (!slot) return;
    if (!requestState) { slot.hidden = true; slot.textContent = ""; delete slot.dataset.kind; renderComposerState(); return; }
    slot.hidden = false;
    const kind = requestState.kind;
    let message = "";
    if (kind === "pacing" || kind === "retry") {
      const seconds = Math.ceil(requestState.retryInMs / 1000);
      const left = Math.ceil(requestState.remainingMs / 1000);
      message = kind === "pacing" ? `Free-tier pacing — next ask in ${seconds}s · Offline Corpus at ${left}s`
        : `Retrying in ${seconds}s · falls back to Offline Corpus at ${left}s`;
    } else if (kind === "switching-key") message = `Switching to ${requestState.label} after a key or quota error…`;
    else if (kind === "daily-warn") message = `Approximately ${requestState.remaining} free asks left today.`;
    else if (kind === "daily-quota") message = "Free daily quota used up — resets at midnight · Offline Corpus answers today.";
    else if (kind === "auth") message = requestState.provider === "nvidia"
      ? "Key looks invalid or expired — NVIDIA free nvapi keys expire after 6 months; renew at build.nvidia.com."
      : "Key looks invalid or expired — check your key in You & AI.";
    else if (kind === "storage") message = "Device quota storage is unavailable — Offline Corpus answer shown. Enable browser storage to use live AI safely.";
    else if (kind === "locked") message = "Encrypted key is locked — unlock it in You & AI. Offline Corpus is available.";
    else if (kind === "bad-request") message = "The provider rejected this request — check your model in AI settings.";
    else if (kind === "not-found") message = "The model or endpoint is unavailable — check the model and provider in AI settings.";
    else if (kind === "window-expired") message = "Recovery window expired — Offline Corpus answer shown.";
    else if (kind === "offline") message = "Offline Corpus selected.";
    else message = requestState.provider === "nvidia"
      ? "Could not reach NVIDIA — a browser CORS restriction or network problem may be blocking the request. Your key was not verified; Offline Corpus is available."
      : "Could not reach the provider — Offline answer shown.";
    const waiting = kind === "pacing" || kind === "retry";
    if (slot.dataset.kind === kind && slot.querySelector("[data-state-message]")) {
      slot.querySelector("[data-state-message]").textContent = message;
      renderComposerState();
      return;
    }
    slot.dataset.kind = kind;
    const showSettings = !waiting && kind !== "daily-warn" && kind !== "offline";
    slot.innerHTML = `<span data-state-message>${escapeHtml(message)}</span>${waiting ? '<button type="button" class="btn btn--ghost btn--sm" data-use-offline>Use Offline Corpus now</button>' : ''}${showSettings ? '<a href="#/you" data-ai-settings>AI settings →</a>' : ''}${["network", "server", "window-expired"].includes(kind) ? '<button type="button" class="btn btn--ghost btn--sm" data-retry>Retry</button>' : ''}`;
    $("[data-use-offline]", slot)?.addEventListener("click", () => { offlineRequested = true; activeAbortController?.abort(); });
    $("[data-ai-settings]", slot)?.addEventListener("click", () => closeTutor());
    $("[data-retry]", slot)?.addEventListener("click", () => { if (retryText) void handleAsk(retryText); });
    renderComposerState();
  }

  // Both the live builder and the preview use exactly the same grounding inputs.
  function currentSystemPrompt(vault) {
    const q = activeContext.question || null;
    return buildGroundTruthSystemPrompt({
      question: q, solution: activeContext.solution, unit: activeContext.unit || null,
      formula: activeContext.formula || null,
      paperTitle: activeContext.paperTitle || (q ? `JELET ${q.year}` : ""),
      studentSelected: activeContext.selected || [],
      studentOutcome: activeContext.scoreResult?.outcome || null,
      studentScoreText: activeContext.scoreResult
        ? formatTwelfths(activeContext.scoreResult.twelfths, { signed: true }) : "",
      languageMode: vault.preferredLanguage || "English",
      origin: activeContext.origin, sectionHeading: activeContext.section,
    });
  }

  function updatePreview(built = null) {
    const slot = $("#aiPreviewSlot", body);
    const vault = readAiVault();
    let details = $(".ai-prompt-preview", body);
    if (slot && vault.previewPrompt && !details) {
      slot.innerHTML = `<details class="tiebreak-details ai-prompt-preview" hidden>
        <summary></summary><div class="stack-xs" style="margin-top:var(--space-xs)">
        <div class="row-between"><span class="card__meta mono ai-preview-endpoint"></span><button type="button" class="btn btn--ghost btn--sm" id="copyPromptJsonBtn">Copy JSON</button></div>
        <pre class="ai-prompt-pre mono" id="promptJsonPre"></pre></div></details>`;
      details = $(".ai-prompt-preview", slot);
      $("#copyPromptJsonBtn", slot).addEventListener("click", async () => {
        try { await navigator.clipboard.writeText($("#promptJsonPre", slot)?.textContent || ""); showToast("Exact request JSON copied"); }
        catch { showToast("Prompt JSON ready above"); }
      });
    }
    if (slot && !vault.previewPrompt) { slot.innerHTML = ""; details = null; }
    const pre = $("#promptJsonPre", body);
    const input = $("#aiComposerInput", body);
    const draft = input?.value || "";
    const sysPrompt = currentSystemPrompt(vault);
    const hint = $("#aiTokenHint", body);
    if (hint && vault.apiKey?.trim()) {
      const tokens = estimateTokens(sysPrompt) + chatHistory.reduce((n, m) => n + estimateTokens(m.text), 0) + estimateTokens(draft);
      hint.textContent = `~${tokens} tokens this ask`;
      // Refresh this device's actual current rolling-window count best-effort.
      void loadGovernor().then(record => {
        if (!hint.isConnected) return;
        const now = Date.now();
        const sends = record?.providers?.[vault.provider]?.sends;
        const used = Array.isArray(sends) ? sends.filter(t => Number.isFinite(t) && t > now - 60000 && t <= now).length : 0;
        const left = PROVIDER_LIMITS[vault.provider] ? Math.max(0, PROVIDER_LIMITS[vault.provider].rpm - used) : null;
        if (left !== null) hint.textContent = `~${tokens} tokens this ask · ${left} left before pacing`;
      }).catch(() => {});
    }
    if (!pre || !details) return;
    const pInfo = AI_PROVIDERS[built?.provider || vault.provider] || AI_PROVIDERS.gemini;
    if (built || !activeAbortController) {
      $("summary", details).textContent = `Check prompt before sending (${built?.providerLabel || pInfo.label} · ${built?.model || resolveEffectiveModel(vault)})`;
      $(".ai-preview-endpoint", details).textContent = pInfo.endpointHint;
    }
    if (built) {
      details.hidden = false;
      pre.textContent = built.bodyString;
      return;
    }
    // Do not replace the preview of an in-flight POST with a new unsent draft.
    if (activeAbortController || thinking) return;
    details.hidden = !draft.trim();
    if (!draft.trim()) return;
    try {
      pre.textContent = buildAiRequestPayload({ vault, systemPrompt: sysPrompt,
        history: chatHistory.map(m => ({ role: m.role, text: m.text })), userMessage: draft, stream: true }).bodyString;
    } catch { /* offline mode remains available */ }
  }

  function renderWelcome() {
    const slot = $("#aiWelcomeSlot", body);
    if (!slot) return;
    if (!pendingWelcomeAction) { slot.innerHTML = ""; return; }
    const provider = AI_PROVIDERS[readAiVault().provider] || AI_PROVIDERS.gemini;
    slot.innerHTML = `
      <div class="worked-example stack-xs">
        <strong>Before you ask (${escapeHtml(provider.label)} BYOK)</strong>
        <div class="card__meta">• Your saved key and message go to <strong>${escapeHtml(provider.label)}</strong>. NVIDIA may use the optional local-only relay if you started it on this device; otherwise requests go directly from your browser.</div>
        <div class="card__meta">• Only this question context and your message are sent — never your mock history or CGPA.</div>
        <div class="card__meta">• AI can still slip on algebra — the <strong>Official WBJEEB Key &amp; Verified Solution</strong> always win.</div>
        <div class="cluster-xs" style="margin-top:var(--space-2xs)">
          <button type="button" class="btn btn--ghost btn--sm" id="cancelWelcomeBtn">Use Offline Mode</button>
          <button type="button" class="btn btn--primary btn--sm" id="acceptWelcomeBtn">Got it, send</button>
        </div>
      </div>`;
    $("#cancelWelcomeBtn", slot).addEventListener("click", () => {
      const message = pendingWelcomeAction; pendingWelcomeAction = null; renderWelcome();
      void handleAsk(message, { forceOfflineFirst: true });
    });
    $("#acceptWelcomeBtn", slot).addEventListener("click", () => {
      writeAiVault({ acceptedWelcomeVersion: WELCOME_VERSION });
      const message = pendingWelcomeAction; pendingWelcomeAction = null; renderWelcome();
      void handleAsk(message);
    });
  }

  function showThinking() {
    const thread = $("#aiChatThread", body);
    if (!thread) return;
    const follow = nearThreadBottom(thread);
    thread.appendChild(el(`<div class="ai-msg ai-msg--assistant ai-msg--thinking"><div class="ai-msg__meta">${icon("icon-spark")} Codec Tutor</div><div class="ai-msg__bubble"><span class="ai-visually-hidden" role="status">Tutor is preparing a reply.</span><span class="ai-thinking-dots" aria-hidden="true"><span></span><span></span><span></span></span></div></div>`));
    if (follow) thread.scrollTop = thread.scrollHeight;
    renderComposerState();
  }

  /** Relative-time label for a stored session's updatedAt. */
  function relativeTime(iso) {
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return "";
    const diff = Date.now() - t;
    const min = Math.round(diff / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min} min ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr} hr ago`;
    const day = Math.round(hr / 24);
    if (day < 7) return `${day} d ago`;
    return new Date(t).toLocaleDateString();
  }

  function escapeAttr(s) {
    return String(s ?? "").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  /** True when the user prefers no motion (typewriter collapses to instant). */
  function prefersReducedMotion() {
    try {
      return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  }

  function clearThinking() {
    thinking = false;
  }

  /** Stop any in-progress typewriter (discards the partial reveal). */
  function cancelTyping() {
    if (typing && typing.timer) clearInterval(typing.timer);
    typing = null;
  }

  /** Commit the in-progress typewriter to chat history WITHOUT re-rendering. */
  function commitTyping() {
    if (!typing) return;
    const { text, source, truncated } = typing;
    if (typing.timer) clearInterval(typing.timer);
    typing = null;
    chatHistory.push({ role: "assistant", text, source, ...(truncated ? { truncated: true } : {}) });
    void persistCurrentSession();
  }

  function nearThreadBottom(thread) {
    return !thread || thread.scrollHeight <= thread.clientHeight ||
      (thread.scrollTop + thread.clientHeight) / thread.scrollHeight >= 0.9;
  }

  /** A typewriter tick updates only the current bubble, never the composer. */
  function updateTypingBubble() {
    if (!typing) return;
    const thread = $("#aiChatThread", body);
    const bubble = $(".ai-msg--typing .ai-msg__bubble", thread || body);
    if (!thread || !bubble) return;
    const follow = nearThreadBottom(thread);
    bubble.innerHTML = `${renderTutorBubbleHtml(typing.tokens.slice(0, typing.idx).join(""))}<span class="ai-typing-cursor" aria-hidden="true"></span>`;
    if (follow) thread.scrollTop = thread.scrollHeight;
    const latest = $("#aiJumpLatest", body);
    if (latest) latest.hidden = nearThreadBottom(thread);
  }

  function messageNode(msg) {
    const item = el(`
      <div class="ai-msg ai-msg--${msg.role}">
        <div class="ai-msg__meta">${msg.role === "user" ? "You" : `${icon("icon-spark")} ${escapeHtml(msg.source || "Codec Tutor")} <button type="button" class="btn btn--ghost btn--sm ai-copy-reply">Copy</button><button type="button" class="btn btn--ghost btn--sm ai-regenerate-reply">Regenerate</button>`}</div>
        <div class="ai-msg__bubble">${msg.role === "user" ? escapeHtml(msg.text) : renderTutorBubbleHtml(msg.text)}${msg.truncated ? '<button type="button" class="chip ai-continue-chip">Continue ▸</button>' : ''}</div>
      </div>`);
    item.querySelector(".ai-copy-reply")?.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(msg.text); showToast("Answer copied"); }
      catch { showToast("Could not copy answer"); }
    });
    item.querySelector(".ai-regenerate-reply")?.addEventListener("click", () => {
      const index = chatHistory.indexOf(msg);
      const previous = chatHistory.slice(0, index).reverse().find(turn => turn.role === "user");
      if (previous) void handleAsk(previous.text);
    });
    item.querySelector(".ai-continue-chip")?.addEventListener("click", () => {
      void handleAsk("Continue the previous answer exactly where it stopped, without repeating it.", { continueFrom: msg });
    });
    return item;
  }

  function renderComposerState() {
    const button = $("#aiSendBtn", body);
    if (button) {
      button.textContent = activeAbortController?.signal.aborted ? "Stopping…" : activeAbortController ? "Stop" : "Send";
      button.disabled = Boolean(activeAbortController?.signal.aborted);
    }
    const keyChoice = $("#aiChatKeyChoice", body);
    if (keyChoice) keyChoice.disabled = Boolean(thinking || typing || activeAbortController);
    const suggestions = $(".ai-suggestions", body);
    if (suggestions) suggestions.hidden = Boolean(thinking || typing || activeAbortController);
    const row = $("#aiChipsRow", body);
    if (row) row.hidden = !suggestionsOpen || Boolean(thinking || typing || activeAbortController);
    const input = $("#aiComposerInput", body);
    if (input) input.disabled = Boolean(activeAbortController && ["pacing", "retry"].includes(requestState?.kind));
    const toggle = $("#aiSuggestionsToggle", body);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(suggestionsOpen));
      const chevron = $(".ai-suggestions-chev", toggle);
      if (chevron) chevron.textContent = suggestionsOpen ? "▾" : "▸";
    }
  }

  function appendMessage(msg, replacing = null) {
    const thread = $("#aiChatThread", body);
    if (!thread) return;
    const follow = nearThreadBottom(thread);
    const node = messageNode(msg);
    $("#aiThreadWelcome", thread)?.remove();
    if (replacing && replacing.parentElement === thread) replacing.replaceWith(node);
    else thread.appendChild(node);
    if (follow) thread.scrollTop = thread.scrollHeight;
    const latest = $("#aiJumpLatest", body);
    if (latest) latest.hidden = nearThreadBottom(thread);
  }

  function showLiveText(text, source) {
    const thread = $("#aiChatThread", body);
    if (!thread) return;
    const follow = nearThreadBottom(thread);
    let node = $(".ai-msg--streaming", thread);
    if (!node) {
      node = el(`<div class="ai-msg ai-msg--assistant ai-msg--streaming" aria-live="off" aria-label="Tutor is composing a reply"><div class="ai-msg__meta">${icon("icon-spark")} ${escapeHtml(source)}</div><div class="ai-msg__bubble"></div></div>`);
      const thinkingNode = $(".ai-msg--thinking", thread);
      if (thinkingNode) thinkingNode.replaceWith(node); else thread.appendChild(node);
    }
    streaming = {text, source};
    $(".ai-msg__bubble", node).innerHTML = renderTutorBubbleHtml(text);
    if (follow) thread.scrollTop = thread.scrollHeight;
    const latest = $("#aiJumpLatest", body);
    if (latest) latest.hidden = nearThreadBottom(thread);
  }
  function saveInterruptedLive() {
    if (streaming?.text) {
      chatHistory.push({role:"assistant", text:streaming.text, source:"Live response · stopped", truncated:true});
      void persistCurrentSession();
    }
    streaming = null;
    $(".ai-msg--streaming", body)?.remove();
  }

  /** Finish without replacing the composer, even while history is open. */
  function finalizeTyping() {
    if (!typing) return;
    const current = $(".ai-msg--typing", body);
    commitTyping();
    clearThinking();
    suggestionsOpen = false;
    appendMessage(chatHistory[chatHistory.length - 1], current);
    renderComposerState();
    updatePreview();
  }

  /** Reveal words into just one bubble; all sibling nodes remain mounted. */
  function startTyping(text, source, { truncated = false } = {}) {
    clearThinking();
    cancelTyping();
    const fullText = String(text ?? "");
    const thinkingNode = $(".ai-msg--thinking", body);
    if (!fullText) { thinkingNode?.remove(); renderComposerState(); return; }
    if (prefersReducedMotion()) {
      const msg = { role: "assistant", text: fullText, source: source || "", ...(truncated ? { truncated: true } : {}) };
      chatHistory.push(msg);
      suggestionsOpen = false;
      appendMessage(msg, thinkingNode);
      renderComposerState();
      renderRequestState();
      updatePreview();
      void persistCurrentSession();
      return;
    }
    const tokens = fullText.match(/\S+\s*|\s+/g) || [fullText];
    const wordsPerTick = Math.max(1, Math.round(tokens.length / 30));
    const state = { text: fullText, source: source || "", truncated, tokens, idx: 0, wordsPerTick, timer: null };
    typing = state;
    const thread = $("#aiChatThread", body);
    if (thread) {
      const follow = nearThreadBottom(thread);
      const tItem = el(`<div class="ai-msg ai-msg--assistant ai-msg--typing" aria-live="off" aria-label="Tutor is composing a reply"><div class="ai-msg__meta">${icon("icon-spark")} ${escapeHtml(state.source || "Codec Tutor")}</div><div class="ai-msg__bubble"><span class="ai-typing-cursor" aria-hidden="true"></span></div></div>`);
      if (thinkingNode) thinkingNode.replaceWith(tItem); else thread.appendChild(tItem);
      if (follow) thread.scrollTop = thread.scrollHeight;
    }
    renderComposerState();
    renderRequestState();
    state.timer = setInterval(() => {
      state.idx += state.wordsPerTick;
      if (state.idx >= state.tokens.length) {
        clearInterval(state.timer);
        state.timer = null;
        finalizeTyping();
        return;
      }
      typing = state;
      updateTypingBubble();
    }, 22);
  }

  /* ------------------------------------------------------------------ *
   * Keyboard fit — keep the AI sheet above the on-screen keyboard.
   * `dvh` alone is inconsistent across mobile browsers; `visualViewport`
   * gives the reliable visible height, so we size the sheet to it while open
   * (phone/tablet bottom-sheet layout only; the desktop panel is untouched).
   * ------------------------------------------------------------------ */
  let _keyboardFitHandler = null;

  function fitSheetForKeyboard() {
    if (!sheet) return;
    if (typeof window === "undefined" || !window.visualViewport) return;
    if (typeof window.matchMedia === "function" && window.matchMedia("(min-width: 1024px)").matches) return;
    const vv = window.visualViewport;
    const h = Math.round(vv.height);
    if (h > 0) {
      sheet.style.height = `${h}px`;
      sheet.style.maxHeight = "none";
      sheet.classList.add("ai-sheet--keyboard");
    }
  }

  function startKeyboardFit() {
    if (typeof window === "undefined" || !window.visualViewport) return;
    fitSheetForKeyboard();
    if (_keyboardFitHandler) return;
    _keyboardFitHandler = () => {
      const threadEl = document.getElementById("aiChatThread");
      const follow = nearThreadBottom(threadEl);
      fitSheetForKeyboard();
      if (threadEl && follow) threadEl.scrollTop = threadEl.scrollHeight;
    };
    window.visualViewport.addEventListener("resize", _keyboardFitHandler);
    window.visualViewport.addEventListener("scroll", _keyboardFitHandler);
  }

  function stopKeyboardFit() {
    if (_keyboardFitHandler && window.visualViewport) {
      window.visualViewport.removeEventListener("resize", _keyboardFitHandler);
      window.visualViewport.removeEventListener("scroll", _keyboardFitHandler);
      _keyboardFitHandler = null;
    }
    if (sheet) {
      sheet.style.height = "";
      sheet.style.maxHeight = "";
      sheet.classList.remove("ai-sheet--keyboard");
    }
  }

  /** Build the history-panel HTML (replaces the chat thread while open). */
  async function buildHistoryPanel() {
    const record = await loadAiHistory();
    const sessions = listSessions(record);
    let rowsHtml;
    if (!sessions.length) {
      rowsHtml = `<div class="ai-history-empty">No past conversations yet — ask about any question or unit and it will be remembered here (stored only on this device).</div>`;
    } else {
      rowsHtml = sessions
        .map((s) => {
          const msgs = Array.isArray(s.messages) ? s.messages : [];
          const snippet = msgs.length
            ? String(msgs[msgs.length - 1].text || "").replace(/\s+/g, " ").slice(0, 80)
            : "";
          return `
            <div class="ai-history-row" data-key="${escapeAttr(s.key)}">
              <button type="button" class="ai-history-row__main">
                <span class="ai-history-row__title">${escapeHtml(s.title)}</span>
                <span class="ai-history-row__snippet">${escapeHtml(snippet)}</span>
              </button>
              <span class="ai-history-row__time">${escapeHtml(relativeTime(s.updatedAt))}</span>
              <button type="button" class="ai-history-row__del" data-del="${escapeAttr(s.key)}" aria-label="Delete conversation">×</button>
            </div>`;
        })
        .join("");
    }
    return `
      <div class="ai-history-panel">
        <label class="form-field"><span class="form-label">Search conversations</span><input id="aiHistorySearch" class="input-field" type="search" autocomplete="off" placeholder="Search history" /></label>
        <div class="row-between" style="gap:var(--space-xs)">
          <strong class="ai-context-card__title">Conversation history</strong>
          <button type="button" class="btn btn--ghost btn--sm" id="aiHistoryNewBtn">${icon("icon-refresh")} New chat</button>
        </div>
        <div class="ai-history-list">${rowsHtml}<div class="ai-history-empty" id="aiHistoryNoMatch" hidden>No matching conversations.</div></div>
        <p class="card__meta">Stored only on this device · never synced · API keys never included.</p>
        <button type="button" class="btn btn--ghost btn--sm" id="aiHistoryClearAllBtn">Clear all history</button>
      </div>`;
  }

  let historyLayer = null;
  function closeHistoryDrawer({ returnFocus = true } = {}) {
    historyOpen = false;
    historyBtn?.setAttribute("aria-expanded", "false");
    sheet?.classList.remove("ai-history-open");
    const closingLayer = historyLayer;
    historyLayer = null;
    if (closingLayer) {
      if (prefersReducedMotion()) closingLayer.remove();
      else {
        closingLayer.classList.add("is-closing");
        closingLayer.setAttribute("aria-hidden", "true");
        closingLayer.inert = true;
        const remove = () => closingLayer.remove();
        closingLayer.querySelector(".ai-history-drawer")?.addEventListener("animationend", remove, { once: true });
        setTimeout(remove, 300);
      }
    }
    if (returnFocus && sheet?.classList.contains("is-open")) historyBtn?.focus();
  }

  async function refreshHistoryDrawer(query = "") {
    const html = await buildHistoryPanel();
    if (!historyOpen || !historyLayer) return;
    const dialog = $(".ai-history-drawer", historyLayer);
    dialog.innerHTML = html;
    const search = $("#aiHistorySearch", dialog);
    search.value = query;
    const filter = () => {
      const term = search.value.trim().toLocaleLowerCase();
      const rows = [...dialog.querySelectorAll(".ai-history-row")];
      let visible = 0;
      for (const row of rows) {
        const match = row.querySelector(".ai-history-row__main").textContent.toLocaleLowerCase().includes(term);
        row.hidden = !match;
        if (match) visible++;
      }
      $("#aiHistoryNoMatch", dialog).hidden = !term || visible > 0;
    };
    search.addEventListener("input", filter);
    filter();
    dialog.querySelectorAll(".ai-history-row").forEach(row => {
      row.querySelector(".ai-history-row__main")?.addEventListener("click", async () => {
        const key = row.dataset.key;
        closeHistoryDrawer({ returnFocus: false });
        await openStoredSession(key);
      });
      row.querySelector("[data-del]")?.addEventListener("click", async () => {
        const record = await loadAiHistory();
        await persistAiHistory(deleteSession(record, row.dataset.key));
        await refreshHistoryDrawer(search.value);
      });
    });
    $("#aiHistoryNewBtn", dialog)?.addEventListener("click", () => {
      closeHistoryDrawer({ returnFocus: false });
      void newConversation();
    });
    $("#aiHistoryClearAllBtn", dialog)?.addEventListener("click", async () => {
      await persistAiHistory(clearHistory());
      await refreshHistoryDrawer(search.value);
    });
    search.focus();
  }

  async function openHistoryDrawer() {
    if (historyOpen) return;
    sheet.querySelectorAll(".ai-history-layer.is-closing").forEach(layer => layer.remove());
    historyOpen = true;
    historyBtn?.setAttribute("aria-expanded", "true");
    sheet.classList.add("ai-history-open");
    historyLayer = el(`<div class="ai-history-layer"><button type="button" class="ai-history-scrim" aria-label="Close conversation history" tabindex="-1"></button><aside id="aiHistoryDrawer" class="ai-history-drawer" role="dialog" aria-modal="true" aria-label="Conversation history"></aside></div>`);
    sheet.appendChild(historyLayer);
    $(".ai-history-scrim", historyLayer).addEventListener("click", () => closeHistoryDrawer());
    await refreshHistoryDrawer();
  }

  /** Find a formula by id across a unit's sections/notes keyFormulas. */
  function findFormula(unit, formulaId) {
    if (!unit || !formulaId) return null;
    const pools = [...(unit.sections || []), ...(unit.notes || [])];
    for (const pool of pools) {
      const f = (pool.keyFormulas || []).find((kf) => kf.formulaId === formulaId);
      if (f) return f;
    }
    return null;
  }

  /** Rehydrate a stored session's context by id and reopen it (Gap C). */
  async function openStoredSession(key) {
    try {
      const record = await loadAiHistory();
      const session = record.sessions && record.sessions[key];
      if (!session) return;
      const ctx = { ...(session.context || {}) };
      ctx.selected = Array.isArray(ctx.selected) ? ctx.selected.slice() : [];
      ctx.studentOutcome = ctx.studentOutcome || null;
      if (ctx.studentOutcome) {
        ctx.scoreResult = { outcome: ctx.studentOutcome };
      }
      // Re-fetch the full objects by id (never stored).
      if (ctx.questionId) {
        const q = (await getQuestionIndex()).get(ctx.questionId);
        if (q) {
          ctx.question = q;
          if (ctx.unitId) ctx.unit = await loadUnit(ctx.unitId).catch(() => null);
          ctx.solution = await loadSolutionForQuestion(q).catch(() => null);
        }
      }
      if (ctx.unitId && !ctx.unit) {
        ctx.unit = await loadUnit(ctx.unitId).catch(() => null);
      }
      if (ctx.formulaId && ctx.unit) {
        ctx.formula = findFormula(ctx.unit, ctx.formulaId);
      }
      // openTutor recomputes the same key and restores the stored messages.
      await openTutor(ctx);
    } catch {
      /* rehydration is best-effort */
    }
  }

  /** New chat: clear the current session's messages, then seed a fresh thread. */
  async function newConversation() {
    exchangeId++;
    activeAbortController?.abort();
    streaming = null;
    $(".ai-msg--streaming", body)?.remove();
    cancelTyping();
    clearThinking();
    activeAbortController = null;
    if (activeHistoryKey) {
      try {
        const record = await loadAiHistory();
        await persistAiHistory(deleteSession(record, activeHistoryKey));
      } catch {
        /* best-effort */
      }
    }
    chatHistory = [];
    requestState = null;
    retryText = "";
    composerDraft = "";
    const input = $("#aiComposerInput", body);
    if (input) input.value = "";
    pendingWelcomeAction = null;
    historyOpen = false;
    suggestionsOpen = false;
    const thread = $("#aiChatThread", body);
    if (thread) {
      thread.innerHTML = `<div class="ai-empty" id="aiThreadWelcome"><strong>What would you<br>like to learn?</strong><p>Grounded in verified JELET material</p></div>`;
    }
    renderRequestState();
    renderWelcome();
    renderComposerState();
    updatePreview();
    if (activeContext.mode === "formula" && activeContext.formula) {
      await handleAsk(`Explain ${activeContext.formula.label} step by step`, { forceOfflineFirst: true });
    } else if (activeContext.question) {
      const hasWrong =
        activeContext.selected?.length &&
        activeContext.scoreResult &&
        activeContext.scoreResult.outcome !== "correct";
      await handleAsk(
        hasWrong ? "Why was my option wrong?" : "Show verified step-by-step breakdown",
        { forceOfflineFirst: true }
      );
    }
  }

  function closeTutor({ closeOverlay = true, restoreFocus = true } = {}) {
    closeHistoryDrawer({ returnFocus: false });
    exchangeId++;
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
    // Finalize any in-progress typewriter, then persist the conversation
    // (best-effort) before the sheet closes.
    commitTyping();
    saveInterruptedLive();
    clearThinking();
    void persistCurrentSession();
    stopKeyboardFit();
    if (closeOverlay) closeAllSheets({ skipTutor: true });
    if (restoreFocus && opener?.isConnected && typeof opener.focus === "function") opener.focus();
    opener = null;
  }

  // Capture Escape before the generic sheet handler so cancellation and focus
  // return go through the tutor's own cleanup path.
  document.addEventListener("keydown", (event) => {
    if (!sheet?.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (historyOpen) closeHistoryDrawer();
      else closeTutor();
      return;
    }
    if (event.key !== "Tab") return;
    if (!historyOpen && sheet.dataset.pinned === "true" && matchMedia("(min-width: 1024px)").matches) return;
    const focusRoot = historyOpen ? $(".ai-history-drawer", historyLayer) : sheet;
    const focusable = [...focusRoot.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], summary, [tabindex]:not([tabindex="-1"])')]
      .filter(node => node.getClientRects().length && !node.closest('[hidden], [inert], [aria-hidden="true"]'));
    if (!focusable.length) { event.preventDefault(); return; }
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !focusRoot.contains(document.activeElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !focusRoot.contains(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  }, true);

  function refreshVaultForOpenSheet() {
    if (!sheet?.classList.contains("is-open")) return;
    const vault = readAiVault();
    const byok = Boolean(vault.apiKey?.trim());
    const provider = AI_PROVIDERS[vault.provider] || AI_PROVIDERS.gemini;
    if (modeBadge) {
      modeBadge.className = "ai-header-status";
      modeBadge.textContent = vault.keyLocked ? "Key locked · Offline" : byok ? `${provider.label} · BYOK` : "Corpus Tutor · Offline";
    }
    const keyChoice = $("#aiChatKeyChoice", body);
    if (keyChoice) {
      keyChoice.setAttribute("aria-label", `Choose API key for ${provider.label}`);
      const keys = vault.vaultKeys.filter(k => k.provider === vault.provider);
      keyChoice.innerHTML = `<option value="auto">Auto · ${escapeHtml(keys.find(k => k.id === vault.keySelection?.[vault.provider])?.label || keys[0]?.label || provider.label)}</option>` + keys.map(k => `<option value="${escapeHtml(k.id)}">${escapeHtml(k.label)} · ${escapeHtml(provider.label)}</option>`).join("");
      keyChoice.value = vault.keyModes?.[vault.provider] === "manual" && keys.some(k => k.id === vault.keySelection?.[vault.provider]) ? vault.keySelection[vault.provider] : "auto";
    }
    const hint = $("#aiTokenHint", body);
    if (hint && !byok) hint.textContent = "0 tokens · offline corpus";
    updatePreview();
  }
  window.addEventListener("jelet-ai-vault-change", refreshVaultForOpenSheet);
  window.addEventListener("storage", event => { if (event.key === "jelet_ai_vault_v1") refreshVaultForOpenSheet(); });

  closeBtn?.addEventListener("click", () => closeTutor());
  const pinBtn = document.getElementById("aiPinBtn");
  pinBtn?.addEventListener("click", () => {
    const pinned = sheet.dataset.pinned !== "true";
    sheet.dataset.pinned = String(pinned);
    pinBtn.setAttribute("aria-pressed", String(pinned));
    sheet.setAttribute("aria-modal", String(!pinned));
    pinBtn.textContent = pinned ? "Unpin" : "Pin";
    const overlay = document.getElementById("sheetOverlay");
    if (overlay && matchMedia("(min-width: 1024px)").matches) overlay.classList.toggle("is-open", !pinned);
  });
  let swipeStart = null;
  const handle = sheet?.querySelector(".bottom-sheet__handle");
  handle?.addEventListener("pointerdown", event => {
    if (event.pointerType === "touch" && !matchMedia("(min-width: 1024px)").matches) {
      swipeStart = event.clientY;
      handle.setPointerCapture(event.pointerId);
    }
  });
  handle?.addEventListener("pointerup", event => {
    if (swipeStart !== null && event.clientY - swipeStart > 80) closeTutor();
    swipeStart = null;
  });
  handle?.addEventListener("pointercancel", () => { swipeStart = null; });

  // History panel toggle (Gap C) — button lives in the static sheet header.
  const historyBtn = document.getElementById("aiHistoryBtn");
  historyBtn?.addEventListener("click", async () => {
    if (historyOpen) closeHistoryDrawer();
    else await openHistoryDrawer();
  });

  async function openTutor(ctx = {}) {
    // Hard Timed-Mock Integrity Lock (docs/04 §6)
    if (location.hash.startsWith("#/exam/")) {
      showToast("Codec AI Tutor is locked during Timed Mock Exams.");
      return;
    }

    if (!sheet.classList.contains("is-open")) opener = document.activeElement;
    exchangeId++;
    activeAbortController?.abort();
    activeAbortController = null;

    // Preserve the completed text of a previous conversation before switching.
    saveInterruptedLive();
    if (typing) commitTyping();
    cancelTyping();
    clearThinking();

    // Canonical context: accept both caller naming styles forever (Bug A fix).
    activeContext = normalizeTutorContext(ctx);
    if (activeContext.question && !activeContext.solution) {
      activeContext.solution = await loadSolutionForQuestion(activeContext.question);
    }
    if (activeContext.question && !activeContext.unit && activeContext.question.unitId) {
      activeContext.unit = await loadUnit(activeContext.question.unitId).catch(() => null);
    }

    // History (Gap C): restore a prior conversation for this exact context.
    activeHistoryKey = tutorContextKey(activeContext);
    closeHistoryDrawer({ returnFocus: false });
    requestState = null;
    retryText = "";
    pendingWelcomeAction = null;
    let restored = false;
    try {
      const record = await loadAiHistory();
      const stored = record.sessions && record.sessions[activeHistoryKey];
      if (stored && Array.isArray(stored.messages) && stored.messages.length) {
        chatHistory = stored.messages.map((m) => ({
          role: m.role,
          text: m.text,
          source: m.source || "",
          ...(m.truncated ? { truncated: true } : {}),
        }));
        restored = true;
      } else {
        chatHistory = [];
      }
    } catch {
      chatHistory = [];
    }

    // Auto-seed only for genuinely new threads; restore never duplicates it.
    suggestionsOpen = false;
    openOverlay(sheet);
    if (sheet.dataset.pinned === "true" && matchMedia("(min-width: 1024px)").matches) document.getElementById("sheetOverlay")?.classList.remove("is-open");
    startKeyboardFit();
    await renderTutorBody();
    $("#aiComposerInput", body)?.focus({ preventScroll: true });

    if (!restored) {
      // Auto-seed initial helpful context summary if opened on a specific question or formula!
      if (activeContext.mode === "formula" && activeContext.formula) {
        await handleAsk(`Explain ${activeContext.formula.label} step by step`, { forceOfflineFirst: true });
      } else if (activeContext.question) {
        const hasWrong =
          activeContext.selected?.length &&
          activeContext.scoreResult &&
          activeContext.scoreResult.outcome !== "correct";
        await handleAsk(
          hasWrong ? "Why was my option wrong?" : "Show verified step-by-step breakdown",
          { forceOfflineFirst: true }
        );
      }
    }
  }

  async function renderTutorBody(draftMessage = "") {
    const vault = readAiVault();
    const byokActive = Boolean(vault.apiKey && vault.apiKey.trim());
    const pInfo = AI_PROVIDERS[vault.provider] || AI_PROVIDERS.gemini;

    if (modeBadge) {
      modeBadge.className = "ai-header-status";
      modeBadge.textContent = vault.keyLocked ? "Key locked · Offline" : byokActive
        ? `${pInfo.label} · BYOK`
        : "Corpus Tutor · Offline";
    }

    const q = activeContext.question || null;
    const u = activeContext.unit || null;
    const f = activeContext.formula || null;

    let contextTitle = "All 42 JELET Syllabus Units & 400 PYQs";
    let contextMeta = "Grounded in verified 2022–2025 WBJEEB keys & SymPy solutions";
    if (q) {
      const selStr = activeContext.selected?.length
        ? `Your choice: (${activeContext.selected.join(", ")})`
        : "Reviewing question";
      contextTitle = `JELET ${q.year || ""} · Q${q.qNumber} · Unit ${q.unitId} (Cat-${q.category === 2 ? "II" : "I"})`;
      contextMeta = `Official Key: (${(q.key?.correct || []).join(", ")}) · ${selStr}`;
    } else if (u && f) {
      contextTitle = `Unit ${u.unitId} · ${f.label}`;
      contextMeta = `${u.title} (${u.officialCode})`;
    } else if (u) {
      contextTitle = `Unit ${u.unitId} · ${u.title}`;
      contextMeta = `Official Section ${u.officialCode} · ${(u.pyqIds || []).length} PYQs`;
    }

    // Section/page context (Gap B): where the student opened the tutor from.
    if (activeContext.origin) {
      contextMeta += ` · From ${activeContext.origin}`;
      if (activeContext.section) contextMeta += ` · § ${activeContext.section}`;
    }

    // Honest local attempt history for a question context (Gap B, optional).
    // 0 prior attempts shows nothing extra; best-effort — never blocks rendering.
    if (q) {
      try {
        const qStats = await getQuestionStatsMap();
        const rec = qStats.get(q.id);
        const attempts = Number(rec?.attemptsCount || 0);
        if (attempts > 0) {
          const lastOutcome = rec?.lastOutcome || "";
          contextMeta += ` · ${attempts} prior attempt(s)${lastOutcome ? ` · last ${lastOutcome}` : ""}`;
        }
      } catch {
        /* history enrichment is best-effort */
      }
    }

    const sysPrompt = currentSystemPrompt(vault);

    let pacingLeft = null;
    if (byokActive && PROVIDER_LIMITS[vault.provider]) {
      try {
        const governor = await loadGovernor();
        const now = Date.now();
        const sends = governor?.providers?.[vault.provider]?.sends || [];
        const used = Array.isArray(sends) ? sends.filter(t => Number.isFinite(t) && t > now - 60000 && t <= now).length : 0;
        pacingLeft = Math.max(0, PROVIDER_LIMITS[vault.provider].rpm - used);
      } catch { /* counters are best-effort */ }
    }
    const visibleDraft = $("#aiComposerInput", body)?.value || composerDraft;
    const chips = q
      ? [
          "Why was my option wrong?",
          "Step-by-step derivation",
          "Exam shortcut & traps",
          "Explain in simpler words",
          "Give me a similar PYQ",
          "বাংলায় বলো (Bengali)",
        ]
      : [
          "Key formulas & traps",
          "Step-by-step intuition",
          "Explain in simpler words",
          "Give me a similar PYQ",
          "বাংলায় বলো (Bengali)",
        ];

    // History is an overlay; this conversation remains mounted underneath it.
    const threadSectionHtml = `
        <!-- Chat Thread -->
        <div class="ai-chat-thread" id="aiChatThread" role="log" aria-live="polite"></div>
        <button type="button" class="btn btn--ghost btn--sm" id="aiJumpLatest" hidden>↓ Latest</button>
        <div id="aiRequestState" class="ai-state-card" role="status" aria-live="polite" hidden></div>

        <!-- Preset Prompt Chips (collapsible to save phone space) -->
        <div class="ai-suggestions" ${thinking || typing || activeAbortController ? "hidden" : ""}>
          <button type="button" class="btn btn--ghost btn--sm ai-suggestions-toggle" id="aiSuggestionsToggle" aria-expanded="${suggestionsOpen}">
            <span class="ai-suggestions-label">Suggestions</span>
            <span class="ai-suggestions-chev" aria-hidden="true">${suggestionsOpen ? "\u25BE" : "\u25B8"}</span>
          </button>
          <div class="chip-row ai-chips-row" id="aiChipsRow" ${suggestionsOpen ? "" : "hidden"}>
            ${chips
              .map(
                (c) =>
                  `<button type="button" class="chip ai-preset-chip" data-prompt="${escapeHtml(c)}">${escapeHtml(c)}</button>`
              )
              .join("")}
          </div>
        </div>

        <!-- Composer Row -->
        <form class="ai-composer" id="aiComposerForm">
          <input type="text" class="input-field" id="aiComposerInput" placeholder="${chatHistory.length ? "Ask a follow-up…" : "Ask a JELET doubt…"}" autocomplete="off" />
          <div class="ai-composer__toolbar">
            <label class="ai-composer__key"><span class="ai-visually-hidden">Choose API key</span>
              <select id="aiChatKeyChoice" aria-label="Choose API key for ${escapeHtml(pInfo.label)}">
                <option value="auto">Auto · ${escapeHtml(vault.vaultKeys.filter(k => k.provider === vault.provider).find(k => k.id === vault.keySelection?.[vault.provider])?.label || vault.vaultKeys.find(k => k.provider === vault.provider)?.label || pInfo.label)}</option>
                ${vault.vaultKeys.filter(k => k.provider === vault.provider).map(k => `<option value="${escapeHtml(k.id)}">${escapeHtml(k.label)} · ${escapeHtml(pInfo.label)}</option>`).join("")}
              </select>
            </label>
            <button type="submit" class="btn btn--primary btn--sm" id="aiSendBtn">${activeAbortController ? "Stop" : "Send"}</button>
          </div>
        </form>
        <div class="card__meta" id="aiTokenHint">${byokActive ? `~${estimateTokens(sysPrompt) + chatHistory.reduce((n, m) => n + estimateTokens(m.text), 0) + estimateTokens(visibleDraft)} tokens this ask${pacingLeft === null ? "" : ` · ${pacingLeft} left before pacing`}` : "0 tokens · offline corpus"}</div>`;

    const oldInput = $("#aiComposerInput", body);
    const draftValue = oldInput ? oldInput.value : composerDraft;
    composerDraft = draftValue;
    const hadInputFocus = oldInput && document.activeElement === oldInput;
    const selectionStart = hadInputFocus ? oldInput.selectionStart : null;
    const selectionEnd = hadInputFocus ? oldInput.selectionEnd : null;
    const oldThread = $("#aiChatThread", body);
    const wasNearBottom = nearThreadBottom(oldThread);
    const oldScrollTop = oldThread?.scrollTop || 0;
    body.innerHTML = "";
    const wrap = el(`
      <div class="ai-tutor-wrap">
        <!-- Scoped Context Card -->
        <div class="ai-context-card" ${q || u || f || activeContext.origin ? "" : "hidden"}>
          <div class="row-between" style="gap:var(--space-xs)">
            <strong class="ai-context-card__title">${escapeHtml(contextTitle)}</strong>

          </div>
          <p class="card__meta">${escapeHtml(contextMeta)}</p>
        </div>

        <!-- Byte-exact preview mounts here only when enabled in You. -->
        <div id="aiPreviewSlot"></div>

        <!-- One-time "Before you ask" Agreement Card (docs/04 §3) -->
        <div id="aiWelcomeSlot"></div>

        ${threadSectionHtml}
      </div>
    `);

    body.appendChild(wrap);
    const restoredInput = $("#aiComposerInput", wrap);
    if (restoredInput) {
      restoredInput.value = draftValue;
      if (hadInputFocus) {
        restoredInput.focus({ preventScroll: true });
        if (selectionStart !== null) restoredInput.setSelectionRange(selectionStart, selectionEnd);
      }
    }

    // Populate chat thread (skipped while the history panel is open)
    {
    const thread = $("#aiChatThread", wrap);
    if (!chatHistory.length) {
      thread.innerHTML = `
        <div class="ai-empty" id="aiThreadWelcome">
          <strong>What would you<br>like to learn?</strong>
          <p>${byokActive ? `${escapeHtml(pInfo.label)} · grounded in verified JELET material` : 'Offline Corpus · verified JELET material'}</p>
          ${byokActive ? '' : '<a href="#/you" id="jumpToYouVaultLink">Set up an AI key in You &amp; AI</a>'}
        </div>`;
      $("#jumpToYouVaultLink", thread)?.addEventListener("click", () => {
        closeTutor();
      });
    } else {
      for (const msg of chatHistory) thread.appendChild(messageNode(msg));
    }

    // In-flight reply: thinking bubble, or a word-by-word typewriter bubble.
    if (typing) {
      const revealed = typing.tokens.slice(0, typing.idx).join("");
      const tItem = el(`
        <div class="ai-msg ai-msg--assistant ai-msg--typing" aria-live="off" aria-label="Tutor is composing a reply">
          <div class="ai-msg__meta">${icon("icon-spark")} ${escapeHtml(typing.source || "Codec Tutor")}</div>
          <div class="ai-msg__bubble">${renderTutorBubbleHtml(revealed)}<span class="ai-typing-cursor" aria-hidden="true"></span></div>
        </div>
      `);
      thread.appendChild(tItem);
    } else if (thinking) {
      const tItem = el(`
        <div class="ai-msg ai-msg--assistant ai-msg--thinking">
          <div class="ai-msg__meta">${icon("icon-spark")} Codec Tutor</div>
          <div class="ai-msg__bubble"><span class="ai-visually-hidden" role="status">Tutor is preparing a reply.</span><span class="ai-thinking-dots" aria-hidden="true"><span></span><span></span><span></span></span></div>
        </div>
      `);
      thread.appendChild(tItem);
    }
    thread.scrollTop = wasNearBottom ? thread.scrollHeight : oldScrollTop;
    const latest = $("#aiJumpLatest", wrap);
    const syncLatest = () => { latest.hidden = nearThreadBottom(thread); };
    thread.addEventListener("scroll", syncLatest);
    latest.addEventListener("click", () => { thread.scrollTop = thread.scrollHeight; syncLatest(); });
    syncLatest();
    }

    renderRequestState();

    renderWelcome();

    updatePreview();

    const inputEl = $("#aiComposerInput", wrap);
    inputEl?.addEventListener("input", () => {
      composerDraft = inputEl.value;
      updatePreview();
    });

    const chatKeyChoice = $("#aiChatKeyChoice", wrap);
    const providerKeys = vault.vaultKeys.filter(k => k.provider === vault.provider);
    chatKeyChoice.value = vault.keyModes?.[vault.provider] === "manual" && providerKeys.some(k => k.id === vault.keySelection?.[vault.provider]) ? vault.keySelection[vault.provider] : "auto";
    chatKeyChoice.addEventListener("change", () => {
      selectAiKey(readAiVault().provider, chatKeyChoice.value);
      updatePreview();
    });

    // Suggestions toggle — collapse the preset chips to reclaim phone space.
    $("#aiSuggestionsToggle", wrap)?.addEventListener("click", () => {
      suggestionsOpen = !suggestionsOpen;
      renderComposerState();
    });

    // Preset chips
    wrap.querySelectorAll(".ai-preset-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const p = chip.dataset.prompt;
        handleAsk(p);
      });
    });

    // Composer submit / Stop (absent while the history panel is open)
    $("#aiComposerForm", wrap)?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (activeAbortController) {
        activeAbortController.abort();
        renderComposerState();
        return;
      }
      if (thinking) return;
      const val = inputEl.value.trim();
      if (!val) return;
      inputEl.value = "";
      composerDraft = "";
      await handleAsk(val);
    });
  }

  async function handleAsk(userText, { forceOfflineFirst = false, continueFrom = null } = {}) {
    if (location.hash.startsWith("#/exam/")) { closeTutor(); return; }
    if (activeAbortController || thinking) return;
    const vault = readAiVault();
    const byokReady = Boolean(vault.apiKey && vault.apiKey.trim()) && !forceOfflineFirst;

    // Enforce one-time "Before you ask" welcome agreement before first BYOK call!
    if (byokReady && Number(vault.acceptedWelcomeVersion || 0) < WELCOME_VERSION) {
      pendingWelcomeAction = userText;
      renderWelcome();
      return;
    }

    requestState = vault.keyLocked && !forceOfflineFirst ? { kind: "locked" } : null;
    retryText = userText;
    // If a previous reply is still being typed out, commit it first.
    if (typing) finalizeTyping();

    const userTurn = { role: "user", text: userText };
    chatHistory.push(userTurn);
    appendMessage(userTurn);
    renderRequestState();

    if (!byokReady) {
      // Thinking bubble while the offline reply is computed, then type it out.
      const thisExchange = ++exchangeId;
      thinking = true;
      showThinking();
      const reply = await buildOfflineCorpusReply({
        context: activeContext,
        userPrompt: userText,
        languageMode: vault.preferredLanguage || "English",
      });
      if (thisExchange !== exchangeId) return;
      startTyping(reply, "SymPy & WBJEEB Corpus");
      return;
    }

    // Live BYOK Request with byte-exact payload & AbortController
    const sysPrompt = currentSystemPrompt(vault);

    const continuationIndex = continueFrom ? chatHistory.indexOf(continueFrom) : -1;
    const priorTurns = (continuationIndex >= 0 ? chatHistory.slice(0, continuationIndex + 1) : chatHistory.slice(0, -1))
      .map((m) => ({ role: m.role, text: m.text }));

    activeAbortController = new AbortController();
    const controller = activeAbortController;
    const thisExchange = ++exchangeId;
    const originalContext = activeContext;
    offlineRequested = false;
    thinking = true;
    showThinking();
    if (thisExchange !== exchangeId) return;

    try {
      const candidates = vault.vaultKeys.filter(k => k.provider === vault.provider && k.secret);
      let activeKey = candidates.find(k => k.secret === vault.apiKey) || candidates[0];
      const firstKeyId = activeKey?.id;
      const triedKeys = new Set(activeKey ? [activeKey.id] : []);
      const makeInitial = () => buildAiRequestPayload({ vault:{...vault,apiKey:activeKey?.secret || vault.apiKey}, systemPrompt: sysPrompt, history: priorTurns, userMessage: userText, stream: true });
      const req = makeInitial();
      const result = await sendGovernedAiRequest({
        request: req,
        signal: controller.signal,
        onKeyFailure: (failedRequest) => {
          if (vault.keyModes?.[vault.provider] === "manual") return null;
          const next = candidates.find(k => !triedKeys.has(k.id));
          if (!next) return null;
          activeKey = next;
          triedKeys.add(next.id);
          return {request:withAiRequestKey(failedRequest, next.secret), label:next.label};
        },
        buildContinuation: (partial) => buildAiRequestPayload({
          vault:{...vault,apiKey:activeKey?.secret || vault.apiKey}, systemPrompt: sysPrompt,
          history: [...priorTurns, { role: "user", text: userText }, { role: "assistant", text: partial }],
          userMessage: "Continue exactly where you stopped, without repeating the previous text.",
          stream: true,
        }),
        onRequest: (built) => {
          if (thisExchange !== exchangeId) return;
          if (["pacing", "retry"].includes(requestState?.kind)) {
            requestState = null;
            renderRequestState();
          }
          updatePreview(built);
        },
        onChunk: (text) => {
          if (thisExchange === exchangeId) showLiveText(text, `${req.providerLabel} (${req.model})`);
        },
        onState: (state) => {
          if (thisExchange !== exchangeId) return;
          requestState = state;
          renderRequestState();
        },
      });
      if (thisExchange !== exchangeId) return;
      if (activeKey && activeKey.id !== firstKeyId) {
        const current = readAiVault();
        if (current.provider === vault.provider && current.keyModes?.[vault.provider] !== "manual" && current.vaultKeys.some(k => k.id === activeKey.id)) {
          writeAiVault({keySelection:{...(current.keySelection || {}), [vault.provider]:activeKey.id}});
        }
      }
      activeAbortController = null;
      if (requestState?.kind !== "daily-warn") requestState = null;
      if (streaming) {
        const node = $(".ai-msg--streaming", body);
        streaming = null;
        clearThinking();
        const message = {role:"assistant", text:result.text, source:`${req.providerLabel} (${req.model})`, ...(result.truncated ? {truncated:true} : {})};
        chatHistory.push(message);
        suggestionsOpen = false;
        appendMessage(message, node);
        renderComposerState(); renderRequestState(); updatePreview();
        void persistCurrentSession();
      } else startTyping(result.text, `${req.providerLabel} (${req.model})`, { truncated: result.truncated });
    } catch (err) {
      if (thisExchange !== exchangeId) return;
      activeAbortController = null;
      streaming = null;
      $(".ai-msg--streaming", body)?.remove();
      if (err.name === "AbortError" && !offlineRequested) {
        if (err.partialText) {
          const partial = { role: "assistant", text: err.partialText, source: "Live response · stopped", truncated: true };
          chatHistory.push(partial);
          const thinkingNode = $(".ai-msg--thinking", body);
          if (thinkingNode) thinkingNode.before(messageNode(partial)); else appendMessage(partial);
        }
        requestState = null;
        startTyping("*Generation stopped.*", "Cancelled");
      } else {
        const fallback = await buildOfflineCorpusReply({ context: originalContext, userPrompt: userText,
          languageMode: vault.preferredLanguage || "English" });
        if (thisExchange !== exchangeId) return;
        if (err.partialText) {
          const partial = { role: "assistant", text: err.partialText, source: "Live response · incomplete", truncated: true };
          chatHistory.push(partial);
          const thinkingNode = $(".ai-msg--thinking", body);
          // Keep the incomplete live text before the offline fallback in the log.
          if (thinkingNode) thinkingNode.before(messageNode(partial));
          else appendMessage(partial);
        }
        requestState = { kind: offlineRequested ? "offline" : (err.kind || "network"), provider: vault.provider };
        startTyping(fallback, "Offline Fallback · Corpus Verified");
      }
    }
  }

  return { openTutor, closeTutor };
}
