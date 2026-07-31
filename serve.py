#!/usr/bin/env python3
"""Local static server with 404.html fallback (Python's default http.server has none).

  python3 serve.py
  python3 serve.py 8080

GitHub Pages serves root 404.html automatically — this is only for local preview.
"""
from __future__ import annotations

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class StallHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        path = self.translate_path(self.path)
        if Path(path).is_file():
            return super().send_head()

        # Directory without index still uses default behavior.
        p = Path(path)
        if p.is_dir():
            return super().send_head()

        not_found = ROOT / "404.html"
        if not_found.is_file():
            try:
                f = not_found.open("rb")
            except OSError:
                self.send_error(404, "File not found")
                return None
            self.send_response(404)
            self.send_header("Content-type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(not_found.stat().st_size))
            self.end_headers()
            return f

        self.send_error(404, "File not found")
        return None


def main() -> None:
    port = 8000
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    server = ThreadingHTTPServer(("127.0.0.1", port), StallHandler)
    print(f"stall.one local server → http://127.0.0.1:{port}/  (404.html enabled)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
        server.server_close()


if __name__ == "__main__":
    main()
