import { getAllAttempts } from "../core/stats.js";
import { resultSummary, resultCardSvg } from "../core/share-result.js";
import { $, el } from "../core/ui.js";

export function mountResultShare(root, attempt) {
  const card = el(`<section class="card stack-s" aria-label="Share a study result">
    <h3 class="card__title">Share your result</h3>
    <p class="card__meta">Generated on this device. Nothing is uploaded. No name, profile, answers or API keys are included.</p>
    <button class="btn btn--ghost" type="button" id="shareResultBtn" aria-expanded="false">Share</button>
    <div id="shareResultPanel" class="stack-s" hidden>
      <label class="cluster-xs"><input id="shareFullToggle" type="checkbox"> Full breakdown (paper, time, accuracy trend and section scores)</label>
      <p class="card__meta">Default: score + accuracy only. Review the exact card before downloading.</p>
      <div id="shareResultPreview" class="figure-frame"></div>
      <button class="btn btn--primary" type="button" id="downloadResultBtn">Download SVG card</button>
      <p id="shareResultStatus" role="status" class="card__meta"></p>
    </div>
  </section>`);
  root.insertBefore(card, root.children[1] || null);
  let svg = "";
  let history = [];
  const status = $("#shareResultStatus", card);
  function update() {
    const css = getComputedStyle(document.documentElement);
    svg = resultCardSvg(resultSummary(attempt, history, $("#shareFullToggle", card).checked), {
      background: css.getPropertyValue("--fig-fill").trim(),
      text: css.getPropertyValue("--fig-text").trim(),
      accent: css.getPropertyValue("--fig-primary").trim(),
    });
    $("#shareResultPreview", card).innerHTML = svg;
  }
  $("#shareResultBtn", card).addEventListener("click", async () => {
    const btn = $("#shareResultBtn", card);
    btn.disabled = true;
    try {
      history = await getAllAttempts();
      update();
      $("#shareResultPanel", card).hidden = false;
      btn.setAttribute("aria-expanded", "true");
    } catch {
      $("#shareResultPanel", card).hidden = false;
      status.textContent = "Could not read local history. Try again.";
    } finally { btn.disabled = false; }
  });
  $("#shareFullToggle", card).addEventListener("change", update);
  $("#downloadResultBtn", card).addEventListener("click", () => {
    if (!svg) return;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "jelet-study-result.svg";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "SVG card downloaded. Share this file wherever you choose.";
  });
}
