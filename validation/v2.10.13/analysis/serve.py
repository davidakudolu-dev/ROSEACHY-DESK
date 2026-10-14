from functools import partial
from http.server import HTTPServer,SimpleHTTPRequestHandler
HTTPServer(('127.0.0.1',8778),partial(SimpleHTTPRequestHandler,directory='/workspace/roseachy-v2.10.12-ember-review/app')).serve_forever()
