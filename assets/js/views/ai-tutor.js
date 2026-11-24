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
import { renderLatex, escapeHtml, stripLatexForSearch } from "../core/math.js";
import { formatTwelfths, scoreQuestion, isVoidedQuestion } from "../core/scoring.js";
import {
  AI_PROVIDERS,
  WELCOME_VERSION,
  readAiVault,
  writeAiVault,
  buildGroundTruthSystemPrompt,
  buildAiRequestPayload,
  sendBuiltAiRequest,
} from "../core/ai-vault.js";
import { $, el, icon, showToast } from "../core/ui.js";

/**
 * Synthesize an immediate, 100%-corpus-grounded tutor response offline
 * when no BYOK key is configured (or when user selects Corpus Verified mode).
 */
async function buildOfflineCorpusReply({ context, userPrompt, languageMode }) {
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
    const keyStr = (q.key?.correct || []).join(", ");
    const selected = context.selected || [];
    const sc =
      context.scoreResult ||
      (selected.length ? scoreQuestion(q, selected) : null);
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
      const relevantFormulas = (unit?.formulas || [])
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

    const topFormulas = (unit.formulas || [])
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
      ...(u.formulas || []).map((f) => `${f.label} ${f.notes}`),
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
    const fList = (bestUnit.formulas || [])
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

/** Convert lightweight `**bold**` + `\n\n` paragraphs + KaTeX `$...$` to clean safe HTML. */
function renderTutorBubbleHtml(markdownLike) {
  const paragraphs = String(markdownLike || "").split(/\n{2,}/);
  return paragraphs
    .map((para) => {
      const lines = para.split("\n").map((line) => {
        // Render LaTeX safely (escapes non-math HTML) then bold **...**
        const withMath = renderLatex(line);
        return withMath.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      });
      return `<p class="ai-msg-para">${lines.join("<br />")}</p>`;
    })
    .join("");
}

export function initAiTutor({ openOverlay, closeAllSheets }) {
  const sheet = document.getElementById("aiSheet");
  const body = document.getElementById("aiSheetBody");
  const modeBadge = document.getElementById("aiSheetModeBadge");
  const closeBtn = document.getElementById("closeAiSheetBtn");

  let activeContext = {};
  let chatHistory = []; // [{ role: "user"|"assistant", text: string, source: string }]
  let activeAbortController = null;
  let pendingWelcomeAction = null;

  function closeTutor() {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
    closeAllSheets();
  }

  closeBtn?.addEventListener("click", closeTutor);

  async function openTutor(ctx = {}) {
    // Hard Timed-Mock Integrity Lock (docs/04 §6)
    if (location.hash.startsWith("#/exam/")) {
      showToast("Codec AI Tutor is locked during Timed Mock Exams.");
      return;
    }

    activeContext = { ...ctx };
    if (activeContext.question && !activeContext.solution) {
      activeContext.solution = await loadSolutionForQuestion(activeContext.question);
    }
    if (activeContext.question && !activeContext.unit && activeContext.question.unitId) {
      activeContext.unit = await loadUnit(activeContext.question.unitId).catch(() => null);
    }

    chatHistory = [];
    pendingWelcomeAction = null;
    openOverlay(sheet);
    await renderTutorBody();

    // Auto-seed initial helpful context summary if opened on a specific question or formula!
    if (activeContext.mode === "formula" && activeContext.formula) {
      await handleAsk(`Explain ${activeContext.formula.label} step by step`, { forceOfflineFirst: !hasByokKey() });
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

  function hasByokKey() {
    const v = readAiVault();
    return Boolean(v.apiKey && v.apiKey.trim());
  }

  async function renderTutorBody(draftMessage = "Explain step by step") {
    const vault = readAiVault();
    const byokActive = Boolean(vault.apiKey && vault.apiKey.trim());
    const pInfo = AI_PROVIDERS[vault.provider] || AI_PROVIDERS.gemini;

    if (modeBadge) {
      modeBadge.className = byokActive ? "badge badge--brand" : "pill";
      modeBadge.textContent = byokActive
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

    const sysPrompt = buildGroundTruthSystemPrompt({
      question: q,
      solution: activeContext.solution,
      unit: u,
      formula: f,
      paperTitle: activeContext.paperTitle || (q ? `JELET ${q.year}` : ""),
      studentSelected: activeContext.selected || [],
      studentOutcome: activeContext.scoreResult?.outcome || null,
      studentScoreText: activeContext.scoreResult
        ? formatTwelfths(activeContext.scoreResult.twelfths, { signed: true })
        : "",
      languageMode: vault.preferredLanguage || "English",
    });

    const previewReq = buildAiRequestPayload({
      vault,
      systemPrompt: sysPrompt,
      history: chatHistory.map((m) => ({ role: m.role, text: m.text })),
      userMessage: draftMessage,
    });

    const chips = q
      ? [
          "Why was my option wrong?",
          "Step-by-step derivation",
          "Exam shortcut & traps",
          "বাংলায় বলো (Bengali)",
        ]
      : [
          "Key formulas & traps",
          "Step-by-step intuition",
          "বাংলায় বলো (Bengali)",
        ];

    body.innerHTML = "";
    const wrap = el(`
      <div class="ai-tutor-wrap">
        <!-- Scoped Context Card -->
        <div class="ai-context-card">
          <div class="row-between" style="gap:var(--space-xs)">
            <strong class="ai-context-card__title">${escapeHtml(contextTitle)}</strong>
            <div class="segmented" style="padding:2px">
              <button type="button" class="segmented__btn lang-btn ${vault.preferredLanguage !== "Bengali" ? "is-active" : ""}" data-lang="English" style="min-height:28px;padding:2px 8px">EN</button>
              <button type="button" class="segmented__btn lang-btn ${vault.preferredLanguage === "Bengali" ? "is-active" : ""}" data-lang="Bengali" style="min-height:28px;padding:2px 8px">বাংলা</button>
            </div>
          </div>
          <p class="card__meta">${escapeHtml(contextMeta)}</p>
        </div>

        <!-- Collapsible Byte-Exact Prompt Preview (12-phone-codec-ai-tutor.png & docs/04 §4) -->
        ${
          vault.previewPrompt
            ? `
          <details class="tiebreak-details ai-prompt-preview">
            <summary>Check prompt before sending (${escapeHtml(pInfo.label)} · ${escapeHtml(previewReq.model)})</summary>
            <div class="stack-xs" style="margin-top:var(--space-xs)">
              <div class="row-between">
                <span class="card__meta mono">${escapeHtml(pInfo.endpointHint)}</span>
                <button type="button" class="btn btn--ghost btn--sm" id="copyPromptJsonBtn" style="min-height:28px;padding:2px 8px">Copy JSON</button>
              </div>
              <pre class="ai-prompt-pre mono" id="promptJsonPre">${escapeHtml(previewReq.bodyString)}</pre>
            </div>
          </details>`
            : ""
        }

        <!-- One-time "Before you ask" Agreement Card (docs/04 §3) -->
        <div id="aiWelcomeSlot"></div>

        <!-- Chat Thread -->
        <div class="ai-chat-thread" id="aiChatThread"></div>

        <!-- Preset Prompt Chips -->
        <div class="chip-row ai-chips-row">
          ${chips
            .map(
              (c) =>
                `<button type="button" class="chip ai-preset-chip" data-prompt="${escapeHtml(c)}">${escapeHtml(c)}</button>`
            )
            .join("")}
        </div>

        <!-- Composer Row -->
        <form class="ai-composer" id="aiComposerForm">
          <input type="text" class="input-field" id="aiComposerInput" placeholder="${
            byokActive
              ? "Ask follow-up doubt on this topic…"
              : "Ask any JELET topic or tap a chip…"
          }" autocomplete="off" />
          <button type="submit" class="btn btn--primary btn--sm" id="aiSendBtn">
            ${activeAbortController ? "Stop" : "Ask"}
          </button>
        </form>
      </div>
    `);

    body.appendChild(wrap);

    // Populate chat thread
    const thread = $("#aiChatThread", wrap);
    if (!chatHistory.length) {
      thread.innerHTML = `
        <div class="ai-msg ai-msg--assistant">
          <div class="ai-msg__meta">${icon("icon-spark")} Grounded in Official WBJEEB Corpus</div>
          <div class="ai-msg__bubble">
            Tap any chip below or type a question. ${
              byokActive
                ? `Your personal <strong>${escapeHtml(pInfo.label)}</strong> key is active with immutable answer-key grounding.`
                : `Running in <strong>100% Offline Corpus Mode</strong> using SymPy-verified solutions (or add a free Gemini/Groq key in <a href="#/you" id="jumpToYouVaultLink">You &amp; AI</a>).`
            }
          </div>
        </div>
      `;
      $("#jumpToYouVaultLink", thread)?.addEventListener("click", () => {
        closeTutor();
      });
    } else {
      for (const msg of chatHistory) {
        const item = el(`
          <div class="ai-msg ai-msg--${msg.role}">
            <div class="ai-msg__meta">${
              msg.role === "user" ? "You" : `${icon("icon-spark")} ${escapeHtml(msg.source || "Codec Tutor")}`
            }</div>
            <div class="ai-msg__bubble">${
              msg.role === "user" ? escapeHtml(msg.text) : renderTutorBubbleHtml(msg.text)
            }</div>
          </div>
        `);
        thread.appendChild(item);
      }
      thread.scrollTop = thread.scrollHeight;
    }

    // One-time "Before you ask" card if pending first BYOK call
    if (pendingWelcomeAction) {
      const wSlot = $("#aiWelcomeSlot", wrap);
      wSlot.innerHTML = `
        <div class="worked-example stack-xs">
          <strong>Before you ask (${escapeHtml(pInfo.label)} BYOK)</strong>
          <div class="card__meta">• Direct from your browser to <strong>${escapeHtml(pInfo.label)}</strong> using your saved key — no middleman server.</div>
          <div class="card__meta">• Only this question context and your message are sent — never your mock history or CGPA.</div>
          <div class="card__meta">• AI can still slip on algebra — the <strong>Official WBJEEB Key &amp; Verified Solution</strong> always win.</div>
          <div class="cluster-xs" style="margin-top:var(--space-2xs)">
            <button type="button" class="btn btn--ghost btn--sm" id="cancelWelcomeBtn">Use Offline Mode</button>
            <button type="button" class="btn btn--primary btn--sm" id="acceptWelcomeBtn">Got it, send</button>
          </div>
        </div>
      `;
      $("#cancelWelcomeBtn", wSlot).addEventListener("click", async () => {
        const msg = pendingWelcomeAction;
        pendingWelcomeAction = null;
        await handleAsk(msg, { forceOfflineFirst: true });
      });
      $("#acceptWelcomeBtn", wSlot).addEventListener("click", async () => {
        writeAiVault({ acceptedWelcomeVersion: WELCOME_VERSION });
        const msg = pendingWelcomeAction;
        pendingWelcomeAction = null;
        await handleAsk(msg);
      });
    }

    // Copy JSON preview button
    $("#copyPromptJsonBtn", wrap)?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(previewReq.bodyString);
        showToast("Exact request JSON copied");
      } catch {
        showToast("Prompt JSON ready above");
      }
    });

    // Live update JSON preview as student types!
    const inputEl = $("#aiComposerInput", wrap);
    inputEl?.addEventListener("input", () => {
      const pre = $("#promptJsonPre", wrap);
      if (!pre) return;
      const updated = buildAiRequestPayload({
        vault: readAiVault(),
        systemPrompt: sysPrompt,
        history: chatHistory.map((m) => ({ role: m.role, text: m.text })),
        userMessage: inputEl.value || draftMessage,
      });
      pre.textContent = updated.bodyString;
    });

    // Language switch
    wrap.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        writeAiVault({ preferredLanguage: btn.dataset.lang });
        await renderTutorBody(inputEl?.value || draftMessage);
      });
    });

    // Preset chips
    wrap.querySelectorAll(".ai-preset-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const p = chip.dataset.prompt;
        if (p.includes("বাংলা")) {
          writeAiVault({ preferredLanguage: "Bengali" });
        }
        handleAsk(p);
      });
    });

    // Composer submit / Stop
    $("#aiComposerForm", wrap).addEventListener("submit", async (e) => {
      e.preventDefault();
      if (activeAbortController) {
        activeAbortController.abort();
        activeAbortController = null;
        await renderTutorBody();
        return;
      }
      const val = inputEl.value.trim();
      if (!val) return;
      inputEl.value = "";
      await handleAsk(val);
    });
  }

  async function handleAsk(userText, { forceOfflineFirst = false } = {}) {
    const vault = readAiVault();
    const byokReady = Boolean(vault.apiKey && vault.apiKey.trim()) && !forceOfflineFirst;

    // Enforce one-time "Before you ask" welcome agreement before first BYOK call!
    if (byokReady && Number(vault.acceptedWelcomeVersion || 0) < WELCOME_VERSION) {
      pendingWelcomeAction = userText;
      await renderTutorBody(userText);
      return;
    }

    chatHistory.push({ role: "user", text: userText });

    if (!byokReady) {
      const reply = await buildOfflineCorpusReply({
        context: activeContext,
        userPrompt: userText,
        languageMode: vault.preferredLanguage || "English",
      });
      chatHistory.push({
        role: "assistant",
        text: reply,
        source: "SymPy & WBJEEB Corpus",
      });
      await renderTutorBody();
      return;
    }

    // Live BYOK Request with byte-exact payload & AbortController
    const q = activeContext.question || null;
    const u = activeContext.unit || null;
    const f = activeContext.formula || null;
    const sysPrompt = buildGroundTruthSystemPrompt({
      question: q,
      solution: activeContext.solution,
      unit: u,
      formula: f,
      paperTitle: activeContext.paperTitle || (q ? `JELET ${q.year}` : ""),
      studentSelected: activeContext.selected || [],
      studentOutcome: activeContext.scoreResult?.outcome || null,
      studentScoreText: activeContext.scoreResult
        ? formatTwelfths(activeContext.scoreResult.twelfths, { signed: true })
        : "",
      languageMode: vault.preferredLanguage || "English",
    });

    const priorTurns = chatHistory
      .slice(0, -1)
      .map((m) => ({ role: m.role, text: m.text }));
    const req = buildAiRequestPayload({
      vault,
      systemPrompt: sysPrompt,
      history: priorTurns,
      userMessage: userText,
    });

    activeAbortController = new AbortController();
    await renderTutorBody(userText);

    try {
      const llmReply = await sendBuiltAiRequest(req, {
        signal: activeAbortController.signal,
      });
      activeAbortController = null;
      chatHistory.push({
        role: "assistant",
        text: llmReply,
        source: `${req.providerLabel} (${req.model})`,
      });
      await renderTutorBody();
    } catch (err) {
      activeAbortController = null;
      if (err.name === "AbortError") {
        chatHistory.push({
          role: "assistant",
          text: "*Generation stopped.*",
          source: "Cancelled",
        });
      } else {
        const fallback = await buildOfflineCorpusReply({
          context: activeContext,
          userPrompt: userText,
          languageMode: vault.preferredLanguage || "English",
        });
        chatHistory.push({
          role: "assistant",
          text: `*Live provider error (${err.message}) — showing Verified Offline Corpus breakdown instead:*\n\n${fallback}`,
          source: "Offline Fallback · Corpus Verified",
        });
      }
      await renderTutorBody();
    }
  }

  return { openTutor, closeTutor };
}
