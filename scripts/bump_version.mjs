#!/usr/bin/env node
/**
 * bump_version.mjs — JELET Study Hub (v3) · Release version bumper
 * ---------------------------------------------------------------------------
 * Keeps the three version stamps in sync before every deploy:
 *   1. `version.json`            — { version, build, swVersion, updatedAt }
 *   2. `sw.js`                   — `SW_VERSION` constant
 *   3. `assets/js/core/update-manager.js` — `APP_BUILD` / `APP_SW_VERSION`
 *
 * Usage:
 *   node scripts/bump_version.mjs --check   # validate sync (CI gate)
 *   node scripts/bump_version.mjs --bump    # stamp a new build + bump SW
 *
 * `--bump` derives a new build id from today's date + the current git
 * short hash (falls back to a counter when git is unavailable), increments
 * the trailing SW number, and rewrites all three files. Commit the three
 * files together and deploy — open tabs will detect the new `build` in
 * `version.json`, activate the new worker, and safely reload (see
 * `assets/js/core/update-manager.js`). IndexedDB study data is never
 * touched by this flow.
 */

import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION_JSON = resolve(ROOT, "version.json");
const SW_JS = resolve(ROOT, "sw.js");
const UPDATE_MANAGER = resolve(ROOT, "assets/js/core/update-manager.js");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function gitShortHash() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

async function check() {
  const errors = [];
  let version;
  try {
    version = await readJson(VERSION_JSON);
  } catch (err) {
    console.error(`✗ version.json unreadable: ${err.message}`);
    process.exit(1);
  }
  if (!version.build || !version.swVersion) {
    errors.push("version.json must define build + swVersion");
  }

  const swSrc = await readFile(SW_JS, "utf8");
  const swMatch = swSrc.match(/const SW_VERSION = "([^"]+)"/);
  if (!swMatch) errors.push("sw.js: SW_VERSION constant not found");
  else if (version.swVersion && swMatch[1] !== version.swVersion) {
    errors.push(`sw.js SW_VERSION (${swMatch[1]}) !== version.json swVersion (${version.swVersion})`);
  }

  const umSrc = await readFile(UPDATE_MANAGER, "utf8");
  const buildMatch = umSrc.match(/export const APP_BUILD = "([^"]+)"/);
  const umSwMatch = umSrc.match(/export const APP_SW_VERSION = "([^"]+)"/);
  if (!buildMatch) errors.push("update-manager.js: APP_BUILD not found");
  else if (version.build && buildMatch[1] !== version.build) {
    errors.push(`update-manager.js APP_BUILD (${buildMatch[1]}) !== version.json build (${version.build})`);
  }
  if (!umSwMatch) errors.push("update-manager.js: APP_SW_VERSION not found");
  else if (version.swVersion && umSwMatch[1] !== version.swVersion) {
    errors.push(`update-manager.js APP_SW_VERSION (${umSwMatch[1]}) !== version.json swVersion (${version.swVersion})`);
  }

  if (errors.length) {
    console.error(`\n✗ bump_version --check FAILED (${errors.length} issue(s))\n`);
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }
  console.log(`✓ bump_version --check PASSED — build ${version.build}, SW ${version.swVersion} in sync.`);
}

async function bump() {
  const version = await readJson(VERSION_JSON);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const hash = gitShortHash();
  const suffix = hash ? `-${hash}` : "-local";
  const newBuild = `${today}${suffix}`;

  const swMatch = String(version.swVersion || "jelet-v3-sw-0").match(/^(.*-sw-)(\d+)$/);
  const nextSw = swMatch ? `${swMatch[1]}${Number(swMatch[2]) + 1}` : "jelet-v3-sw-1";

  const next = {
    version: version.version || "3.0.0",
    build: newBuild,
    swVersion: nextSw,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(VERSION_JSON, JSON.stringify(next, null, 2) + "\n", "utf8");

  const swSrc = await readFile(SW_JS, "utf8");
  if (!/const SW_VERSION = "[^"]+"/.test(swSrc)) {
    console.error("✗ sw.js: SW_VERSION constant not found — aborting.");
    process.exit(1);
  }
  await writeFile(SW_JS, swSrc.replace(/const SW_VERSION = "[^"]+"/, `const SW_VERSION = "${nextSw}"`), "utf8");

  const umSrc = await readFile(UPDATE_MANAGER, "utf8");
  let umNext = umSrc;
  if (!/export const APP_BUILD = "[^"]+"/.test(umNext) || !/export const APP_SW_VERSION = "[^"]+"/.test(umNext)) {
    console.error("✗ update-manager.js: APP_BUILD / APP_SW_VERSION not found — aborting.");
    process.exit(1);
  }
  umNext = umNext.replace(/export const APP_BUILD = "[^"]+"/, `export const APP_BUILD = "${newBuild}"`);
  umNext = umNext.replace(/export const APP_SW_VERSION = "[^"]+"/, `export const APP_SW_VERSION = "${nextSw}"`);
  await writeFile(UPDATE_MANAGER, umNext, "utf8");

  console.log(`✓ bumped to build ${newBuild}, SW ${nextSw}.`);
  console.log("  Commit version.json + sw.js + assets/js/core/update-manager.js together, then deploy.");
}

const arg = process.argv[2];
if (arg === "--check") await check();
else if (arg === "--bump") await bump();
else {
  console.log("Usage: node scripts/bump_version.mjs --check | --bump");
  process.exit(arg ? 1 : 0);
}
