import http.client
import importlib.util
import io
import threading
import unittest
from unittest.mock import patch
from http.server import ThreadingHTTPServer

spec = importlib.util.spec_from_file_location('relay', 'scripts/serve_local.py')
relay = importlib.util.module_from_spec(spec)
spec.loader.exec_module(relay)


class RelayTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = relay.LocalServer(('127.0.0.1', 0), relay.LocalHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.port = cls.server.server_address[1]

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def request(self, method, path, headers=None, body=None):
        conn = http.client.HTTPConnection('127.0.0.1', self.port, timeout=3)
        conn.request(method, path, body=body, headers=headers or {})
        result = conn.getresponse()
        data = result.read()
        conn.close()
        return result.status, data, dict(result.getheaders())

    def headers(self):
        return {'Origin': f'http://localhost:{self.port}', 'Host': f'localhost:{self.port}',
                'Authorization': 'Bearer private-test-key', 'Content-Type': 'application/json'}

    def test_local_only_and_no_hidden_files(self):
        self.assertEqual(self.request('GET', '/', {'Host': 'evil.example'})[0], 403)
        self.assertEqual(self.request('HEAD', '/.git/config', {'Host': 'evil.example'})[0], 403)
        self.assertEqual(self.request('GET', '/%2egit/config')[0], 404)
        status, page, headers = self.request('GET', '/')
        self.assertEqual(status, 200)
        self.assertIn(b'jelet-nvidia-local-relay', page)
        self.assertEqual(headers['Cache-Control'], 'no-store')
        self.assertEqual(self.request('GET', relay.HEALTH)[2]['Cache-Control'], 'no-store')

    def test_cross_origin_and_invalid_requests_never_reach_upstream(self):
        headers = self.headers()
        with patch.object(relay.http.client, 'HTTPSConnection') as upstream:
            for changes in ({'Origin': 'https://evil.example'}, {'Host': 'evil.example'},
                            {'Origin': ''}, {'Sec-Fetch-Site': 'cross-site'},
                            {'Authorization': 'Bearer bad key'}, {'Content-Type': 'text/plain'}):
                self.assertNotEqual(self.request('POST', relay.CHAT, {**headers, **changes}, b'{}')[0], 200)
            self.assertEqual(self.request('POST', '/anything-else', headers, b'{}')[0], 403)
            self.assertEqual(self.request('POST', relay.CHAT, {**headers, 'Content-Length': str(relay.MAX_BODY + 1)}, b'')[0], 413)
            upstream.assert_not_called()

    def test_exact_body_fixed_destination_stream_and_no_logs(self):
        body = b'{"message":"secret prompt", "stream":true}'
        class FakeResponse:
            status = 200
            def __init__(self): self.data = io.BytesIO(b'data: one\n\ndata: [DONE]\n\n')
            def getheader(self, name, default=None): return 'text/event-stream' if name == 'Content-Type' else default
            def read1(self, size): return self.data.read(8)
        class FakeConnection:
            def __init__(self, host, timeout): self.host = host; captured.append(self)
            def request(self, method, path, body, headers): self.sent = (method, path, body, headers)
            def getresponse(self): return FakeResponse()
            def close(self): self.closed = True
        captured = []
        with patch.object(relay.http.client, 'HTTPSConnection', FakeConnection):
            browser_headers = self.headers()
            del browser_headers['Origin']
            browser_headers['Sec-Fetch-Site'] = 'same-origin'
            status, response, headers = self.request('POST', relay.CHAT, browser_headers, body)
        self.assertEqual(status, 200)
        self.assertEqual(response, b'data: one\n\ndata: [DONE]\n\n')
        self.assertEqual(headers['Cache-Control'], 'no-store')
        self.assertEqual(captured[0].host, 'integrate.api.nvidia.com')
        self.assertEqual(captured[0].sent[:3], ('POST', '/v1/chat/completions', body))
        self.assertEqual(captured[0].sent[3]['Authorization'], 'Bearer private-test-key')
        self.assertTrue(captured[0].closed)
        with patch('sys.stderr', new_callable=io.StringIO) as output:
            self.request('GET', '/?secret-prompt=private-test-key')
            self.assertEqual(output.getvalue(), '')

    def test_upstream_failure_is_safe(self):
        with patch.object(relay.http.client, 'HTTPSConnection', side_effect=OSError('private-test-key secret prompt')):
            status, data, _ = self.request('POST', relay.CHAT, self.headers(), b'{"secret":"prompt"}')
        self.assertEqual(status, 502)
        self.assertNotIn(b'private-test-key', data)
        self.assertNotIn(b'secret prompt', data)


if __name__ == '__main__': unittest.main()
