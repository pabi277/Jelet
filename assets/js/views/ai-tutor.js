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
  let historyOpen = false; // history panel visibility (Gap C)
  let activeHistoryKey = null; // tutorContextKey for the open conversation
  let thinking = false; // show the "thinking" bubble while a reply is being produced
  let typing = null; // in-progress typewriter reveal { text, source, tokens, idx, wordsPerTick, timer }
  let suggestionsOpen = true; // preset-chip row visibility (collapsible to save phone space)

  /**
   * Persist the current conversation into the device-local aiHistory record.
   * Best-effort: a storage failure must never break the tutor.
   */
  async function persistCurrentSession() {
    if (!activeHistoryKey) return;
    try {
      const record = await loadAiHistory();
      const next = upsertSession(record, {
        key: activeHistoryKey,
        title: sessionTitle(activeContext),
        context: sessionContext(activeContext),
        messages: chatHistory,
      });
      await persistAiHistory(next);
    } catch {
      /* history persistence is best-effort */
    }
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
    const { text, source } = typing;
    if (typing.timer) clearInterval(typing.timer);
    typing = null;
    chatHistory.push({ role: "assistant", text, source });
    void persistCurrentSession();
  }

  /** Finish typing: commit the full message, clear state, re-render + persist. */
  function finalizeTyping() {
    if (!typing) return;
    commitTyping();
    clearThinking();
    void renderTutorBody();
  }

  /**
   * Reveal an assistant reply word-by-word (the "typing" feel). The full text
   * is committed to chat history only once the reveal completes, so the
   * byte-exact preview and history persistence always see the complete message.
   */
  function startTyping(text, source) {
    clearThinking();
    cancelTyping();
    const fullText = String(text ?? "");
    if (!fullText) {
      finalizeTyping();
      return;
    }
    if (prefersReducedMotion()) {
      chatHistory.push({ role: "assistant", text: fullText, source: source || "" });
      typing = null;
      void renderTutorBody();
      void persistCurrentSession();
      return;
    }
    const tokens = fullText.match(/\S+\s*|\s+/g) || [fullText];
    // Bound the total reveal to ~30 ticks so long replies don't drag on.
    const wordsPerTick = Math.max(1, Math.round(tokens.length / 30));
    const state = { text: fullText, source: source || "", tokens, idx: 0, wordsPerTick, timer: null };
    typing = state;
    renderTutorBody();
    state.timer = setInterval(() => {
      state.idx += state.wordsPerTick;
      if (state.idx >= state.tokens.length) {
        clearInterval(state.timer);
        state.timer = null;
        finalizeTyping();
        return;
      }
      typing = state;
      renderTutorBody();
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
      fitSheetForKeyboard();
      const threadEl = document.getElementById("aiChatThread");
      if (threadEl) threadEl.scrollTop = threadEl.scrollHeight;
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
              <div class="ai-history-row__main">
                <div class="ai-history-row__title">${escapeHtml(s.title)}</div>
                <div class="ai-history-row__snippet">${escapeHtml(snippet)}</div>
              </div>
              <span class="ai-history-row__time">${escapeHtml(relativeTime(s.updatedAt))}</span>
              <button type="button" class="ai-history-row__del" data-del="${escapeAttr(s.key)}" aria-label="Delete conversation">×</button>
            </div>`;
        })
        .join("");
    }
    return `
      <div class="ai-history-panel">
        <div class="row-between" style="gap:var(--space-xs)">
          <strong class="ai-context-card__title">Conversation history</strong>
          <button type="button" class="btn btn--ghost btn--sm" id="aiHistoryNewBtn">${icon("icon-refresh")} New chat</button>
        </div>
        <div class="ai-history-list">${rowsHtml}</div>
        <p class="card__meta">Stored only on this device · never synced · API keys never included.</p>
        <button type="button" class="btn btn--ghost btn--sm" id="aiHistoryClearAllBtn">Clear all history</button>
      </div>`;
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
    if (activeHistoryKey) {
      try {
        const record = await loadAiHistory();
        await persistAiHistory(deleteSession(record, activeHistoryKey));
      } catch {
        /* best-effort */
      }
    }
    chatHistory = [];
    pendingWelcomeAction = null;
    historyOpen = false;
    await renderTutorBody();
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

  function closeTutor() {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
    // Finalize any in-progress typewriter, then persist the conversation
    // (best-effort) before the sheet closes.
    commitTyping();
    clearThinking();
    void persistCurrentSession();
    stopKeyboardFit();
    closeAllSheets();
  }

  closeBtn?.addEventListener("click", closeTutor);

  // History panel toggle (Gap C) — button lives in the static sheet header.
  const historyBtn = document.getElementById("aiHistoryBtn");
  historyBtn?.addEventListener("click", async () => {
    historyOpen = !historyOpen;
    historyBtn.setAttribute("aria-expanded", String(historyOpen));
    await renderTutorBody();
  });

  async function openTutor(ctx = {}) {
    // Hard Timed-Mock Integrity Lock (docs/04 §6)
    if (location.hash.startsWith("#/exam/")) {
      showToast("Codec AI Tutor is locked during Timed Mock Exams.");
      return;
    }

    // Discard any in-progress typing from a previous (closing) conversation.
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
    historyOpen = false;
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
        }));
        restored = true;
      } else {
        chatHistory = [];
      }
    } catch {
      chatHistory = [];
    }

    openOverlay(sheet);
    startKeyboardFit();
    await renderTutorBody();

    // Auto-seed only for genuinely new threads — a restored conversation keeps
    // its own history (no duplicate seed).
    const willSeed =
      !restored &&
      ((activeContext.mode === "formula" && activeContext.formula) || Boolean(activeContext.question));

    // Preset suggestions stay open only for a genuinely empty thread; once a
    // reply exists (seeded or restored) they collapse to save phone space.
    suggestionsOpen = !willSeed && chatHistory.length === 0;
    if (!suggestionsOpen) await renderTutorBody();

    if (!restored) {
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
      origin: activeContext.origin,
      sectionHeading: activeContext.section,
    });

    let previewReq = null;
    let previewError = null;
    try {
      previewReq = buildAiRequestPayload({
        vault,
        systemPrompt: sysPrompt,
        history: chatHistory.map((m) => ({ role: m.role, text: m.text })),
        userMessage: draftMessage,
      });
    } catch (err) {
      previewError = err.message;
    }

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

    // History panel replaces the chat thread + chips + composer while open (Gap C).
    const threadSectionHtml = historyOpen
      ? await buildHistoryPanel()
      : `
        <!-- Chat Thread -->
        <div class="ai-chat-thread" id="aiChatThread"></div>

        <!-- Preset Prompt Chips (collapsible to save phone space) -->
        <div class="ai-suggestions">
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
          <input type="text" class="input-field" id="aiComposerInput" placeholder="${
            byokActive
              ? "Ask follow-up doubt on this topic…"
              : "Ask any JELET topic or tap a chip…"
          }" autocomplete="off" />
          <button type="submit" class="btn btn--primary btn--sm" id="aiSendBtn">
            ${activeAbortController ? "Stop" : "Ask"}
          </button>
        </form>`;

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
          vault.previewPrompt && previewReq
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
            : vault.previewPrompt && previewError && byokActive
            ? `<div class="exam-trap">${escapeHtml(previewError)} — Offline Corpus Tutor remains active.</div>`
            : ""
        }

        <!-- One-time "Before you ask" Agreement Card (docs/04 §3) -->
        <div id="aiWelcomeSlot"></div>

        ${threadSectionHtml}
      </div>
    `);

    body.appendChild(wrap);

    // Populate chat thread (skipped while the history panel is open)
    if (!historyOpen) {
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

    // In-flight reply: thinking bubble, or a word-by-word typewriter bubble.
    if (typing) {
      const revealed = typing.tokens.slice(0, typing.idx).join("");
      const tItem = el(`
        <div class="ai-msg ai-msg--assistant ai-msg--typing">
          <div class="ai-msg__meta">${icon("icon-spark")} ${escapeHtml(typing.source || "Codec Tutor")}</div>
          <div class="ai-msg__bubble">${renderTutorBubbleHtml(revealed)}<span class="ai-typing-cursor" aria-hidden="true"></span></div>
        </div>
      `);
      thread.appendChild(tItem);
      thread.scrollTop = thread.scrollHeight;
    } else if (thinking) {
      const tItem = el(`
        <div class="ai-msg ai-msg--assistant ai-msg--thinking">
          <div class="ai-msg__meta">${icon("icon-spark")} Codec Tutor</div>
          <div class="ai-msg__bubble"><span class="ai-thinking-dots" aria-hidden="true"><span></span><span></span><span></span></span></div>
        </div>
      `);
      thread.appendChild(tItem);
      thread.scrollTop = thread.scrollHeight;
    }
    }

    // History panel interactions (Gap C)
    if (historyOpen) {
      const panel = $(".ai-history-panel", wrap);
      panel
        ?.querySelectorAll(".ai-history-row")
        .forEach((row) => {
          row.addEventListener("click", async (ev) => {
            if (ev.target.closest("[data-del]")) return;
            await openStoredSession(row.dataset.key);
          });
        });
      panel
        ?.querySelectorAll("[data-del]")
        .forEach((btn) => {
          btn.addEventListener("click", async (ev) => {
            ev.stopPropagation();
            const record = await loadAiHistory();
            await persistAiHistory(deleteSession(record, btn.dataset.del));
            await renderTutorBody();
          });
        });
      $("#aiHistoryNewBtn", wrap)?.addEventListener("click", () => {
        void newConversation();
      });
      $("#aiHistoryClearAllBtn", wrap)?.addEventListener("click", async () => {
        const record = await loadAiHistory();
        await persistAiHistory(clearHistory());
        await renderTutorBody();
      });
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
      try {
        const updated = buildAiRequestPayload({
          vault: readAiVault(),
          systemPrompt: sysPrompt,
          history: chatHistory.map((m) => ({ role: m.role, text: m.text })),
          userMessage: inputEl.value || draftMessage,
        });
        pre.textContent = updated.bodyString;
      } catch {
        // Offline corpus path stays unaffected if custom provider config is invalid.
      }
    });

    // Language switch
    wrap.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        writeAiVault({ preferredLanguage: btn.dataset.lang });
        await renderTutorBody(inputEl?.value || draftMessage);
      });
    });

    // Suggestions toggle — collapse the preset chips to reclaim phone space.
    $("#aiSuggestionsToggle", wrap)?.addEventListener("click", () => {
      suggestionsOpen = !suggestionsOpen;
      renderTutorBody(inputEl?.value || draftMessage);
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

    // Composer submit / Stop (absent while the history panel is open)
    $("#aiComposerForm", wrap)?.addEventListener("submit", async (e) => {
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

    // If a previous reply is still being typed out, commit it first.
    if (typing) finalizeTyping();

    chatHistory.push({ role: "user", text: userText });

    if (!byokReady) {
      // Thinking bubble while the offline reply is computed, then type it out.
      thinking = true;
      await renderTutorBody(userText);
      const reply = await buildOfflineCorpusReply({
        context: activeContext,
        userPrompt: userText,
        languageMode: vault.preferredLanguage || "English",
      });
      startTyping(reply, "SymPy & WBJEEB Corpus");
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
      origin: activeContext.origin,
      sectionHeading: activeContext.section,
    });

    const priorTurns = chatHistory
      .slice(0, -1)
      .map((m) => ({ role: m.role, text: m.text }));

    activeAbortController = new AbortController();
    thinking = true;
    await renderTutorBody(userText);

    try {
      const req = buildAiRequestPayload({
        vault,
        systemPrompt: sysPrompt,
        history: priorTurns,
        userMessage: userText,
      });
      const llmReply = await sendBuiltAiRequest(req, {
        signal: activeAbortController.signal,
      });
      activeAbortController = null;
      startTyping(llmReply, `${req.providerLabel} (${req.model})`);
    } catch (err) {
      activeAbortController = null;
      if (err.name === "AbortError") {
        startTyping("*Generation stopped.*", "Cancelled");
      } else {
        const fallback = await buildOfflineCorpusReply({
          context: activeContext,
          userPrompt: userText,
          languageMode: vault.preferredLanguage || "English",
        });
        startTyping(`*Live provider error (${err.message}) — showing Verified Offline Corpus breakdown instead:*\n\n${fallback}`, "Offline Fallback · Corpus Verified");
      }
    }
  }

  return { openTutor, closeTutor };
}
