import { getMeta, setMeta } from "../db/indexeddb.js";
import { normalizeGroup, decodeGroupInvite, groupInviteUrl, joinStudyGroup } from "../core/study-groups.js";
import { escapeHtml } from "../core/math.js";
import { $, el } from "../core/ui.js";

const lines = value => value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

export async function mountStudyBuddies(root, manifest, encodedInvite = null) {
  const card = el(`<section class="card stack-s community-card" aria-label="Study buddies">
    <h3 class="card__title">Study buddies</h3>
    <p class="card__meta">Share a group name, focus topics and a study plan — no account, chat, live membership or automatic peer updates. Group state is per-device unless you explicitly use encrypted study sync or a backup. Local edits do not notify buddies: share an updated invite to pass them on.</p>
    <div id="buddyInvitePreview" class="stack-s"></div>
    <details><summary>Create a topic group</summary>
      <form id="buddyCreateForm" class="stack-s">
        <label class="stack-xs">Group name<input class="input-field" name="groupName" maxlength="80" required placeholder="JELET 2028"></label>
        <label class="stack-xs">Shared topic<input class="input-field" name="groupTopic" maxlength="120" required placeholder="Physics focus"></label>
        <button class="btn btn--primary" type="submit">Create locally</button>
      </form>
    </details>
    <p class="card__meta">Invites are readable, not encrypted or access-controlled. Anyone with the link can view the shared topics. Do not type names or private information. Opening a link asks before joining; it does not upload anything.</p>
    <div id="buddyGroups" class="stack-s"></div>
    <div id="buddyLinkSlot" class="stack-xs" hidden>
      <label class="stack-xs">Invite link — copy and send yourself<textarea id="buddyInviteLink" class="input-field" rows="4" readonly></textarea></label>
      <button class="btn btn--ghost" type="button" id="buddyCopyLink">Copy invite link</button>
    </div>
    <p id="buddyStatus" class="card__meta" role="status"></p>
  </section>`);
  root.appendChild(card);
  const status = $("#buddyStatus", card);
  const unitNames = new Map((manifest.units || []).map(u => [u.unitId, u.title]));
  async function save(groups) {
    // Re-read meta so other profile/settings fields are never replaced by a stale snapshot.
    await setMeta({ studyGroups: groups, updatedAt: new Date().toISOString() });
  }
  async function currentGroups() {
    const groups = (await getMeta()).studyGroups;
    return Array.isArray(groups) ? groups : [];
  }
  async function renderGroups() {
    const slot = $("#buddyGroups", card);
    slot.innerHTML = "";
    const groups = await currentGroups();
    if (!groups.length) slot.innerHTML = `<p class="card__meta">No groups joined on this device.</p>`;
    for (const raw of groups) {
      let group;
      try { group = normalizeGroup(raw); } catch { continue; }
      const item = el(`<article class="worked-example stack-s">
        <h4 class="card__title">${escapeHtml(group.name)}</h4>
        <p class="card__meta">Shared topic: ${escapeHtml(group.topic)}</p>
        <p class="card__meta">Buddies' shared focus topics (peer-provided, not a verified member roster): ${group.topics.length ? group.topics.map(escapeHtml).join(" · ") : "None shared yet"}</p>
        <ul class="card__meta">${group.plan.length ? group.plan.map(id => `<li>${escapeHtml(id)} · ${escapeHtml(unitNames.get(id) || id)}</li>`).join("") : "<li>No agreed focus units recorded yet.</li>"}</ul>
        <details><summary>Edit this device's copy</summary>
          <form class="stack-s js-buddy-edit">
            <label class="stack-xs">Shared topic<input class="input-field" name="topic" maxlength="120" required value="${escapeHtml(group.topic)}"></label>
            <label class="stack-xs">Buddies' focus topics — one per line, up to 10; no names<textarea class="input-field" name="topics" rows="3" maxlength="1210">${escapeHtml(group.topics.join("\n"))}</textarea></label>
            <label class="stack-xs">Agreed focus units — one canonical unit ID per line<textarea class="input-field" name="plan" rows="4" maxlength="168">${escapeHtml(group.plan.join("\n"))}</textarea></label>
            <p class="card__meta">M01–M11 · P01–P15 · C01–C08 · E01–E08. Only enter units you and your buddies agreed to focus on; edits are not live collaboration.</p>
            <button class="btn btn--ghost" type="submit">Save local plan</button>
          </form>
        </details>
        <button class="btn btn--primary js-buddy-share" type="button">Prepare invite link</button>
        <button class="btn btn--ghost js-buddy-leave" type="button">Leave locally</button>
      </article>`);
      slot.appendChild(item);
      $(".js-buddy-edit", item).addEventListener("submit", async ev => {
        ev.preventDefault();
        try {
          const data = new FormData(ev.currentTarget);
          const updated = normalizeGroup({ ...group, topic: data.get("topic"), topics: lines(data.get("topics")), plan: lines(data.get("plan")) });
          const latest = await currentGroups();
          await save(latest.map(g => g.id === group.id ? updated : g));
          $("#buddyLinkSlot", card).hidden = true;
          await renderGroups();
          status.textContent = "Local plan saved. Share an updated invite to pass it to buddies.";
        } catch (e) { status.textContent = e.message; }
      });
      $(".js-buddy-share", item).addEventListener("click", () => {
        $("#buddyInviteLink", card).value = groupInviteUrl(group, location.href);
        $("#buddyLinkSlot", card).hidden = false;
        status.textContent = "Review the readable invite. Only this group's name, shared topic, peer focus topics and unit plan are included — no profile or result history.";
      });
      $(".js-buddy-leave", item).addEventListener("click", async () => {
        try {
          await save((await currentGroups()).filter(g => g.id !== group.id));
          $("#buddyLinkSlot", card).hidden = true;
          await renderGroups();
          status.textContent = "Left locally. Previously shared invites are not revoked.";
        } catch (e) { status.textContent = e.message; }
      });
    }
  }
  $("#buddyCreateForm", card).addEventListener("submit", async ev => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const button = form.querySelector("button");
    if (button.disabled) return;
    button.disabled = true;
    try {
      const data = new FormData(form);
      const group = normalizeGroup({ v: 1, id: crypto.randomUUID(), name: data.get("groupName"), topic: data.get("groupTopic"), topics: [], plan: [] });
      await save(joinStudyGroup(await currentGroups(), group));
      form.reset();
      await renderGroups();
      status.textContent = "Group created locally. Add agreed units and prepare an invite to share.";
    } catch (e) { status.textContent = e.message; }
    finally { button.disabled = false; }
  });
  $("#buddyCopyLink", card).addEventListener("click", async () => {
    const input = $("#buddyInviteLink", card);
    try { await navigator.clipboard.writeText(input.value); status.textContent = "Invite copied. Nothing uploaded."; }
    catch { input.focus(); input.select(); status.textContent = "Clipboard unavailable. Copy the selected link manually."; }
  });
  await renderGroups();
  if (encodedInvite != null) {
    const preview = $("#buddyInvitePreview", card);
    const clearInvite = () => {
      preview.innerHTML = "";
      history.replaceState(null, "", "#/you");
    };
    try {
      const incoming = decodeGroupInvite(encodedInvite);
      preview.innerHTML = `<div class="worked-example stack-s"><strong>Invite preview: ${escapeHtml(incoming.name)}</strong>
        <p class="card__meta">${escapeHtml(incoming.topic)}</p>
        <p class="card__meta">Peer focus topics: ${incoming.topics.map(escapeHtml).join(" · ") || "None shared"}</p>
        <p class="card__meta">Focus units: ${incoming.plan.map(escapeHtml).join(", ") || "None shared"}</p>
        <p class="card__meta">Saves only on this device. An existing local group with the same invite ID is kept unchanged.</p>
        <button class="btn btn--primary" id="buddyJoin" type="button">Join locally</button>
        <button class="btn btn--ghost" id="buddyDecline" type="button">Dismiss invite</button></div>`;
      $("#buddyDecline", preview).addEventListener("click", clearInvite);
      $("#buddyJoin", preview).addEventListener("click", async () => {
        try {
          const groups = await currentGroups();
          const exists = groups.some(g => g.id === incoming.id);
          await save(joinStudyGroup(groups, incoming));
          clearInvite();
          await renderGroups();
          status.textContent = exists ? "Already joined — local edits kept." : "Joined locally. No server membership was created.";
        } catch (e) { status.textContent = e.message; }
      });
    } catch (e) { status.textContent = e.message; }
  }
}
