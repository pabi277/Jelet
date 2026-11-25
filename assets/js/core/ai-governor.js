/** Pure, device-local free-tier policy. Never store prompts or API keys here. */
export const PROVIDER_LIMITS = Object.freeze({
  gemini: { minGapMs: 6000, rpm: 10, dailyWarn: 50, dailyMax: 100, tokenBudget: 8000 },
  groq: { minGapMs: 3000, rpm: 30, dailyWarn: 40, dailyMax: 80, tokenBudget: 8000 },
  openrouter: { minGapMs: 3000, rpm: 20, dailyWarn: 40, dailyMax: 48, tokenBudget: 6000 },
  nvidia: { minGapMs: 2000, rpm: 40, dailyWarn: 100, dailyMax: 200, tokenBudget: 8000 },
});
export const RETRY_WINDOW_MS = 70000;
export const MAX_AUTO_RETRIES = 2;

export function localDay(now = Date.now()) {
  const d = new Date(now);
  if (!Number.isFinite(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function limits(provider) {
  if (!Object.hasOwn(PROVIDER_LIMITS, provider)) throw new Error(`Unknown provider: ${provider}`);
  return PROVIDER_LIMITS[provider];
}

/** State is supplied explicitly, making every verdict deterministic and testable. */
export function canSendNow(provider, now = Date.now(), state = {}) {
  const cfg = limits(provider);
  const record = state?.providers?.[provider] || {};
  const count = record.day === localDay(now) ? Math.max(0, Number(record.count) || 0) : 0;
  const stamps = (Array.isArray(record.sends) ? record.sends : [])
    .filter(t => Number.isFinite(t) && t <= now && t > now - 60000).sort((a, b) => a - b);
  if (count >= cfg.dailyMax) return { verdict: 'daily-block', remaining: 0 };
  if (stamps.length) {
    const gap = cfg.minGapMs - (now - stamps[stamps.length - 1]);
    if (gap > 0) return { verdict: 'min-gap', retryInMs: gap };
  }
  if (stamps.length >= cfg.rpm) return { verdict: 'rpm', retryInMs: stamps[stamps.length - cfg.rpm] + 60000 - now };
  return { verdict: count >= cfg.dailyWarn ? 'daily-warn' : 'ok', remaining: Math.max(0, cfg.dailyMax - count) };
}

export function recordSend(provider, now = Date.now(), state = {}) {
  limits(provider);
  const old = state?.providers?.[provider] || {};
  const day = localDay(now);
  const sends = (Array.isArray(old.sends) ? old.sends : []).filter(t => Number.isFinite(t) && t <= now && t > now - 60000);
  return { ...state, providers: { ...(state?.providers || {}), [provider]: {
    day, count: (old.day === day ? Math.max(0, Number(old.count) || 0) : 0) + 1,
    sends: [...sends, now],
  } } };
}

/** Conservative heuristic, not a provider tokenizer. Includes message framing. */
export function estimateTokens(text) {
  const s = String(text ?? '');
  const commands = (s.match(/\\[a-zA-Z]+|[$^_{}]/g) || []).length;
  return Math.ceil(s.length / 4 + commands * 0.5) + 4;
}
export function trimHistoryByBudget(history, systemPrompt, tokenBudget) {
  const turns = (Array.isArray(history) ? history : []).slice(-8);
  const budget = Math.max(0, Number(tokenBudget) || 0);
  let size = estimateTokens(systemPrompt) + turns.reduce((n, t) => n + estimateTokens(t?.text), 0);
  while (turns.length > 2 && size > budget) size -= estimateTokens(turns.shift()?.text);
  return turns;
}

export function parseRetryAfter(value, now = Date.now()) {
  if (value == null || String(value).trim() === '') return null;
  const str = String(value).trim();
  if (/^\d+(?:\.\d+)?$/.test(str)) return Math.ceil(Number(str) * 1000);
  const date = Date.parse(str);
  return Number.isFinite(date) ? Math.max(0, date - now) : null;
}
function header(headers, name) {
  if (typeof headers?.get === 'function') return headers.get(name);
  const entry = Object.entries(headers || {}).find(([k]) => k.toLowerCase() === name.toLowerCase());
  return entry?.[1] ?? null;
}
export function classifyProviderError(status, bodyText = '', headers = {}, now = Date.now()) {
  const s = String(bodyText || '').toLowerCase();
  const retryAfterMs = parseRetryAfter(header(headers, 'retry-after'), now);
  let kind = 'unknown';
  if (status === 429) {
    if (/quota|daily|per.day|requests.per.day/.test(s)) kind = 'daily-quota';
    else kind = 'per-minute';
  } else if (status === 401 || status === 403) kind = 'auth';
  else if (status === 400) kind = 'bad-request';
  else if (status === 408 || status >= 500 && status <= 599) kind = 'server';
  else if (!status || status instanceof Error) kind = 'network';
  return { kind, retryAfterMs };
}
export function nextRetryMs(attempt, classifier, retryAfterHeader = null, random = Math.random, now = Date.now()) {
  const kind = typeof classifier === 'string' ? classifier : classifier?.kind;
  if (!['per-minute', 'server'].includes(kind) || attempt < 0 || attempt >= MAX_AUTO_RETRIES) return null;
  const base = Math.min(60000, 1000 * 2 ** attempt);
  const jittered = Math.min(60000, Math.round(base * (0.9 + Math.max(0, Math.min(1, random())) * 0.2)));
  const after = typeof retryAfterHeader === 'number' ? retryAfterHeader : parseRetryAfter(retryAfterHeader, now);
  return Math.max(jittered, after ?? classifier?.retryAfterMs ?? 0);
}
/** No recovery action may start at or after the deadline. */
export function recoveryVerdict(startedAt, now, waitMs = 0) {
  const remainingMs = Math.max(0, startedAt + RETRY_WINDOW_MS - now);
  return { verdict: remainingMs > 0 && waitMs < remainingMs ? 'wait' : 'offline', remainingMs };
}

const safeCount = n => Number.isFinite(Number(n)) ? Math.max(0, Number(n)) : 0;
export function recordUsage(ledger, { provider, day, requests = 0, promptTokens = 0, outputTokens = 0 } = {}) {
  limits(provider);
  const base = ledger && typeof ledger === 'object' && !Array.isArray(ledger) ? ledger : {};
  const prev = base[provider]?.day === day ? base[provider] : {};
  return { ...base, [provider]: { day, requests: safeCount(prev.requests) + safeCount(requests),
    promptTokens: safeCount(prev.promptTokens) + safeCount(promptTokens),
    outputTokens: safeCount(prev.outputTokens) + safeCount(outputTokens) } };
}
export function getTodaySummary(ledger, provider, now = Date.now()) {
  limits(provider);
  const day = localDay(now);
  const row = ledger?.[provider]?.day === day ? ledger[provider] : {};
  return { day, requests: safeCount(row.requests), promptTokens: safeCount(row.promptTokens), outputTokens: safeCount(row.outputTokens) };
}


/** Render-safe, local-only usage snapshot, based on the current local day. */
export function getGovernorDashboard(state = {}, now = Date.now()) {
  return Object.entries(PROVIDER_LIMITS).map(([provider, limits]) => {
    const usage = getTodaySummary(state?.ledger, provider, now);
    const last = state?.lastErrors?.[provider];
    return { provider, ...usage, totalTokens: usage.promptTokens + usage.outputTokens,
      dailyWarn: limits.dailyWarn, dailyMax: limits.dailyMax, rpm: limits.rpm,
      minGapMs: limits.minGapMs,
      lastError: typeof last?.kind === 'string' ? { kind: last.kind, at: last.at } : null };
  });
}
