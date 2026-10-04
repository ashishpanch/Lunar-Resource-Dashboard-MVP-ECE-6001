from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import webbrowser, threading, socket, os
ROOT=Path(__file__).resolve().parent
os.chdir(ROOT)
def port(start=5500):
    for p in range(start,start+50):
        with socket.socket() as s:
            try:s.bind(("127.0.0.1",p));return p
            except OSError:pass
    raise RuntimeError("No open port")
P=port()
if __name__=="__main__":
    u=f"http://127.0.0.1:{P}/"
    print("LunaScan running at",u)
    threading.Timer(.7,lambda:webbrowser.open(u)).start()
    ThreadingHTTPServer(("127.0.0.1",P),SimpleHTTPRequestHandler).serve_forever()
