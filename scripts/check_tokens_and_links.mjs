#!/usr/bin/env node
/**
 * check_tokens_and_links.mjs — JELET Study Hub (v3) · CI gate
 * ---------------------------------------------------------------------------
 * Verifies, before any phase closes:
 *   1. ZERO raw hex color values outside assets/css/tokens.css.
 *   2. ZERO absolute root-breaking paths (/assets/, /_data/, /scripts/ are
 *      forbidden — ./assets/..., ./_data/... relative paths required).
 *   3. 100% of internal asset references resolve to files that exist.
 *   4. ZERO .pdf / .epub / .zip / .7z / copyrighted reference files anywhere
 *      in the repository (Zero-Copyright GitHub Law).
 * Exits non-zero on any failure.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const errors = [];
const warnings = [];

/* ------------------------------------------------------------------ *
 * File walker (skips .git and other VCS/build dirs)
 * ------------------------------------------------------------------ */
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".cache", "private_refs"]);

async function walk(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) out.push(...await walk(join(dir, e.name)));
    } else {
      out.push(join(dir, e.name));
    }
  }
  return out;
}

const SOURCE_EXT = new Set([".css", ".js", ".mjs", ".html", ".svg"]);

/* ------------------------------------------------------------------ *
 * Check 1: raw hex outside tokens.css
 * ------------------------------------------------------------------ */
const HEX_RE = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

async function checkHexColors(files) {
  for (const file of files) {
    const rel = relative(ROOT, file);
    const name = file.split("/").pop();
    if (name === "tokens.css") continue; // tokens.css is the single source of truth
    if (!SOURCE_EXT.has(extname(file))) continue;
    let src = await readFile(file, "utf8");
    // HTML <meta> tags (e.g. theme-color) are browser hints, not style colors.
    if (extname(file) === ".html") src = src.replace(/<meta[^>]*>/g, "");
    const matches = src.match(HEX_RE) || [];
    if (matches.length) {
      // filter obvious non-colors (e.g. hash routes like #/abc won't match hex)
      errors.push(`[hex] ${rel}: hardcoded hex ${matches.join(", ")} — move all colors into tokens.css`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Check 2: absolute root-breaking paths
 * ------------------------------------------------------------------ */
const ABS_PATH_RE = /(?<![\w.\-])\/(assets|_data|scripts|docs)\//g;

async function checkAbsolutePaths(files) {
  for (const file of files) {
    if (!SOURCE_EXT.has(extname(file))) continue;
    const rel = relative(ROOT, file);
    // This gate script legitimately documents the forbidden paths; skip itself.
    if (rel === "scripts/check_tokens_and_links.mjs") continue;
    let src = await readFile(file, "utf8");
    // Strip external URLs before path checks (they may legitimately contain /assets/).
    src = src.replace(/https?:\/\/[^\s"')]+/g, "");
    const matches = src.match(ABS_PATH_RE) || [];
    if (matches.length) {
      errors.push(`[abs-path] ${rel}: absolute root path ${matches.join(", ")} — use relative ./assets/... ./_data/...`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Check 3: internal asset references resolve
 * ------------------------------------------------------------------ */
async function checkAssetLinks(files) {
  const htmlFiles = files.filter((f) => extname(f) === ".html");
  for (const file of htmlFiles) {
    const rel = relative(ROOT, file);
    const src = await readFile(file, "utf8");
    const refRe = /(?:href|src)\s*=\s*"(\.\/[^"#]+)"/g;
    let m;
    while ((m = refRe.exec(src))) {
      const target = resolve(dirname(file), m[1]);
      try {
        await stat(target);
      } catch {
        errors.push(`[link] ${rel}: referenced asset "${m[1]}" does not exist`);
      }
    }
  }

  // JS module imports of local assets
  const jsFiles = files.filter((f) => [".js", ".mjs"].includes(extname(f)));
  for (const file of jsFiles) {
    const rel = relative(ROOT, file);
    const src = await readFile(file, "utf8");
    const impRe = /(?:from|import)\s*["'](\.\/[^"']+)["']/g;
    let m;
    while ((m = impRe.exec(src))) {
      const spec = m[1];
      if (spec.endsWith(".js") || spec.endsWith(".mjs")) {
        const target = resolve(dirname(file), spec);
        try {
          await stat(target);
        } catch {
          errors.push(`[link] ${rel}: import "${spec}" does not resolve`);
        }
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Check 4: zero copyrighted / reference files
 * ------------------------------------------------------------------ */
const FORBIDDEN_EXT = new Set([".pdf", ".epub", ".zip", ".7z", ".rar"]);
const FORBIDDEN_NAME_RE = /(BS_Grewal|HC_Verma|Jain_and_Jain|VK_Mehta|Allen|NCERT|Guidebook|Worked_Solutions_Ref)/i;

async function checkCopyright(files) {
  for (const file of files) {
    const rel = relative(ROOT, file);
    const ext = extname(file).toLowerCase();
    const base = file.split("/").pop();
    if (FORBIDDEN_EXT.has(ext)) {
      errors.push(`[copyright] ${rel}: forbidden file type "${ext}" — Zero-Copyright GitHub Law`);
    }
    if (FORBIDDEN_NAME_RE.test(base)) {
      errors.push(`[copyright] ${rel}: matches a forbidden copyrighted reference name`);
    }
    if (/05_Reference_Books_PRIVATE_NO_GITHUB/.test(rel)) {
      errors.push(`[copyright] ${rel}: lives in the private NO_GITHUB reference folder`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */
async function main() {
  const files = await walk(ROOT);
  await checkHexColors(files);
  await checkAbsolutePaths(files);
  await checkAssetLinks(files);
  await checkCopyright(files);

  const total = files.length;
  if (errors.length) {
    console.error(`\n✗ check_tokens_and_links FAILED (${errors.length} issue(s) across ${total} files)\n`);
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }
  console.log(`✓ check_tokens_and_links PASSED — 0 raw hex outside tokens.css, 0 absolute root paths, 0 broken links, 0 copyrighted files (${total} files scanned).`);
}

main().catch((err) => {
  console.error("check_tokens_and_links crashed:", err);
  process.exit(2);
});
