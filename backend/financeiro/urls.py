from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token

from .views import (
    TransacaoViewSet, 
    LogSistemaViewSet,
    DashboardView, 
    relatorio_pdf, 
    HealthCheckView,
    relatorio_logs_view # <--- Certifique-se que está importado
)

router = DefaultRouter()
router.register(r'transacoes', TransacaoViewSet, basename='transacao')
router.register(r'logs', LogSistemaViewSet, basename='logs')

urlpatterns = [
    # ==========================================================
    # 1. ROTAS ESPECÍFICAS (DEVEM VIR PRIMEIRO)
    # ==========================================================
    
    # Autenticação
    path('login/', obtain_auth_token, name='api_token_auth'),
    
    # Status
    path('health/', HealthCheckView.as_view(), name='health-check'),

    # Relatórios PDF (Antes do Router para não confundir com IDs)
    path('logs/pdf/', relatorio_logs_view, name='logs-pdf'), # <--- MUDOU PARA CÁ (TOPO)
    path('relatorio/pdf/', relatorio_pdf, name='relatorio-pdf'),
    path('dashboard/', DashboardView.as_view(), name='dashboard-data'),

    # ==========================================================
    # 2. ROTAS GENÉRICAS (ROUTER) - FICAM POR ÚLTIMO
    # ==========================================================
    path('', include(router.urls)),
]