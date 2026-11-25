/** Portable, identity-free topic invitations. No server membership or live collaboration. */
const UNIT_IDS = new Set([
  ...Array.from({ length: 11 }, (_, i) => `M${String(i + 1).padStart(2, "0")}`),
  ...Array.from({ length: 15 }, (_, i) => `P${String(i + 1).padStart(2, "0")}`),
  ...["C", "E"].flatMap(s => Array.from({ length: 8 }, (_, i) => `${s}${String(i + 1).padStart(2, "0")}`)),
]);

function text(value, max, label) {
  if (typeof value !== "string" || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`${label} must be plain text (1–${max} characters).`);
  }
  return value.trim();
}

export function normalizeGroup(input) {
  if (!input || input.v !== 1 || !/^[a-zA-Z0-9-]{8,64}$/.test(input.id || "")) throw new Error("Invalid study-group invite version or ID.");
  const name = text(input.name, 80, "Group name");
  const topic = text(input.topic, 120, "Shared topic");
  if (!Array.isArray(input.topics) || input.topics.length > 10 || !Array.isArray(input.plan) || input.plan.length > 42) {
    throw new Error("Use up to 10 peer focus topics and 42 canonical units.");
  }
  const topics = [...new Set(input.topics.map(t => text(t, 120, "Peer focus topic")))];
  const plan = [...new Set(input.plan.map(id => {
    if (!UNIT_IDS.has(id)) throw new Error("Study plan units must use the 42 canonical unit IDs (M01–M11, P01–P15, C01–C08, E01–E08).");
    return id;
  }))];
  // Allowlist, never serialize arbitrary local record fields or identity metadata.
  return { v: 1, id: input.id, name, topic, topics, plan };
}

export function encodeGroupInvite(group) {
  const bytes = new TextEncoder().encode(JSON.stringify(normalizeGroup(group)));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeGroupInvite(encoded) {
  if (typeof encoded !== "string" || !encoded.length || encoded.length > 10000 || !/^[\w-]+$/.test(encoded)) {
    throw new Error("Invalid or oversized study-group invite.");
  }
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return normalizeGroup(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
  } catch { throw new Error("This study-group invite is invalid or unsupported. Nothing was joined."); }
}

export function groupInviteUrl(group, pageUrl) {
  const url = new URL(pageUrl);
  url.search = "";
  url.hash = `/you?invite=${encodeGroupInvite(group)}`;
  return url.href;
}

/** Joining twice never duplicates a group or overwrites local edits. */
export function joinStudyGroup(groups, incoming) {
  const group = normalizeGroup(incoming);
  const current = Array.isArray(groups) ? groups : [];
  if (current.some(g => g.id === group.id)) return current;
  if (current.length >= 30) throw new Error("Local group list is full (30). Leave a group first.");
  return [...current, group];
}
