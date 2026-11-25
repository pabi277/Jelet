#!/usr/bin/env python3
"""Optional zero-dependency reference benchmark adapter. Never required by the PWA.

Durable SQLite event store, append-only through this API, identity-free rows, no
request/access logs. Put behind TLS; production operators must also disable proxy
logs and apply resource caps. See DEPLOY.md. No sample data is ever inserted.
"""
import argparse
from contextlib import closing
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import math
import sqlite3

MAX_BODY = 512


def utc_week(now):
    start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    return start, start + timedelta(days=7)


def parse_submission(raw):
    def object_fields(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError("Duplicate field")
            result[key] = value
        return result

    body = json.loads(raw, object_pairs_hook=object_fields)
    if not isinstance(body, dict) or set(body) != {"marks", "accuracy", "paperYear"}:
        raise ValueError("Exactly marks, accuracy and paperYear are required")
    marks, accuracy, year = body["marks"], body["accuracy"], body["paperYear"]
    if type(marks) not in (int, float) or not math.isfinite(marks) or not -20 <= marks <= 120:
        raise ValueError("Marks out of range")
    twelfths = round(marks * 12)
    if abs(marks * 12 - twelfths) > 1e-8:
        raise ValueError("Marks must be exact twelfths")
    if type(accuracy) is not int or not 0 <= accuracy <= 100:
        raise ValueError("Accuracy must be an integer percentage")
    if type(year) is not int or year not in range(2022, 2027):
        raise ValueError("Unsupported paper year")
    return twelfths, accuracy, year


def connect(database):
    db = sqlite3.connect(database, timeout=5)
    db.execute("PRAGMA journal_mode=WAL")
    return db


def initialize(database):
    with closing(connect(database)) as db, db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS submissions (
                twelfths INTEGER NOT NULL CHECK(twelfths BETWEEN -240 AND 1440),
                accuracy INTEGER NOT NULL CHECK(accuracy BETWEEN 0 AND 100),
                paper_year INTEGER NOT NULL CHECK(paper_year BETWEEN 2022 AND 2026),
                received_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS submissions_week ON submissions(received_at);
            CREATE TRIGGER IF NOT EXISTS submissions_no_update BEFORE UPDATE ON submissions
                BEGIN SELECT RAISE(ABORT, 'append-only'); END;
            CREATE TRIGGER IF NOT EXISTS submissions_no_delete BEFORE DELETE ON submissions
                BEGIN SELECT RAISE(ABORT, 'append-only'); END;
        """)


def handler_for(database, allow_origin):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass  # Never log paths, request metadata, bodies or IP addresses.

        def setup(self):
            super().setup()
            self.connection.settimeout(5)

        def reply(self, status, body):
            data = json.dumps(body, separators=(",", ":")).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Access-Control-Allow-Origin", allow_origin)
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Accept, Content-Type")
            self.end_headers()
            self.wfile.write(data)

        def allowed(self):
            if self.path != "/benchmark":
                self.reply(404, {"error": "Not found"})
                return False
            origin = self.headers.get("Origin")
            if origin and allow_origin != "*" and origin != allow_origin:
                self.reply(403, {"error": "Origin not allowed"})
                return False
            return True

        def do_OPTIONS(self):
            if self.allowed():
                self.reply(200, {})

        def do_GET(self):
            if not self.allowed():
                return
            try:
                with closing(connect(database)) as db, db:
                    # One consistent snapshot, generatedAt taken after acquiring it.
                    db.execute("BEGIN")
                    now = datetime.now(timezone.utc)
                    start, end = utc_week(now)
                    rows = db.execute(
                        "SELECT twelfths, COUNT(*) FROM submissions WHERE received_at >= ? AND received_at < ? GROUP BY twelfths ORDER BY twelfths",
                        (start.isoformat(), end.isoformat()),
                    ).fetchall()
                self.reply(200, {
                    "version": 1, "weekStart": start.date().isoformat(),
                    "generatedAt": now.isoformat(), "count": sum(count for _, count in rows),
                    "scores": [{"twelfths": score, "count": count} for score, count in rows],
                })
            except sqlite3.Error:
                self.reply(503, {"error": "Store unavailable"})

        def do_POST(self):
            if not self.allowed():
                return
            if self.headers.get("Content-Type", "").split(";")[0].strip() != "application/json":
                self.reply(415, {"error": "Use application/json"})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > MAX_BODY or self.headers.get("Transfer-Encoding"):
                    self.reply(413, {"error": "Body must be 1–512 bytes with Content-Length"})
                    return
                values = parse_submission(self.rfile.read(length))
            except (ValueError, UnicodeError, OverflowError, RecursionError):
                self.reply(400, {"error": "Invalid submission; only valid marks, accuracy, paperYear accepted"})
                return
            try:
                with closing(connect(database)) as db, db:
                    db.execute("BEGIN IMMEDIATE")
                    now = datetime.now(timezone.utc)
                    db.execute("INSERT INTO submissions VALUES (?, ?, ?, ?)", (*values, now.isoformat()))
                # Acknowledge only after the transaction commits durably.
                self.reply(201, {"accepted": True, "weekStart": utc_week(now)[0].date().isoformat()})
            except sqlite3.Error:
                self.reply(503, {"error": "Store unavailable; not confirmed"})

        def do_PUT(self):
            self.reply(405, {"error": "Append-only; use GET or POST"})

        do_DELETE = do_PUT
        do_PATCH = do_PUT

    return Handler


class PrivateHTTPServer(ThreadingHTTPServer):
    def handle_error(self, _request, _client_address):
        pass  # Default traceback logging includes the client IP; never emit it.


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", required=True, help="Durable SQLite path outside the source checkout")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8787)
    parser.add_argument("--allow-origin", required=True, help="Exact app origin (no trailing slash), or * for a public anonymous endpoint")
    args = parser.parse_args()
    initialize(args.database)
    server = PrivateHTTPServer((args.host, args.port), handler_for(args.database, args.allow_origin))
    print(json.dumps({"ready": True, "port": server.server_port}), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
