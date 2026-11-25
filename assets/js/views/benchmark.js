import * as db from "../db/indexeddb.js";
import { benchmarkEndpoint, benchmarkSubmission, benchmarkPosition, fetchBenchmark, contributeBenchmark, weekStartUtc } from "../core/benchmark.js";
import { formatTwelfths } from "../core/scoring.js";
import { $, el } from "../core/ui.js";

/** Configuration and receipts are device-local meta records, excluded from encrypted sync. */
export async function mountBenchmark(root, attempt = null) {
  const config = await db.get("meta", "benchmark");
  let base = config?.baseUrl || "";
  let aggregate = null;
  let busy = false;
  let eligible = false;
  try { benchmarkSubmission(attempt, true); eligible = true; } catch { /* no eligible mock */ }
  const card = el(`<section class="card stack-s community-card" aria-label="Anonymous peer benchmark">
    <h3 class="card__title">This week's benchmark</h3>
    <p class="card__meta">Optional comparison with real, self-reported full-mock submissions received this UTC week (Monday–Sunday), across paper years. Submissions are not unique students, verified scores, official ranks or a representative sample.</p>
    <label class="stack-xs">Benchmark endpoint base URL<input type="url" class="input-field" id="benchmarkUrl" placeholder="https://your-provider.example"></label>
    <button type="button" class="btn btn--ghost" id="benchmarkSave">Save endpoint locally</button>
    <p class="card__meta">No request until you choose Load or Contribute. Requests omit cookies and referrers. The provider still sees connection metadata such as IP address; choose a trusted operator with a no-logging policy.</p>
    <button type="button" class="btn btn--ghost" id="benchmarkLoad">Load this week's aggregate</button>
    <p class="card__meta" id="benchmarkStatus" role="status"></p>
    <p class="card__meta" id="benchmarkComparison"></p>
    <p class="card__meta" id="benchmarkPayload"></p>
    <p class="card__meta" id="benchmarkReceipt"></p>
    <label class="community-toggle"><input type="checkbox" id="benchmarkConsent"> Contribute anonymously (this mock only)</label>
    <button type="button" class="btn btn--primary" id="benchmarkSubmit">Contribute this mock</button>
    <p class="card__meta">Only marks, accuracy and paper-year leave this device. No name, email, profile, attempt ID, device ID or API key. Contributions cannot be withdrawn from an append-only aggregate. No background uploads or offline queue.</p>
  </section>`);
  root.appendChild(card);
  const status = $("#benchmarkStatus", card);
  const comparison = $("#benchmarkComparison", card);
  const consent = $("#benchmarkConsent", card);
  const submit = $("#benchmarkSubmit", card);
  $("#benchmarkUrl", card).value = base;
  status.textContent = base ? "Not loaded — choose Load to contact your endpoint." : "Benchmark not configured — local study is unaffected.";
  $("#benchmarkPayload", card).textContent = eligible
    ? `Selected mock: JELET ${benchmarkSubmission(attempt, true).paperYear} · ${formatTwelfths(attempt.totalTwelfths)} / 120 marks · ${benchmarkSubmission(attempt, true).accuracy}% accuracy. Exact POST: ${JSON.stringify(benchmarkSubmission(attempt, true))}`
    : "Complete an independent official-paper full mock to contribute or compare. You can still load the aggregate.";
  consent.disabled = !eligible;
  submit.disabled = true;
  let sent = false;
  const receiptKey = () => `benchmarkReceipt:${base}:${weekStartUtc()}:${attempt?.attemptId}`;
  async function updateSent() {
    sent = sent || Boolean(eligible && await db.get("meta", receiptKey()));
    $("#benchmarkReceipt", card).textContent = sent ? "Already contributed this mock this week from this device. No repeat submission will be sent." : "";
    submit.disabled = busy || !eligible || !consent.checked || sent;
  }
  await updateSent();
  consent.addEventListener("change", () => { submit.disabled = busy || !eligible || !consent.checked || sent; });
  function display() {
    comparison.textContent = "";
    if (!aggregate.count) { status.textContent = "No submissions this week — no percentile available."; return; }
    status.textContent = `${aggregate.count} submissions · UTC week starting ${aggregate.weekStart} · snapshot ${aggregate.generatedAt}`;
    const position = eligible ? benchmarkPosition(attempt.totalTwelfths, aggregate) : null;
    if (position) comparison.textContent = `Your score is higher than ${position.higherThanPct}% of this week's ${position.count} submissions: ${position.below} below · ${position.equal} tied · ${position.above} above. Ties are not counted as lower. This is not an exam rank.`;
  }
  async function run(action) {
    if (busy) return;
    busy = true;
    card.querySelectorAll("button").forEach(b => { b.disabled = true; });
    status.textContent = "Contacting benchmark endpoint…";
    comparison.textContent = "";
    try { await action(); }
    catch (e) { status.textContent = e.message; }
    finally {
      busy = false;
      card.querySelectorAll("button").forEach(b => { b.disabled = false; });
      await updateSent().catch(() => { submit.disabled = true; });
    }
  }
  $("#benchmarkSave", card).addEventListener("click", () => run(async () => {
    base = benchmarkEndpoint($("#benchmarkUrl", card).value);
    await db.put("meta", { key: "benchmark", baseUrl: base });
    aggregate = null;
    sent = false;
    consent.checked = false;
    status.textContent = base ? "Endpoint saved locally. Nothing sent. Choose Load to fetch." : "Benchmark not configured — local study is unaffected.";
  }));
  $("#benchmarkLoad", card).addEventListener("click", () => run(async () => {
    if (benchmarkEndpoint($("#benchmarkUrl", card).value) !== base) throw new Error("Save your edited endpoint before contacting it.");
    aggregate = await fetchBenchmark(base);
    display();
  }));
  submit.addEventListener("click", () => run(async () => {
    if (sent) throw new Error("Already contributed this mock this week from this device.");
    if (benchmarkEndpoint($("#benchmarkUrl", card).value) !== base) throw new Error("Save your edited endpoint before contributing.");
    await contributeBenchmark(base, attempt, consent.checked);
    sent = true;
    submit.disabled = true;
    consent.checked = false;
    status.textContent = "Contribution accepted. Load the aggregate to see the updated comparison.";
    await db.put("meta", { key: receiptKey(), acceptedAt: new Date().toISOString() });
  }));
}
