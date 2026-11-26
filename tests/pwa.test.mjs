/**
 * pwa.test.mjs — Phase 05 gate: Installable PWA integrity & offline inventory
 * --------------------------------------------------------------------------
 * Verifies the launch-readiness artifacts without a headless browser:
 *   1. `manifest.webmanifest` parses, has the required installable fields
 *      (name, icons 192/512, display: standalone, theme/background, start_url).
 *   2. Icon files referenced by the manifest exist on disk at declared sizes.
 *   3. `sw.js` parses as valid JS, precaches the complete app shell, and
 *      every precache URL exists on disk.
 *   4. The corpus precache inventory (`_data/manifest.json` papers,
 *      solutions, 42 units, all referenced SVG figures) resolves — i.e. the
 *      SW's offline cache would be complete after one online install.
 *   5. `index.html` links the manifest + PWA meta; SW registration exists
 *      in app.js and is guarded against non-http(s) origins.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const ROOT = new URL("../", import.meta.url).pathname;

function read(rel) {
  return fs.readFileSync(`${ROOT}${rel}`, "utf8");
}

test("manifest.webmanifest is valid and installable", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));

  assert.ok(manifest.name, "manifest.name required");
  assert.ok(manifest.short_name, "manifest.short_name required");
  assert.equal(manifest.display, "standalone", "must be standalone display");
  assert.ok(manifest.start_url, "start_url required");
  assert.ok(manifest.theme_color, "theme_color required");
  assert.ok(manifest.background_color, "background_color required");

  const sizes = (manifest.icons || []).map((i) => i.sizes).flat();
  assert.ok(sizes.includes("192x192"), "192x192 icon required");
  assert.ok(sizes.includes("512x512"), "512x512 icon required");

  for (const icon of manifest.icons) {
    const data = fs.readFileSync(`${ROOT}${icon.src.replace(/^\.\//, "")}`);
    assert.ok(
      data.length > 0 &&
        data[0] === 0x89 &&
        data[1] === 0x50 &&
        data[2] === 0x4e &&
        data[3] === 0x47,
      `icon ${icon.src} must be a valid PNG`
    );
    const [w, h] = [
      data.readUInt32BE(16),
      data.readUInt32BE(20),
    ];
    const declared = icon.sizes.split(" ").find((s) => s !== "any" && s !== "maskable");
    assert.equal(`${w}x${h}`, declared, `icon ${icon.src} size must match manifest`);
  }
});

test("sw.js precaches the full app shell and all URLs exist on disk", () => {
  const sw = read("sw.js");

  // Valid JS syntax (throws on parse error).
  new Function(sw);

  const shellBlock = sw.match(/SHELL_ASSETS = \[([\s\S]*?)\];/);
  assert.ok(shellBlock, "SHELL_ASSETS array must exist");
  const assets = [...shellBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

  assert.ok(assets.includes("./index.html"), "index.html must be precached");
  assert.ok(
    assets.includes("./manifest.webmanifest"),
    "manifest must be precached"
  );
  for (const rel of ["tokens.css", "shell.css", "components.css"]) {
    assert.ok(
      assets.includes(`./assets/css/${rel}`),
      `assets/css/${rel} must be precached`
    );
  }
  assert.ok(
    assets.includes("./assets/vendor/katex/katex.mjs"),
    "vendored KaTeX must be precached"
  );
  assert.ok(
    assets.includes("./assets/vendor/katex/katex.css"),
    "KaTeX CSS must be precached"
  );

  const jsModules = fs
    .readdirSync(`${ROOT}assets/js/core`)
    .filter((f) => f.endsWith(".js"))
    .map((f) => `./assets/js/core/${f}`)
    .concat(
      fs
        .readdirSync(`${ROOT}assets/js/views`)
        .filter((f) => f.endsWith(".js"))
        .map((f) => `./assets/js/views/${f}`)
    )
    .concat(
      fs
        .readdirSync(`${ROOT}assets/js/db`)
        .filter((f) => f.endsWith(".js"))
        .map((f) => `./assets/js/db/${f}`)
    )
    .concat("./assets/js/app.js");
  for (const mod of jsModules) {
    assert.ok(assets.includes(mod), `SW must precache ${mod}`);
  }

  for (const url of assets) {
    const rel = url.replace(/^\.\//, "");
    assert.ok(fs.existsSync(`${ROOT}${rel}`), `precache URL ${url} must exist`);
  }
});

test("SW corpus precache inventory resolves the entire verified corpus", () => {
  const sw = read("sw.js");
  assert.ok(
    sw.includes("collectCorpusUrls"),
    "SW must discover corpus URLs from the manifest at install time"
  );
  assert.ok(
    sw.includes("./_data/manifest.json"),
    "SW must precache the corpus manifest"
  );

  const manifest = JSON.parse(read("_data/manifest.json"));
  const urls = new Set();
  for (const p of manifest.papers) {
    urls.add(p.dataFile);
    urls.add(p.solutionsFile);
  }
  for (const u of manifest.units) urls.add(`./_data/units/${u.unitId}.json`);

  for (const p of manifest.papers) {
    const paper = JSON.parse(read(p.dataFile.replace(/^\.\//, "")));
    for (const q of paper.questions) {
      if (q.stemFigure?.src) urls.add(q.stemFigure.src);
      for (const o of q.options || []) {
        if (o.figure?.src) urls.add(o.figure.src);
      }
    }
  }

  for (const url of urls) {
    const rel = url.replace(/^\.\//, "");
    assert.ok(fs.existsSync(`${ROOT}${rel}`), `corpus URL ${url} must exist`);
  }
  // Sanity: the inventory covers all papers, solutions, units, and figures.
  assert.ok(urls.size >= 150, `expected full corpus inventory, got ${urls.size}`);
});

test("index.html wires the manifest and app.js registers the SW safely", () => {
  const html = read("index.html");
  assert.ok(
    /<link rel="manifest" href="\.\/manifest\.webmanifest"/.test(html),
    "index.html must link the manifest"
  );
  assert.ok(
    /apple-touch-icon/.test(html),
    "index.html should declare an apple-touch-icon"
  );
  assert.ok(
    /skip-to-content|Skip to main content/.test(html),
    "index.html must include a skip-to-content link"
  );

  const app = read("assets/js/app.js");
  assert.ok(
    app.includes("navigator.serviceWorker.register"),
    "app.js must register the service worker"
  );
  assert.ok(
    app.includes('if (!/^https?:$/i.test(location.protocol)) return;'),
    "SW registration must be guarded to http(s) origins"
  );
  assert.ok(
    app.includes('"./sw.js"'),
    "app.js must register ./sw.js (relative, subpath-safe)"
  );
});

test("No external CDN requests: KaTeX, fonts, and assets are fully vendored", () => {
  const html = read("index.html");
  // Every linked stylesheet/script in index.html must be a local relative
  // path — except self-referential SEO metadata (canonical/OG/Twitter URL),
  // which must use the deploy origin (never a third-party host).
  const linkRe = /(?:href|src)\s*=\s*"([^"]+)"/g;
  let m;
  while ((m = linkRe.exec(html))) {
    const value = m[1];
    const isSelfRefSeo = value.startsWith("https://pabi277.github.io/Jelet/");
    assert.ok(
      value.startsWith("./") || value.startsWith("#") || isSelfRefSeo,
      `index.html asset must be relative (or self-referential SEO): ${value}`
    );
    if (isSelfRefSeo) {
      assert.ok(
        value.startsWith("https://pabi277.github.io/Jelet/"),
        `SEO URL must point at the deploy origin: ${value}`
      );
    }
  }

  const css = [read("assets/css/shell.css"), read("assets/css/components.css")].join("\n");
  const externalCss = css.match(/url\(\s*["']?https?:/g);
  assert.equal(externalCss, null, "CSS must not reference external URLs");

  // KaTeX fonts referenced by vendored CSS must live locally.
  const katexCss = read("assets/vendor/katex/katex.css");
  const fontRefs = [...katexCss.matchAll(/url\(["']?([^)"']+)/g)].map((x) => x[1]);
  for (const ref of fontRefs) {
    if (/^https?:/.test(ref)) {
      assert.fail(`vendored KaTeX CSS must not reference CDN fonts: ${ref}`);
    }
    const rel = `assets/vendor/katex/${ref.replace(/^\.?\//, "")}`;
    assert.ok(fs.existsSync(`${ROOT}${rel}`), `KaTeX asset must exist: ${ref}`);
  }
});
