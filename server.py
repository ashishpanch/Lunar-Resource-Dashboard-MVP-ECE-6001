from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import webbrowser
import threading
import os

PORT = 5500
ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)

def open_browser():
    webbrowser.open(f"http://localhost:{PORT}")

if __name__ == "__main__":
    threading.Timer(0.8, open_browser).start()
    print(f"LunaScan running at http://localhost:{PORT}")
    print("Press Ctrl+C to stop the server.")
    ThreadingHTTPServer(("127.0.0.1", PORT), SimpleHTTPRequestHandler).serve_forever()
