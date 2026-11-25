import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { once } from "node:events";
import { validateBenchmark, benchmarkPosition } from "../assets/js/core/benchmark.js";

test("optional reference benchmark endpoint is empty until valid explicit POSTs, durable and append-only", { timeout: 30000 }, async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "jelet-benchmark-test-"));
  const database = path.join(dir, "events.sqlite");
  let child;
  let stderr = "";
  async function start() {
    child = spawn("python3", ["scripts/benchmark_server.py", "--database", database, "--port", "0", "--allow-origin", "https://app.test"], { stdio: ["ignore", "pipe", "pipe"] });
    child.stderr.on("data", b => { stderr += b; });
    const ready = await Promise.race([
      once(child.stdout, "data").then(([b]) => JSON.parse(b.toString())),
      once(child, "exit").then(([code]) => { throw new Error(`Server exited ${code}: ${stderr}`); }),
    ]);
    return `http://127.0.0.1:${ready.port}/benchmark`;
  }
  async function stop() {
    if (child && child.exitCode == null) { const exit = once(child, "exit"); child.kill(); await exit; }
  }
  try {
    let url = await start();
    const post = body => fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://app.test" }, body: typeof body === "string" ? body : JSON.stringify(body) });
    await t.test("empty GET is a real zero-count histogram and CORS permits only configured origin", async () => {
      const res = await fetch(url, { headers: { Origin: "https://app.test" } });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("cache-control"), "no-store");
      assert.equal(res.headers.get("access-control-allow-origin"), "https://app.test");
      assert.equal(res.headers.get("set-cookie"), null);
      const body = validateBenchmark(await res.json());
      assert.equal(body.count, 0);
      assert.equal(benchmarkPosition(0, body), null);
      assert.equal((await fetch(url, { headers: { Origin: "https://other.test" } })).status, 403);
      assert.equal((await fetch(url, { method: "OPTIONS" })).status, 200);
    });
    await t.test("invalid/personal data, non-twelfths and duplicate fields are rejected with no append", async () => {
      const valid = { marks: 10, accuracy: 50, paperYear: 2025 };
      for (const bad of [{ ...valid, name: "must-not-be-stored" }, { ...valid, apiKey: "must-not-be-stored" }, { ...valid, marks: 0.1 }, { ...valid, marks: -21 }, { ...valid, accuracy: true }, { ...valid, accuracy: 101 }, { ...valid, paperYear: 2021 }, null, { ...valid, marks: "10" }, '{"marks":10,"marks":20,"accuracy":50,"paperYear":2025}', '{"marks":NaN,"accuracy":50,"paperYear":2025}']) assert.equal((await post(bad)).status, 400);
      assert.equal((await post(" ".repeat(513))).status, 413);
      assert.equal((await fetch(url, { method: "POST", body: "not json" })).status, 415);
      assert.equal((await (await fetch(url)).json()).count, 0);
    });
    await t.test("valid POSTs append actual events and exact twelfth-score bins, not identities", async () => {
      for (const marks of [901 / 12, 901 / 12, -0.25]) {
        const res = await post({ marks, accuracy: 75, paperYear: 2025 });
        assert.equal(res.status, 201);
        assert.equal((await res.json()).accepted, true);
      }
      const aggregate = validateBenchmark(await (await fetch(url)).json());
      assert.equal(aggregate.count, 3);
      assert.deepEqual(aggregate.scores, [{ twelfths: -3, count: 1 }, { twelfths: 901, count: 2 }]);
      assert.equal(benchmarkPosition(901, aggregate).equal, 2);
      for (const method of ["PUT", "DELETE", "PATCH"]) assert.equal((await fetch(url, { method })).status, 405);
    });
    await t.test("only this week's receipt events are included, never past/future records", async () => {
      const insert = spawnSync("python3", ["-c", `import sqlite3,sys\nfrom datetime import datetime,timedelta,timezone\nnow=datetime.now(timezone.utc)\nstart=(now-timedelta(days=now.weekday())).replace(hour=0,minute=0,second=0,microsecond=0)\nwith sqlite3.connect(sys.argv[1]) as db:\n for stamp in [start-timedelta(microseconds=1), start+timedelta(days=7)]:\n  db.execute('INSERT INTO submissions VALUES (0,0,2025,?)',(stamp.isoformat(),))\n`, database], { encoding: "utf8" });
      assert.equal(insert.status, 0, insert.stderr);
      const body = validateBenchmark(await (await fetch(url)).json());
      assert.equal(body.count, 3);
    });
    await stop();
    url = await start();
    await t.test("restart preserves append-only rows and database contains only contract fields", async () => {
      assert.equal((await (await fetch(url)).json()).count, 3);
      const check = spawnSync("python3", ["-c", `import sqlite3,sys,json\ndb=sqlite3.connect(sys.argv[1])\nprint(json.dumps([r[1] for r in db.execute('PRAGMA table_info(submissions)')]))\nfor sql in ['UPDATE submissions SET accuracy=0', 'DELETE FROM submissions']:\n try:\n  db.execute(sql)\n  raise Exception('mutation allowed')\n except sqlite3.IntegrityError:\n  pass\n`, database], { encoding: "utf8" });
      assert.equal(check.status, 0, check.stderr);
      assert.deepEqual(JSON.parse(check.stdout), ["twelfths", "accuracy", "paper_year", "received_at"]);
      assert.equal(stderr, "", "no access/body/IP logging");
    });
  } finally {
    await stop();
    await rm(dir, { recursive: true, force: true });
  }
});
