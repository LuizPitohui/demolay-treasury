from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token

from .views import (
    TransacaoViewSet, 
    LogSistemaViewSet,
    MembroViewSet,
    ConfiguracaoViewSet,    # <--- [ADICIONAR] Importante para a tela de settings
    DashboardView, 
    relatorio_pdf, 
    HealthCheckView,
    relatorio_logs_view
)

router = DefaultRouter()
router.register(r'transacoes', TransacaoViewSet, basename='transacao')
router.register(r'logs', LogSistemaViewSet, basename='logs')
router.register(r'membros', MembroViewSet, basename='membros')
router.register(r'configuracao', ConfiguracaoViewSet, basename='configuracao') # <--- [ADICIONAR] Registra a rota

urlpatterns = [
    # ==========================================================
    # 1. ROTAS ESPECÍFICAS (DEVEM VIR PRIMEIRO)
    # ==========================================================
    
    # Autenticação
    path('login/', obtain_auth_token, name='api_token_auth'),
    
    # Status
    path('health/', HealthCheckView.as_view(), name='health-check'),

    # Relatórios PDF
    path('logs/pdf/', relatorio_logs_view, name='logs-pdf'),
    path('relatorio/pdf/', relatorio_pdf, name='relatorio-pdf'),
    path('dashboard/', DashboardView.as_view(), name='dashboard-data'),

    # ==========================================================
    # 2. ROTAS GENÉRICAS (ROUTER) - FICAM POR ÚLTIMO
    # ==========================================================
    path('', include(router.urls)),
]