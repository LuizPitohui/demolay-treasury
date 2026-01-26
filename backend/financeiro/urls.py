from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token

from .views import (
    TransacaoViewSet, 
    LogSistemaViewSet,
    MembroViewSet,
    ConfiguracaoViewSet,
    EventoViewSet,  # <--- 1. IMPORT NOVO
    DashboardView, 
    HealthCheckView,
)

from .reports import (
    gerar_relatorio_mensal, 
    gerar_relatorio_logs, 
    gerar_recibo_mensalidade
) 

router = DefaultRouter()
router.register(r'transacoes', TransacaoViewSet, basename='transacao')
router.register(r'logs', LogSistemaViewSet, basename='logs')
router.register(r'membros', MembroViewSet, basename='membros')
router.register(r'configuracao', ConfiguracaoViewSet, basename='configuracao')
router.register(r'eventos', EventoViewSet, basename='eventos') # <--- 2. ROTA NOVA

urlpatterns = [
    # ==========================================================
    # 1. ROTAS ESPECÍFICAS
    # ==========================================================
    
    # Autenticação
    path('login/', obtain_auth_token, name='api_token_auth'),
    
    # Status
    path('health/', HealthCheckView.as_view(), name='health-check'),

    # Relatórios PDF e Dashboard
    path('logs/pdf/', gerar_relatorio_logs, name='logs-pdf'),
    path('relatorio/pdf/', gerar_relatorio_mensal, name='relatorio-pdf'),
    
    # Recibo
    path('recibo/<int:pk>/', gerar_recibo_mensalidade, name='recibo-pdf'),

    path('dashboard/', DashboardView.as_view(), name='dashboard-data'),

    # ==========================================================
    # 2. ROTAS GENÉRICAS (ROUTER)
    # ==========================================================
    path('', include(router.urls)),
]