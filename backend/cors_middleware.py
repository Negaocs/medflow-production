from flask import request, make_response

class CORSMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        def custom_start_response(status, headers, exc_info=None):
            cors_headers = [
                ('Access-Control-Allow-Origin', 'https://medflow-frontend-i059.onrender.com'),
                ('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'),
                ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
                ('Access-Control-Allow-Credentials', 'true'),
                ('Access-Control-Max-Age', '3600')
            ]
            
            # Adicionar headers CORS à resposta
            headers_list = list(headers)
            for header in cors_headers:
                headers_list.append(header)
                
            return start_response(status, headers_list, exc_info)
        
        # Tratar requisições OPTIONS (preflight)
        if environ['REQUEST_METHOD'] == 'OPTIONS':
            resp = make_response('', 200)
            return resp(environ, start_response)
            
        return self.app(environ, custom_start_response)

