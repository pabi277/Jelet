#!/usr/bin/env python3
"""Loopback-only JELET static server with an optional, fixed-target NVIDIA relay.

Run on the same device as the browser: python scripts/serve_local.py
No API key or prompt is logged or stored. NVIDIA requests are accepted only
from this server's own browser origin and forwarded only to NVIDIA over HTTPS.
"""
import argparse
import http.client
import json
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
HEALTH = '/__jelet_nvidia_relay__/health'
CHAT = '/__jelet_nvidia_relay__/chat/completions'
MAX_BODY = 2 * 1024 * 1024


class LocalServer(ThreadingHTTPServer):
    daemon_threads = True

    def handle_error(self, request, client_address):
        # Never emit request data or upstream exception details into Termux logs.
        pass


class LocalHandler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def setup(self):
        super().setup()
        self.connection.settimeout(30)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        # URLs, request contents and provider errors may contain private data.
        return

    def valid_host(self):
        port = self.server.server_address[1]
        return self.headers.get('Host', '').lower() in (f'localhost:{port}', f'127.0.0.1:{port}')

    def send_bytes(self, status, data, content_type='text/plain; charset=utf-8'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(data)

    def do_HEAD(self):
        if not self.valid_host() or any(part.startswith('.') for part in unquote(urlsplit(self.path).path).split('/') if part):
            self.send_bytes(403, b'Forbidden.')
            return
        super().do_HEAD()

    def do_GET(self):
        if not self.valid_host():
            self.send_bytes(403, b'Invalid local host.')
            return
        path = unquote(urlsplit(self.path).path)
        if any(part.startswith('.') for part in path.split('/') if part):
            self.send_bytes(404, b'Not found.')
            return
        if path == HEALTH:
            self.send_bytes(200, b'{"service":"jelet-nvidia-local-relay","version":1}', 'application/json')
            return
        if path in ('/', '/index.html'):
            # The marker is present only when this local server actually serves
            # the app; the browser also verifies the no-store health endpoint.
            page = (ROOT / 'index.html').read_bytes()
            marker = b'<meta name="jelet-nvidia-local-relay" content="1">\n'
            self.send_bytes(200, page.replace(b'</head>', marker + b'</head>', 1), 'text/html; charset=utf-8')
            return
        return super().do_GET()

    def do_POST(self):
        self.close_connection = True
        if not self.valid_host() or urlsplit(self.path).path != CHAT:
            self.send_bytes(403, b'Forbidden.')
            return
        if any(len(self.headers.get_all(name, [])) != 1 for name in ('Host', 'Authorization', 'Content-Length', 'Content-Type')):
            self.send_bytes(400, b'Invalid request headers.')
            return
        host = self.headers.get('Host', '').lower()
        origins = self.headers.get_all('Origin', [])
        site = self.headers.get('Sec-Fetch-Site')
        # Chromium may omit Origin on a same-origin fetch. Fetch Metadata is
        # browser-controlled; without it require an exact Origin instead.
        if len(origins) > 1 or (origins and origins[0].lower() != f'http://{host}') or (site and site != 'same-origin') or (not origins and site != 'same-origin'):
            self.send_bytes(403, b'Same-origin requests only.')
            return
        auth = self.headers.get('Authorization', '')
        if not re.fullmatch(r'Bearer [^\s\x00-\x1f\x7f]{1,4096}', auth):
            self.send_bytes(400, b'Missing or invalid authorization.')
            return
        if self.headers.get('Content-Type', '').split(';', 1)[0].strip().lower() != 'application/json' or self.headers.get('Transfer-Encoding'):
            self.send_bytes(400, b'JSON requests with a content length are required.')
            return
        try:
            length = int(self.headers.get('Content-Length', ''))
        except ValueError:
            length = -1
        if length < 1 or length > MAX_BODY:
            self.send_bytes(413, b'Invalid request size.')
            return
        body = self.rfile.read(length)
        connection = None
        response_started = False
        try:
            connection = http.client.HTTPSConnection('integrate.api.nvidia.com', timeout=50)
            connection.request('POST', '/v1/chat/completions', body=body, headers={
                'Authorization': auth, 'Content-Type': 'application/json',
                'Accept': 'text/event-stream, application/json', 'Accept-Encoding': 'identity',
            })
            upstream = connection.getresponse()
            self.send_response(upstream.status)
            self.send_header('Content-Type', upstream.getheader('Content-Type', 'application/json'))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            retry_after = upstream.getheader('Retry-After')
            if retry_after:
                self.send_header('Retry-After', retry_after)
            self.send_header('Connection', 'close')
            self.end_headers()
            response_started = True
            self.close_connection = True
            while True:
                chunk = upstream.read1(8192)
                if not chunk:
                    break
                self.wfile.write(chunk)
                self.wfile.flush()
        except (OSError, http.client.HTTPException):
            if not response_started:
                self.send_bytes(502, b'{"error":{"message":"NVIDIA connection failed"}}', 'application/json')
            self.close_connection = True
        finally:
            if connection:
                connection.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8000, help='loopback port (default: 8000)')
    args = parser.parse_args()
    server = LocalServer(('127.0.0.1', args.port), LocalHandler)
    print(f'JELET local server: http://localhost:{server.server_address[1]}/', flush=True)
    print('NVIDIA relay is local-only; it does not log or store keys or prompts.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
