from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import unquote,urlsplit
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def do_GET(self):
  path=unquote(urlsplit(self.path).path)
  if path=='/':self.send_response(302);self.send_header('Location','/research/media/');self.end_headers();return
  if '..' in Path(path).parts or not path.startswith(('/research/','/references/','/PROJECT START FOLDER/')):
   self.send_error(404);return
  return super().do_GET()
 def do_HEAD(self):
  path=unquote(urlsplit(self.path).path)
  if '..' in Path(path).parts or not path.startswith(('/research/','/references/','/PROJECT START FOLDER/')):
   self.send_error(404);return
  return super().do_HEAD()
print('Catalogo: http://127.0.0.1:8765/research/media/',flush=True)
ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()
