import threading

# Armazenamento temporário global (seguro por thread)
_thread_locals = threading.local()

def get_current_request():
    """Retorna a requisição atual ou None se estiver rodando via terminal"""
    return getattr(_thread_locals, 'request', None)

class AuditMiddleware:
    """
    Middleware estilo Arasaka: Intercepta todas as requisições
    e armazena o contexto para uso nos Logs de Auditoria.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Guarda a requisição no "bolso" da thread
        _thread_locals.request = request
        
        # 2. Processa a resposta
        response = self.get_response(request)
        
        # 3. Limpa a thread (faxina importante para memória)
        if hasattr(_thread_locals, 'request'):
            del _thread_locals.request
            
        return response

def get_client_ip(request):
    """Extrai o IP real, considerando Cloudflare e Proxies"""
    if not request:
        return None
        
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    cf_connecting_ip = request.META.get('HTTP_CF_CONNECTING_IP') # Cloudflare
    
    if cf_connecting_ip:
        ip = cf_connecting_ip
    elif x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
        
    return ip