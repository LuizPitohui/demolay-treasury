from rest_framework import viewsets, views, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Sum
from django.db.models.functions import TruncMonth

# Import dos Models e Serializers
# Certifique-se que o nome no models.py está como LogSistema
from .models import Transacao, LogSistema 
from .serializers import TransacaoSerializer, LogSistemaSerializer

# Import dos Geradores de PDF
from .reports import gerar_relatorio_mensal, gerar_relatorio_logs

# ==============================================================================
# 1. VIEW DE STATUS (HEALTH CHECK)
# ==============================================================================
class HealthCheckView(views.APIView):
    """
    Endpoint leve para o Frontend saber se o Backend está vivo.
    Público (AllowAny) para o ícone funcionar na tela de login.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "status": "online", 
            "server": "Nexus-Arasaka", 
            "version": "1.0"
        })

# ==============================================================================
# 2. VIEWSETS (CRUD)
# ==============================================================================

class TransacaoViewSet(viewsets.ModelViewSet):
    queryset = Transacao.objects.all().order_by('-data_transacao')
    serializer_class = TransacaoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        return queryset

    # --- AQUI ESTA A CORREÇÃO DOS LOGS ---
    
    def perform_create(self, serializer):
        # 1. Salva a transação
        instance = serializer.save(responsavel=self.request.user)
        
        # 2. Grava o Log Manualmente
        LogSistema.objects.create(
            usuario=self.request.user,
            acao=f"Criou Transação: {instance.nome} (R$ {instance.valor})",
            detalhes=f"Categoria: {instance.categoria} | Tipo: {instance.tipo}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        LogSistema.objects.create(
            usuario=self.request.user,
            acao=f"Editou Transação: {instance.nome}",
            detalhes=f"Novo Valor: R$ {instance.valor}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    def perform_destroy(self, instance):
        # Grava log ANTES de deletar para ter os dados
        LogSistema.objects.create(
            usuario=self.request.user,
            acao=f"Apagou Transação: {instance.nome}",
            detalhes=f"Valor apagado: R$ {instance.valor}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        instance.delete()

class LogSistemaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LogSistema.objects.all().order_by('-data_criacao')
    serializer_class = LogSistemaSerializer
    permission_classes = [permissions.IsAuthenticated]

# ==============================================================================
# 3. DASHBOARD (ESTATÍSTICAS)
# ==============================================================================

class DashboardView(views.APIView):
    """
    Endpoint Tático: Entrega os números já processados para os gráficos.
    """
    permission_classes = [permissions.IsAuthenticated] # <--- TRANCADO

    def get(self, request):
        # 1. Totais Gerais
        total_entradas = Transacao.objects.filter(tipo='ENTRADA').aggregate(Sum('valor'))['valor__sum'] or 0
        total_saidas = Transacao.objects.filter(tipo='SAIDA').aggregate(Sum('valor'))['valor__sum'] or 0
        saldo_atual = total_entradas - total_saidas

        # 2. Dados para Gráfico de Pizza (Por Categoria)
        por_categoria = Transacao.objects.values('categoria').annotate(total=Sum('valor')).order_by('-total')

        # 3. Dados para Gráfico de Linha (Fluxo Mensal)
        fluxo_mensal = Transacao.objects.annotate(
            mes=TruncMonth('data_transacao')
        ).values('mes', 'tipo').annotate(total=Sum('valor')).order_by('mes')

        # 4. Últimas movimentações (para a tabela rápida na home)
        ultimas = Transacao.objects.all().order_by('-data_transacao')[:5]
        ultimas_serializer = TransacaoSerializer(ultimas, many=True)

        return Response({
            "cards": {
                "saldo": saldo_atual,
                "entradas": total_entradas,
                "saidas": total_saidas
            },
            "graficos": {
                "por_categoria": por_categoria,
                "fluxo_mensal": fluxo_mensal
            },
            "recentes": ultimas_serializer.data
        })

# ==============================================================================
# 4. RELATÓRIOS PDF
# ==============================================================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def relatorio_pdf(request):
    return gerar_relatorio_mensal(request)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def relatorio_logs_view(request):
    """
    Gera o Relatório de Auditoria Filtrado por Mês/Ano.
    """
    return gerar_relatorio_logs(request)