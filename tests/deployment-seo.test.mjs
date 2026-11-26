/**
 * deployment-seo.test.mjs — Task 3: deployment-ready + SEO invariants
 * -----------------------------------------------------------------------------
 *   1. SEO surface in `index.html`: title, meta description, robots,
 *      canonical, Open Graph, Twitter card, JSON-LD (WebApplication).
 *   2. `robots.txt` + `sitemap.xml` exist, point at the deploy origin, and
 *      cover the five hash routes.
 *   3. Deployment config: `.nojekyll`, `_headers` / `vercel.json` /
 *      `netlify.toml` mark index.html, sw.js and version.json as
 *      must-revalidate (fresh updates), and `404.html` exists (noindex).
 *   4. `scripts/bump_version.mjs` exists and its --check gate passes
 *      (version stamps in sync).
 *   5. Absolute SEO URLs stay self-referential (no third-party hosts).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const ORIGIN = "https://pabi277.github.io/Jelet/";

test("index.html carries full SEO meta: title, description, robots, canonical", () => {
  const html = read("index.html");
  assert.match(html, /<title>[^<]+JELET[^<]+<\/title>/, "SEO title mentions JELET");
  assert.ok(html.includes('<meta name="description"'), "meta description present");
  assert.ok(html.includes('<meta name="robots"'), "meta robots present");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonical, "canonical link present");
  assert.equal(canonical[1], ORIGIN, "canonical points at deploy origin");
  assert.ok(html.includes('<meta name="keywords"'), "keywords present");
  assert.ok(html.includes('<html lang="en"'), "lang attribute set");
});

test("Open Graph + Twitter card tags are complete and self-referential", () => {
  const html = read("index.html");
  for (const prop of ["og:type", "og:title", "og:description", "og:url", "og:image", "og:site_name"]) {
    assert.ok(html.includes(`property="${prop}"`), `${prop} present`);
  }
  for (const name of ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]) {
    assert.ok(html.includes(`name="${name}"`), `${name} present`);
  }
  assert.ok(html.includes('content="summary_large_image"'), "twitter card type set");

  // Every absolute https URL in index.html must be our own deploy origin.
  const urls = [...html.matchAll(/https?:\/\/[^"'\s<>]+/g)].map((m) => m[0]);
  assert.ok(urls.length > 0, "SEO URLs exist");
  for (const url of urls) {
    if (url.startsWith("https://schema.org")) continue; // JSON-LD vocabulary
    assert.ok(
      url.startsWith(ORIGIN),
      `absolute URL must be self-referential: ${url}`
    );
  }
});

test("JSON-LD structured data declares a free Educational WebApplication", () => {
  const html = read("index.html");
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(ld, "JSON-LD block present");
  const data = JSON.parse(ld[1]);
  assert.equal(data["@context"], "https://schema.org", "schema.org context");
  const app = data["@graph"].find((n) => n["@type"] === "WebApplication");
  assert.ok(app, "WebApplication node");
  assert.equal(app.name, "JELET Study Hub");
  assert.equal(app.url, ORIGIN);
  assert.equal(app.applicationCategory, "EducationalApplication");
  assert.equal(app.isAccessibleForFree, true);
  assert.equal(app.offers.price, "0");
  const org = data["@graph"].find((n) => n["@type"] === "EducationalOrganization");
  assert.ok(org, "EducationalOrganization node");
  assert.equal(org.url, ORIGIN);
});

test("robots.txt allows crawling and points at the sitemap", () => {
  const robots = read("robots.txt");
  assert.match(robots, /User-agent: \*/, "wildcard UA");
  assert.match(robots, /Allow: \//, "allows root");
  assert.ok(robots.includes(`Sitemap: ${ORIGIN}sitemap.xml`), "sitemap URL uses deploy origin");
});

test("sitemap.xml lists the app and all five destinations", () => {
  const sitemap = read("sitemap.xml");
  assert.ok(sitemap.startsWith("<?xml"), "valid xml declaration");
  assert.ok(sitemap.includes("<urlset"), "urlset root");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.includes(ORIGIN), "root URL listed");
  for (const route of ["#/learn", "#/practice", "#/papers", "#/you"]) {
    assert.ok(
      locs.some((l) => l.includes(route)),
      `hash route ${route} listed`
    );
  }
  for (const loc of locs) {
    assert.ok(loc.startsWith(ORIGIN), `sitemap loc uses deploy origin: ${loc}`);
  }
  // Papers deep links for the four verified papers.
  for (const y of [2025, 2024, 2023, 2022]) {
    assert.ok(locs.some((l) => l.includes(`#/papers/jelet-${y}`)), `papers/jelet-${y} listed`);
  }
});

test("deployment configs force must-revalidate on shell/version files", () => {
  assert.ok(fs.existsSync(path.join(ROOT, ".nojekyll")), ".nojekyll exists (GitHub Pages)");

  const headers = read("_headers");
  assert.ok(headers.includes("/index.html"), "_headers covers index.html");
  assert.ok(headers.includes("/sw.js"), "_headers covers sw.js");
  assert.ok(headers.includes("/version.json"), "_headers covers version.json");
  assert.match(headers, /Cache-Control: public, max-age=0, must-revalidate/, "must-revalidate present");
  assert.ok(headers.includes("Service-Worker-Allowed: /"), "SW scope header");
  assert.ok(headers.includes("X-Content-Type-Options: nosniff"), "nosniff header");

  const vercel = JSON.parse(read("vercel.json"));
  const vercelSources = vercel.headers.map((h) => h.source);
  for (const src of ["/index.html", "/sw.js", "/version.json"]) {
    assert.ok(vercelSources.includes(src), `vercel.json covers ${src}`);
  }
  const swHeaders = vercel.headers.find((h) => h.source === "/sw.js").headers;
  assert.ok(
    swHeaders.some((h) => h.value.includes("must-revalidate")),
    "vercel sw.js must-revalidate"
  );

  const netlify = read("netlify.toml");
  assert.ok(netlify.includes("must-revalidate"), "netlify must-revalidate");
  assert.ok(netlify.includes('for = "/version.json"'), "netlify covers version.json");
  assert.ok(netlify.includes('publish = "."'), "netlify publishes repo root");
});

test("404.html exists, is noindex, and links back to the five destinations", () => {
  const nf = read("404.html");
  assert.ok(nf.includes('name="robots" content="noindex'), "404 is noindex");
  for (const route of ["#/", "#/learn", "#/practice", "#/papers", "#/you"]) {
    assert.ok(nf.includes(`href="./${route}"`), `404 links to ${route}`);
  }
  assert.ok(nf.includes("./manifest.webmanifest"), "404 keeps relative asset paths");
});

test("bump_version.mjs --check passes: all three version stamps in sync", () => {
  const out = execFileSync(
    process.execPath,
    ["scripts/bump_version.mjs", "--check"],
    { cwd: ROOT, encoding: "utf8" }
  );
  assert.ok(out.includes("PASSED"), `check gate passed: ${out}`);
});

test("update docs cover the release + SEO flow", () => {
  const deploy = read("DEPLOY.md");
  assert.ok(/version\.json/.test(deploy), "DEPLOY.md documents version.json");
  assert.ok(/bump_version/.test(deploy), "DEPLOY.md documents the bump script");
  assert.ok(/cache/i.test(deploy), "DEPLOY.md documents cache behaviour");
  assert.ok(/seo|sitemap|robots/i.test(deploy), "DEPLOY.md documents SEO files");
});
